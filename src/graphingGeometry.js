export const GRAPH_GRID = { width: 1888, height: 1554, unit: 105 };
export const graphScale = (width, height) => Math.max(width / GRAPH_GRID.width, height / GRAPH_GRID.height) * GRAPH_GRID.unit;
export function graphCoordinates(clientX, clientY, rect) {
  const scale = graphScale(rect.width, rect.height);
  return [Math.round((clientX - rect.left - rect.width / 2) / scale * 2) / 2, Math.round((rect.top + rect.height / 2 - clientY) / scale * 2) / 2];
}
export function circleRadius(points) { return Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1]); }
export function readGraph(value) {
  try { const data = JSON.parse(value); return Array.isArray(data.objects) ? data : { objects: [], noSolution: false }; }
  catch { return { objects: [], noSolution: false }; }
}
