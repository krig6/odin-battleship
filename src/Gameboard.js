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
    const key = `${x},${y}`;

    if (this.successfulHits.has(key) || this.missedShots.has(key)) {
      throw new Error('This cell has already been attacked.');
    }

    const target = this.board[x][y];

    if (!target) {
      this.missedShots.add(key);
      return 'miss';
    }

    target.hit();
    this.successfulHits.add(key);

    this.markDiagonalBuffer(x, y);

    if (target.isSunk) {
      this.markFullShipBuffer(target);
    }

    return 'hit';
  }

  markDiagonalBuffer(x, y) {
    const diagonals = [
      [-1, -1], [-1, 1],
      [1, -1], [1, 1]
    ];

    for (const [dx, dy] of diagonals) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;

      if (
        nx >= 0 && nx < this.boardSize &&
        ny >= 0 && ny < this.boardSize &&
        !this.shipPositions.has(key) &&
        !this.successfulHits.has(key) &&
        !this.missedShots.has(key)
      ) {
        this.missedShots.add(key);
      }
    }
  }

  markFullShipBuffer(ship) {
    for (let i = -1; i <= ship.length; i++) {
      for (let offset = -1; offset <= 1; offset++) {
        let x = ship.x;
        let y = ship.y;

        if (ship.orientation === 'horizontal') {
          x += offset;
          y += i;
        } else {
          x += i;
          y += offset;
        }

        const key = `${x},${y}`;

        if (
          x >= 0 && x < this.boardSize &&
          y >= 0 && y < this.boardSize &&
          !this.shipPositions.has(key)
        ) {
          this.missedShots.add(key);
        }
      }
    }
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
