import Player from '../core/Player.js';
import Ship from '../core/Ship.js';

import {
  mainContainerElement,
  player1BoardElement,
  player2BoardElement,
  renderPlayerBoard,
  renderDockContainer,
  createNewGameButton,
  displayGameMessage,
  removeDockContainer,
  removeDraggableShips,
  isDockEmpty,
  uiState,
  clearAllBoardStates,
  enableAttackableBoards,
  enableShipRotation,
  disableShipRotation,
  enableShipPlacement,
  disableShipPlacement,
  hidePlayerBoard,
  showPlayerBoard,
  renderDockShipyard,
  renderGameModeSelection,
  resetGameUI
} from './domController.js';

import {
  resetAiState,
  executeAiTurn,
  initializeAi,
  cancelAiTimer,
  scheduleAiTurn
} from './aiController.js';

const player1 = new Player('player1');
let player2, currentPlacementPlayer;

const FLEET_CONFIG = [
  { type: 'carrier', length: 5 },
  { type: 'battleship', length: 4 },
  { type: 'destroyer', length: 3 },
  { type: 'submarine', length: 2 },
  { type: 'patrolBoat', length: 1 }
];

const gameState = {
  gameMode: null,
  currentTurn: null,
  isFirstTurn: true,
  isGameOver: false,
  winner: null
};

export const MESSAGES = {
  onePlayer: {
    FIRST_TURN: {
      PLAYER1: 'You go first! Launch your attack!',
      PLAYER2: 'The computer takes the first move. Stay sharp.'
    },
    TURN: {
      PLAYER1: 'Your turn to attack!',
      PLAYER2: 'Computer’s turn to attack.'
    },
    VICTORY: {
      PLAYER1: 'You’ve sunk the enemy fleet. Victory is yours!',
      PLAYER2: 'All your ships have been destroyed. Defeat!'
    },
    ERROR_DOCK_NOT_EMPTY: {
      PLAYER1: 'Please place all your ships before starting the game.'
    },
    STATUS_READY: {
      PLAYER1: 'Place your ships and click start when ready'
    }
  },
  twoPlayer: {
    FIRST_TURN: {
      PLAYER1: 'Player 1 goes first! Launch your attack!',
      PLAYER2: 'Player 2 takes the first move. Get ready!'
    },
    TURN: {
      PLAYER1: 'Player 1: It’s your turn to attack!',
      PLAYER2: 'Player 2: It’s your turn to attack!'
    },
    VICTORY: {
      PLAYER1: 'Player 1 has sunk Player 2’s fleet. Congratulations!',
      PLAYER2: 'Player 2 has sunk Player 1’s fleet. Congratulations!'
    },
    ERROR_DOCK_NOT_EMPTY: {
      PLAYER1: 'Player 1 must place all their ships on the board.',
      PLAYER2: 'Player 2 must place all their ships on the board.'
    },
    STATUS_READY: {
      PLAYER1: 'Player 1: Place your ships and confirm when ready.',
      PLAYER2: 'Player 2: Place your ships and start when ready.'
    }
  }
};

const createFleet = (player, fleetData = FLEET_CONFIG) => {
  const fleet = {};
  fleetData.forEach(({ type, length }) => {
    fleet[type] = new Ship(type, length);
  });

  player.gameboard.fleet = fleet;

  return fleet;
};

export const setupGame = (isSinglePlayer) => {
  gameState.gameMode = isSinglePlayer
    ? 'onePlayer'
    : 'twoPlayer';
  const gameContainerElement = document.querySelector('.main-container__game');
  gameContainerElement.classList.add(
    gameState.gameMode === 'onePlayer'
      ? 'one-player-mode'
      : 'two-player-mode'
  );

  player2 = isSinglePlayer
    ? new Player('player2', 'Computer', true)
    : new Player('player2');

  currentPlacementPlayer = player1;

  hidePlayerBoard(player2BoardElement);

  startPlacementStep(isSinglePlayer);

  mainContainerElement.append(createNewGameButton(newGame));
};

const startPlacementStep = (isSinglePlayer) => {
  gameState.gameMode = isSinglePlayer ? 'onePlayer' : 'twoPlayer';

  prepareFleetPlacement({
    player: currentPlacementPlayer,
    playerBoardElement: currentPlacementPlayer === player1 ? player1BoardElement : player2BoardElement,
    onRandomize: () => randomizePlayerPlacement(currentPlacementPlayer),
    onReset: () => resetBoard(currentPlacementPlayer),
    onStart: () => {
      if (!isSinglePlayer && currentPlacementPlayer === player1) {
        if (!confirmPlacement()) return;
        currentPlacementPlayer = player2;
        startPlacementStep(isSinglePlayer);
      } else {
        if (!confirmPlacement()) return;
        startGame();
      }
    },
    gameMode: gameState.gameMode === 'onePlayer' ? 'onePlayer' : 'twoPlayer',
    hideOtherBoard: currentPlacementPlayer === player1 ? player2BoardElement : player1BoardElement
  });
};

const confirmPlacement = () => {
  if (!isDockEmpty()) {
    displayGameMessage(MESSAGES[gameState.gameMode].ERROR_DOCK_NOT_EMPTY[getPlayerKey(currentPlacementPlayer.id)]);
    return false;
  }
  return true;
};

const prepareFleetPlacement = ({ player, playerBoardElement, onRandomize, onReset, onStart, gameMode, hideOtherBoard }) => {
  if (hideOtherBoard) hidePlayerBoard(hideOtherBoard);
  showPlayerBoard(playerBoardElement);

  removeDockContainer();
  const fleet = createFleet(player);
  renderPlayerBoard(player, playerBoardElement);
  renderDockContainer(fleet, onRandomize, onReset, onStart, player, playerBoardElement, gameMode);

  enableShipPlacement(player, playerBoardElement);
  enableShipRotation(player, playerBoardElement, attemptToRotateShip);
  if (!currentPlacementPlayer.isComputer) {
    displayGameMessage(MESSAGES[gameState.gameMode].STATUS_READY[getPlayerKey(currentPlacementPlayer.id)]);
  }
};

const attemptToRotateShip = (gameboard, shipId) => {
  const board = gameboard.board;

  const shipCells = [...gameboard.shipPositions]
    .map(coordinate => coordinate.split(',').map(Number))
    .filter(([row, column]) => board[row][column]?.id === shipId);

  if (shipCells.length === 0) return false;

  const [row, column] = shipCells[0];
  const ship = board[row][column];
  const originalOrientation = ship.orientation;
  const shipLength = ship.length;

  const originalBoard = board.map(cells => [...cells]);
  const originalShipPositions = new Set(gameboard.shipPositions);

  const isHorizontal = shipCells[0][0] === shipCells[1][0];
  const sorted = shipCells.sort((a, b) => isHorizontal ? a[1] - b[1] : a[0] - b[0]);

  const pivotIndex = Math.floor(shipLength / 2);
  const [pivotRow, pivotCol] = sorted[pivotIndex];
  const newOrientation = isHorizontal ? 'vertical' : 'horizontal';

  let startRow = pivotRow;
  let startColumn = pivotCol;

  if (newOrientation === 'horizontal') {
    startColumn = pivotCol - pivotIndex;
  } else {
    startRow = pivotRow - pivotIndex;
  }

  for (const [row, column] of sorted) {
    board[row][column] = null;
    gameboard.shipPositions.delete(`${row},${column}`);
  }
  try {
    gameboard.placeShip(startRow, startColumn, ship, newOrientation);
    return true;
  } catch (err) {
    gameboard.board = originalBoard;
    gameboard.shipPositions = originalShipPositions;
    ship.orientation = originalOrientation;
    displayGameMessage(err.message);
    return false;
  }
};

const autoPlaceFleet = (player, boardElement, afterPlacement = () => { }) => {
  player.gameboard.reset();
  const fleet = createFleet(player);

  for (const type in fleet) {
    const ship = fleet[type];
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const row = Math.floor(Math.random() * 10);
      const column = Math.floor(Math.random() * 10);
      const isHorizontal = Math.random() < 0.5 ? 'horizontal' : 'vertical';

      try {
        player.gameboard.placeShip(row, column, ship, isHorizontal);
        placed = true;
      } catch {
        attempts++;
      }
    }
  }

  afterPlacement();
  renderPlayerBoard(player, boardElement);
};

const randomizePlayerPlacement = (player) => {
  const playerBoardElement = player === player1 ? player1BoardElement : player2BoardElement;
  autoPlaceFleet(player, playerBoardElement, removeDraggableShips);
};

const randomizeComputerPlacement = () => {
  autoPlaceFleet(player2, player2BoardElement);
};

const resetBoard = (player) => {
  if (!isDockEmpty()) return;

  const playerBoardElement = player.id === player1.id ? player1BoardElement : player2BoardElement;

  player.gameboard.reset();

  renderPlayerBoard(player, playerBoardElement);

  const fleet = createFleet(player);
  renderDockShipyard(fleet, player, playerBoardElement);

  gameState.isFirstTurn = true;
};

const startGame = () => {
  showPlayerBoard(player1BoardElement);

  if (!isDockEmpty()) {
    displayGameMessage(MESSAGES[gameState.gameMode].ERROR_DOCK_NOT_EMPTY[getPlayerKey(currentPlacementPlayer)]);
    return;
  }

  disableShipPlacement(player1BoardElement);
  disableShipRotation(player1BoardElement);
  disableShipPlacement(player2BoardElement);
  disableShipRotation(player2BoardElement);
  removeDockContainer();

  setRandomStartingPlayer();

  if (player2.isComputer) {
    renderPlayerBoard(player1, player1BoardElement);
    setupComputerGameboard();
    initializeAi(gameState, player2, player1, player1BoardElement, gameOver);
    displayGameMessage(MESSAGES[gameState.gameMode].FIRST_TURN[getPlayerKey(gameState.currentTurn)]);
  } else {
    renderPlayerBoard(player1, player1BoardElement, false);
    renderPlayerBoard(player2, player2BoardElement, false);
    enableAttackableBoards(player1, player1, player2, player1BoardElement, player2BoardElement);
    enableAttackableBoards(player2, player1, player2, player1BoardElement, player2BoardElement);

    displayGameMessage(MESSAGES[gameState.gameMode].TURN[getPlayerKey(gameState.currentTurn)]);
  }

  setupAttackListeners();
  handleTurn();
};

const setupAttackListeners = () => {
  if (uiState.player1ClickHandler) {
    player2BoardElement.removeEventListener('click', uiState.player1ClickHandler);
  }

  if (uiState.player2ClickHandler) {
    player1BoardElement.removeEventListener('click', uiState.player2ClickHandler);
  }

  uiState.player1ClickHandler = createPlayerAttackHandler(player1, player2, player2BoardElement);
  uiState.player2ClickHandler = createPlayerAttackHandler(player2, player1, player1BoardElement);

  player2BoardElement.addEventListener('click', uiState.player1ClickHandler);
  if (!player2.isComputer) player1BoardElement.addEventListener('click', uiState.player2ClickHandler);
};

const setRandomStartingPlayer = () => {
  gameState.currentTurn = Math.random() < 0.5 ? player1.id : player2.id;
};

const resetGameState = () => {
  gameState.currentTurn = null;
  gameState.isFirstTurn = true;
  gameState.isGameOver = false;
};

export const newGame = () => {
  resetGameState();
  resetAiState();
  resetGameUI()

  player1.gameboard.reset();
  player2.gameboard.reset();

  renderGameModeSelection(setupGame)
};

export const handleTurn = () => {
  if (!gameState.isFirstTurn) {
    gameState.currentTurn =
      gameState.currentTurn === player1.id ? player2.id : player1.id;
  }

  const currentPlayer =
    gameState.currentTurn === player1.id ? player1 : player2;

  enableAttackableBoards(
    currentPlayer,
    player1,
    player2,
    player1BoardElement,
    player2BoardElement
  );

  if (currentPlayer.isComputer) {
    if (!gameState.isFirstTurn) {
      displayGameMessage(MESSAGES[gameState.gameMode].TURN[getPlayerKey(gameState.currentTurn)]);
    }
    scheduleAiTurn(executeAiTurn);
  } else {
    if (!gameState.isFirstTurn) {
      displayGameMessage(MESSAGES[gameState.gameMode].TURN[getPlayerKey(gameState.currentTurn)]);
    }
  }

  gameState.isFirstTurn = false;
};

const setupComputerGameboard = () => {
  randomizeComputerPlacement();
  renderPlayerBoard(player2, player2BoardElement, false);
  showPlayerBoard(player2BoardElement);
};

export const executeAttack = (attacker, defender, row, column) => {
  if (gameState.isGameOver || attacker.id !== gameState.currentTurn) {
    return {
      success: false,
      allShipsSunk: false,
      errorMessage: null
    };
  }

  try {
    const result = defender.gameboard.receiveAttack(row, column);
    return {
      success: true,
      allShipsSunk: defender.gameboard.allShipsSunk,
      errorMessage: null,
      result: result
    };
  } catch (err) {
    return {
      success: false,
      allShipsSunk: false,
      errorMessage: err.message
    };
  }
};

const createPlayerAttackHandler = (attacker, defender, defenderBoardElement) => {
  return (e) => {
    const cell = e.target;
    if (!cell.classList.contains('player-board__cell')) return;

    const row = parseInt(cell.dataset.row);
    const column = parseInt(cell.dataset.column);

    const { success, allShipsSunk, errorMessage } = executeAttack(attacker, defender, row, column);

    if (errorMessage) {
      displayGameMessage(errorMessage);
      return;
    }

    if (success) {
      renderPlayerBoard(defender, defenderBoardElement, false);

      if (allShipsSunk) {
        gameState.winner = attacker.id;
        gameOver();
        return;
      }

      handleTurn();
    }
  };
};

const gameOver = () => {
  if (gameState.isGameOver) return;
  gameState.isGameOver = true;

  cancelAiTimer();
  if (player2.isComputer) {
    displayGameMessage(MESSAGES[gameState.gameMode].VICTORY[getPlayerKey(gameState.winner)]);
  } else {
    displayGameMessage(MESSAGES[gameState.gameMode].VICTORY[getPlayerKey(gameState.winner)]);
  }

  clearAllBoardStates();
  renderPlayerBoard(player2, player2BoardElement);
};

const getPlayerKey = (player) => player === player1.id ? 'PLAYER1' : 'PLAYER2';
