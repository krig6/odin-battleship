export const player1BoardElement = document.getElementById('player-one-board');
export const player2BoardElement = document.getElementById('player-two-board');
export const mainContainerElement = document.getElementById('main-container');

export const renderPlayerBoard = (player, boardElement, revealShips = true) => {
  const successfulHits = player.gameboard.successfulHits;
  const missedShots = player.gameboard.missedShots;
  const boardGrid = player.gameboard.getGrid();
  boardElement.innerHTML = '';

  for (let row = 0; row < boardGrid.length; row++) {
    for (let column = 0; column < boardGrid[row].length; column++) {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      cellElement.dataset.row = row;
      cellElement.dataset.column = column;

      cellElement.addEventListener('dblclick', () => {
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

      if (cellValue && revealShips) {
        cellElement.classList.add('ship');
        cellElement.dataset.shipId = cellValue.id;
      }

      boardElement.appendChild(cellElement);
    }
  }
};

export const renderDockContainer = (fleet, onRandomize, onReset, onStart) => {
  const gameContainerElement = document.getElementById('game-container');

  const dockContainerElement = document.createElement('div');
  dockContainerElement.classList.add('dock-container');

  const draggableShips = createDraggableShips(fleet);
  const randomizeBtnElement = createRandomizeButton(onRandomize);
  const resetBtnElement = createResetButton(onReset);
  const startBtnElement = createStartGameButton(onStart);

  const dockControls = document.createElement('div');
  dockControls.classList.add('dock-controls');
  dockControls.append(randomizeBtnElement, resetBtnElement, startBtnElement);

  dockContainerElement.append(draggableShips, dockControls);
  gameContainerElement.append(dockContainerElement);
};

const createDraggableShips = (fleetConfig) => {
  const dockShipyardElement = document.createElement('div');
  dockShipyardElement.classList.add('dock-shipyard');

  const ships = Object.values(fleetConfig);

  for (const { length, type } of ships) {
    const shipElement = document.createElement('div');
    shipElement.classList.add('ship');
    shipElement.setAttribute('draggable', true);
    shipElement.dataset.type = type;
    shipElement.dataset.length = length;

    let orientation = 'horizontal';
    let dragOffset = 0;

    shipElement.addEventListener('mousedown', (e) => {
      const part = e.target.closest('.segment');
      dragOffset = part ? [...part.parentNode.children].indexOf(part) : 0;
      shipElement.dataset.offset = dragOffset;
    });

    shipElement.addEventListener('click', () => {
      orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
      shipElement.classList.toggle('vertical');
      shipElement.dataset.orientation = orientation;
    });

    shipElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/ship-type', type);
      e.dataTransfer.setData('text/ship-length', length);
      e.dataTransfer.setData('text/orientation', orientation);
      e.dataTransfer.setData('text/drag-offset', dragOffset);
      e.dataTransfer.effectAllowed = 'move';
      shipElement.classList.add('dragging');
    });

    shipElement.addEventListener('dragend', () => {
      shipElement.classList.remove('dragging');
    });

    for (let shipElementIndex = 0; shipElementIndex < length; shipElementIndex++) {
      const segmentElement = document.createElement('div');
      segmentElement.classList.add('segment', type);
      shipElement.appendChild(segmentElement);
    }

    dockShipyardElement.appendChild(shipElement);
  }

  return dockShipyardElement;
};

const createButton = (label, className, onClickHandler) => {
  const button = document.createElement('button');
  button.textContent = label;
  button.classList.add(className);
  button.addEventListener('click', onClickHandler);
  return button;
};

export const createRandomizeButton = (onClickHandler) =>
  createButton('Randomize', 'random-btn', onClickHandler);

export const createResetButton = (onClickHandler) =>
  createButton('Reset', 'reset-btn', onClickHandler);

export const createStartGameButton = (onClickHandler) =>
  createButton('Start', 'start-game-btn', onClickHandler);

export const createNewGameButton = (onClickHandler) =>
  createButton('New Game', 'new-game-btn', onClickHandler);

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
        startRow,
        startCol,
        orientation
      };

      const placeEvent = new CustomEvent('place-ship', {
        detail: eventData,
        bubbles: true
      });

      cell.dispatchEvent(placeEvent);
    });
  });
};

export const displayGameMessage = (gameMessage = 'Drag and place your ships.') => {
  const messageContainerElement = document.getElementById('message-container');
  const message = document.createElement('p');
  messageContainerElement.innerHTML = '';
  message.textContent = gameMessage;

  messageContainerElement.appendChild(message);
};

export const clearTurnIndicators = () => {
  player1BoardElement.classList.remove('turn');
  player2BoardElement.classList.remove('turn');
};

export const setActiveBoard = (currentPlayer) => {
  if (currentPlayer.isComputer) {
    player2BoardElement.classList.add('turn');
    player1BoardElement.classList.remove('turn');
  } else {
    player1BoardElement.classList.add('turn');
    player2BoardElement.classList.remove('turn');
  }
};
