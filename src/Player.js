import Gameboard from '../src/Gameboard.js';

class Player {
  constructor(name = 'Nameless Admiral', isComputer = false) {
    this.name = name;
    this.isComputer = isComputer;
    this.board = new Gameboard();
  }
}

export default Player;
