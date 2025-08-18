export const player1BoardElement = document.querySelector('[data-player="1"]');
export const player2BoardElement = document.querySelector('[data-player="2"]');
export const mainContainerElement = document.querySelector('.main-container');

export const uiState = {
  player1ClickHandler: null,
  player2ClickHandler: null
};

export const renderPlayerBoard = (player, boardElement, revealShips = true) => {
  const { successfulHits, missedShots } = player.gameboard;
  const boardGrid = player.gameboard.getGrid();
  boardElement.innerHTML = '';

  for (let row = 0; row < boardGrid.length; row++) {
    for (let column = 0; column < boardGrid[row].length; column++) {
      const cellElement = document.createElement('div');
      cellElement.classList.add('player-board__cell');
      cellElement.dataset.row = row;
      cellElement.dataset.column = column;

      const cellValue = boardGrid[row][column];
      const positionKey = `${row},${column}`;

      if (successfulHits.has(positionKey)) cellElement.classList.add('player-board__cell--hit', 'smoke');
      if (missedShots.has(positionKey)) cellElement.classList.add('player-board__cell--miss');

      if (cellValue && revealShips) {
        cellElement.classList.add('player-board__cell--ship');
        cellElement.dataset.shipId = cellValue.id;

        cellElement.addEventListener('dblclick', () => {
          const shipId = cellElement.dataset.shipId;
          if (!shipId) return;
          dispatchRotateShip(cellElement, shipId);
        });

        let lastTap = 0;
        cellElement.addEventListener('touchend', (e) => {
          const shipId = cellElement.dataset.shipId;
          if (!shipId) return;

          const now = Date.now();
          if (now - lastTap < 300 && now - lastTap > 0) {
            e.preventDefault();
            dispatchRotateShip(cellElement, shipId);
          }
          lastTap = now;
        });
      }

      boardElement.appendChild(cellElement);
    }
  }
};

const dispatchRotateShip = (cellElement, shipId) => {
  cellElement.dispatchEvent(new CustomEvent('rotate-ship', {
    detail: { shipId },
    bubbles: true
  }));
};

export const renderDockContainer = (fleet, onRandomize, onReset, onStart, player, playerBoardElement) => {
  const gameContainer = document.querySelector('.main-container__game');
  const dockContainer = document.createElement('div');
  dockContainer.classList.add('dock-container');

  const dockShipyard = createDockShipyard(fleet, player, playerBoardElement);
  const dockActions = document.createElement('div');
  dockActions.classList.add('dock-container__actions');
  dockActions.append(
    createRandomizeButton(onRandomize),
    createResetButton(onReset),
    createStartGameButton(onStart)
  );

  dockContainer.append(dockShipyard, dockActions);
  gameContainer.append(dockContainer);
};

export const createDockShipyard = (fleet, player, playerBoardElement) => {
  const dockShipyard = document.createElement('div');
  dockShipyard.classList.add('dock-container__shipyard');

  const dragState = {
    isDragging: false,
    beingDragged: null,
    startX: 0,
    startY: 0,
    segmentIndex: 0,
    boardElement: playerBoardElement
  };

  Object.values(fleet).forEach((ship) => {
    const shipElement = document.createElement('div');
    shipElement.classList.add('ship', 'ship--draggable');
    shipElement.dataset.type = ship.type;
    shipElement.dataset.orientation = 'horizontal';

    for (let i = 0; i < ship.length; i++) {
      const segment = document.createElement('div');
      segment.classList.add('ship__segment');
      shipElement.appendChild(segment);
    }

    const startDrag = (x, y, segmentIndex) => {
      dragState.isDragging = true;
      dragState.beingDragged = shipElement;
      dragState.startX = x;
      dragState.startY = y;
      dragState.segmentIndex = segmentIndex;
      shipElement.style.cursor = 'grabbing';
      shipElement.classList.add('ship--dragging');
    };

    const calculateSegmentIndex = (e, orientation) => {
      const rect = shipElement.getBoundingClientRect();
      return orientation === 'horizontal'
        ? Math.floor((e.clientX - rect.left) / (rect.width / ship.length))
        : Math.floor((e.clientY - rect.top) / (rect.height / ship.length));
    };

    shipElement.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const index = calculateSegmentIndex(e, shipElement.dataset.orientation);
      startDrag(e.clientX, e.clientY, index);
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', onDrop);
    });

    shipElement.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const index = calculateSegmentIndex(t, shipElement.dataset.orientation);
      startDrag(t.clientX, t.clientY, index);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('touchend', onDrop, { passive: false });
    });

    dockShipyard.appendChild(shipElement);
  });

  const onDrag = (e) => {
    if (!dragState.isDragging) return;
    const x = e.clientX ?? e.touches[0].clientX;
    const y = e.clientY ?? e.touches[0].clientY;
    dragState.beingDragged.style.transform = `translate(${x - dragState.startX}px, ${y - dragState.startY}px)`;

    const prevVisibility = dragState.beingDragged.style.visibility;
    dragState.beingDragged.style.visibility = 'hidden';
    const hoverCell = document.elementFromPoint(x, y);

    dragState.beingDragged.style.visibility = prevVisibility;

    if (!hoverCell || !hoverCell.classList.contains('player-board__cell')) {
      dragState.boardElement.querySelectorAll('.player-board__cell--dropzone').forEach(c => c.classList.remove('player-board__cell--dropzone'));
      return;
    }

    let row = parseInt(hoverCell.dataset.row, 10);
    let column = parseInt(hoverCell.dataset.column, 10);
    const orientation = dragState.beingDragged.dataset.orientation;
    const length = fleet[dragState.beingDragged.dataset.type].length;

    if (orientation === 'horizontal') column -= dragState.segmentIndex;
    else row -= dragState.segmentIndex;

    highlightShipPreview(dragState.boardElement, row, column, length, orientation);
  };

  const onDrop = (e) => {
    dragState.boardElement.querySelectorAll('.player-board__cell--dropzone')
      .forEach(c => c.classList.remove('player-board__cell--dropzone'));
    if (!dragState.isDragging) return;

    const x = e.clientX ?? e.changedTouches[0].clientX;
    const y = e.clientY ?? e.changedTouches[0].clientY;
    const shipElement = dragState.beingDragged;
    dragState.isDragging = false;
    dragState.beingDragged = null;
    shipElement.classList.remove('ship--dragging');

    const prevVisibility = shipElement.style.visibility;
    shipElement.style.visibility = 'hidden';
    const dropTarget = document.elementFromPoint(x, y);
    shipElement.style.visibility = prevVisibility;

    const type = shipElement.dataset.type;
    const ship = fleet[type];

    if (!ship || ship.isPlaced) return;

    let placed = false;

    if (dropTarget && dropTarget.classList.contains('player-board__cell')) {
      let row = parseInt(dropTarget.dataset.row, 10);
      let column = parseInt(dropTarget.dataset.column, 10);
      const orientation = shipElement.dataset.orientation;

      if (orientation === 'horizontal') column -= dragState.segmentIndex;
      else row -= dragState.segmentIndex;

      try {
        player.gameboard.placeShip(row, column, ship, orientation);
        ship.isPlaced = true;
        shipElement.remove();
        renderPlayerBoard(player, dragState.boardElement);
        placed = true;
      } catch (err) {
        displayGameMessage(err.message);
      }
    }

    if (!placed) {
      shipElement.style.transform = '';
      shipElement.style.visibility = '';
    }
  };

  return dockShipyard;
};

const highlightShipPreview = (board, startRow, startColumn, length, orientation) => {
  board.querySelectorAll('.player-board__cell--dropzone').forEach(c => c.classList.remove('player-board__cell--dropzone'));
  for (let segmentOffset = 0; segmentOffset < length; segmentOffset++) {
    let row = startRow;
    let column = startColumn;
    if (orientation === 'horizontal') column += segmentOffset;
    else row += segmentOffset;
    const cell = board.querySelector(`.player-board__cell[data-row="${row}"][data-column="${column}"]`);
    if (cell) cell.classList.add('player-board__cell--dropzone');
  }
};

const createButton = (label, modifier, onClickHandler) => {
  const button = document.createElement('button');
  button.textContent = label;
  button.classList.add('battleship__button', `battleship__button--${modifier}`);
  button.addEventListener('click', onClickHandler);
  return button;
};

export const createRandomizeButton = (onClickHandler) =>
  createButton('Randomize', 'randomize', onClickHandler);

export const createResetButton = (onClickHandler) =>
  createButton('Reset', 'reset', onClickHandler);

export const createStartGameButton = (onClickHandler) =>
  createButton('Start', 'start-game', onClickHandler);

export const createNewGameButton = (onClickHandler) =>
  createButton('New Game', 'new-game', onClickHandler);

export const displayGameMessage = (gameMessage = 'Drag and place your ships.') => {
  const messageContainerElement = document.querySelector('.main-container__message');
  const message = document.createElement('p');
  messageContainerElement.innerHTML = '';
  message.textContent = gameMessage;

  messageContainerElement.appendChild(message);
};

const setBoardAttackableState = (boardElement, canBeAttacked) => {
  boardElement.classList.toggle('player-board--attackable', canBeAttacked);
  boardElement.classList.toggle('player-board--protected', !canBeAttacked);
};

export const clearAllBoardStates = () => {
  player1BoardElement.classList.remove('player-board--attackable', 'player-board--protected');
  player2BoardElement.classList.remove('player-board--attackable', 'player-board--protected');
};

export const enableAttackableBoards = (currentPlayer) => {
  const humanBoardCanBeAttacked = currentPlayer.isComputer;
  const aiBoardCanBeAttacked = !currentPlayer.isComputer;

  setBoardAttackableState(player1BoardElement, humanBoardCanBeAttacked);
  setBoardAttackableState(player2BoardElement, aiBoardCanBeAttacked);
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

export const removeNewGameButton = () => {
  const newGameButtonElement = document.querySelector('.battleship__button--new-game');
  if (newGameButtonElement) {
    newGameButtonElement.remove();
  }
};
