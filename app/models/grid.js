import Cell from './cell';


export default class Grid {
  constructor(size) {
    this.size = size;

    this._cells = [];
    for (let x = 0; x < size; x++) {
      this._cells[x] = [];
      for (let y = 0; y < size; y++) {
        this._cells[x][y] = new Cell(x, y, this);
      }
    }
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        this._cells[x][y].getNeighbors();
      }
    }
  }

  get(x, y) {
    try {
      return this._cells[x][y];
    } catch (e) {
      throw new Error(`No Cell in Grid at (${x}, ${y})`);
    }
  }

  * cells() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        yield this.get(x, y);
      }
    }
  }

  toString() {
    return `Grid(size: ${this.size})`;
  }
}
