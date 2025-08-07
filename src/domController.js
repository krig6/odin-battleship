export const renderGameboardGrid = (player, container, revealShips = true) => {
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

      container.appendChild(cellElement);
    }
  }
};

export const updatePlayerGameBoard = (player, container) => {
  renderGameboardGrid(player, container);
};

export const renderDockContainer = (fleet, onRandomize, onReset, onStart) => {
  const gameContainer = document.getElementById('game-container');

  const dockContainer = document.createElement('div');
  dockContainer.classList.add('dock-container');

  const draggableShips = createDraggableShips(fleet);
  const randomizeBtn = createRandomizeButton(onRandomize);
  const resetBtn = createResetButton(onReset);
  const startBtn = createStartGameButton(onStart);

  const dockControls = document.createElement('div');
  dockControls.classList.add('dock-controls');
  dockControls.append(randomizeBtn, resetBtn, startBtn);

  dockContainer.append(draggableShips, dockControls);
  gameContainer.append(dockContainer);
};

const createDraggableShips = (fleetConfig) => {
  const dockShipyard = document.createElement('div');
  dockShipyard.classList.add('dock-shipyard');

  const ships = Object.values(fleetConfig);

  for (const { length, type } of ships) {
    const ship = document.createElement('div');
    ship.classList.add('ship');
    ship.setAttribute('draggable', true);
    ship.dataset.type = type;
    ship.dataset.length = length;

    let orientation = 'horizontal';
    let dragOffset = 0;

    ship.addEventListener('mousedown', (e) => {
      const part = e.target.closest('.segment');
      dragOffset = part ? [...part.parentNode.children].indexOf(part) : 0;
      ship.dataset.offset = dragOffset;
    });

    ship.addEventListener('click', () => {
      orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
      ship.classList.toggle('vertical');
      ship.dataset.orientation = orientation;
    });

    ship.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/ship-type', type);
      e.dataTransfer.setData('text/ship-length', length);
      e.dataTransfer.setData('text/orientation', orientation);
      e.dataTransfer.setData('text/drag-offset', dragOffset);
      e.dataTransfer.effectAllowed = 'move';
      ship.classList.add('dragging');
    });

    ship.addEventListener('dragend', () => {
      ship.classList.remove('dragging');
    });

    for (let shipIndex = 0; shipIndex < length; shipIndex++) {
      const segment = document.createElement('div');
      segment.classList.add('segment', type);
      ship.appendChild(segment);
    }

    dockShipyard.appendChild(ship);
  }

  return dockShipyard;
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
  const messageContainer = document.getElementById('message-container');
  const message = document.createElement('p');
  messageContainer.innerHTML = '';
  message.textContent = gameMessage;

  messageContainer.appendChild(message);
};

export const clearTurnIndicators = () => {
  player1Board.classList.remove('turn');
  player2Board.classList.remove('turn');
};

export const setActiveBoard = (currentPlayer) => {
  if (currentPlayer.isComputer) {
    player2Board.classList.add('turn');
    player1Board.classList.remove('turn');
  } else {
    player1Board.classList.add('turn');
    player2Board.classList.remove('turn');
  }
};
