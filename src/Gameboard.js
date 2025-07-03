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

  placeShip(x, y, type) {
    this.board[x][y] = type;
  }

}

export default Gameboard;
