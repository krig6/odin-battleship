import Gameboard from '../../src/Gameboard';
import Ship from '../../src/Ship';

describe('Gameboard', () => {
  describe('invalid ship placements', () => {
    let board;
    let ship;

    beforeEach(() => {
      board = new Gameboard();
      ship = new Ship('destroyer', 3);
    });

    it('throws an error when placing a ship with invalid starting indices', () => {
      expect(() => board.placeShip(-1, 5, ship)).toThrow('Invalid starting coordinates: position is outside the board.');
      expect(() => board.placeShip(5, -2, ship)).toThrow('Invalid starting coordinates: position is outside the board.');
      expect(() => board.placeShip(10, 0, ship)).toThrow('Invalid starting coordinates: position is outside the board.');
      expect(() => board.placeShip(0, 10, ship, 'vertical')).toThrow('Invalid starting coordinates: position is outside the board.');
    });

    it('throws an error when placing a ship horizontally beyond the board boundaries', () => {
      expect(() => board.placeShip(1, 9, ship)).toThrow('Ship placement exceeds board boundaries.');
    });

    it('throws an error when placing a ship vertically beyond the board boundaries', () => {
      expect(() => board.placeShip(9, 1, ship, 'vertical')).toThrow('Ship placement exceeds board boundaries.');
    });

    it('throws an error when direction is not "horizontal" or "vertical"', () => {
      expect(() => board.placeShip(9, 1, ship, 'up')).toThrow('Invalid direction specified. Must be horizontal or vertical.');
    });

    it('throws an error when attempting to place a ship overlapping an existing ship', () => {
      board.placeShip(3, 4, ship);
      const overlappingShip = new Ship('submarine', 2);
      expect(() => board.placeShip(3, 5, overlappingShip)).toThrow('Invalid placement: overlapping with another ship.');
    });
  });
});
