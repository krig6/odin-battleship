class Ship {
  constructor(type, length) {
    this.type = type;
    this.length = length;
    this.hits = 0;
  }

  hit() {
    this.hits++;
  }
}

export default Ship;
