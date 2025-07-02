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

