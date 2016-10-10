import _ from 'lodash';
import neighbors from '../utils/mapUtils';


export default class Cell {
  constructor(x, y, grid) {
    this.x = x;
    this.y = y;
    this.grid = grid;
    this.neighbors = new Map();
  }

  getNeighbors() {
    _.map(neighbors(this.x, this.y, this.grid.size), ([x, y], key) => {
      this.neighbors.set(key, this.grid.get(x, y));
    });
  }

  get height() {
    if (this.grid.heightmap) {
      return this.grid.heightmap.get(this.x, this.y);
    }
    throw Error('No heightmap');
  }

  get rainfall() {
    if (this.grid.rivermap) {
      return this.grid.rivermap.rainfall.get(this.x, this.y);
    }
    throw Error('No rivermap');
  }

  get waterflow() {
    if (this.grid.rivermap) {
      return this.grid.rivermap.waterflow.get(this.x, this.y);
    }
    throw Error('No rivermap');
  }

  get waterlevel() {
    if (this.grid.rivermap) {
      return this.grid.rivermap.waterlevel.get(this.x, this.y);
    }
    throw Error('No rivermap');
  }

  toString() {
    return `Cell(x: ${this.x}, y: ${this.y})`;
  }
}
