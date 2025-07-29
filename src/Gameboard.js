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

  placeShip(x, y, ship, orientation = 'horizontal') {
    if ((x < 0 || x >= this.boardSize) || (y < 0 || y >= this.boardSize)) {
      throw new Error('Invalid starting coordinates: position is outside the board.');
    }

    if (!['horizontal', 'vertical'].includes(orientation)) {
      throw new Error('Invalid orientation specified. Must be horizontal or vertical.');
    }

    if ((orientation === 'horizontal' && y + ship.length > this.boardSize) ||
      (orientation === 'vertical' && x + ship.length > this.boardSize)) {
      throw new Error('Ship placement exceeds board boundaries.');
    }

    ship.id = ship.type;
    ship.orientation = orientation;
    ship.x = x;
    ship.y = y;

    const bufferCoords = new Set();

    for (let i = 0; i < ship.length; i++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cx = orientation === 'horizontal' ? x + dx : x + i + dx;
          const cy = orientation === 'horizontal' ? y + i + dy : y + dy;

          if (cx >= 0 && cx < this.boardSize && cy >= 0 && cy < this.boardSize) {
            bufferCoords.add(`${cx},${cy}`);
          }
        }
      }
    }

    for (const coord of bufferCoords) {
      const [r, c] = coord.split(',').map(Number);
      const occupyingShip = this.board[r][c];
      if (occupyingShip && occupyingShip.id !== ship.id) {
        throw new Error('Invalid placement: overlapping or adjacent to another ship.');
      }
    }

    for (let i = 0; i < ship.length; i++) {
      const cx = orientation === 'vertical' ? x + i : x;
      const cy = orientation === 'horizontal' ? y + i : y;
      this.board[cx][cy] = ship;
      this.shipPositions.add(`${cx},${cy}`);
    }

    this.fleet[ship.type] = ship;
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

  reset() {
    this.board = this.initializeBoard();
    this.successfulHits = new Set();
    this.missedShots = new Set();
    this.shipPositions = new Set();
    this.fleet = {};
  }
}

export default Gameboard;
