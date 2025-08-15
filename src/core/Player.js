import Gameboard from './Gameboard.js';

class Player {
  constructor(id, name = 'You', isComputer = false) {
    this.name = name;
    this.isComputer = isComputer;
    this.gameboard = new Gameboard();
    this.id = id;
  }
}

export default Player;
