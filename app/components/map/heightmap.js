import nj from 'numjs';
import _ from 'lodash';
import Random from 'random-js';

export default class HeightMap {

  constructor(options) {
    // prepare the grid
    this.size = options.size || 512;
    this.roughness = options.roughness || 2;
    this.engine = Random.engines.mt19937();
    if (options.seed) {
      this.seed = options.seed;
      this.engine.seed(this.seed);
    } else {
      this.engine.autoSeed();
    }
  }

  randomInt(max) {
    return Random.integer(0, max)(this.engine);
  }

  generate() {
    const top = this.randomInt(255);
    const bottom = this.randomInt(255);

    this.grid = nj.zeros([this.size, this.size], 'uint8');
    this.grid.set(0, 0, top);
    this.grid.set(this.size - 1, 0, top);
    this.grid.set(0, this.size - 1, bottom);
    this.grid.set(this.size - 1, this.size - 1, bottom);

    this._diamond(0, 0, this.size - 1, this.size - 1);

    this.maxHeight = this.grid.max();
    this.minHeight = this.grid.min();
    this.avgHeight = this.grid.mean();

    // simple erosion
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        this.grid.set(x, y, _.mean([
          this.grid.get(x + 1, y + 1) || 0,
          this.grid.get(x - 1, y - 1) || 0,
          this.grid.get(x - 1, y + 1) || 0,
          this.grid.get(x + 1, y - 1) || 0,
          this.grid.get(x, y + 1) || 0,
          this.grid.get(x + 1, y) || 0,
          this.grid.get(x, y - 1) || 0,
          this.grid.get(x - 1, y) || 0
        ]));
      }
    }
  }

  _square(xa, ya, x, y, xb, yb) {
    if (this.grid.get(x, y) === 0) {
      const d = Math.abs(xa - xb) + Math.abs(ya - yb);
      let cell = (this.grid.get(xa, ya) + this.grid.get(xb, yb)) / 2;
      cell += Random.real(-0.5, 0.5)(this.engine) * d * this.roughness;
      if (y === 0) {
        this.grid.set(x, this.size - 1, cell);
      }
      if ((x === 0 || x === this.size - 1) && y < this.size - 1) {
        this.grid.set(x, this.size - 1 - y, cell);
      }
      this.grid.set(x, y, _.clamp(cell, 0, 255));
    }
  }

  _diamond(x1, y1, x2, y2) {
    // if we have more squares
    if (!(x2 - x1 < 2 && y2 - y1 < 2)) {
      // set the center point to be the average of all 4 corners
      const x = Math.floor((x1 + x2) / 2);
      const y = Math.floor((y1 + y2) / 2);
      const centerAvg = Math.floor((
        this.grid.get(x1, y1) + this.grid.get(x2, y1) +
        this.grid.get(x2, y2) + this.grid.get(x1, y2)
      ) / 4);
      this.grid.set(x, y, _.clamp(centerAvg, 0, 255));

      // subdivide the square into 4 parts
      this._square(x1, y1, x, y1, x2, y1);
      this._square(x2, y1, x2, y, x2, y2);
      this._square(x1, y2, x, y2, x2, y2);
      this._square(x1, y1, x1, y, x1, y2);

      // subdivide and perform the diamond part on each subdivided square
      this._diamond(x1, y1, x, y);
      this._diamond(x, y1, x2, y);
      this._diamond(x, y, x2, y2);
      this._diamond(x1, y, x, y2);
    }
  }
}
