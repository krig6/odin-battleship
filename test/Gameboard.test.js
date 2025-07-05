import Gameboard from '../src/Gameboard';
import Ship from '../src/Ship.js';

it('creates a new Gameboard instance', () => {
  const board = new Gameboard();
  expect(board).toBeDefined();
});

it('creates a board with the correct dimensions', () => {
  const board = new Gameboard();
  expect(board.board.length).toBe(10);
  board.board.forEach(row => {
    expect(row.length).toBe(10);
  });
});

it('correctly places the ship on the specified coordinates', () => {
  const board = new Gameboard();
  const carrier = new Ship('carrier', 5);
  board.placeShip(5, 5, carrier);
  expect(board.board[5][5]).toBe(carrier);
});

it('correctly places the ship horizontally', () => {
  const board = new Gameboard();
  const submarine = new Ship('submarine', 5);
  board.placeShip(1, 2, submarine);
  expect(board.board[1][3]).toBe(submarine);
});

it('correctly places the ship vertically', () => {
  const board = new Gameboard();
  const destroyer = new Ship('destroyer', 3);
  board.placeShip(5, 7, destroyer, 'vertical');
  expect(board.board[5][7]).toBe(destroyer);
  expect(board.board[6][7]).toBe(destroyer);
  expect(board.board[7][7]).toBe(destroyer);
});

it('throws an error when placing a ship with invalid starting indices', () => {
  const board = new Gameboard();
  const destroyer = new Ship('destroyer', 3);

  expect(() => board.placeShip(-1, 5, destroyer)).toThrow('Invalid starting coordinates: position is outside the board.');
  expect(() => board.placeShip(5, -2, destroyer)).toThrow('Invalid starting coordinates: position is outside the board.');
  expect(() => board.placeShip(10, 0, destroyer)).toThrow('Invalid starting coordinates: position is outside the board.');
  expect(() => board.placeShip(0, 10, destroyer, 'vertical')).toThrow('Invalid starting coordinates: position is outside the board.');
});

it('throws an error when placing a ship horizontally beyond the board boundaries', () => {
  const board = new Gameboard();
  const battleship = new Ship('battleship', 4);
  expect(() => board.placeShip(1, 9, battleship)).toThrow('Ship placement exceeds board boundaries.');
});

it('throws an error when placing a ship vertically beyond the board boundaries', () => {
  const board = new Gameboard();
  const destroyer = new Ship('destroyer', 3);
  expect(() => board.placeShip(9, 1, destroyer, 'vertical')).toThrow('Ship placement exceeds board boundaries.');
});

it('throws an error when direction is not "horizontal" or "vertical"', () => {
  const board = new Gameboard();
  const destroyer = new Ship('destroyer', 3);
  expect(() => board.placeShip(9, 1, destroyer, 'up')).toThrow('Invalid direction specified. Must be horizontal or vertical.');
});

it('increments ship hit count when attack targets ship coordinates', () => {
  const board = new Gameboard();
  const battleship = new Ship('battleship', 4);
  board.placeShip(3, 4, battleship, 'vertical');
  board.receiveAttack(6, 4);
  expect(battleship.hits).toBe(1);
});

it('records missed shots when attacking an empty cell', () => {
  const board = new Gameboard();
  const submarine = new Ship('submarine', 2);
  board.placeShip(0, 0, submarine);
  board.receiveAttack(6, 4);
  expect(board.missedShots.has('6,4')).toBe(true);
});
