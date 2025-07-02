import Gameboard from '../src/Gameboard';

it('creates a new Gameboard instance', () => {
  const board = new Gameboard();
  expect(board).toBeDefined();
});
