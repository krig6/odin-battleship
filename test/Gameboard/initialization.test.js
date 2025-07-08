import Gameboard from '../../src/Gameboard';

describe('Gameboard', () => {
  describe('initialization', () => {
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
  });
});
