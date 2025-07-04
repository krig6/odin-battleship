import Gameboard from '../src/Gameboard';

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
  board.placeShip(1, 2, 'carrier');
  expect(board.board[1][2]).toBe('carrier');
});

it('correctly places the ship horizontally', () => {
  const board = new Gameboard();
  board.placeShip(1, 2, 'submarine', 2);
  expect(board.board[1][3]).toBe('submarine');
});

it('correctly places the ship vertically', () => {
  const board = new Gameboard();
  board.placeShip(5, 7, 'destroyer', 3, 'vertical');
  expect(board.board[5][7]).toBe('destroyer');
  expect(board.board[6][7]).toBe('destroyer');
  expect(board.board[7][7]).toBe('destroyer');
});

it('throws an error when placing a ship with invalid starting indices', () => {
  const board = new Gameboard();

  expect(() => board.placeShip(-1, 5, 'destroyer', 3, 'horizontal')).toThrow('Invalid starting coordinates: position is outside the board.');
  expect(() => board.placeShip(5, -2, 'destroyer', 3, 'horizontal')).toThrow('Invalid starting coordinates: position is outside the board.');
  expect(() => board.placeShip(10, 0, 'destroyer', 3, 'horizontal')).toThrow('Invalid starting coordinates: position is outside the board.');
  expect(() => board.placeShip(0, 10, 'destroyer', 3, 'vertical')).toThrow('Invalid starting coordinates: position is outside the board.');
});
