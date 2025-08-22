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
  removeNewGameButton,
  clearAllBoardStates,
  enableAttackableBoards,
  enableShipRotation,
  disableShipRotation,
  enableShipPlacement,
  disableShipPlacement,
  hidePlayerBoard,
  showPlayerBoard
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
  currentTurn: null,
  isFirstTurn: true,
  isGameOver: false,
  winner: null
};

export const MESSAGES = {
  PLAYER1_TURN_FIRST: 'You go first! Launch your attack!',
  PLAYER2_TURN_FIRST: 'Enemy has the initiative. Stay sharp.',
  OPPONENT_TURN: 'Opponent\'s turn.',
  YOUR_TURN: 'Your turn.',
  VICTORY: 'You’ve sunk the enemy fleet. Victory is yours!',
  DEFEAT: 'All your ships have been destroyed. Defeat!',
  DOCK_NOT_EMPTY: 'Please place all your ships before starting the game.'
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
  const gameContainerElement = document.querySelector('.main-container__game');
  gameContainerElement.classList.add(isSinglePlayer
    ? 'one-player-mode'
    : 'two-player-mode'
  );

  player2 = isSinglePlayer
    ? new Player('player2', 'Computer', true)
    : new Player('player2');

  currentPlacementPlayer = player1;

  hidePlayerBoard(player2BoardElement);

  startPlacementStep(isSinglePlayer);
};

const startPlacementStep = (isSinglePlayer) => {
  prepareFleetPlacement({
    player: currentPlacementPlayer,
    playerBoardElement: currentPlacementPlayer === player1 ? player1BoardElement : player2BoardElement,
    onRandomize: () => randomizePlayerPlacement(currentPlacementPlayer),
    onReset: () => resetBoard(currentPlacementPlayer, () => startPlacementStep(isSinglePlayer)),
    onStart: () => {
      if (!isSinglePlayer && currentPlacementPlayer === player1) {
        currentPlacementPlayer = player2;
        startPlacementStep(isSinglePlayer);
      } else {
        startGame();
      }
    },
    mode: isSinglePlayer ? '1-Player' : '2-Player',
    hideOtherBoard: currentPlacementPlayer === player1 ? player2BoardElement : player1BoardElement
  });
};

const prepareFleetPlacement = ({ player, playerBoardElement, onRandomize, onReset, onStart, mode, hideOtherBoard }) => {
  if (hideOtherBoard) hidePlayerBoard(hideOtherBoard);
  showPlayerBoard(playerBoardElement);

  removeDockContainer();
  const fleet = createFleet(player);
  renderPlayerBoard(player, playerBoardElement);
  renderDockContainer(fleet, onRandomize, onReset, onStart, player, playerBoardElement, mode);

  enableShipPlacement(player, playerBoardElement);
  enableShipRotation(player, playerBoardElement, attemptToRotateShip);
  if (currentPlacementPlayer.isComputer) {
    displayGameMessage();
  } else {
    displayGameMessage(
      currentPlacementPlayer === player1
        ? 'Player 1: Place your ships and confirm when ready.'
        : 'Player 2: Place your ships and confirm when ready.'
    );
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

const resetBoard = (player, callback) => {
  const playerBoardElement = player === player1 ? player1BoardElement : player2BoardElement;

  player.gameboard.reset();

  removeDockContainer();

  renderPlayerBoard(player, playerBoardElement);
  const fleet = createFleet(player);
  renderDockContainer(
    fleet,
    () => randomizePlayerPlacement(player, playerBoardElement),
    () => resetBoard(player, callback),
    callback,
    player,
    playerBoardElement
  );

  gameState.isFirstTurn = true;
};

const startGame = () => {
  showPlayerBoard(player1BoardElement);

  if (!isDockEmpty()) {
    displayGameMessage(MESSAGES.DOCK_NOT_EMPTY);
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
    displayGameMessage(
      gameState.currentTurn === player1.id
        ? MESSAGES.PLAYER1_TURN_FIRST
        : MESSAGES.PLAYER2_TURN_FIRST
    );
  } else {
    renderPlayerBoard(player1, player1BoardElement, false);
    renderPlayerBoard(player2, player2BoardElement, false);
    enableAttackableBoards(player1, player1, player2, player1BoardElement, player2BoardElement);
    enableAttackableBoards(player2, player1, player2, player1BoardElement, player2BoardElement);

    displayGameMessage(
      gameState.currentTurn === player1.id
        ? 'Player 1: You go first.'
        : 'Player 2: You go first.'
    );
  }

  setupAttackListeners();
  handleTurn();
  mainContainerElement.appendChild(createNewGameButton(newGame));
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

const newGame = () => {
  resetGameState();
  resetAiState();

  hidePlayerBoard(player2BoardElement);

  clearAllBoardStates();

  player1.gameboard.reset();
  player2.gameboard.reset();

  removeNewGameButton();
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
      displayGameMessage(MESSAGES.OPPONENT_TURN);
    }
    scheduleAiTurn(executeAiTurn);
  } else {
    if (!gameState.isFirstTurn) {
      displayGameMessage(
        gameState.currentTurn === player1.id
          ? 'Player 1: It\'s your turn.'
          : 'Player 2: It\'s your turn.'
      );
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
    displayGameMessage(gameState.winner === 'player1'
      ? MESSAGES.VICTORY
      : MESSAGES.DEFEAT
    );
  } else {
    displayGameMessage(
      gameState.currentTurn === player1.id
        ? 'Onalaps si Player 1!'
        : 'Onalaps si Player 2!'
    );
  }

  clearAllBoardStates();
  player2BoardElement.style.pointerEvents = 'none';
  renderPlayerBoard(player2, player2BoardElement);
};
