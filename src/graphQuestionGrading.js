import { circleRadius, readGraph } from './graphingGeometry.js';

const canonical = (value = '') => String(value).toLowerCase()
  .replace(/[−–]/g, '-')
  .replace(/[{}\[\]]/g, (character) => '{['.includes(character) ? '(' : ')')
  .replace(/\s+/g, '');
const list = value => canonical(value).split(',').filter(Boolean).sort().join(',');
const sameList = expected => value => list(value) === list(expected);
const sameText = (...expected) => value => expected.some(item => canonical(value) === canonical(item));
const sameSelection = expected => value => {
  try { return JSON.stringify([...JSON.parse(value)].sort()) === JSON.stringify([...expected].sort()); } catch { return false; }
};
const circle = (center, radius) => value => {
  const data = readGraph(value);
  if (data.objects.length !== 1) return false;
  const [object] = data.objects;
  return object.type === 'circle' && object.points?.length === 2 &&
    object.points[0][0] === center[0] && object.points[0][1] === center[1] &&
    Math.abs(circleRadius(object.points) - radius) < 0.001;
};

// Deterministic answer keys for the supplied 2.5 content. These remain local to
// the prototype; grading never sends a response to a gradebook.
const answers = {
  1: { y: sameList('0'), x: sameList('-5,0,5') },
  2: { square: sameText('81/4', '20.25'), factored: sameText('(x+9/2)^2', '(x+4.5)^2') },
  3: { 'x-small': sameText('0'), 'x-large': sameText('1/2', '.5', '0.5'), 'y-intercept': sameText('0') },
  4: { 'x-small': sameText('-5'), 'x-large': sameText('3'), 'y-intercept': sameText('0') },
  5: { 'x-small': sameText('-5'), 'x-middle': sameText('0'), 'x-large': sameText('5'), 'y-intercept': sameText('0') },
  6: { graph: sameText('0') },
  7: { graph: sameText('1') },
  8: { symmetries: sameSelection([3]) },
  9: { symmetries: sameSelection([0, 1, 2]) },
  10: { symmetries: sameSelection([2]) },
  11: { graph: sameText('2'), 'x-small': sameText('0'), 'x-large': sameText('4'), 'y-intercept': sameText('0'), symmetries: sameSelection([3]) },
  12: { graph: sameText('1'), 'x-intercept': sameText('0'), 'y-intercept': sameText('0'), symmetries: sameSelection([2]) },
  13: { graph: sameText('0'), 'x-intercept': sameText('0'), 'y-intercept': sameText('0'), symmetries: sameSelection([1]) },
  14: { graph: sameText('0'), 'x-intercept': sameText('0'), 'y-intercept': sameText('0'), symmetries: sameSelection([0]) },
  15: { graph: sameText('2'), 'x-intercept': sameText('9'), 'y-intercept': sameText('3'), symmetries: sameSelection([3]) },
  16: { graph: sameText('2'), 'x-intercept': sameText('dne'), 'y-intercept': sameText('dne'), symmetries: sameSelection([2]) },
  17: { center: sameText('0,0', '(0,0)'), radius: sameText('18') },
  18: { center: sameText('5,0', '(5,0)'), radius: sameText('6/5', '1.2') },
  19: { center: sameText('-11,-9', '(-11,-9)'), radius: sameText('11') },
  20: { equation: sameText('x^2+y^2=3', 'x²+y²=3') },
  21: { equation: sameText('(x+20)^2+y^2=13', '(x+20)²+y²=13') },
  22: { equation: sameText('x^2+y^2-6x-10y+30=0', 'x²+y²-6x-10y+30=0') },
  23: { equation: sameText('x^2+y^2=130', 'x²+y²=130') },
  24: { equation: sameText('(x+2)^2+(y+9)^2=36', '(x+2)²+(y+9)²=36') },
  25: { equation: sameText('(x+1)^2+(y-4)^2=16', '(x+1)²+(y-4)²=16') },
  26: { center: sameText('-2,3', '(-2,3)'), radius: sameText('6'), drawing: circle([-2, 3], 6) },
  27: { equation: sameText('(x-3)^2+(y+2)^2=4', '(x-3)²+(y+2)²=4'), center: sameText('3,-2', '(3,-2)'), radius: sameText('2'), drawing: circle([3, -2], 2) },
  29: { equation: sameText('(x-10)^2+(y-4)^2=225', '(x-10)²+(y-4)²=225') },
  30: { classification: sameText('1') },
};

export function graphGradingFields(question) {
  const number = Number(question.id.replace('graphs-circles-question-', ''));
  const validators = answers[number];
  if (!validators) return [];
  const fields = question.inputs.filter(field => validators[field.id]);
  const total = Math.round(question.points * 100);
  const share = Math.floor(total / fields.length);
  return fields.map((field, index) => ({
    ...field,
    points: (index === fields.length - 1 ? total - share * index : share) / 100,
    validate: validators[field.id],
  }));
}
