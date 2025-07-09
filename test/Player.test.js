import Player from '../src/Player';

it('creates a Player instance', () => {
  const playerOne = new Player();
  expect(playerOne.name).toBe('Nameless Admiral');
});

it('can identify if the player is a computer', () => {
  const player = new Player('Bot', true);
  expect(player.isComputer).toBe(true);
});

it('defaults isComputer to false', () => {
  const player = new Player();
  expect(player.isComputer).toBe(false);
});

it('assigns a new gameboard to each player', () => {
  const player = new Player();
  expect(player.gameboard).toBeDefined();
});
