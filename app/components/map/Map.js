import React, { Component, PropTypes } from 'react';
import HeightMap from './heightmap';
import mp from 'multiprocessing';


export default class Map extends Component {
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
    sealevel: 0
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

    const ctx = this.canvas.getContext('2d');
    const imgData = ctx.createImageData(this.mapgen.size, this.mapgen.size);
    const flattened = this.mapgen.grid.flatten();
    let count = 0;
    for (let i = 0; i < imgData.data.length; i += 4) {
      const level = flattened.get(count);
      const landLow = [81, 115, 99];
      const landHigh = [225, 219, 185];
      const waterLow = [41, 92, 143];
      const waterHigh = [100, 152, 203];
      let ratio;
      let r;
      let g;
      let b;
      if (level > this.state.sealevel) { // land
        const rDiff = Math.abs(landLow[0] - landHigh[0]);
        const gDiff = Math.abs(landLow[1] - landHigh[1]);
        const bDiff = Math.abs(landLow[2] - landHigh[2]);
        ratio = 1 * (level - this.state.sealevel) / (this.mapgen.maxHeight - this.state.sealevel);
        r = Math.min(Math.round(landLow[0] + (rDiff * ratio)), 255);
        g = Math.min(Math.round(landLow[1] + (gDiff * ratio)), 255);
        b = Math.min(Math.round(landLow[2] + (bDiff * ratio)), 255);
      } else { // water
        const rDiff = Math.abs(waterLow[0] - waterHigh[0]);
        const gDiff = Math.abs(waterLow[1] - waterHigh[1]);
        const bDiff = Math.abs(waterLow[2] - waterHigh[2]);
        ratio = 1 * level / this.state.sealevel;
        r = Math.min(Math.round(waterLow[0] + (rDiff * ratio)), 255);
        g = Math.min(Math.round(waterLow[1] + (gDiff * ratio)), 255);
        b = Math.min(Math.round(waterLow[2] + (bDiff * ratio)), 255);
      }
      imgData.data[i + 0] = r;
      imgData.data[i + 1] = g;
      imgData.data[i + 2] = b;
      imgData.data[i + 3] = 255;
      count++;
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
            <button onClick={() => this.remake()}>Regenerate</button>
            <span>
              {this.mapgen.minHeight}
              <input
                type="range"
                min={this.mapgen.minHeight}
                max={this.mapgen.maxHeight}
                value={this.state.sealevel}
                onChange={(event) => {
                  this.setState({ sealevel: event.target.value });
                }}
              />
              {this.mapgen.maxHeight}
            </span>
          </div>
          <canvas ref={elem => this.canvas = elem} />
        </div>
      );
    }
    return <div />;
  }
}
