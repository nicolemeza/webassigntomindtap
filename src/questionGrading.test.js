import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingR5Questions } from './r5Questions.js';
import { matchesAnswer, gradingFields, submitQuestion, earnedPoints, fieldComplete, gradedAnswerState } from './questionGrading.js';

const one = { id: 'r5-factoring-question-1', kind: 'greatest-common-factor', points: 1 };
const question = (n) => n === 1 ? one : remainingR5Questions.find((q) => q.id === `r5-factoring-question-${n}`);

test('graded input state follows the latest submission, not the best score', () => {
  assert.equal(gradedAnswerState('2', [], undefined), undefined);
  assert.equal(gradedAnswerState('2', [false], '2'), 'incorrect');
  assert.equal(gradedAnswerState('14xy^2', [false, true], '14xy^2'), 'correct');
  assert.equal(gradedAnswerState('2', [true, false], '2'), 'incorrect');
  assert.equal(earnedPoints(one, { answer: [true, false] }), 1);
});
test('editing clears graded input state; restoring a submitted value restores its state', () => {
  assert.equal(gradedAnswerState('3', [false], '2'), undefined);
  assert.equal(gradedAnswerState('', [false], '2'), undefined);
  assert.equal(gradedAnswerState(' 2 ', [false], '2'), 'incorrect');
  assert.equal(gradedAnswerState('2', [false], '2'), 'incorrect');
});

test('every available R.5 field has a working solution; missing source content stays ungradable', () => {
  for (let n = 1; n <= 29; n++) {
    const q = question(n), fields = gradingFields(q);
    assert.equal(fields.length, n === 28 ? 0 : q.inputs?.length || 1);
    for (const field of fields) assert.equal(matchesAnswer(field.expected, field.expected), true, `${n} ${field.id}`);
  }
});
test('accepts reordered factors, equivalent monomials, signs, whitespace and powers', () => {
  for (const [actual, expected] of [
    ['y² * 14 * x', '14xy^2'], ['(9+x)(2+x)', '(x+2)(x+9)'],
    ['(7-b)(7-b)', '(b-7)^2'], ['(5q-4)(q-5)', '(q-5)(5q-4)'],
    ['8x^2(x+2)', '8x^2(2+x)'], ['(2x+4)(x+9)/2', '(x+2)(x+9)'],
    ['5x^{1/7}(x^{2/7} − 2)', '5x^(1/7)(x^(2/7)-2)'],
    ['prime', 'PRIME'],
  ]) assert.equal(matchesAnswer(actual, expected), true, actual);
});
test('rejects incorrect, expanded, partly factored and malformed answers safely', () => {
  for (const actual of ['(x+3)(x+6)', 'x^2+11x+18', '0', '', 'alert(1)', 'x/**2', 'x^999999', '1/0']) assert.equal(matchesAnswer(actual, '(x+2)(x+9)'), false, actual);
  assert.equal(matchesAnswer('(z^2-25)(z^2+25)', '(z-5)(z+5)(z^2+25)'), false);
});
test('blank fields consume nothing; each submitted field consumes its own attempt', () => {
  const q = question(3);
  assert.equal(submitQuestion(q, {}).submitted, 0);
  const first = submitQuestion(q, { values: { a: '0', b: '' } });
  assert.deepEqual(first.history, { a: [false] });
  const second = submitQuestion(q, { values: { a: '1', b: '5x' } }, first.history, first.lastSubmitted);
  assert.deepEqual(second.history, { a: [false, true], b: [false] });
  assert.equal(earnedPoints(q, second.history), 0.5);
  const third = submitQuestion(q, { values: { a: '0', b: '6x' } }, second.history, second.lastSubmitted);
  assert.deepEqual(third.history, { a: [false, true, false], b: [false, true] });
  assert.equal(earnedPoints(q, third.history), 1);
  assert.deepEqual(first.history, { a: [false] }, 'previous state is immutable');
});
test('five attempts maximum; exhausted fields cannot subsequently gain points', () => {
  let history = {};
  let lastSubmitted = {};
  for (let i = 0; i < 7; i++) {
    const result = submitQuestion(one, { text: String(i) }, history, lastSubmitted);
    history = result.history; lastSubmitted = result.lastSubmitted;
  }
  assert.equal(history.answer.length, 5);
  assert.equal(fieldComplete(history.answer), true);
  assert.deepEqual(submitQuestion(one, { text: '14xy^2' }, history).history, history);
  assert.equal(earnedPoints(one, history), 0);
});
test('correct answers remain editable and consume attempts while keeping the best score', () => {
  const first = submitQuestion(one, { text: '14xy^2' });
  assert.equal(earnedPoints(one, first.history), 1);
  assert.equal(fieldComplete(first.history.answer), false);
  const second = submitQuestion(one, { text: '2' }, first.history, first.lastSubmitted);
  assert.equal(second.submitted, 1);
  assert.deepEqual(second.history.answer, [true, false]);
  assert.equal(earnedPoints(one, second.history), 1);
  let history = second.history;
  let lastSubmitted = second.lastSubmitted;
  for (const text of ['14xy^2', '7', '14xy^2']) {
    const result = submitQuestion(one, { text }, history, lastSubmitted);
    history = result.history; lastSubmitted = result.lastSubmitted;
  }
  assert.deepEqual(history.answer, [true, false, true, false, true]);
  assert.equal(fieldComplete(history.answer), true);
  assert.equal(submitQuestion(one, { text: '2' }, history).submitted, 0);
  assert.equal(earnedPoints(one, history), 1);
});
test('empty available fields are skipped without corrective feedback', () => {
  assert.deepEqual(submitQuestion(one, {}).emptyFields, ['answer']);
  assert.equal(submitQuestion(one, { text: '  ' }).message, '');
  assert.equal(submitQuestion(one, { text: '2' }).message, '');
  assert.equal(submitQuestion(one, { text: '14xy^2' }).message, '');
  const partial = submitQuestion(question(3), { values: { a: '1', b: '' } });
  assert.deepEqual(partial.emptyFields, ['b']);
  assert.deepEqual(partial.history, { a: [true] });
  assert.equal(submitQuestion(one, {}, { answer: [false, false, false, false, false] }).message, '');
});
test('unchanged inputs consume no attempts, including after a correct answer', () => {
  for (const text of ['2', '14xy^2']) {
    const first = submitQuestion(one, { text });
    const repeated = submitQuestion(one, { text }, first.history, first.lastSubmitted);
    assert.equal(repeated.submitted, 0);
    assert.deepEqual(repeated.history, first.history);
    assert.deepEqual(repeated.lastSubmitted, first.lastSubmitted);
    assert.deepEqual(repeated.unchangedFields, ['answer']);
    assert.equal(repeated.message, 'The input was not changed.');
    assert.equal(fieldComplete(repeated.history.answer), false);
  }
});
test('ignores whitespace-only edits and clears validation after a changed submission', () => {
  const first = submitQuestion(one, { text: '14xy^2' });
  const whitespace = submitQuestion(one, { text: ' 14 x y ^ 2 ' }, first.history, first.lastSubmitted);
  assert.equal(whitespace.submitted, 0);
  const changed = submitQuestion(one, { text: '2' }, whitespace.history, whitespace.lastSubmitted);
  assert.equal(changed.submitted, 1);
  assert.equal(changed.message, '');
  assert.deepEqual(changed.unchangedFields, []);
  assert.equal(earnedPoints(one, changed.history), 1);
  assert.deepEqual(first.lastSubmitted, { answer: '14xy^2' });
});
test('only changed fields are graded in a multi-field submission', () => {
  const q = question(3);
  const first = submitQuestion(q, { values: { a: '0', b: '5x' } });
  const second = submitQuestion(q, { values: { a: '0', b: '6x' } }, first.history, first.lastSubmitted);
  assert.equal(second.submitted, 1);
  assert.deepEqual(second.history, { a: [false], b: [false, true] });
  assert.deepEqual(second.unchangedFields, ['a']);
  assert.match(second.message, /input was not changed for Field 1/);
  const repeated = submitQuestion(q, { values: { a: '0', b: '6x' } }, second.history, second.lastSubmitted);
  assert.equal(repeated.submitted, 0);
  assert.deepEqual(repeated.unchangedFields, ['a', 'b']);
});
test('blank submissions and edits reverted to the last graded value use no attempt', () => {
  const first = submitQuestion(one, { text: '2' });
  const blank = submitQuestion(one, { text: '' }, first.history, first.lastSubmitted);
  assert.equal(blank.submitted, 0);
  assert.deepEqual(blank.lastSubmitted, first.lastSubmitted);
  const restored = submitQuestion(one, { text: '2' }, blank.history, blank.lastSubmitted);
  assert.equal(restored.submitted, 0);
  assert.deepEqual(restored.unchangedFields, ['answer']);
});
test('three fields split into .33/.33/.34 and total exactly one', () => {
  const q = question(13), fields = gradingFields(q);
  assert.deepEqual(fields.map((f) => f.points), [.33, .33, .34]);
  assert.equal(earnedPoints(q, { a: [true], b: [true] }), .66);
  assert.equal(earnedPoints(q, Object.fromEntries(fields.map((f) => [f.id, [true]]))), 1);
});
test('GCF and missing-term fields allow algebraically equivalent expanded or factored forms', () => {
  assert.deepEqual(submitQuestion(question(16), { values: { inside: '2y(xy^2+3)' } }).history, { inside: [true] });
  assert.deepEqual(submitQuestion(question(2), { values: { answer: '8x^4(y^2-4y+4)' } }).history, { answer: [true] });
});
test('sample activities and unavailable follow-ups never consume attempts', () => {
  assert.equal(submitQuestion({ id: 'sample-question-1', points: 1 }, { text: '1' }).submitted, 0);
  assert.equal(submitQuestion(question(28), {}).submitted, 0);
});
test('algebra practice grades text and true/false together without changing the question layout', () => {
  const practice = { id: 'sample-question-1', responseFormat: 'text-and-truth', answerKey: '5', statementAnswer: 'True', points: 1 };
  assert.deepEqual(submitQuestion(practice, { text: '10/2', choice: 'True' }).history, { answer: [true] });
  assert.deepEqual(submitQuestion(practice, { text: '5', choice: 'False' }).history, { answer: [false] });
  assert.equal(submitQuestion(practice, { text: '5' }).submitted, 0);
  assert.equal(submitQuestion(practice, { choice: 'True' }).submitted, 0);
});
test('factoring answer keys expand to the original expressions', () => {
  for (const n of [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 17, 18, 20, 21, 22, 23, 24, 25, 27]) {
    const q = question(n), expression = q.blocks.find((block) => block.type === 'math').expression;
    assert.equal(matchesAnswer(gradingFields(q)[0].expected, expression, false), true, `question ${n}`);
  }
  assert.equal(matchesAnswer(gradingFields(question(13))[2].expected, '729y^3+1000z^3', false), true);
  assert.equal(matchesAnswer(gradingFields(question(16))[3].expected, '4x^2y^3+12xy+2x^2y^2+6x', false), true);
  assert.equal(matchesAnswer(gradingFields(question(26))[0].expected, '7x^2-2x-9', false), true);
  assert.equal(matchesAnswer(gradingFields(question(29))[0].expected, '256-16t^2', false), true);
});
