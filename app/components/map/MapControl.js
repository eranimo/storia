import React, { Component, PropTypes } from 'react';
import { render } from 'react-dom';
import _ from 'lodash';
import { observer, inject } from 'mobx-react';


const renderers = {
  heightmap(x, y, cell) {
    return [cell.height, cell.height, cell.height];
  },
  shadows(x, y, cell, sealevel, grid) {
    const level = cell.height;
    const top = grid.heightmap.get(x, y - 1);
    const bottom = grid.heightmap.get(x, y + 1);
    const left = grid.heightmap.get(x - 1, y);
    const right = grid.heightmap.get(x + 1, y);
    let add = 0;
    if (level < sealevel) return [0, 0, 255];

    if (top < level && (left < level || right < level)) {
      add = -100;
    }

    if (top < level) add = 25 + level - top;
    if (bottom < level) add = -10 + level - bottom;
    if (left < level) add = 5 + level - left;
    if (right < level) add = level - right;
    const final = _.clamp(100 + add, 0, 255);
    return [final, final, final];
  },
  contours(x, y, cell, sealevel) {
    const level = cell.height;
    // const top = mapgen.grid.get(x, y - 1);
    // const bottom = mapgen.grid.get(x, y + 1);
    // const left = mapgen.grid.get(x - 1, y);
    // const right = mapgen.grid.get(x + 1, y);
    if (level <= sealevel) { // water
      for (let i = 10; i <= sealevel + 10; i += 10) {
        if (level <= i) {
          return [20, 20 + Math.round(i * 1.1), 40 + Math.round(i * 1.8)];
        }
      }
    } else { // land
      for (let i = 10; i < 200; i += 10) {
        if (level < sealevel + i) {
          // return [Math.round(i * 2.6), 50 + Math.round(i * 1.5), 40 + i];
          return [120 + Math.round(i * 1.2), 100 + i, 80 + i];
        }
      }
    }
    return [255, 255, 255];
  },
  terrain(x, y, cell, sealevel, grid) {
    const level = cell.height;
    const landLow = [81, 115, 99];
    const landHigh = [225, 219, 185];
    const waterLow = [41, 92, 143];
    const waterHigh = [100, 152, 203];
    let ratio;
    if (level > sealevel) { // land
      const rDiff = Math.abs(landLow[0] - landHigh[0]);
      const gDiff = Math.abs(landLow[1] - landHigh[1]);
      const bDiff = Math.abs(landLow[2] - landHigh[2]);
      ratio = 1 * (level - sealevel) / (grid.heightmap.maxHeight - sealevel);
      return [
        Math.min(Math.round(landLow[0] + (rDiff * ratio)), 255),
        Math.min(Math.round(landLow[1] + (gDiff * ratio)), 255),
        Math.min(Math.round(landLow[2] + (bDiff * ratio)), 255)
      ];
    }
    const rDiff = Math.abs(waterLow[0] - waterHigh[0]);
    const gDiff = Math.abs(waterLow[1] - waterHigh[1]);
    const bDiff = Math.abs(waterLow[2] - waterHigh[2]);
    ratio = 1 * level / sealevel;
    return [
      Math.min(Math.round(waterLow[0] + (rDiff * ratio)), 255),
      Math.min(Math.round(waterLow[1] + (gDiff * ratio)), 255),
      Math.min(Math.round(waterLow[2] + (bDiff * ratio)), 255)
    ];
  },
  rainfall(x, y, cell, sealevel) {
    const level = cell.height;
    if (level < sealevel) {
      return [100, 100, 100];
    }
    return [0, 0, cell.rainfall * 5];
  },
  waterflow(x, y, cell, sealevel) {
    const level = cell.height;
    if (level < sealevel) {
      return [100, 100, 100];
    }
    return [0, 0, cell.waterflow * 3];
  },
  waterlevel(x, y, cell, sealevel) {
    const level = cell.height;
    if (level < sealevel) {
      return [100, 100, 100];
    }
    return [0, 0, cell.waterlevel * 3];
  }
};


@inject('map')
@observer
export default class MapControl extends Component {
  static propTypes = {
    map: PropTypes.object
  }
  constructor(props) {
    super(props);
    this.props.map.generate();
  }
  state = {
    renderer: 'terrain'
  }
  componentDidMount() {
    this.draw();
  }

  componentDidUpdate() {
    this.draw();
  }

  draw() {
    const { grid, sealevel } = this.props.map;
    this.canvas.width = grid.size;
    this.canvas.height = grid.size;

    this.canvas.addEventListener('mousemove', event => {
      const { offsetX, offsetY } = event;
      const cell = grid.get(offsetX, offsetY);
      if (!cell) return;
      // render(
      //   <div>
      //     <b>Coordinates: </b> {offsetX}, {offsetY}<br />
      //     <b>Height: </b> {cell.height}<br />
      //     <b>Elevation: </b> {cell.height - this.state.sealevel}<br />
      //     <b>Rainfall: </b> {cell.rainfall}
      //   </div>
      // , this.info);
    });

    const ctx = this.canvas.getContext('2d');
    const imgData = ctx.createImageData(grid.size, grid.size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const x = (i / 4) % grid.size;
      const y = Math.floor((i / 4) / grid.size);
      const cell = grid.get(x, y);
      const renderFunc = renderers[this.state.renderer];
      const [r, g, b] = renderFunc(x, y, cell, sealevel, grid);
      imgData.data[i + 0] = r;
      imgData.data[i + 1] = g;
      imgData.data[i + 2] = b;
      imgData.data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }

  remake() {
    console.time('remake');
    this.props.map.remake();
    console.timeEnd('remake');
    this.draw();
  }
  render() {
    const { map } = this.props;
    if (!map.grid) {
      return <div>Making map...</div>;
    }
    return (
      <div>
        <div>
          <h1>Canvas</h1>
          <b>Controls:</b><br />
          <button onClick={() => this.remake()}>Regenerate</button>
          <button
            onClick={() => {
              this.props.map.riverTick();
              this.draw();
            }}
          >
            Tick
          </button>
          <hr />
          <b>Map View: </b>
          <select
            value={this.state.renderer}
            onChange={event => this.setState({ renderer: event.target.value })}
          >
            {Object.keys(renderers).map(rendererName => {
              return (
                <option key={rendererName} value={rendererName}>
                  {_.capitalize(rendererName)}
                </option>
              );
            })}
          </select>
          <hr />
          <span>
            {map.grid.heightmap.minHeight}
            <input
              type="range"
              min={map.grid.heightmap.minHeight}
              max={map.grid.heightmap.maxHeight}
              value={map.sealevel}
              onChange={(event) => map.updateSealevel(_.round(event.target.value))}
            />
          {map.grid.heightmap.maxHeight}
            ({map.sealevel})
          </span>
        </div>
        <canvas ref={elem => this.canvas = elem} />
        <hr />
        <div ref={elem => this.info = elem} />
      </div>
    );
  }
}
