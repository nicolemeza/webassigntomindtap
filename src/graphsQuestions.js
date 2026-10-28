// Question content transcribed from the supplied 2.5 WebAssign screenshot.
// This is content/response data, not an answer key.
const text = text => ({ type: 'text', text });
const math = expression => ({ type: 'math', expression });
const input = (id, label) => ({ input: id, label });
const row = (...parts) => ({ type: 'answer-row', parts });
const answer = (id, label) => row(input(id, label));
const coordinate = (id, label) => row({ text: label }, { math: '(x, y) = (' }, input(id, label), { math: ')' });
const symmetries = ['about the x-axis', 'about the y-axis', 'about the origin', 'no symmetries'];
const symmetry = (prompt = 'Find any symmetries. (Select all that apply.)') => ({ type: 'selections', id: 'symmetries', label: prompt, options: symmetries, multiple: true });
const graphDescriptions = {
  6: ['Upward-opening parabola, vertex (0, −5)', 'Downward-opening parabola, vertex (0, −5)', 'Upward-opening parabola, vertex (0, 5)', 'Downward-opening parabola, vertex (0, 5)'],
  7: ['Downward-opening parabola, vertex (0, −2)', 'Upward-opening parabola, vertex (0, 2)', 'Downward-opening parabola, vertex (0, 2)', 'Upward-opening parabola, vertex (0, −2)'],
  11: ['Upward-opening parabola, vertex (−2, −4)', 'Downward-opening parabola, vertex (2, 4)', 'Upward-opening parabola, vertex (2, −4)', 'Downward-opening parabola, vertex (−2, 4)'],
  12: ['Decreasing cubic through the origin with nonhorizontal tangent', 'Increasing cubic through the origin with horizontal tangent', 'Decreasing cubic through the origin with horizontal tangent', 'Increasing cubic through the origin with nonhorizontal tangent'],
  13: ['Upward V with slopes −2 and 2', 'Downward V with slopes 2 and −2', 'Upward V with slopes −1/2 and 1/2', 'Downward V with slopes 1/2 and −1/2'],
  14: ['Narrow left-opening parabola at the origin', 'Narrow right-opening parabola at the origin', 'Wide right-opening parabola at the origin', 'Wide left-opening parabola at the origin'],
  15: ['Increasing square-root curve starting at (0, 3)', 'Increasing square-root curve starting at (0, −3)', 'Decreasing square-root curve starting at (0, 3)', 'Decreasing square-root curve starting at (0, −3)'],
  16: ['Hyperbola in quadrants I and III passing through (2, 8)', 'Hyperbola close to the axes in quadrants II and IV', 'Hyperbola in quadrants II and IV passing through (−2, 8)', 'Hyperbola close to the axes in quadrants I and III'],
};
const graphChoices = number => ({ type: 'graph-choices', id: 'graph', label: 'Choose the graph of the equation.', options: Array.from({ length: 4 }, (_, i) => ({ src: `/graphs-questions/q${number}-choice-${i + 1}.png`, label: `Graph ${i + 1}`, description: graphDescriptions[number][i] })) });
const question = (number, blocks, extra = {}) => ({
  id: `graphs-circles-question-${number}`, kind: 'math-response', points: 1, blocks,
  hasWatchIt: [3, 4, 9, 20, 22, 23].includes(number),
  inputs: blocks.flatMap(block => block.parts ? block.parts.filter(part => part.input).map(part => ({ id: part.input, label: part.label })) : block.id ? [{ id: block.id, label: block.label }] : []),
  ...extra,
});
const interceptPrompt = 'Find the x- and y-intercepts of the graph. Do not graph the equation.';
const intercepts = (twoX = false) => [
  text('Find any intercepts. (If an answer does not exist, enter DNE.)'),
  ...(twoX ? [coordinate('x-small', 'x-intercept (smaller x-value)'), coordinate('x-large', 'x-intercept (larger x-value)')] : [coordinate('x-intercept', 'x-intercept')]),
  coordinate('y-intercept', 'y-intercept'),
];
const graphQuestion = (number, equation, twoX = false) => question(number, [text('Graph the equation.'), math(equation), graphChoices(number), ...intercepts(twoX), symmetry()]);
const centerRadius = [row({ text: 'center:' }, { math: '(h, k) = (' }, input('center', 'Center of the circle'), { math: ')' }), row({ text: 'radius:' }, { math: 'r =' }, input('radius', 'Radius of the circle'))];
const identifyCircle = (number, equation) => question(number, [text('Identify the center and radius of the circle written in standard form.'), math(equation), ...centerRadius]);
const circleEquation = (number, form, properties) => question(number, [text(`Write an equation in ${form} form of the circle with the given properties.`), text(properties), answer('equation', 'Equation of the circle')]);
const convertCircle = (number, equation) => question(number, [text('Convert the general form of the circle given into standard form.'), math(equation), answer('equation', 'Standard form of the circle')]);
const graphPad = { type: 'graph-pad', id: 'drawing', label: 'Graph the circle.' };

export const graphsQuestions = [
  question(1, [text('You are given the equation y = x³ − 25x. (Enter your answers as comma-separated lists.)'), text('(a) Let x = 0 and solve for y.'), answer('y', 'Question 1, values of y when x is zero'), text('(b) Let y = 0 and solve for x by factoring.'), answer('x', 'Question 1, values of x when y is zero')]),
  question(2, [text('Complete the square on x² + 9x.'), answer('square', 'Complete the square'), text('Factor the resulting trinomial.'), answer('factored', 'Factored trinomial')]),
  question(3, [text(interceptPrompt), math('y = 5x − 10x^2'), coordinate('x-small', 'x-intercept (smaller x-value)'), coordinate('x-large', 'x-intercept (larger x-value)'), coordinate('y-intercept', 'y-intercept')]),
  question(4, [text(interceptPrompt), math('y = x^2 + 2x − 15'), coordinate('x-small', 'x-intercept (smaller x-value)'), coordinate('x-large', 'x-intercept (larger x-value)'), coordinate('y-intercept', 'y-intercept')]),
  question(5, [text(interceptPrompt), math('y = x^4 − 25x^2'), coordinate('x-small', 'x-intercept (smallest x-value)'), coordinate('x-middle', 'x-intercept'), coordinate('x-large', 'x-intercept (largest x-value)'), coordinate('y-intercept', 'y-intercept')]),
  question(6, [text('Graph the equation.'), math('y = x^2 − 5'), graphChoices(6)]),
  question(7, [text('Graph the equation.'), math('y = (1/2)x^2 + 2'), graphChoices(7)]),
  question(8, [text('Find the symmetries, if any, of the graph of the equation. Do not graph the equation. (Select all that apply.)'), math('y = 3x + 8'), symmetry('Select all symmetries that apply.')]),
  question(9, [text('Find the symmetries, if any, of the graph of the equation. Do not graph the equation. (Select all that apply.)'), math('x^2 + y^2 = 64'), symmetry('Select all symmetries that apply.')]),
  question(10, [text('Find the symmetries, if any, of the graph of the equation. Do not graph the equation. (Select all that apply.)'), math('y = 3x^3 + 4x'), symmetry('Select all symmetries that apply.')]),
  graphQuestion(11, 'y = x^2 − 4x', true),
  graphQuestion(12, 'y = x^3 + 2x'),
  graphQuestion(13, 'y = 2|x|'),
  graphQuestion(14, 'y^2 = −2x'),
  graphQuestion(15, 'y = 3 − √x'),
  graphQuestion(16, 'xy = −16'),
  identifyCircle(17, 'x^2 + y^2 = 324'),
  identifyCircle(18, '(x − 5)^2 + y^2 = 36/25'),
  identifyCircle(19, '(x + 11)^2 + (y + 9)^2 = 121'),
  circleEquation(20, 'standard', 'Center at the origin; r = √3'),
  circleEquation(21, 'standard', 'Center at (−20, 0); r = √13'),
  circleEquation(22, 'general', 'Center at (3, 5); r = 2'),
  circleEquation(23, 'general', 'Ends of diameter at (9, 7) and (−9, −7)'),
  convertCircle(24, 'x^2 + y^2 + 4x + 18y + 49 = 0'),
  convertCircle(25, '3x^2 + 3y^2 + 6x − 24y + 3 = 0'),
  question(26, [text('Consider the following equation of a circle.'), math('(x + 2)^2 + (y − 3)^2 = 36'), text('Determine the center and radius of the circle.'), ...centerRadius, graphPad]),
  question(27, [text('Consider the following equation of a circle.'), math('x^2 + y^2 − 6x + 4y + 9 = 0'), text('Convert the given general form of the equation into standard form.'), answer('equation', 'Standard form of the circle'), text('Determine the center and radius of the circle.'), ...centerRadius, graphPad]),
  question(28, [{ type: 'fix-it', title: 'Fix It', notice: 'This question has several parts that must be completed sequentially. If you skip a part of the question, you will not receive any points for the skipped part, and you will not be able to come back to the skipped part.', prompt: 'The following solution is incorrect. You will be asked to determine which steps are incorrect and fix the solution.', solutionPrompt: 'Write the equation of the circle with center (2, −9) and radius 5 in general form.', expression: '', steps: ['(x − 2)^2 + (y + 9)^2 = 25', '(x − 2)^2 + (y + 9)^2 − 25 = 0', 'x^2 + 4 + y^2 + 81 − 25 = 0', 'x^2 + y^2 + 60 = 0'] }], { followUpUnavailable: true }),
  question(29, [text('As a hurricane strengthens an eye begins to form at the center of the storm. At a wind speed of 80 mph the eye of a hurricane is circular when viewed from above and is 30 miles in diameter. If the eye is located at map coordinates (x, y) = (10, 4), find an equation, in standard form, of the circle that models the eye of the hurricane.'), answer('equation', 'Equation modeling the eye of the hurricane')]),
  question(30, [text("When converting a circle's equation from general to standard form, it is possible to obtain a constant term on the right side that is zero or negative. If the constant term is zero, the graph is a single point. If the constant term is negative, the graph is nonexistent. Determine whether the graph of the equation is a single point or nonexistent."), math('x^2 − 10x + y^2 + 6y + 37 = 0'), { type: 'selections', id: 'classification', label: 'Select the description of the graph.', options: ['The graph is a single point.', 'The graph is nonexistent.'] }]),
];

function graphFieldHasResponse(question, values, field) {
    const value = values[field.id];
    if (!value?.trim()) return false;
    const block = question.blocks.find(item => item.id === field.id);
    if (block?.type === 'graph-pad') {
      try { const data = JSON.parse(value); return data.objects?.length > 0 || data.noSolution === true; } catch { return false; }
    }
    if (block?.multiple) {
      try { return JSON.parse(value).length > 0; } catch { return false; }
    }
    return true;
}

export function hasGraphQuestionResponse(question, values = {}) {
  return question.inputs.length > 0 && question.inputs.every(field => graphFieldHasResponse(question, values, field));
}

export function hasAnyGraphQuestionResponse(question, values = {}) {
  return question.inputs.some(field => graphFieldHasResponse(question, values, field));
}
