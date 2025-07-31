import Player from './Player.js';
import Ship from './Ship.js';
import {
  enableBoardDropZones,
  renderGameboardGrid,
  renderDockLayout,
  updatePlayerGameBoard,
  renderNewGameButton
} from './domController.js';

const player1 = new Player();
const player2 = new Player('Computer', true);
const player1Board = document.getElementById('player-one-board');
const player2Board = document.getElementById('player-two-board');
const mainContainer = document.getElementById('main-container');
let currentTurn = null;
let aiTimeoutId = null;

const FLEET_CONFIG = [
  { type: 'carrier', length: 5 },
  { type: 'battleship', length: 4 },
  { type: 'destroyer', length: 3 },
  { type: 'submarine', length: 2 },
  { type: 'patrolBoat', length: 1 }
];

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
  renderDockLayout(fleet, randomizePlayerPlacement, resetBoard, startGame);
  enableBoardDropZones(player1Board);
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
    alert(err.message);
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

  const originalBoard = board.map(row => [...row]);
  const originalShipPositions = new Set(gameboard.shipPositions);

  if (shipCells.length === 1) {
    board[r][c] = null;
    gameboard.shipPositions.delete(`${r},${c}`);

    const newOrientation = originalOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    try {
      gameboard.placeShip(r, c, ship, newOrientation);
      return true;
    } catch (err) {
      gameboard.board = originalBoard;
      gameboard.shipPositions = originalShipPositions;
      ship.orientation = originalOrientation;
      return false;
    }
  }

  const isHorizontal = shipCells[0][0] === shipCells[1][0];
  const sorted = shipCells.sort((a, b) => isHorizontal ? a[1] - b[1] : a[0] - b[0]);

  const midIndex = Math.floor(sorted.length / 2);
  const [pivotRow, pivotCol] = sorted[midIndex];

  let startRow = pivotRow;
  let startCol = pivotCol;
  const newOrientation = isHorizontal ? 'vertical' : 'horizontal';

  if (newOrientation === 'horizontal') {
    startCol = pivotCol - midIndex;
  } else {
    startRow = pivotRow - midIndex;
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
  updatePlayerGameBoard(player, boardElement);
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

  const dock = document.querySelector('.dock-layout');
  if (dock) dock.remove();

  const fleet = createFleet(player1);
  updatePlayerGameBoard(player1, player1Board);
  renderDockLayout(fleet, randomizePlayerPlacement, resetBoard, startGame);
  enableBoardDropZones(player1Board);
};

const startGame = () => {
  if (!isPlayerFleetPlaced()) {
    return;
  }

  const dock = document.querySelector('.dock-layout');
  if (dock) dock.remove();

  setRandomStartingPlayer();
  setupComputerGameboard();
  handleAttacks(player2, player2Board);
  handleTurn();
  mainContainer.appendChild(renderNewGameButton(newGame));
};

const setRandomStartingPlayer = () => {
  return currentTurn = Math.floor(Math.random() * 2) === 0 ? 'player1' : 'player2';
};

const newGame = () => {
  if (aiTimeoutId !== null) {
    clearTimeout(aiTimeoutId);
    aiTimeoutId = null;
  }
  resetAiState();

  if (player2Board) {
    player2Board.style.display = 'none';
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

const clearTurnIndicators = () => {
  player1Board.classList.remove('turn');
  player2Board.classList.remove('turn');
};

const handleTurn = () => {
  if (currentTurn === 'player2') {
    player2Board.classList.add('turn');
    player1Board.classList.remove('turn');
    aiTimeoutId = setTimeout(computerAttacks, 100);
  } else {
    player1Board.classList.add('turn');
    player2Board.classList.remove('turn');
  }
};

const aiState = {
  hunting: false,
  targetQueue: []
};

const resetAiState = () => {
  aiState.hunting = false;
  aiState.targetQueue = [];
};

const getAdjacentCells = (row, col) => {
  const directions = [
    [row, col - 1],  // left
    [row, col + 1], // right
    [row - 1, col], // up
    [row + 1, col] // down
  ];

  return directions.filter(([row, col]) =>
    row >= 0 && row < 10 &&
    col >= 0 && col < 10 &&
    !player1.gameboard.successfulHits.has(`${row},${col}`) &&
    !player1.gameboard.missedShots.has(`${row},${col}`)
  );
};

const computerAttacks = () => {
  let hasAttacked = false;
  let attempt = 0;

  if (aiState.hunting && aiState.targetQueue.length > 0) {
    while (!hasAttacked && aiState.targetQueue.length > 0) {
      const adjacentKey = aiState.targetQueue.shift();
      const [r, c] = adjacentKey;
      const canShoot =
        !player1.gameboard.successfulHits.has(`${r},${c}`) &&
        !player1.gameboard.missedShots.has(`${r},${c}`);

      if (canShoot) {
        const result = player1.gameboard.receiveAttack(r, c);
        currentTurn = 'player1';
        hasAttacked = true;
        updatePlayerGameBoard(player1, player1Board);

        if (result === 'hit') {
          const ship = player1.gameboard.getGrid()[r][c];
          const nextTargets = getAdjacentCells(r, c);
          aiState.targetQueue.push(...nextTargets);

          if (ship && ship.isSunk) {
            resetAiState();
          }
        }
        if (player1.gameboard.allShipsSunk) {
          console.log(`${player1.name} has all ships sunk!`);
          return;
        }
        break;
      }
    }
  }

  if (!hasAttacked) {
    while (attempt < 100) {
      let r = Math.floor(Math.random() * 10);
      let c = Math.floor(Math.random() * 10);
      const key = `${r},${c}`;
      const canShoot =
        !player1.gameboard.successfulHits.has(key) &&
        !player1.gameboard.missedShots.has(key);

      if (canShoot) {
        const result = player1.gameboard.receiveAttack(r, c);
        currentTurn = 'player1';
        hasAttacked = true;
        updatePlayerGameBoard(player1, player1Board);

        if (result === 'hit') {
          aiState.hunting = true;
          const ship = player1.gameboard.getGrid()[r][c];
          const nextTargets = getAdjacentCells(r, c);
          aiState.targetQueue.push(...nextTargets);

          if (ship && ship.isSunk) {
            resetAiState();
          }
        }
        if (player1.gameboard.allShipsSunk) {
          console.log(`${player1.name} has all ships sunk!`);
          return;
        }
        break;
      }
      attempt++;
    }
  }
  if (hasAttacked && !player1.gameboard.allShipsSunk) {
    handleTurn();
  }
};

const isPlayerFleetPlaced = () => {
  const shipyard = document.querySelector('.shipyard-container');
  return shipyard ? shipyard.querySelectorAll('.ship').length === 0 : false;
};

const setupComputerGameboard = () => {
  randomizeComputerPlacement();
  renderGameboardGrid(player2, player2Board, false);
  player2Board.style.display = 'grid';
};

const handleAttacks = (player, playerBoard) => {
  playerBoard.addEventListener('click', (e) => {

    if ((currentTurn === 'player1' && player !== player2) ||
      (currentTurn === 'player2' && player !== player1)) {
      return;
    }

    const cell = e.target;
    if (!cell.classList.contains('cell')) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.column);

    const result = player.gameboard.receiveAttack(row, col);
    currentTurn = currentTurn === 'player1' ? 'player2' : 'player1';

    renderGameboardGrid(player, playerBoard, false);

    if (player.gameboard.allShipsSunk) {
      console.log(`${player.name} has all ships sunk!`);
      return;
    }

    if (result === 'hit') {
      const ship = player.gameboard.getGrid()[row][col];

      if (ship && ship.isSunk) {
        console.log(`${player.name}'s ${ship.type.charAt(0).toUpperCase()}${ship.type.slice(1)} has sunk!`);
      }
    }
    handleTurn();
  });
};
