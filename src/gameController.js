import Player from './Player.js';
import Ship from './Ship.js';
import { updatePlayerGameBoard } from './domController.js';
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

const initialFleetPlacement = () => {
  const fleet = player1.gameboard.fleet;
  let row = 0;

  for (const type in fleet) {
    const ship = fleet[type];
    player1.gameboard.placeShip(row, 0, ship);
    row++;
  }

  updatePlayerGameBoard(player1, player1Board);
};

const handleAttacks = () => {
  player1Board.addEventListener('click', (e) => {
    const cell = e.target;
    if (!cell.classList.contains('cell')) return;

    const row = cell.dataset.row;
    const col = cell.dataset.column;

    player1.gameboard.receiveAttack(row, col);
    updatePlayerGameBoard(player1, player1Board);
  });
};

