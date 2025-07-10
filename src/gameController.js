import Player from './Player.js';
import Ship from './Ship.js';
const player1 = new Player();
const player2 = new Player('Computer', true);
const player1Board = document.getElementById('player-one-board');
const player2Board = document.getElementById('player-two-board');
const FLEET_CONFIG = [
  { type: 'carrier', length: 5 },
  { type: 'battleship', length: 4 },
  { type: 'destroyer', length: 3 },
  { type: 'submarine', length: 2 },
  { type: 'patrolBoat', length: 1 }
];

const createFleet = (fleetData = FLEET_CONFIG) => {
  const fleet = player1.gameboard.fleet;
  fleetData.forEach(({ type, length }) => {
    fleet[type] = new Ship(type, length);
  });
};

