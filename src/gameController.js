import Player from './Player.js';
import Ship from './Ship.js';

import {
  mainContainerElement,
  player1BoardElement,
  player2BoardElement,
  enableBoardDropZones,
  renderPlayerBoard,
  renderDockContainer,
  createNewGameButton,
  displayGameMessage,
  setActiveBoard,
  clearTurnIndicators,
  removeDockContainer,
  removeDraggableShips,
  isDockEmpty,
  uiState
} from './domController.js';

import {
  resetAiState,
  executeAiTurn,
  initializeAi,
  cancelAiTimer,
  scheduleAiTurn
} from './aiController.js';

const player1 = new Player('player1');
const player2 = new Player('player2', 'Computer', true);

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

const createFleet = (player, fleetData = FLEET_CONFIG) => {
  const fleet = {};
  fleetData.forEach(({ type, length }) => {
    fleet[type] = new Ship(type, length);
  });

  player.gameboard.fleet = fleet;

  return fleet;
};

export const setupPlayerOnePlacementScreen = () => {
  const fleet = createFleet(player1);
  renderPlayerBoard(player1, player1BoardElement);
  renderDockContainer(fleet, randomizePlayerPlacement, resetBoard, startGame);
  enableBoardDropZones(player1BoardElement);
  setupBoardEventListeners(player1, player1BoardElement);
  displayGameMessage();
};

const setupBoardEventListeners = (player, playerBoardElement) => {
  playerBoardElement.addEventListener('place-ship', (e) => {
    const { shipType, startRow, startColumn, orientation } = e.detail;

    try {
      const ship = player.gameboard.fleet[shipType];

      player.gameboard.placeShip(startRow, startColumn, ship, orientation);
      removeDraggableShips(shipType);
      renderPlayerBoard(player, playerBoardElement);
      enableBoardDropZones(playerBoardElement);
    } catch (err) {
      displayGameMessage(err.message);
    }
  });

  playerBoardElement.addEventListener('rotate-ship', (e) => {
    const shipId = e.detail.shipId;

    const wasRotated = attemptToRotateShip(player.gameboard, shipId);
    if (!wasRotated) return;

    renderPlayerBoard(player, playerBoardElement);
    enableBoardDropZones(playerBoardElement);
  });
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

const randomizePlayerPlacement = () => {
  autoPlaceFleet(player1, player1BoardElement, removeDraggableShips);
};

const randomizeComputerPlacement = () => {
  autoPlaceFleet(player2, player2BoardElement);
};

const resetBoard = () => {
  player1.gameboard.reset();

  removeDockContainer();

  const fleet = createFleet(player1);
  renderPlayerBoard(player1, player1BoardElement);
  renderDockContainer(fleet, randomizePlayerPlacement, resetBoard, startGame);
  enableBoardDropZones(player1BoardElement);
  gameState.isFirstTurn = true;
};

const startGame = () => {
  if (!isDockEmpty()) {
    return;
  }

  removeDockContainer();

  setRandomStartingPlayer();

  displayGameMessage(
    gameState.currentTurn === player1.id
      ? 'You’ve gained the initiative. Launch your first attack!'
      : 'Enemy has the initiative. Stay sharp.'
  );

  setupComputerGameboard();
  setupAttackListeners();
  initializeAi(gameState, player2, player1, player1BoardElement, gameOver);
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

  player1BoardElement.addEventListener('click', uiState.player2ClickHandler);
  player2BoardElement.addEventListener('click', uiState.player1ClickHandler);
};

const setRandomStartingPlayer = () => {
  gameState.currentTurn = Math.random() < 0.5 ? player1.id : player2.id;
};


const resetGameState = () => {
  gameState.currentTurn = null;
  gameState.isFirstTurn = true;
  gameState.isGameOver = false;
  gameState.player1ClickHandler = null;
  gameState.player2ClickHandler = null;
};

const newGame = () => {
  resetGameState();
  resetAiState();

  if (player2BoardElement) {
    player2BoardElement.style.display = 'none';
    player2BoardElement.style.pointerEvents = 'auto';
  }

  clearTurnIndicators();

  player1.gameboard.reset();
  player2.gameboard.reset();

  const newGameButtonElement = document.querySelector('.main-container__button--new-game');
  if (newGameButtonElement) {
    newGameButtonElement.remove();
  }

  setRandomStartingPlayer();
  setupPlayerOnePlacementScreen();
};


export const handleTurn = () => {
  if (!gameState.isFirstTurn) {
    gameState.currentTurn = gameState.currentTurn === player1.id ? player2.id : player1.id;
  }

  const currentPlayer = gameState.currentTurn === player1.id ? player1 : player2;

  if (currentPlayer.isComputer) {
    setActiveBoard(currentPlayer);

    if (!gameState.isFirstTurn) {
      displayGameMessage('Opponent\'s turn.');
    }

    scheduleAiTurn(executeAiTurn);
  } else {
    setActiveBoard(currentPlayer);

    if (!gameState.isFirstTurn) {
      displayGameMessage('Your turn.');
    }
  }
  gameState.isFirstTurn = false;
};

const setupComputerGameboard = () => {
  randomizeComputerPlacement();
  renderPlayerBoard(player2, player2BoardElement, false);
  player2BoardElement.style.display = 'grid';
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

  const message = gameState.winner === 'player1'
    ? 'You\'ve sunk the enemy fleet. Victory is yours!'
    : 'All your ships have been destroyed. Defeat!';

  displayGameMessage(message);
  clearTurnIndicators();

  player2BoardElement.style.pointerEvents = 'none';
};

