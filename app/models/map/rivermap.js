import nj from 'numjs';
import Random from 'random-js';

import map from '../../stores/map';

export default class RiverMap {
  constructor(options) {
    this.grid = options.grid;
    this.size = options.size;

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
    // TODO: use noise instead of random
    console.log(map.sealevel);
    this.rainfall = nj.zeros([this.size, this.size], 'uint8');
    this.waterflow = nj.zeros([this.size, this.size], 'uint8');
    for (const { x, y, height } of this.grid.cells()) {
      if (height >= map.sealevel) {
        this.rainfall.set(x, y, this.randomInt(5));
      }
    }
  }

  tick() {
    for (const cell of this.grid.cells()) {
      if (cell.height >= map.sealevel) {
        let lowest = null;
        let lowestHeight = Infinity;
        for (const [key, value] of cell.neighbors.entries()) {
          if (value.height < lowestHeight) {
            lowestHeight = value.height;
            lowest = value;
          }
        }
        const rainfall = this.rainfall.get(cell.x, cell.y);
        this.rainfall.set(lowest.x, lowest.y, this.rainfall.get(lowest.x, lowest.y) + rainfall);
        this.rainfall.set(cell.x, cell.y, 0);
        this.waterflow.set(cell.x, cell.y, this.waterflow.get(cell.x, cell.y) + rainfall);
      }
    }
  }
}
