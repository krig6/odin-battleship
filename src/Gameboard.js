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
    return Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(null));
  }

  placeShip(x, y, ship, orientation = 'horizontal') {
    if ((x < 0 || x >= this.boardSize) || (y < 0 || y >= this.boardSize)) {
      throw new Error('Invalid starting coordinates: Position is outside the board.');
    }

    if ((orientation === 'horizontal' && y + ship.length > this.boardSize) ||
      (orientation === 'vertical' && x + ship.length > this.boardSize)) {
      throw new Error('Ship placement exceeds board boundaries.');
    }

    ship.id = ship.type;
    ship.orientation = orientation;
    ship.x = x;
    ship.y = y;

    const bufferCoordinates = new Set();

    for (let shipIndex = 0; shipIndex < ship.length; shipIndex++) {
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
          const row = orientation === 'horizontal'
            ? x + rowOffset
            : x + shipIndex + rowOffset;

          const column = orientation === 'horizontal'
            ? y + shipIndex + columnOffset
            : y + columnOffset;

          const isWithinBounds = (
            row >= 0 &&
            row < this.boardSize &&
            column >= 0 &&
            column < this.boardSize
          );

          if (isWithinBounds) {
            bufferCoordinates.add(`${row},${column}`);
          }
        }
      }
    }

    for (const coordinate of bufferCoordinates) {
      const [row, column] = coordinate.split(',').map(Number);
      const occupyingShip = this.board[row][column];
      if (occupyingShip && occupyingShip.id !== ship.id) {
        throw new Error('Invalid placement: Overlapping or adjacent to another ship.');
      }
    }

    for (let shipIndex = 0; shipIndex < ship.length; shipIndex++) {
      const row = orientation === 'vertical' ? x + shipIndex : x;
      const column = orientation === 'horizontal' ? y + shipIndex : y;
      this.board[row][column] = ship;
      this.shipPositions.add(`${row},${column}`);
    }

    this.fleet[ship.type] = ship;
  }

  receiveAttack(x, y) {
    const coordinate = `${x},${y}`;

    if (this.successfulHits.has(coordinate) || this.missedShots.has(coordinate)) {
      throw new Error('This cell has already been attacked.');
    }

    const target = this.board[x][y];

    if (!target) {
      this.missedShots.add(coordinate);
      return 'miss';
    }

    target.hit();
    this.successfulHits.add(coordinate);

    this.markDiagonalBuffer(x, y);

    if (target.isSunk) {
      this.markFullShipBuffer(target);
    }

    return 'hit';
  }

  markDiagonalBuffer(x, y) {
    const diagonalOffsets = [
      [-1, -1], [-1, 1],
      [1, -1], [1, 1]
    ];

    for (const [rowOffset, columnOffset] of diagonalOffsets) {
      const row = x + rowOffset;
      const column = y + columnOffset;
      const coordinate = `${row},${column}`;

      const isWithinBounds = (
        row >= 0 &&
        row < this.boardSize &&
        column >= 0 &&
        column < this.boardSize
      );

      const isUnmarked = (
        !this.shipPositions.has(coordinate) &&
        !this.successfulHits.has(coordinate) &&
        !this.missedShots.has(coordinate)
      );

      if (isWithinBounds && isUnmarked) {
        this.missedShots.add(coordinate);
      }
    }
  }

  markFullShipBuffer(ship) {
    for (let shipIndex = -1; shipIndex <= ship.length; shipIndex++) {
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        let row = ship.x;
        let column = ship.y;

        if (ship.orientation === 'horizontal') {
          row += rowOffset;
          column += shipIndex;
        } else {
          row += shipIndex;
          column += rowOffset;
        }

        const coordinate = `${row},${column}`;

        const isWithinBounds = (
          row >= 0 &&
          row < this.boardSize &&
          column >= 0 &&
          column < this.boardSize
        );

        const isUnoccupied = !this.shipPositions.has(coordinate);

        if (isWithinBounds && isUnoccupied) {
          this.missedShots.add(coordinate);
        }
      }
    }
  }

  get allShipsSunk() {
    const ships = Object.values(this.fleet);
    if (ships.length === 0) {
      throw new Error('No ships have been placed on the board.');
    }
    return ships.every(ship => ship.isSunk);
  }

  getGrid() {
    return this.board;
  }

  reset() {
    this.board = this.initializeBoard();
    this.successfulHits.clear();
    this.missedShots.clear();
    this.shipPositions.clear();
    this.fleet = {};
  }
}

export default Gameboard;
