export const GRAPH_RANGE = 11;
export const graphScale = (width, height) => Math.max(1, Math.min(width, height)) / (GRAPH_RANGE * 2);
export function graphCoordinates(clientX, clientY, rect) {
  const scale = graphScale(rect.width, rect.height);
  const snap = number => Math.round(number * 2) / 2 || 0;
  return [snap((clientX - rect.left - rect.width / 2) / scale), snap((rect.top + rect.height / 2 - clientY) / scale)];
}
export function circleRadius(points) { return Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1]); }
export function validGraphPoints(type, points) {
  if (!Array.isArray(points) || points.length !== (type === 'point' ? 1 : 2) || points.some(point => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite))) return false;
  if (type === 'point') return true;
  if (points[0][0] === points[1][0] && points[0][1] === points[1][1]) return false;
  if (type === 'parabola') return points[0][0] !== points[1][0];
  if (type === 'horizontal-parabola') return points[0][1] !== points[1][1];
  return ['line', 'ray', 'segment', 'circle'].includes(type);
}
export function translateGraphObject(object, delta) {
  return { ...object, points: object.points.map(point => point.map((coordinate, axis) => coordinate + delta[axis])) };
}
export function readGraph(value) {
  try { const data = JSON.parse(value); return Array.isArray(data.objects) ? { ...data, objects: data.objects.filter(object => object && validGraphPoints(object.type, object.points)), noSolution: Boolean(data.noSolution) } : { objects: [], noSolution: false }; }
  catch { return { objects: [], noSolution: false }; }
}
