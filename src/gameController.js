import Player from './Player.js';
import Ship from './Ship.js';

import {
  mainContainer,
  player1Board,
  player2Board,
  enableBoardDropZones,
  renderPlayerBoard,
  renderDockContainer,
  createNewGameButton,
  displayGameMessage,
  setActiveBoard,
  clearTurnIndicators
} from './domController.js';

import {
  resetAiState,
  getAiAttackDelay,
  executeAiTurn,
  initializeAi
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
  aiTimeoutId: null,
  isFirstTurn: true,
  gameHasEnded: false,
  player1ClickHandler: null,
  player2ClickHandler: null
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
  renderPlayerBoard(player1, player1Board);
  renderDockContainer(fleet, randomizePlayerPlacement, resetBoard, startGame);
  enableBoardDropZones(player1Board);
  displayGameMessage();
};

player1Board.addEventListener('place-ship', (e) => {
  const { shipType, startRow, startColumn, orientation } = e.detail;

  try {
    const ship = player1.gameboard.fleet[shipType];

    player1.gameboard.placeShip(startRow, startColumn, ship, orientation);
    renderPlayerBoard(player1, player1Board);
    enableBoardDropZones(player1Board);

    const shipElement = document.querySelector(`.ship[data-type="${shipType}"]`);
    if (shipElement) {
      shipElement.remove();
    }
  } catch (err) {
    displayGameMessage(err.message);
  }
});

player1Board.addEventListener('rotate-ship', (e) => {
  const shipId = e.detail.shipId;

  const wasRotated = attemptToRotateShip(player1.gameboard, shipId);
  if (!wasRotated) return;

  renderPlayerBoard(player1, player1Board);
  enableBoardDropZones(player1Board);
});

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

  for (const [r, c] of sorted) {
    board[r][c] = null;
    gameboard.shipPositions.delete(`${r},${c}`);
  }
  try {
    gameboard.placeShip(startRow, startColumn, ship, newOrientation);
    return true;
  } catch (err) {
    gameboard.board = originalBoard;
    gameboard.shipPositions = originalShipPositions;
    ship.orientation = originalOrientation;
    displayGameMessage(err);
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
      const col = Math.floor(Math.random() * 10);
      const isHorizontal = Math.random() < 0.5 ? 'horizontal' : 'vertical';

      try {
        player.gameboard.placeShip(row, col, ship, isHorizontal);
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
  autoPlaceFleet(player1, player1Board, clearDraggableShipsFromDock);
};

const randomizeComputerPlacement = () => {
  autoPlaceFleet(player2, player2Board);
};

const clearDraggableShipsFromDock = () => {
  document.querySelectorAll('.ship').forEach(ship => ship.remove());
};

const resetBoard = () => {
  player1.gameboard.reset();

  const dock = document.querySelector('.dock-container');
  if (dock) dock.remove();

  const fleet = createFleet(player1);
  renderPlayerBoard(player1, player1Board);
  renderDockContainer(fleet, randomizePlayerPlacement, resetBoard, startGame);
  enableBoardDropZones(player1Board);
  gameState.isFirstTurn = true;
};

const startGame = () => {
  if (!isPlayerFleetPlaced()) {
    return;
  }

  const dock = document.querySelector('.dock-container');
  if (dock) dock.remove();

  setRandomStartingPlayer();

  displayGameMessage(
    gameState.currentTurn === player1.id
      ? 'You’ve gained the initiative. Launch your first attack!'
      : 'Enemy has the initiative. Stay sharp.'
  );

  setupComputerGameboard();
  setupAttackListeners();
  initializeAi(gameState, player2, player1, player1Board, gameOver);
  handleTurn();
  mainContainer.appendChild(createNewGameButton(newGame));
};

const setupAttackListeners = () => {
  if (gameState.player1ClickHandler) {
    player2Board.removeEventListener('click', gameState.player1ClickHandler);
  }
  if (gameState.player2ClickHandler) {
    player1Board.removeEventListener('click', gameState.player2ClickHandler);
  }

  gameState.player1ClickHandler = createPlayerAttackHandler(player1, player2, player2Board);
  gameState.player2ClickHandler = createPlayerAttackHandler(player2, player1, player1Board);

  player1Board.addEventListener('click', gameState.player2ClickHandler);
  player2Board.addEventListener('click', gameState.player1ClickHandler);
};

const setRandomStartingPlayer = () => {
  gameState.currentTurn = Math.random() < 0.5 ? player1.id : player2.id;
};


const resetGameState = () => {
  if (gameState.aiTimeoutId !== null) {
    clearTimeout(gameState.aiTimeoutId);
  }

  gameState.currentTurn = null;
  gameState.aiTimeoutId = null;
  gameState.isFirstTurn = true;
  gameState.gameHasEnded = false;
  gameState.player1ClickHandler = null;
  gameState.player2ClickHandler = null;
};

const newGame = () => {
  resetGameState();
  resetAiState();

  if (player2Board) {
    player2Board.style.display = 'none';
    player2Board.style.pointerEvents = 'auto';
  }

  clearTurnIndicators();

  player1.gameboard.reset();
  player2.gameboard.reset();

  const newGameButton = document.querySelector('.new-game-btn');
  if (newGameButton) {
    newGameButton.remove();
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

    const aiAttackDelay = getAiAttackDelay();
    gameState.aiTimeoutId = setTimeout(executeAiTurn, aiAttackDelay);
  } else {
    setActiveBoard(currentPlayer);

    if (!gameState.isFirstTurn) {
      displayGameMessage('Your turn.');
    }
  }
  gameState.isFirstTurn = false;
};

const isPlayerFleetPlaced = () => {
  const shipyard = document.querySelector('.dock-shipyard');
  return shipyard ? shipyard.querySelectorAll('.ship').length === 0 : false;
};

const setupComputerGameboard = () => {
  randomizeComputerPlacement();
  renderPlayerBoard(player2, player2Board, false);
  player2Board.style.display = 'grid';
};

export const executeAttack = (attacker, defender, row, column) => {
  if (gameState.gameHasEnded || attacker.id !== gameState.currentTurn) {
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
    if (!cell.classList.contains('cell')) return;

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
        gameOver(attacker.id);
        return;
      }

      handleTurn();
    }
  };
};

const gameOver = (winner) => {
  if (gameState.gameHasEnded) return;
  gameState.gameHasEnded = true;

  if (gameState.aiTimeoutId !== null) {
    clearTimeout(gameState.aiTimeoutId);
    gameState.aiTimeoutId = null;
  }

  const message =
    winner === 'player1'
      ? 'You\'ve sunk the enemy fleet. Victory is yours!'
      : 'All your ships have been destroyed. Defeat!';

  displayGameMessage(message);
  clearTurnIndicators();

  player2Board.style.pointerEvents = 'none';
};

