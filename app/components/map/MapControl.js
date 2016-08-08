import React, { Component, PropTypes } from 'react';
import HeightMap from './heightmap';
import { render } from 'react-dom';
import _ from 'lodash';

const renderers = {
  heightmap(x, y, level) {
    return [level, level, level];
  },
  shadows(x, y, level, sealevel, mapgen) {
    const top = mapgen.grid.get(x, y - 1);
    const bottom = mapgen.grid.get(x, y + 1);
    const left = mapgen.grid.get(x - 1, y);
    const right = mapgen.grid.get(x + 1, y);
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
  contours(x, y, level, sealevel) {
    // const top = mapgen.grid.get(x, y - 1);
    // const bottom = mapgen.grid.get(x, y + 1);
    // const left = mapgen.grid.get(x - 1, y);
    // const right = mapgen.grid.get(x + 1, y);
    if (level <= sealevel) {
      for (let i = 10; i <= sealevel + 10; i += 10) {
        if (level <= i) {
          return [0, Math.round(i * 1.1), 40 + Math.round(i * 1.8)];
        }
      }
    } else {
      for (let i = 10; i < 200; i += 10) {
        if (level < sealevel + i) {
          return [Math.round(i * 2.6), 50 + Math.round(i * 1.5), 40 + i];
        }
      }
    }
    return [255, 255, 255];
  },
  terrain(x, y, level, sealevel, mapgen) {
    const landLow = [81, 115, 99];
    const landHigh = [225, 219, 185];
    const waterLow = [41, 92, 143];
    const waterHigh = [100, 152, 203];
    let ratio;
    if (level > sealevel) { // land
      const rDiff = Math.abs(landLow[0] - landHigh[0]);
      const gDiff = Math.abs(landLow[1] - landHigh[1]);
      const bDiff = Math.abs(landLow[2] - landHigh[2]);
      ratio = 1 * (level - sealevel) / (mapgen.maxHeight - sealevel);
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
  }
};


export default class MapControl extends Component {
  constructor(props) {
    super(props);
    console.time('heightmap');
    this.mapgen = new HeightMap({
      size: Math.pow(2, 9),
      roughness: 0.9,
      seed: undefined
    });
    this.mapgen.generate();
    // const mapgen = new MapGen();
    console.timeEnd('heightmap');
  }
  state = {
    sealevel: 0,
    renderer: 'terrain'
  }
  componentWillMount() {
    this.setState({ sealevel: this.mapgen.avgHeight });
  }
  componentDidMount() {
    // console.log(this.canvas);
    this.draw();
  }

  componentDidUpdate() {
    this.draw();
  }

  draw() {
    this.canvas.width = this.mapgen.size;
    this.canvas.height = this.mapgen.size;

    this.canvas.addEventListener('mousemove', event => {
      const { offsetX, offsetY } = event;
      const height = this.mapgen.grid.get(offsetX, offsetY);
      render(
        <div>
          <b>Coordinates: </b> {offsetX}, {offsetY}<br />
          <b>Height: </b> {height}<br />
          <b>Elevation: </b> {height - this.state.sealevel}
        </div>
      , this.info);
    });

    const ctx = this.canvas.getContext('2d');
    const imgData = ctx.createImageData(this.mapgen.size, this.mapgen.size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const x = (i / 4) % this.mapgen.size;
      const y = Math.floor((i / 4) / this.mapgen.size);
      const level = this.mapgen.grid.get(x, y);
      const renderFunc = renderers[this.state.renderer];
      const [r, g, b] = renderFunc(x, y, level, this.state.sealevel, this.mapgen);
      imgData.data[i + 0] = r;
      imgData.data[i + 1] = g;
      imgData.data[i + 2] = b;
      imgData.data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }

  remake() {
    console.time('heightmap');
    this.mapgen.generate();
    console.timeEnd('heightmap');
    this.setState({ sealevel: this.mapgen.avgHeight });
    this.draw();
  }
  // shouldComponentUpdate(nextProps) {
  //   return nextProps.mapData !== this.props.mapData;
  // }
  render() {
    if (this.mapgen && this.mapgen.grid) {
      return (
        <div>
          <div>
            <h1>Canvas</h1>
            <b>Controls:</b> <button onClick={() => this.remake()}>Regenerate</button>
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
              {this.mapgen.minHeight}
              <input
                type="range"
                min={this.mapgen.minHeight}
                max={this.mapgen.maxHeight}
                value={this.state.sealevel}
                onChange={(event) => {
                  this.setState({ sealevel: _.round(event.target.value) });
                }}
              />
              {this.mapgen.maxHeight}
              ({this.state.sealevel})
            </span>
          </div>
          <canvas ref={elem => this.canvas = elem} />
          <hr />
          <div ref={elem => this.info = elem} />
        </div>
      );
    }
    return <div />;
  }
}
