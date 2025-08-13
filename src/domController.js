export const player1BoardElement = document.querySelector('[data-player="1"]');
export const player2BoardElement = document.querySelector('[data-player="2"]');
export const mainContainerElement = document.querySelector('.main-container');

export const uiState = {
  player1ClickHandler: null,
  player2ClickHandler: null
};

export const renderPlayerBoard = (player, boardElement, revealShips = true) => {
  const successfulHits = player.gameboard.successfulHits;
  const missedShots = player.gameboard.missedShots;
  const boardGrid = player.gameboard.getGrid();
  boardElement.innerHTML = '';

  for (let row = 0; row < boardGrid.length; row++) {
    for (let column = 0; column < boardGrid[row].length; column++) {
      const cellElement = document.createElement('div');
      cellElement.classList.add('player-board__cell');
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
        cellElement.classList.add('player-board__cell--hit');
      }

      if (missedShots.has(positionKey)) {
        cellElement.classList.add('player-board__cell--miss');
      }

      if (cellValue && revealShips) {
        cellElement.classList.add('player-board__cell--ship');
        cellElement.dataset.shipId = cellValue.id;
      }

      boardElement.appendChild(cellElement);
    }
  }
};

export const renderDockContainer = (fleet, onRandomize, onReset, onStart) => {
  const gameContainerElement = document.querySelector('.main-container__game');

  const dockContainerElement = document.createElement('div');
  dockContainerElement.classList.add('dock-container');

  const dockShipyard = createDockShipyard(fleet);
  const randomizeBtnElement = createRandomizeButton(onRandomize);
  const resetBtnElement = createResetButton(onReset);
  const startBtnElement = createStartGameButton(onStart);

  const dockActions = document.createElement('div');
  dockActions.classList.add('dock-container__actions');
  dockActions.append(randomizeBtnElement, resetBtnElement, startBtnElement);

  dockContainerElement.append(dockShipyard, dockActions);
  gameContainerElement.append(dockContainerElement);
};

const createDockShipyard = (fleetConfig) => {
  const dockShipyardElement = document.createElement('div');
  dockShipyardElement.classList.add('dock-container__shipyard');

  const ships = Object.values(fleetConfig);

  for (const { length, type } of ships) {
    const shipElement = document.createElement('div');
    shipElement.classList.add('ship', 'ship--draggable');
    shipElement.setAttribute('draggable', true);
    shipElement.dataset.type = type;
    shipElement.dataset.length = length;

    let orientation = 'horizontal';
    let dragOffset = 0;

    shipElement.addEventListener('mousedown', (e) => {
      const part = e.target.closest('.ship__segment');
      dragOffset = part ? [...part.parentNode.children].indexOf(part) : 0;
      shipElement.dataset.offset = dragOffset;
    });

    shipElement.addEventListener('click', () => {
      orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
      shipElement.classList.toggle('ship--vertical');
      shipElement.dataset.orientation = orientation;
    });

    shipElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/ship-type', type);
      e.dataTransfer.setData('text/ship-length', length);
      e.dataTransfer.setData('text/orientation', orientation);
      e.dataTransfer.setData('text/drag-offset', dragOffset);
      e.dataTransfer.effectAllowed = 'move';
      shipElement.classList.add('ship--dragging');
    });

    shipElement.addEventListener('dragend', () => {
      shipElement.classList.remove('ship--dragging');
    });

    for (let shipElementIndex = 0; shipElementIndex < length; shipElementIndex++) {
      const segmentElement = document.createElement('div');
      segmentElement.classList.add('ship__segment');
      shipElement.appendChild(segmentElement);
    }

    dockShipyardElement.appendChild(shipElement);
  }

  return dockShipyardElement;
};

const createButton = (label, blockName, modifier, onClickHandler) => {
  const button = document.createElement('button');
  button.textContent = label;
  button.classList.add(`${blockName}__button`, `${blockName}__button--${modifier}`);
  button.addEventListener('click', onClickHandler);
  return button;
};

export const createRandomizeButton = (onClickHandler) =>
  createButton('Randomize', 'dock-container', 'randomize', onClickHandler);

export const createResetButton = (onClickHandler) =>
  createButton('Reset', 'dock-container', 'reset', onClickHandler);

export const createStartGameButton = (onClickHandler) =>
  createButton('Start', 'dock-container', 'start-game', onClickHandler);

export const createNewGameButton = (onClickHandler) =>
  createButton('New Game', 'main-container', 'new-game', onClickHandler);

export const enableBoardDropZones = (boardElement) => {
  const cellElements = boardElement.querySelectorAll('.player-board__cell');

  cellElements.forEach((cellElement) => {
    cellElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    cellElement.addEventListener('drop', (e) => {
      e.preventDefault();

      const shipType = e.dataTransfer.getData('text/ship-type');
      const orientation = e.dataTransfer.getData('text/orientation') || 'horizontal';
      const dragOffset = parseInt(e.dataTransfer.getData('text/drag-offset')) || 0;

      let startRow = parseInt(cellElement.dataset.row);
      let startColumn = parseInt(cellElement.dataset.column);

      if (orientation === 'horizontal') {
        startColumn -= dragOffset;
      } else {
        startRow -= dragOffset;
      }

      const eventData = {
        shipType,
        startRow,
        startColumn,
        orientation
      };

      const placeEvent = new CustomEvent('place-ship', {
        detail: eventData,
        bubbles: true
      });

      cellElement.dispatchEvent(placeEvent);
    });
  });
};

export const displayGameMessage = (gameMessage = 'Drag and place your ships.') => {
  const messageContainerElement = document.querySelector('.main-container__message');
  const message = document.createElement('p');
  messageContainerElement.innerHTML = '';
  message.textContent = gameMessage;

  messageContainerElement.appendChild(message);
};

export const clearTurnIndicators = () => {
  player1BoardElement.classList.remove('player-board--turn');
  player2BoardElement.classList.remove('player-board--turn');
};

export const setActiveBoard = (currentPlayer) => {
  if (currentPlayer.isComputer) {
    player2BoardElement.classList.add('player-board--turn');
    player1BoardElement.classList.remove('player-board--turn');
  } else {
    player1BoardElement.classList.add('player-board--turn');
    player2BoardElement.classList.remove('player-board--turn');
  }
};

export const removeDockContainer = () => {
  const dockContainerElement = document.querySelector('.dock-container');
  if (dockContainerElement) dockContainerElement.remove();
};

export const removeDraggableShips = (shipType) => {
  if (shipType) {
    const draggableShipElement = document.querySelector(`.ship--draggable[data-type="${shipType}"]`);
    if (draggableShipElement) draggableShipElement.remove();
  } else {
    const draggableShips = document.querySelectorAll('.ship--draggable');
    draggableShips.forEach(draggableShip => draggableShip.remove());
  }
};

export const isDockEmpty = () => {
  const dockShipyardElement = document.querySelector('.dock-container__shipyard');
  return dockShipyardElement ? dockShipyardElement.querySelectorAll('.ship--draggable').length === 0 : false;
};
