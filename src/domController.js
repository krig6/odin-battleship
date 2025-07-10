const renderGameboardGrid = (player, container) => {
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
