// Transcribed from the supplied Chapter R Test WebAssign screenshot.
// These records deliberately preserve the source sequence and response formats;
// this prototype does not infer or expose answer keys from the screenshot.
const text = (value) => ({ type: 'text', text: value });
const math = (expression) => ({ type: 'math', expression });
const input = (id, label) => ({ input: id, label });
const row = (...parts) => ({ type: 'answer-row', parts });

const question = (number, blocks) => ({
  id: `chapter-r-test-question-${number}`,
  kind: 'math-response',
  points: 1,
  blocks,
  inputs: blocks.flatMap((block) => block.parts?.filter((part) => part.input).map((part) => ({ id: part.input, label: part.label })) || []),
});

const single = (number, prompt, expression) => question(number, [text(prompt), math(expression), row(input('answer', `Answer to question ${number}`))]);
const simplify = 'Simplify the expression. Assume that all variables represent positive numbers, and write your answer without using negative exponents.';
const factor = 'Factor the polynomial completely.';

export const chapterRTestQuestions = [
  question(1, [text('Consider the set'), math('{−7, −2/11, 0, 1, 3, √11, 10}.'), { type: 'selections', id: 'classification', label: 'List the numbers in the set that are prime numbers. (Select all that apply.)', multiple: true, mathOptions: true, options: ['−7', '−2/11', '0', '1', '3', '√11', '10'] }]),
  question(2, [text('Graph the interval on a number line.'), math('(−∞, −5) ∪ [2, ∞)'), { type: 'number-line', id: 'numberline', label: 'Use the number line to enter your answer.' }]),
  question(3, [text('Write the expression without using absolute value symbols.'), math('|x − 5|, when x < 0'), row(input('answer', 'Expression without absolute value symbols'))]),
  question(4, [text('Find the distance on a number line between points with the following coordinates.'), math('−32 and −12'), row(input('answer', 'Distance between the points'))]),
  single(5, simplify, 'r^3r^4s / r^6s^2'),
  single(6, simplify, '(x^0x^2 / x^−2)^6'),
  question(7, [text('Write the number in scientific notation.'), math('1,400,000'), row(input('coefficient', 'Scientific notation coefficient'), { math: '× 10^' }, input('exponent', 'Scientific notation exponent'))]),
  single(8, 'Write the number in standard notation.', '7.9 × 10^−4'),
  single(9, simplify, '(16 / 49)^{3/2}'),
  single(10, simplify, '(8t^3 / 343s^9)^{−2/3}'),
  single(11, simplify, '5∛(7x^4) − 6x∛(56x)'),
  single(12, 'Rationalize the denominator.', 'x / √(x − 3)'),
  single(13, 'Perform each operation.', '(9a^4b^2)(−3a^4b^7)'),
  single(14, 'Perform the operation.', '(x^2 − x + 4)(2x − 3)'),
  single(15, 'Perform the operation.', '(4x^3 + 15x^2 − 1) / (4x − 1)'),
  single(16, factor, 'x^2 − 121'),
  single(17, factor, '6t^2 − 31tw + 40w^2'),
  single(18, 'Factor the polynomial.', '3a^3 − 1029'),
  single(19, 'Simplify the rational expression. Assume the denominator is not 0.', '55p^4q^7 / 77p^5q^2'),
  single(20, 'Perform the operation and simplify if possible. Assume that no denominators are 0.', 'x/(x + 8) + 8/(x + 8)'),
  single(21, 'Perform the operation and simplify if possible. Assume that no denominators are 0.', '(x + 2)/(x^2 + 6x + 9) ÷ (x^2 − 4)/(x + 3)'),
  single(22, 'Simplify the complex fraction. Assume that no denominators are 0.', 'x^−1 / (x^−1 + y^−1)'),
];
