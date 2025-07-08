import Gameboard from '../../src/Gameboard';
import Ship from '../../src/Ship';

describe('Gameboard', () => {
  describe('sunk status', () => {
    let board;
    let ship;
    let shipTwo;

    beforeEach(() => {
      board = new Gameboard();
      ship = new Ship('submarine', 2);
      shipTwo = new Ship('patrolBoat', 1);
    });

    it('returns true if all ships are sunk', () => {
      board.placeShip(8, 0, ship, 'vertical');
      board.placeShip(5, 5, shipTwo);

      board.receiveAttack(8, 0);
      board.receiveAttack(9, 0);
      board.receiveAttack(5, 5);

      expect(board.allShipsSunk).toBe(true);
    });

    it('returns false when not all ships are sunk', () => {
      board.placeShip(9, 0, ship);
      board.placeShip(5, 5, shipTwo);

      board.receiveAttack(5, 5);

      expect(board.allShipsSunk).toBe(false);
    });

    it('throws an error when checking sunk status with no ships placed', () => {
      expect(() => board.allShipsSunk).toThrow('No ships have been placed on the board.');
    });
  });
});
