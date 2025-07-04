class Gameboard {
  constructor(boardSize = 10) {
    this.boardSize = boardSize;
    this.board = this.initializeBoard();
  }

  initializeBoard() {
    const board = [];
    for (let i = 0; i < this.boardSize; i++) {
      board.push(Array(this.boardSize).fill(null));
    }
    return board;
  }

  placeShip(x, y, type, length = 1, direction = 'horizontal') {
    for (let i = 0; i < length; i++) {
      if (direction === 'horizontal') {
        this.board[x][y + i] = type;
      } else {
        this.board[x + i][y] = type;
      }
    }
  }

}

export default Gameboard;
