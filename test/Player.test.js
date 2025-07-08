import Player from '../src/Player';

it('creates a Player instance', () => {
  const playerOne = new Player();
  expect(playerOne.name).toBe('Nameless Admiral');
});
