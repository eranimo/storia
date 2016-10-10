import { observable, action } from 'mobx';
import Grid from '../models/grid';
import HeightMap from '../models/map/heightmap';
import RiverMap from '../models/map/rivermap';


class MapStore {
  @observable sealevel = 0;
  @observable grid = null;
  size = Math.pow(2, 9);

  @action generate() {
    this.grid = new Grid(this.size);
    this.grid.heightmap = new HeightMap({
      size: this.size,
      roughness: 0.9,
      seed: undefined
    });
    this.grid.rivermap = new RiverMap({
      size: this.size,
      seed: undefined,
      grid: this.grid
    });
    this.remake();
  }

  @action remake() {
    this.grid.heightmap.generate();
    this.grid.rivermap.generate();
    this.sealevel = this.grid.heightmap.avgHeight;
  }

  @action updateSealevel(value) {
    this.sealevel = value;
    this.grid.rivermap.generate();
  }

  @action riverTick() {
    this.grid.rivermap.tick();
  }
}

const map = new MapStore();
export default map;
