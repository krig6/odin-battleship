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
