import Ship from '../src/Ship';

it('stores the correct type when created', () => {
  const battleship = new Ship('battleship', 4);
  expect(battleship.type).toBe('battleship');
});

it('stores the correct length when created', () => {
  const destroyer = new Ship('destroyer', 3);
  expect(destroyer.length).toBe(3);
});

it('initializes hits to 0 when created', () => {
  const carrier = new Ship('carrier', 5);
  expect(carrier.hits).toBe(0);
});

it('increments hits count when hit() is called', () => {
  const submarine = new Ship('submarine', 3);
  submarine.hit();
  expect(submarine.hits).toBe(1);
});

it('returns true when all segments have been hit', () => {
  const patrolBoat = new Ship('patrol boat', 2);
  patrolBoat.hit();
  patrolBoat.hit();
  expect(patrolBoat.isSunk).toBe(true);
});

it('returns false when hits are less than the ship length', () => {
  const carrier = new Ship('carrier', 5);
  carrier.hit();
  expect(carrier.isSunk).toBe(false);
});

