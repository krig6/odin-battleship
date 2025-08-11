import { displayGameMessage, renderPlayerBoard } from './domController.js';
import { handleTurn, executeAttack } from './gameController.js';

let gameState, attacker, defender, defenderBoardElement, onGameOver;

export const initializeAi = (_gameState, _attacker, _defender, _defenderBoardElement, _onGameOver) => {
  attacker = _attacker;
  gameState = _gameState;
  defender = _defender;
  defenderBoardElement = _defenderBoardElement;
  onGameOver = _onGameOver;
};

export const aiState = {
  hunting: false,
  targetQueue: [],
  aiTimeoutId: null
};

export const resetAiState = () => {
  aiState.hunting = false;
  aiState.targetQueue = [];
};

export const cancelAiTimer = () => {
  if (aiState.aiTimeoutId !== null) {
    clearTimeout(aiState.aiTimeoutId);
    aiState.aiTimeoutId = null;
  }
};

export const scheduleAiTurn = (callback) => {
  cancelAiTimer();
  const aiAttackDelay = getAiAttackDelay();
  aiState.aiTimeoutId = setTimeout(callback, aiAttackDelay);
};

export const getAiAttackDelay = () => {
  return aiState.hunting
    ? Math.floor(Math.random() * (900 - 500 + 1)) + 500
    : Math.floor(Math.random() * (2500 - 1200 + 1)) + 1200;
};

export const executeAiTurn = () => {
  if (gameState.gameHasEnded) return;

  let attempt = 0;

  while (aiState.hunting && aiState.targetQueue.length > 0) {
    const adjacentCoordinate = aiState.targetQueue.shift();
    const [row, column] = adjacentCoordinate;

    const canShoot = (
      !defender.gameboard.successfulHits.has(`${row},${column}`) &&
      !defender.gameboard.missedShots.has(`${row},${column}`)
    );

    if (!canShoot) {
      continue;
    }
    const { success, allShipsSunk, errorMessage, result } = executeAttack(attacker, defender, row, column);

    if (errorMessage) {
      displayGameMessage(errorMessage);
      return;
    }

    if (success) {
      updateAiTargetingAfterHit(result, row, column);
      renderPlayerBoard(defender, defenderBoardElement);

      if (allShipsSunk) {
        onGameOver(attacker.id);
        return;
      }

      handleTurn();
      return;
    }
  }

  const remainingShipSizes = getRemainingShipSizes();
  while (attempt < 100) {
    let row = Math.floor(Math.random() * 10);
    let column = Math.floor(Math.random() * 10);
    const coordinate = `${row},${column}`;
    const canShoot = (
      !defender.gameboard.successfulHits.has(coordinate) &&
      !defender.gameboard.missedShots.has(coordinate)
    );

    if (!canShoot || !canFitAnyShip(row, column, remainingShipSizes)) {
      attempt++;
      continue;
    }

    const { success, allShipsSunk, errorMessage, result } = executeAttack(attacker, defender, row, column);

    if (errorMessage) {
      displayGameMessage(errorMessage);
      return;
    }

    if (success) {
      updateAiTargetingAfterHit(result, row, column);
      renderPlayerBoard(defender, defenderBoardElement);

      if (allShipsSunk) {
        onGameOver(attacker.id);
        return;
      }

      handleTurn();
      return;
    }
  }
};

const updateAiTargetingAfterHit = (result, row, column) => {
  if (result !== 'hit') return;

  aiState.hunting = true;
  const ship = defender.gameboard.getGrid()[row][column];
  const nextTargets = getAdjacentCells(row, column);
  aiState.targetQueue.push(...nextTargets);

  if (ship?.isSunk) resetAiState();
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

