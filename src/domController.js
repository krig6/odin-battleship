export const renderGameboardGrid = (player, container) => {
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

      cellElement.addEventListener('click', () => {
        const shipId = cellElement.dataset.shipId;
        if (!shipId) return;

        const rotateEvent = new CustomEvent('rotate-ship', {
          detail: { shipId },
          bubbles: true
        });

        cellElement.dispatchEvent(rotateEvent);
      });

      const cellValue = boardGrid[row][column];
      const positionKey = `${row},${column}`;

      if (successfulHits.has(positionKey)) {
        cellElement.classList.add('hit');
      }

      if (missedShots.has(positionKey)) {
        cellElement.classList.add('miss');
      }

      if (cellValue) {
        cellElement.classList.add(cellValue.type);
        cellElement.dataset.shipId = cellValue.id;
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

const createDraggableShips = (fleetConfig) => {
  const shipyardContainer = document.createElement('div');
  shipyardContainer.classList.add('shipyard-container');

  for (const ship of Object.values(fleetConfig)) {
    const shipElement = document.createElement('div');
    shipElement.classList.add('ship');
    shipElement.setAttribute('draggable', true);
    shipElement.dataset.type = ship.type;
    shipElement.dataset.length = ship.length;

    let orientation = 'horizontal';
    let dragOffset = 0;

    shipElement.addEventListener('mousedown', (e) => {
      const part = e.target.closest('.ship-segment');
      dragOffset = part ? [...part.parentNode.children].indexOf(part) : 0;
      shipElement.dataset.offset = dragOffset;
    });

    shipElement.addEventListener('click', () => {
      orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
      shipElement.classList.toggle('vertical');
      shipElement.dataset.orientation = orientation;
    });

    shipElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/ship-type', ship.type);
      e.dataTransfer.setData('text/ship-length', ship.length);
      e.dataTransfer.setData('text/orientation', orientation);
      e.dataTransfer.setData('text/drag-offset', dragOffset);
      e.dataTransfer.effectAllowed = 'move';
      shipElement.classList.add('dragging');
    });

    shipElement.addEventListener('dragend', () => {
      shipElement.classList.remove('dragging');
    });

    for (let i = 0; i < ship.length; i++) {
      const segment = document.createElement('div');
      segment.classList.add('ship-segment', ship.type);
      shipElement.appendChild(segment);
    }

    shipyardContainer.appendChild(shipElement);
  }

  return shipyardContainer;
};

export const renderRandomizeButton = (onClickHandler) => {
  const randomizeButton = document.createElement('button');
  randomizeButton.textContent = 'Randomize';
  randomizeButton.classList.add('random-btn');
  randomizeButton.addEventListener('click', onClickHandler);

  return randomizeButton;
};

export const renderResetButton = (onClickHandler) => {
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.classList.add('reset-btn');

  resetButton.addEventListener('click', onClickHandler);

  return resetButton;
};

export const renderStartGameButton = (onClickHandler) => {
  const startGameButton = document.createElement('button');
  startGameButton.textContent = 'Start';
  startGameButton.classList.add('start-game-btn');

  startGameButton.addEventListener('click', onClickHandler);

  return startGameButton;
};

export const enableBoardDropZones = (container) => {
  const cells = container.querySelectorAll('.cell');

  cells.forEach((cell) => {
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    cell.addEventListener('drop', (e) => {
      e.preventDefault();

      const shipType = e.dataTransfer.getData('text/ship-type');
      const shipLength = parseInt(e.dataTransfer.getData('text/ship-length'));
      const orientation = e.dataTransfer.getData('text/orientation') || 'horizontal';
      const dragOffset = parseInt(e.dataTransfer.getData('text/drag-offset')) || 0;

      let startRow = parseInt(cell.dataset.row);
      let startCol = parseInt(cell.dataset.column);

      if (orientation === 'horizontal') {
        startCol -= dragOffset;
      } else {
        startRow -= dragOffset;
      }

      const eventData = {
        shipType,
        shipLength,
        orientation,
        startRow,
        startCol
      };

      const placeEvent = new CustomEvent('place-ship', {
        detail: eventData,
        bubbles: true
      });

      cell.dispatchEvent(placeEvent);
    });
  });
};

