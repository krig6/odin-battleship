const renderGameboardGrid = (player, container) => {
import { FLEET_CONFIG } from './fleetConfig.js';
  const successfulHits = player.gameboard.successfulHits;
  const missedShots = player.gameboard.missedShots;
  const boardGrid = player.gameboard.getGrid();
  container.innerHTML = '';

  for (let row = 0; row < boardGrid.length; row++) {
    for (let column = 0; column < boardGrid[row].length; column++) {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      cellElement.dataset.row = row;
      cellElement.dataset.column = column;

      const cellValue = boardGrid[row][column];
      const positionKey = `${row},${column}`;

      if (successfulHits.has(positionKey)) {
        cellElement.classList.add('hit');
      }

      if (missedShots.has(positionKey)) {
        cellElement.classList.add('miss');
      }

      if (cellValue) {
        cellElement.classList.add('ship');
      }

      container.appendChild(cellElement);
    }
  }
};

export const updatePlayerGameBoard = (player, container) => {
  renderGameboardGrid(player, container);
};

export const renderShipyard = () => {
  const mainContainer = document.getElementById('main-container');
  const shipyardElement = renderDraggableShips();
  mainContainer.appendChild(shipyardElement);
};

const renderDraggableShips = (fleetConfig = FLEET_CONFIG) => {
  const shipyardContainer = document.createElement('div');
  shipyardContainer.classList.add('shipyard-container');

  for (const shipConfig of fleetConfig) {
    const shipElement = document.createElement('div');
    shipElement.classList.add('ship');
    shipElement.setAttribute('draggable', true);

    for (let i = 0; i < shipConfig.length; i++) {
      const segment = document.createElement('div');
      segment.classList.add('ship-segment');
      shipElement.appendChild(segment);
    }

    shipyardContainer.appendChild(shipElement);
  }

  return shipyardContainer;
};
