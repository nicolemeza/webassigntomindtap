import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterAssignments, getChapterAssignments } from './chapterAssignments.js';
import { getActivityQuestions, isQuestionAnswered, sampleActivityQuestions } from './activityQuestions.js';
import { courseChapters } from './courseModel.js';
import { getWebassignAssignment, webassignAssignments } from './webassignCourse.js';
import { emptyBankFilters, filterQuestions, questionBank } from './questionBankData.js';
import { questionResponseFields } from './questionResponseFields.js';
import { getQuestionCode } from './questionCodes.js';

test('every Chapter 1–8 homework, review, and test has its own complete source questions and points', () => {
  const expected = Object.entries(chapterAssignments).filter(([name]) => name !== 'Chapter R').flatMap(([, titles]) => titles);
  assert.equal(expected.length, 66);
  assert.deepEqual(webassignAssignments.map(a => a.title).sort(), expected.sort());
  for (const chapter of courseChapters.filter(c => /^Chapter [1-8]\./.test(c))) {
    for (const activity of Object.values(getChapterAssignments(chapter)).flat()) {
      const source = getWebassignAssignment(chapter, activity.title);
      const questions = getActivityQuestions(chapter, activity.title);
      assert.equal(questions.length, source.questions.length, activity.title);
      assert.ok(questions.length > 0);
      assert.equal(activity.points, questions.reduce((sum, q) => sum + q.points, 0));
      assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
      const number = chapter.match(/^Chapter (\d)/)[1];
      for (const question of questions) {
        assert.match(question.sourceId, /^\d+$/);
        assert.ok(question.questionCode.startsWith(`GHColAlg13 ${number}.`), `${activity.title}: ${question.questionCode}`);
        assert.equal(question.kind, activity.title === '2.5 HW Graphs of Equations & Circles' ? 'math-response' : 'webassign');
        assert.ok(question.content.length);
        assert.ok(!JSON.stringify(question).includes('[MaxDepth]'));
      }
    }
  }
});

test('Chapter R retains its original assignment titles, totals, settings, and question implementations', () => {
  const chapter = 'Chapter R. A Review of Basic Algebra';
  const activities = Object.values(getChapterAssignments(chapter)).flat();
  assert.deepEqual(activities.map(a => a.points), [24, 34, 27, 33, 29, 30, 40, 22]);
  assert.equal(activities[4].settings.attempts, '1');
  assert.equal(getActivityQuestions(chapter, 'R.1 HW Sets of Real Numbers'), sampleActivityQuestions);
  assert.equal(getActivityQuestions(chapter, 'R.5 HW Factoring').length, 29);
  assert.equal(getActivityQuestions(chapter, 'Chapter R Test').length, 22);
  assert.ok(!webassignAssignments.some(a => /^(R\.|Chapter R)/.test(a.title)));
});

test('chapter and assignment filters intersect and IDs are searchable without leaking other chapters', () => {
  const chapter = courseChapters[1];
  const assignment = chapterAssignments['Chapter 1'][0];
  const first = getActivityQuestions(chapter, assignment)[0];
  const filters = { ...emptyBankFilters, chapters: [chapter], subchapters: [assignment] };
  assert.equal(filterQuestions(questionBank, filters).length, getActivityQuestions(chapter, assignment).length);
  for (const query of [first.sourceId, first.questionCode]) assert.deepEqual(filterQuestions(questionBank, filters, query).map(q => q.sourceId), [first.sourceId]);
  assert.equal(filterQuestions(questionBank, { ...filters, chapters: [courseChapters[2]] }).length, 0);
  assert.equal(new Set(questionBank.map(q => q.id)).size, questionBank.length);
});

test('imported choices preserve zero-valued options and cleared drawings do not count as answers', () => {
  const choice = { kind: 'webassign', fields: [{ id: 'a', type: 'radio', group: 'group-0' }] };
  assert.equal(isQuestionAnswered(choice, { values: { 'group-0': '0' } }), true);
  const graph = { kind: 'webassign', fields: [{ id: 'a', type: 'graph' }] };
  assert.equal(isQuestionAnswered(graph, { values: { a: '{"objects":[],"noSolution":false}' } }), false);
  assert.equal(isQuestionAnswered(graph, { values: { a: '{"objects":[],"noSolution":true}' } }), true);
});

test('the existing graphs activity keeps its local grading, response formats, and source IDs', () => {
  const questions = getActivityQuestions('Chapter 2. Functions and Graphs', '2.5 HW Graphs of Equations & Circles');
  assert.equal(questions.length, 30);
  assert.equal(questions[25].id, 'graphs-circles-question-26');
  assert.ok(questions[25].blocks.some(block => block.type === 'graph-pad'));
  assert.match(questions[25].sourceId, /^\d+$/);
});

test('attempt rows match answer fields and combine each choice group into one response', () => {
  const question = { kind: 'webassign', fields: [
    { id: 'choice-a', type: 'radio', group: 'choice' },
    { id: 'choice-b', type: 'radio', group: 'choice' },
    { id: 'check-a', type: 'checkbox', group: 'checks' },
    { id: 'check-b', type: 'checkbox', group: 'checks' },
    { id: 'value', type: 'text' },
  ] };
  assert.deepEqual(questionResponseFields(question).map(field => field.id), ['choice', 'checks', 'value']);
  const activity = getActivityQuestions('Chapter 3. Functions', '3.1 HW Graphs of Functions');
  assert.deepEqual(questionResponseFields(activity[0]).map(field => field.id), ['field-0', 'field-1', 'field-2', 'field-3', 'field-4']);
  const existingInputs = [{ id: 'answer' }];
  assert.equal(questionResponseFields({ kind: 'math-response', inputs: existingInputs }), existingInputs);
});

test('display references use verified GHCol codes, including the authored factoring variants', () => {
  assert.equal(getQuestionCode({ id: 'algebra-r5-common-factor-choice' }), 'GHColAlg13 R.5.001.');
  assert.equal(getQuestionCode({ id: 'algebra-r5-factoring-select' }), 'GHColAlg13 R.5.024.');
  assert.equal(getQuestionCode({ id: 'r5-factoring-question-13' }), 'GHColAlg13 R.5.050.EP.');
  assert.equal(getQuestionCode({ id: 'r5-factoring-question-28' }), 'GHColAlg13 R.5.143.FI.');
  assert.ok(questionBank.every(question => /^GHColAlg13 /.test(getQuestionCode(question))));
  assert.equal(getQuestionCode({ id: 'unmapped-prototype', sourceId: '1234567' }), undefined);
});
