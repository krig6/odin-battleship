class Gameboard {
  constructor(boardSize = 10) {
    this.boardSize = boardSize;
    this.board = this.initializeBoard();
    this.missedShots = new Set();
  }

  initializeBoard() {
    const board = [];
    for (let i = 0; i < this.boardSize; i++) {
      board.push(Array(this.boardSize).fill(null));
    }
    return board;
  }

  placeShip(x, y, ship, direction = 'horizontal') {
    if ((x < 0 || x >= this.boardSize) || (y < 0 || y >= this.boardSize)) {
      throw new Error('Invalid starting coordinates: position is outside the board.');
    }

    if (direction !== 'horizontal' && direction !== 'vertical') {
      throw new Error('Invalid direction specified. Must be horizontal or vertical.');
    }

    if (direction === 'horizontal' && (y + ship.length) > this.boardSize) {
      throw new Error('Ship placement exceeds board boundaries.');
    }

    if (direction === 'vertical' && (x + ship.length) > this.boardSize) {
      throw new Error('Ship placement exceeds board boundaries.');
    }

    for (let i = 0; i < ship.length; i++) {
      if (direction === 'vertical') {
        this.board[x + i][y] = ship;
      } else {
        this.board[x][y + i] = ship;
      }
    }
  }

  receiveAttack(x, y) {
    if (this.board[x][y] === null) {
      this.missedShots.add(`${x},${y}`);
    } else {
      this.board[x][y].hit();
    }
  }

}
export default Gameboard;
