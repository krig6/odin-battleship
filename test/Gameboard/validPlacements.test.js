import Gameboard from '../../src/Gameboard';
import Ship from '../../src/Ship';

describe('Gameboard', () => {
  describe('valid ship placements', () => {
    let board;
    let ship;

    beforeEach(() => {
      board = new Gameboard();
      ship = new Ship('submarine', 2);
    });

    it('correctly places the ship on the specified coordinates', () => {
      board.placeShip(5, 5, ship);

      expect(board.board[5][5]).toBe(ship);
    });

    it('correctly places the ship horizontally', () => {
      board.placeShip(1, 2, ship);

      expect(board.board[1][2]).toBe(ship);
      expect(board.board[1][3]).toBe(ship);
    });

    it('correctly places the ship vertically', () => {
      board.placeShip(5, 7, ship, 'vertical');

      expect(board.board[5][7]).toBe(ship);
      expect(board.board[6][7]).toBe(ship);
    });
  });
});
