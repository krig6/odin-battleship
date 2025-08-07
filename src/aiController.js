import { updatePlayerGameBoard } from './domController.js';
import { handleTurn } from './gameController.js';

let gameState, defender, defenderBoard, onGameOver;

export const initializeAi = (_gameState, _defender, _defenderBoard, _onGameOver) => {
  gameState = _gameState;
  defender = _defender;
  defenderBoard = _defenderBoard;
  onGameOver = _onGameOver;
};

const aiState = {
  hunting: false,
  targetQueue: []
};

export const resetAiState = () => {
  aiState.hunting = false;
  aiState.targetQueue = [];
};

export const getAiAttackDelay = () => {
  return aiState.hunting
    ? Math.floor(Math.random() * (900 - 500 + 1)) + 500
    : Math.floor(Math.random() * (2500 - 1200 + 1)) + 1200;
};

export const aiAttacks = () => {
  if (gameState.gameHasEnded) return;

  let attempt = 0;

  while (aiState.hunting && aiState.targetQueue.length > 0) {
    const adjacentKey = aiState.targetQueue.shift();
    const [row, column] = adjacentKey;
    const canShoot =
      !defender.gameboard.successfulHits.has(`${row},${column}`) &&
      !defender.gameboard.missedShots.has(`${row},${column}`);

    if (!canShoot) continue;
    const result = defender.gameboard.receiveAttack(row, column);
    gameState.currentTurn = defender.id;
    updatePlayerGameBoard(defender, defenderBoard);

    if (result === 'hit') {
      const ship = defender.gameboard.getGrid()[row][column];
      const nextTargets = getAdjacentCells(row, column);
      aiState.targetQueue.push(...nextTargets);

      if (ship?.isSunk) resetAiState();
    }

    if (defender.gameboard.allShipsSunk) {
      onGameOver('AI');
      return;
    }

    handleTurn();
    return;
  }

  const remainingShipSizes = getRemainingShipSizes();
  while (attempt < 100) {
    let row = Math.floor(Math.random() * 10);
    let column = Math.floor(Math.random() * 10);
    const key = `${row},${column}`;
    const canShoot = (
      !defender.gameboard.successfulHits.has(key) &&
      !defender.gameboard.missedShots.has(key)
    );

    if (!canShoot || !canFitAnyShip(row, column, remainingShipSizes)) {
      attempt++;
      continue;
    }

    const result = defender.gameboard.receiveAttack(row, column);
    gameState.currentTurn = defender.id;
    updatePlayerGameBoard(defender, defenderBoard);

    if (result === 'hit') {
      aiState.hunting = true;
      const ship = defender.gameboard.getGrid()[row][column];
      const nextTargets = getAdjacentCells(row, column);
      aiState.targetQueue.push(...nextTargets);

      if (ship?.isSunk) resetAiState();
    }

    if (defender.gameboard.allShipsSunk) {
      onGameOver('AI');
      return;
    }

    handleTurn();
    return;
  }
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
    !defender.gameboard.successfulHits.has(`${row},${col}`) &&
    !defender.gameboard.missedShots.has(`${row},${col}`)
  );
};

const getRemainingShipSizes = () => {
  return Object.values(defender.gameboard.fleet)
    .filter(ship => !ship.isSunk)
    .map(ship => ship.length);
};

const canFitAnyShip = (row, col, shipSizes) => {
  const boardSize = 10;
  for (const size of shipSizes) {
    let horizontalFit = true;
    let verticalFit = true;

    for (let offset = 0; offset < size; offset++) {
      if (
        col + size > boardSize ||
        defender.gameboard.successfulHits.has(`${row},${col + offset}`) ||
        defender.gameboard.missedShots.has(`${row},${col + offset}`)
      ) {
        horizontalFit = false;
      }
      if (
        row + size > boardSize ||
        defender.gameboard.successfulHits.has(`${row + offset},${col}`) ||
        defender.gameboard.missedShots.has(`${row + offset},${col}`)
      ) {
        verticalFit = false;
      }
    }

    if (horizontalFit || verticalFit) return true;
  }
  return false;
};

