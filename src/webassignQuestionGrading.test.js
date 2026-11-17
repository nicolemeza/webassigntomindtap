import test from 'node:test';
import assert from 'node:assert/strict';
import { earnedPoints, gradingFields, submitQuestion } from './questionGrading.js';
import { getImportedQuestions } from './webassignCourse.js';
import { nextQuestionRandomization, questionRandomizationValue, withQuestionRandomization } from './questionRandomization.js';
import { exploreItQuestions } from './exploreItQuestions.js';
import { circleRadius, readGraph } from './graphingGeometry.js';

const question = fields => ({ id: 'webassign-test', kind: 'webassign', points: 1, fields });

test('imported dropdowns compare the selected value with the actual answer label', () => {
  const q = question([{ id: 'answer', type: 'select', expected: 'denominator', options: [{ value: '', label: 'Select' }, { value: '0', label: 'numerator' }, { value: '1', label: 'denominator' }] }]);
  assert.deepEqual(submitQuestion(q, { values: { answer: '0' } }).history, { answer: [false] });
  assert.deepEqual(submitQuestion(q, { values: { answer: '1' } }).history, { answer: [true] });
  assert.equal(submitQuestion(q, { values: { answer: '' } }).submitted, 0);
});

test('imported radio and checkbox groups preserve zero-valued options and reject extra selections', () => {
  const q = question([{ id: 'a', group: 'choice', type: 'radio', value: '0', correct: true }, { id: 'b', group: 'choice', type: 'radio', value: '1' }]);
  assert.deepEqual(submitQuestion(q, { values: { choice: '0' } }).history, { choice: [true] });
  assert.deepEqual(submitQuestion(q, { values: { choice: '1' } }).history, { choice: [false] });
  const multi = question([{ id: 'a', group: 'choices', type: 'checkbox', value: '0', correct: true }, { id: 'b', group: 'choices', type: 'checkbox', value: '1', correct: true }, { id: 'c', group: 'choices', type: 'checkbox', value: '2' }]);
  assert.deepEqual(submitQuestion(multi, { values: { choices: '1\u001f0' } }).history, { choices: [true] });
  assert.deepEqual(submitQuestion(multi, { values: { choices: '0\u001f1\u001f2' } }).history, { choices: [false] });
});

test('imported text accepts equivalent fractions, thousands separators, and special answer text', () => {
  for (const [expected, value] of [['1/9', '2/18'], ['362,880', '362880'], ['NO SOLUTION', 'no solution'], ['-3', '−3']]) {
    const q = question([{ id: 'answer', type: 'text', expected }]);
    assert.deepEqual(submitQuestion(q, { values: { answer: value } }).history, { answer: [true] });
  }
});

test('missing answer keys and drawings are saved without being marked incorrect or awarding points', () => {
  const q = question([{ id: 'known', type: 'text', expected: '6' }, { id: 'unknown', type: 'text' }, { id: 'drawing', type: 'graph' }]);
  assert.deepEqual(gradingFields(q).map(field => field.id), ['known']);
  const unsupported = submitQuestion(q, { values: { unknown: 'x + 3', drawing: '{"objects":[]}' } });
  assert.equal(unsupported.submitted, 0);
  assert.deepEqual(unsupported.history, {});
  const partial = submitQuestion(q, { values: { known: '6', unknown: 'x + 3' } });
  assert.deepEqual(partial.history, { known: [true] });
  assert.equal(earnedPoints(q, partial.history), 0.33);
});

test('imported responses respect unchanged submissions and attempt limits', () => {
  const q = question([{ id: 'answer', type: 'text', expected: '4' }]);
  const first = submitQuestion(q, { values: { answer: '2' } });
  assert.equal(submitQuestion(q, { values: { answer: ' 2 ' } }, first.history, first.lastSubmitted).submitted, 0);
  const exhausted = { answer: [false, false, false, false, false] };
  assert.equal(submitQuestion(q, { values: { answer: '4' } }, exhausted).submitted, 0);
});

test('both multi-step randomizations have keys that solve the displayed equation', () => {
  const original = getImportedQuestions('Chapter 1. Equations and Inequalities', '1.1 HW Linear Equations & Rational Equations').find(q => q.sourceId === '5352779');
  const snapshot = structuredClone(original);
  const walk = (nodes, predicate) => nodes.flatMap(node => typeof node === 'string' ? [] : [...(predicate(node) ? [node] : []), ...walk(node.children || [], predicate)]);
  for (const [c, d, expanded, solution] of [[7, 3, '5x + 27', '21/13'], [9, 4, '5x + 33', '27/19']]) {
    const randomized = withQuestionRandomization(original, c);
    assert.equal(questionRandomizationValue(randomized), c);
    assert.deepEqual(randomized.fields.map(field => field.expected), ['6', expanded, solution]);
    assert.deepEqual(walk(randomized.content, node => node.randomized).map(node => node.children.join('')), [String(c), String(d), String(6 * d)]);
    assert.deepEqual(walk(randomized.content, node => node.answerKey).map(node => node.children.join('')), ['6', expanded, solution]);
    assert.equal(walk(randomized.content, node => node.answerKey && node.tag === 'img').length, 0);
    const [numerator, denominator] = solution.split('/').map(Number);
    const x = numerator / denominator;
    assert.ok(Math.abs((3 + x) / 3 + (x + c) / 2 - (d * x + 1)) < 1e-12);
    assert.ok(Math.abs(6 * ((3 + x) / 3 + (x + c) / 2) - (5 * x + Number(expanded.split('+')[1]))) < 1e-12);
    const correct = submitQuestion(randomized, { values: { 'field-0': '6', 'field-1': expanded, 'field-2': solution } });
    assert.deepEqual(correct.history, { 'field-0': [true], 'field-1': [true], 'field-2': [true] });
    assert.equal(earnedPoints(randomized, correct.history), 1);
    const stale = submitQuestion(randomized, { values: { 'field-1': c === 7 ? '5x + 33' : '5x + 27', 'field-2': c === 7 ? '27/19' : '21/13' } });
    assert.deepEqual(stale.history, { 'field-1': [false], 'field-2': [false] });
  }
  assert.deepEqual(original, snapshot);
});

test('new randomization always changes to the other permitted version without changing the source', () => {
  const original = getImportedQuestions('Chapter 1. Equations and Inequalities', '1.1 HW Linear Equations & Rational Equations').find(q => q.sourceId === '5352779');
  let preview = withQuestionRandomization(original);
  for (let i = 0; i < 6; i++) {
    preview = nextQuestionRandomization(preview);
    assert.equal(questionRandomizationValue(preview), i % 2 === 0 ? 9 : 7);
  }
  assert.equal(questionRandomizationValue(original), 7);
  assert.throws(() => withQuestionRandomization(original, 8), RangeError);
  const unrelated = question([{ id: 'answer', type: 'text', expected: '4' }]);
  assert.equal(withQuestionRandomization(unrelated), unrelated);
  assert.equal(nextQuestionRandomization(unrelated), unrelated);
});

test('Explore It variants compute both transformations and replace every answer key', () => {
  const original = exploreItQuestions[0];
  const snapshot = structuredClone(original);
  const text = node => typeof node === 'string' ? node : (node.children || []).map(text).join('');
  const baseline = withQuestionRandomization(original);
  assert.deepEqual(baseline.fields.map(field => field.expected), original.fields.map(field => field.expected));
  for (const shrink of [2, 3, 4]) for (const stretch of [2, 3, 4]) for (const targetScale of [4, 9, 16]) {
    const variant = withQuestionRandomization(baseline, { shrink, stretch, targetScale });
    const expected = Object.fromEntries(variant.fields.map(field => [field.id, field.expected]));
    const [coefficient, constant] = expected.function.split('x^2-').map(Number);
    const horizontal = expected.horizontal.includes('/') ? 1 / Number(expected.horizontal.split('/')[1]) : Number(expected.horizontal);
    for (const x of [-3, 0, 2.5]) {
      assert.equal(coefficient * x ** 2 - constant, stretch * ((shrink * x) ** 2 - 3));
      assert.ok(Math.abs(targetScale * ((horizontal * x) ** 2 - 3) - (x ** 2 - 3 * targetScale)) < 1e-12);
    }
    const keys = variant.content.flatMap(block => (block.children || []).filter(node => node.answerKey).map(text));
    assert.deepEqual(keys, Object.values(expected));
    assert.equal(keys.length, 3);
    assert.match(text(variant.content[2]), new RegExp(`shrink is set to ${shrink} and the vertical stretch is set to ${stretch}`));
    assert.match(text(variant.content[4]), new RegExp(`x² − ${3 * targetScale}`));
    const correct = submitQuestion(variant, { values: expected });
    assert.deepEqual(correct.history, { function: [true], horizontal: [true], vertical: [true] });
    assert.equal(earnedPoints(variant, correct.history), 1);
    assert.notDeepEqual(questionRandomizationValue(nextQuestionRandomization(variant, () => 0)), questionRandomizationValue(variant));
  }
  assert.deepEqual(original, snapshot);
});

test('all 18 circle variants follow the source rules and keep numeric and graph keys synchronized', () => {
  const original = getImportedQuestions('Chapter 2. Functions and Graphs', '2.5 HW Graphs of Equations & Circles').find(q => q.sourceId === '5352735');
  const snapshot = structuredClone(original);
  const walk = (nodes, predicate) => nodes.flatMap(node => typeof node === 'string' ? [] : [...(predicate(node) ? [node] : []), ...walk(node.children || [], predicate)]);
  assert.deepEqual(questionRandomizationValue(original), { x: 3, y: 1, radius: 4 });
  let count = 0;
  let previous = withQuestionRandomization(original);
  for (const radius of [4, 5, 6]) for (const x of [1, 2, 3]) for (const y of [1, 2, 3].filter(y => y !== x)) {
    const variant = withQuestionRandomization(previous, { x, y, radius });
    assert.deepEqual(questionRandomizationValue(variant), { x, y, radius });
    assert.deepEqual(variant.fields.filter(field => field.type === 'text').map(field => field.expected), [`-${x},${y}`, String(radius)]);
    assert.deepEqual(walk(variant.content, node => node.randomized).map(node => node.children.join('')), [String(x), String(y), String(radius ** 2)]);
    assert.deepEqual(walk(variant.content, node => node.answerKey).map(node => node.children.join('')), [`-${x},${y}`, String(radius), `Circle: (x+${x})^2+(y-${y})^2=${radius ** 2}`]);
    assert.equal(walk(variant.content, node => node.answerKey && node.tag === 'img').length, 0);
    const graph = readGraph(variant.fields.find(field => field.type === 'graph').answerGraph);
    assert.equal(graph.noSolution, false);
    assert.equal(graph.objects.length, 1);
    const [circle] = graph.objects;
    assert.equal(circle.type, 'circle');
    assert.deepEqual(circle.points, [[-x, y], [radius - x, y]]);
    assert.equal(circleRadius(circle.points), radius);
    for (const [px, py] of [[radius - x, y], [-radius - x, y], [-x, y + radius], [-x, y - radius]]) assert.equal((px + x) ** 2 + (py - y) ** 2, radius ** 2);
    assert.ok(!JSON.stringify(variant.content).includes('Point on CirclePoint on Circle'));
    const correct = submitQuestion(variant, { values: { 'field-0': `-${x},${y}`, 'field-1': String(radius) } });
    assert.deepEqual(correct.history, { 'field-0': [true], 'field-1': [true] });
    previous = variant;
    count++;
  }
  assert.equal(count, 18);
  assert.deepEqual(original, snapshot);
});

test('circle randomization offers every other valid version and rejects invalid offsets and radii', () => {
  const original = getImportedQuestions('Chapter 2. Functions and Graphs', '2.5 HW Graphs of Equations & Circles').find(q => q.sourceId === '5352735');
  const current = questionRandomizationValue(original);
  const alternatives = new Set();
  for (let i = 0; i < 17; i++) {
    const next = questionRandomizationValue(nextQuestionRandomization(original, () => i / 17));
    assert.notDeepEqual(next, current);
    assert.ok([1, 2, 3].includes(next.x) && [1, 2, 3].includes(next.y) && next.x !== next.y);
    assert.ok([4, 5, 6].includes(next.radius));
    alternatives.add(JSON.stringify(next));
  }
  assert.equal(alternatives.size, 17);
  for (const parameters of [{ x: 1, y: 1, radius: 4 }, { x: 0, y: 1, radius: 4 }, { x: 3, y: 4, radius: 4 }, { x: 1, y: 2, radius: 3 }, { x: 1, y: 2, radius: 7 }]) assert.throws(() => withQuestionRandomization(original, parameters), RangeError);
});
