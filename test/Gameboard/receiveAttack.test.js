import Gameboard from '../../src/Gameboard';
import Ship from '../../src/Ship';

describe('Gameboard', () => {
  describe('receiving attacks', () => {
    let board;
    let ship;

    beforeEach(() => {
      board = new Gameboard();
      ship = new Ship('battleship', 4);
    });

    it('increments ship hit count when attack targets ship coordinates', () => {
      board.placeShip(3, 4, ship, 'vertical');
      board.receiveAttack(6, 4);

      expect(ship.hits).toBe(1);
    });

    it('records missed shots when attacking an empty cell', () => {
      board.placeShip(0, 0, ship);
      board.receiveAttack(6, 4);

      expect(board.missedShots.has('6,4')).toBe(true);
    });

    it('returns "miss" when attacking a coordinate with no ship', () => {
      board.placeShip(0, 0, ship);
      const result = board.receiveAttack(6, 4);

      expect(result).toBe('miss');
    });

    it('records successful hits when attacking a ship', () => {
      board.placeShip(6, 6, ship, 'vertical');
      board.receiveAttack(9, 6);

      expect(board.successfulHits.has('9,6')).toBe(true);
    });

    it('returns "hit" when attacking a coordinate occupied by a ship', () => {
      board.placeShip(6, 6, ship, 'vertical');
      const result = board.receiveAttack(9, 6);

      expect(result).toBe('hit');
    });

    it('throws an error when attacking a cell that has already been targeted', () => {
      board.placeShip(3, 4, ship, 'vertical');
      board.receiveAttack(6, 4);

      expect(() => board.receiveAttack(6, 4)).toThrow('This cell has already been attacked.');
    });

    it('throws an error when attacking a cell that was previously marked as a miss', () => {
      board.placeShip(3, 4, ship, 'vertical');
      board.receiveAttack(2, 4);

      expect(() => board.receiveAttack(2, 4)).toThrow('This cell has already been attacked.');
    });
  });
});
