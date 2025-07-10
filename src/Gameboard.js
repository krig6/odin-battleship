class Gameboard {
  constructor(boardSize = 10) {
    this.boardSize = boardSize;
    this.board = this.initializeBoard();
    this.missedShots = new Set();
    this.successfulHits = new Set();
    this.shipPositions = new Set();
    this.fleet = {};
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
        if (this.shipPositions.has(`${x + i},${y}`)) {
          throw new Error('Invalid placement: overlapping with another ship.');
        }
      } else {
        if (this.shipPositions.has(`${x},${y + i}`)) {
          throw new Error('Invalid placement: overlapping with another ship.');
        }
      }
    }

    if (!this.fleet[ship.type]) {
      this.fleet[ship.type] = ship;
    }

    for (let i = 0; i < ship.length; i++) {
      if (direction === 'vertical') {
        this.board[x + i][y] = ship;
        this.shipPositions.add(`${x + i},${y}`);
      } else {
        this.board[x][y + i] = ship;
        this.shipPositions.add(`${x},${y + i}`);
      }
    }
  }

  receiveAttack(x, y) {
    if (this.successfulHits.has(`${x},${y}`) || this.missedShots.has(`${x},${y}`)) {
      throw new Error('This cell has already been attacked.');
    }

    if (this.board[x][y] === null) {
      this.missedShots.add(`${x},${y}`);
      return 'miss';
    }

    this.board[x][y].hit();
    this.successfulHits.add(`${x},${y}`);
    return 'hit';
  }

  get allShipsSunk() {
    if (Object.values(this.fleet).length === 0) {
      throw new Error('No ships have been placed on the board.');
    }

    return Object.values(this.fleet).every(ship => ship.isSunk);
  }

  getGrid() {
    return this.board;
  }

}

export default Gameboard;
