import Player from './Player.js';
import Ship from './Ship.js';

import {
  enableBoardDropZones,
  renderGameboardGrid,
  renderDockContainer,
  updatePlayerGameBoard,
  createNewGameButton,
  displayGameMessage,
  clearTurnIndicators
} from './domController.js';

import {
  resetAiState,
  getAiAttackDelay,
  aiAttacks,
  initializeAi
} from './aiController.js';

const player1 = new Player('player1');
const player2 = new Player('player2', 'Computer', true);
const player1Board = document.getElementById('player-one-board');
const player2Board = document.getElementById('player-two-board');
const mainContainer = document.getElementById('main-container');

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
  renderGameboardGrid(player1, player1Board);
  renderDockContainer(fleet, randomizePlayerPlacement, resetBoard, startGame);
  enableBoardDropZones(player1Board);
  displayGameMessage();
};

player1Board.addEventListener('place-ship', (e) => {
  const { shipType, startRow, startCol, orientation } = e.detail;

  try {
    const ship = player1.gameboard.fleet[shipType];

    player1.gameboard.placeShip(startRow, startCol, ship, orientation);
    updatePlayerGameBoard(player1, player1Board);
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

  updatePlayerGameBoard(player1, player1Board);
  enableBoardDropZones(player1Board);
});

const attemptToRotateShip = (gameboard, shipId) => {
  const board = gameboard.board;

  const shipCells = [...gameboard.shipPositions]
    .map(coordinate => coordinate.split(',').map(Number))
    .filter(([r, c]) => board[r][c]?.id === shipId);

  if (shipCells.length === 0) return false;

  const [r, c] = shipCells[0];
  const ship = board[r][c];
  const originalOrientation = ship.orientation;
  const shipLength = ship.length;

  const originalBoard = board.map(row => [...row]);
  const originalShipPositions = new Set(gameboard.shipPositions);

  const isHorizontal = shipCells[0][0] === shipCells[1][0];
  const sorted = shipCells.sort((a, b) => isHorizontal ? a[1] - b[1] : a[0] - b[0]);

  const pivotIndex = Math.floor(shipLength / 2);
  const [pivotRow, pivotCol] = sorted[pivotIndex];
  const newOrientation = isHorizontal ? 'vertical' : 'horizontal';

  let startRow = pivotRow;
  let startCol = pivotCol;

  if (newOrientation === 'horizontal') {
    startCol = pivotCol - pivotIndex;
  } else {
    startRow = pivotRow - pivotIndex;
  }

  for (const [r, c] of sorted) {
    board[r][c] = null;
    gameboard.shipPositions.delete(`${r},${c}`);
  }
  try {
    gameboard.placeShip(startRow, startCol, ship, newOrientation);
    return true;
  } catch (err) {
    gameboard.board = originalBoard;
    gameboard.shipPositions = originalShipPositions;
    ship.orientation = originalOrientation;
    displayGameMessage(err);
    return false;
  }
};

const autoPlaceFleet = (player, board, afterPlacement = () => { }) => {
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
  updatePlayerGameBoard(player, board);
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
  updatePlayerGameBoard(player1, player1Board);
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
  initializeAi(gameState, player1, player1Board, gameOver);
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

  gameState.player1ClickHandler = handleAttacks(player1, player2, player2Board);
  gameState.player2ClickHandler = handleAttacks(player2, player1, player1Board);

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
    player2Board.classList.add('turn');
    player1Board.classList.remove('turn');

    if (!gameState.isFirstTurn) {
      displayGameMessage('Opponent\'s turn.');
    }

    const aiAttackDelay = getAiAttackDelay();
    gameState.aiTimeoutId = setTimeout(aiAttacks, aiAttackDelay);
  } else {
    player1Board.classList.add('turn');
    player2Board.classList.remove('turn');

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
  renderGameboardGrid(player2, player2Board, false);
  player2Board.style.display = 'grid';
};

const handleAttacks = (attacker, defender, defenderBoard) => {
  return (e) => {
    if (gameState.currentTurn !== attacker.id || gameState.gameHasEnded) return;

    const cell = e.target;
    if (!cell.classList.contains('cell')) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.column);

    try {
      defender.gameboard.receiveAttack(row, col);
      renderGameboardGrid(defender, defenderBoard, false);

      if (defender.gameboard.allShipsSunk) {
        gameOver(attacker.id);
        return;
      }
    } catch (err) {
      displayGameMessage(err.message);
      return;
    }
    handleTurn();
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

