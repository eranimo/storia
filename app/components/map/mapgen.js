import nj from 'numjs';
import _ from 'lodash';
import Random from 'random-js';


export default class MapGen {
  static defaultOptions = {
    size: Math.exp(2, 9) // 512
  }
  constructor(options = {}) {
    this.size = options.size || 512;
    this.seed = options.seed;
    this.engine = Random.engines.mt19937();
    if (this.seed) {
      this.engine.seed(this.seed);
    } else {
      this.engine.autoSeed();
    }

    // initialize the grid
    this.grid = nj.zeros([this.size, this.size], 'uint8');

    const top = _.random(0, 255);
    const bottom = _.random(0, 255);
    this.grid.set(0, 0, top);
    this.grid.set(0, this.size, top);
    this.grid.set(this.size, 0, bottom);
    this.grid.set(this.size, this.size, bottom);
  }

  randomInt(breadth = 0, min = 0, max = 255) {
    const newMax = max * Math.pow(2, -breadth);
    return Random.integer(min, newMax)(this.engine);
  }

  mean(...values) {
    return Math.floor(_.mean(values));
  }

  generate() {
    let [xMax, yMax] = this.grid.shape;
    console.log(this.grid.shape);
    const xMin = 0;
    const yMin = 0;
    // xMax -= 1;
    // yMax -= 1;

    let side = xMax;
    let squares = 1;
    let i = 0;

    while (side > 1) {
      for (let x = 0; x < squares; x++) {
        for (let y = 0; y < squares; y++) {
          // corner locations
          const xLeft = x * side;
          const xRight = (x + 1) * side;
          const yTop = y * side;
          const yBottom = (y + 1) * side;

          // sizes of halfs
          const dx = side / 2;
          const dy = side / 2;
          //  midpoints
          const xm = xLeft + dx;
          const ym = yTop + dy;

          // diamond step
          // create center avg for each square
          const centerAverage = this.mean(
            this.grid.get(xLeft, yTop),
            this.grid.get(xLeft, yBottom),
            this.grid.get(xRight, yTop),
            this.grid.get(xRight, yBottom)
          );

          // console.log('top left', this.grid.get(xLeft, yTop));
          // console.log('bottom left', this.grid.get(xLeft, yBottom));
          // console.log('top right', this.grid.get(xRight, yTop));
          // console.log('right bottom', this.grid.get(xRight, yBottom));
          // console.log('avg', centerAverage);
          // console.log('');

          this.grid.set(xm, ym, centerAverage + this.randomInt(i));

          // square step

          // create squares for each diamond
          // top square
          const topAverage = this.mean(
            this.grid.get(xLeft, yTop),
            this.grid.get(xRight, yTop),
            this.grid.get(xm, ym),
            this.grid.get(xm, (yTop - dy) < yMin ? yMax - dy : yTop - dy),
          );
          // console.log('top avg', topAverage);
          this.grid.set(xm, yTop, topAverage + this.randomInt(i));

          // wrap the top edges around the center of the image
          if (yTop === yMin) {
            this.grid.set(xMax - xm, yTop, this.grid.get(xm, yTop));
          }

          // bottom square
          const bottomAverage = this.mean(
            this.grid.get(xLeft, yBottom),
            this.grid.get(xRight, yBottom),
            this.grid.get(xm, ym),
            this.grid.get(xm, yBottom + dy > yMax ? yTop + dy : yBottom - dy),
          );
          // console.log('bottom avg', bottomAverage);
          this.grid.set(xm, yBottom, bottomAverage + this.randomInt(i));

          // bottom wrapping part
          if (yBottom === yMax) {
            this.grid.set(xMax - xm, yBottom, this.grid.get(xm, yBottom));
          }

          // left square
          const leftAverage = this.mean(
            this.grid.get(xLeft, yTop),
            this.grid.get(xLeft, yBottom),
            this.grid.get(xm, ym),
            this.grid.get(xLeft - dx < xMin ? xMax - dx : xLeft - dx, ym),
          );
          // console.log('left avg', leftAverage);
          this.grid.set(xLeft, ym, leftAverage + this.randomInt(i));

          // left wrapping
          if (xLeft === xMin) {
            this.grid.set(xMax, ym, this.grid.get(xLeft, ym));
          }

          // right square
          const rightAverage = this.mean(
            this.grid.get(xRight, yTop),
            this.grid.get(xRight, yBottom),
            this.grid.get(xm, ym),
            this.grid.get(xRight + dx > xMax ? xMin + dx : xRight + dx, ym),
          );
          // console.log('right avg', rightAverage);
          this.grid.set(xRight, ym, rightAverage + this.randomInt(i));

          // right wrapping
          if (xRight === xMax) {
            this.grid.set(xMin, ym, this.grid.get(xRight, ym));
          }

          // console.log('');
        }
      }

      side = side / 2;
      squares *= 2;
      i += 1;
    }

    this.avgHeight = this.grid.mean();
  }
}
