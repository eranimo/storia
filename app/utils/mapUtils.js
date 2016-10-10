
// neighbors()    Gets a list of neighbors for a point on a grid with wrapping
// grid (numjs array) 2D grid of points
//      Implements .get(x, y) and .set(x, y, val) methods
// mapSize (Integer) 0 indexed size of map
// x (Integer) x coordinate
// y (Integer) y coordinate
export default function neighbors(x, y, mapSize) {
  // Higher X: to the east (Horizontal)
  // Higher Y: to the south (Vertical)

  // 0, 0             = top left
  // mapSize, 0       = top right
  // 0, mapSize       = bottom left
  // mapSize, mapSize = bottom right

  const xPlus = x === mapSize - 1 ? 0 : x + 1;
  const xMinus = x === 0 ? mapSize - 1 : x - 1;
  const yPlus = y === mapSize - 1 ? 0 : y + 1;
  const yMinus = y === 0 ? mapSize - 1 : y - 1;

  return {
    north: [x, yMinus],
    south: [x, yPlus],
    east: [xPlus, y],
    west: [xMinus, y],
    northEast: [xMinus, yPlus],
    northWest: [xMinus, yMinus],
    southWest: [xMinus, yPlus],
    southEast: [xPlus, yPlus],
  };
}
