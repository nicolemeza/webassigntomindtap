import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleQuestionPoints, totalQuestionPoints } from './activityAuthoring.js';
import { activityHref, resolveActivityRoute } from './activityNavigation.js';
import { earnedPoints, submitQuestion } from './questionGrading.js';

test('point scaling preserves ratios and the exact assignment total', () => {
  const scaled = scaleQuestionPoints([{ points: 2 }, { points: 3 }, { points: 1 }], 9);
  assert.deepEqual(scaled.map((question) => question.points), [3, 4.5, 1.5]);
  assert.equal(totalQuestionPoints(scaled), 9);
  assert.equal(totalQuestionPoints([{ points: 0.1 }, { points: 0.2 }]), 0.3);
});

test('tiny and zero point totals never produce negative question points', () => {
  for (const total of [0, 0.01, 0.05, 0.33, 1]) {
    const scaled = scaleQuestionPoints(Array.from({ length: 10 }, () => ({ points: 1 })), total);
    assert.equal(totalQuestionPoints(scaled), total);
    assert.ok(scaled.every((question) => question.points >= 0));
  }
  const zeroWeights = scaleQuestionPoints([{ points: 0 }, { points: 0 }, { points: 0 }], 1);
  assert.equal(totalQuestionPoints(zeroWeights), 1);
  assert.deepEqual(zeroWeights.map((question) => question.points), [0.33, 0.34, 0.33]);
});

test('multiple select requires every correct choice and rejects extra choices', () => {
  const question = { kind: 'choice', correctChoices: ['A', 'B'], points: 3 };
  for (const selections of [['A'], ['A', 'B', 'C'], ['C']]) assert.deepEqual(submitQuestion(question, { selections }).history.answer, [false]);
  const correct = submitQuestion(question, { selections: ['B', 'A'] });
  assert.deepEqual(correct.history.answer, [true]);
  assert.equal(earnedPoints(question, correct.history), 3);
  const unchanged = submitQuestion(question, { selections: ['A', 'B'] }, correct.history, correct.lastSubmitted);
  assert.equal(unchanged.submitted, 0);
});

test('blank choice answers and exhausted attempts follow existing grading rules', () => {
  const question = { kind: 'choice', correctChoices: ['Correct choice'], points: 1 };
  assert.equal(submitQuestion(question, { selections: [] }).submitted, 0);
  const exhausted = { answer: [false, false, false, false, false] };
  assert.deepEqual(submitQuestion(question, { selections: ['Correct choice'] }, exhausted).history, exhausted);
});

test('created activity routes remain stable after renaming and support duplicate titles', () => {
  const chapter = 'Chapter 2. Functions and Graphs';
  const rows = [{ id: 'created-one', title: 'Same title' }, { id: 'created-two', title: 'Same title' }];
  const getActivities = () => ({ chapter: rows });
  const href = activityHref(chapter, 'chapter', rows[1].id);
  rows[1].title = 'Renamed / activity';
  const route = resolveActivityRoute(`${href}/play`, [chapter], getActivities);
  assert.equal(route.activity, rows[1]);
  assert.equal(route.page, 'player');
  assert.equal(resolveActivityRoute('#/activity/%ZZ/chapter/test', [chapter], getActivities), null);
});

test('existing activities continue to resolve by their original title', () => {
  const chapter = 'Chapter R. A Review of Basic Algebra';
  const activity = { title: 'R.5 HW Factoring' };
  assert.equal(resolveActivityRoute(activityHref(chapter, 'Learn It', activity.title), [chapter], () => ({ 'Learn It': [activity] })).activity, activity);
});
