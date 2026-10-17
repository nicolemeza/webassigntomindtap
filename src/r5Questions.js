// Transcribed from the supplied R.5 WebAssign activity screenshot.
// These records describe the questions, not solutions or grading rules.
const text = (value) => ({ type: 'text', text: value });
const math = (expression) => ({ type: 'math', expression });
const input = (id, label) => ({ input: id, label });
const row = (...parts) => ({ type: 'answer-row', parts });
const question = (number, blocks, extra = {}) => ({
  id: `r5-factoring-question-${number}`, kind: 'math-response', points: 1, blocks,
  hasWatchIt: [11, 20, 21, 29].includes(number),
  inputs: blocks.flatMap((block) => block.parts?.filter((part) => part.input).map((part) => ({ id: part.input, label: part.label })) || []),
  ...extra,
});
const single = (number, prompt, expression, extra = []) => question(number, [text(prompt), math(expression), ...extra, row(input('answer', `Answer to question ${number}`))]);
const completely = 'Factor the expression completely. (If the expression is prime, enter PRIME.)';

export const remainingR5Questions = [
  question(2, [text('Find the greatest common factor of'), row({ math: '16x^5(y − 2)^2, 32x^4(y − 2)^3,' }, { text: 'and' }, { math: '24x^4(y − 2)^2.' }), row(input('answer', 'Greatest common factor for question 2'))]),
  question(3, [text('Fill in the boxes to complete each factorization.'), row({ text: '(a)' }, { math: 'x^2 − 6x + 5 = (x − 5)(x −' }, input('a', 'Question 3, part a'), { math: ')' }), row({ text: '(b)' }, { math: '18x^2 − 9x − 2 = (3x − 2)(' }, input('b', 'Question 3, part b'), { math: '+ 1)' })]),
  single(4, 'Factor out the greatest common monomial.', '16x^2 + 8x^3'),
  single(5, 'Factor out the greatest common monomial.', '30y^2z − 18yz^2'),
  single(6, 'Factor by grouping.', 'x^2 + 5x + xy + 5y'),
  single(7, 'Factor the difference of two squares.', '16z^2 − 25'),
  single(8, 'Factor the difference of two squares.', '(x − y)^2 − 16'),
  single(9, 'Factor the trinomial.', 'b^2 − 14b + 49'),
  single(10, 'Factor the trinomial.', 'r^2 − 8rs + 16s^2'),
  single(11, 'Factor the trinomial by grouping.', 'x^2 + 11x + 18'),
  single(12, 'Factor the trinomial by grouping.', '5q^2 − 29q + 20'),
  question(13, [text('Consider the following sum of two cubes.'), math('729y^3 + 1,000z^3'), text('Write each term as a cube.'), row({ math: '729y^3 = (' }, input('a', 'Question 13, cube base for 729y cubed'), { math: ')^3' }), row({ math: '1000z^3 = (' }, input('b', 'Question 13, cube base for 1000z cubed'), { math: ')^3' }), text('Factor the sum of two cubes.'), math('729y^3 + 1,000z^3'), row(input('answer', 'Question 13, factored sum of cubes'))]),
  single(14, 'Factor the difference of two cubes.', '27y^3 − 125z^3'),
  single(15, completely, '9ax + 81ay − bx − 9by'),
  question(16, [text('Consider the following expression.'), math('4x^2y^3 + 12xy + 2x^2y^2 + 6x'), text('Find the greatest common factor (GCF) of the terms 4x²y³, 12xy, 2x²y², and 6x.'), row(input('gcf', 'Question 16, greatest common factor')), text('Factor out the GCF from the expression.'), row(input('factor', 'Question 16, common factor'), { math: '(' }, input('inside', 'Question 16, missing terms inside parentheses'), { math: '+ xy^2 + 3)' }), text(completely), row(input('answer', 'Question 16, completely factored expression'))]),
  single(17, completely, 'z^4 − 625'),
  single(18, completely, '4x^3y − 4xy'),
  single(19, completely, 'x^2 + x + 4'),
  single(20, completely, '−14r^2 − 25rs + 25s^2'),
  single(21, completely, 'x^4 − x^2 − 90'),
  single(22, completely, '3y^3 + 648'),
  single(23, completely, 'x^6 − 20x^4 + 64x^2'),
  single(24, completely, 'y^4 + 8y^2 + 36'),
  single(25, 'Factor the expression by grouping three terms and two terms.', '2x^2 + 9x + 4 − xy − 4y'),
  single(26, 'Factor the indicated monomial from the given expression.', '7x^2 − 2x − 9; 7'),
  single(27, 'Factor completely and simplify the algebraic expression. Write your answer using positive exponents.', '5x^{3/7} − 10x^{1/7}'),
  question(28, [
    { type: 'notice', text: 'This question has several parts that must be completed sequentially. If you skip a part of the question, you will not receive any points for the skipped part, and you will not be able to come back to the skipped part.' },
    { type: 'fix-it', title: 'Fix It', prompt: 'The following solution is incorrect. You will be asked to determine which steps are incorrect and fix the solution.', expression: '2x^2 − 2xy − 18x + 18y', steps: ['2(x^2 − xy − 9x + 9y)', '2[x(x − y) + 9(x − y)]', '2(x − y)(x + 9)'] },
  ], { followUpUnavailable: true }),
  question(29, [text('The formula that gives the distance a stuntwoman is above the ground t seconds after she falls over the side of a 256-foot tall building is s = 256 − 16t². Factor the right side.'), { type: 'image', src: '/rebrand/r5-stuntwoman-diagram.png', alt: 'A stuntwoman falls from a 256-foot building toward a safety cushion. The distance to the ground is s.', width: 340, height: 280 }, row({ math: 's =' }, input('answer', 'Question 29, factored expression for s'))]),
];
