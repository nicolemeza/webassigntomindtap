import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateActivity, hasStudentAttempts, isAssessmentActivity, orderFolderItems } from './activityManagement.js';
import { demoExerciseDueDates, migrateDemoSchedule } from './demoCourseSchedule.js';
import { getChapterAssignments } from './chapterAssignments.js';

test('assessment actions apply to assignments while readings keep their resource menu', () => {
  assert.equal(isAssessmentActivity({ points: 10 }), true);
  assert.equal(isAssessmentActivity({ resourceKind: 'reading', points: 10 }), false);
  assert.equal(hasStudentAttempts({ submitted: '0%' }), false);
  assert.equal(hasStudentAttempts({ submitted: '25%' }), true);
  assert.equal(hasStudentAttempts({}, { answers: { q1: { text: '5' } } }), true);
});
test('duplicating retains math question formats with independent content and no copied results', () => {
  const source = { id: 'original', stableKey: 'chapter/section/original', title: 'Factoring', originalTitle: 'R.5 HW Factoring', chapter: 'Algebra', points: 10, submitted: '75%', hidden: true, accommodations: { student: { attempts: '4' } }, settings: { attempts: '2' } };
  const questions = [{ id: 'q1', kind: 'math-response', inputs: [{ id: 'a' }], points: 10 }];
  const copy = duplicateActivity(source, questions, 'copy-id');
  assert.equal(copy.id, 'copy-id');
  assert.equal(copy.stableKey, undefined);
  assert.equal(copy.originalTitle, 'R.5 HW Factoring');
  assert.equal(copy.questions[0].kind, 'math-response');
  assert.equal(copy.submitted, '0%');
  assert.deepEqual(copy.accommodations, {});
  copy.questions[0].inputs[0].id = 'changed';
  copy.settings.attempts = '5';
  assert.equal(questions[0].inputs[0].id, 'a');
  assert.equal(source.settings.attempts, '2');
});
test('folder placement handles current order, beginning, end, and before dependencies', () => {
  const original = [{ id: 'reading' }, { id: 'r1' }, { id: 'r2' }, { id: 'review' }];
  assert.deepEqual(orderFolderItems(original).map((x) => x.id), ['reading', 'r1', 'r2', 'review']);
  const placed = [...original.map((x) => x.id === 'r1' ? { ...x, placement: 'end' } : x), { id: 'new', placement: 'before:r2' }, { id: 'nested', placement: 'before:new' }];
  assert.deepEqual(orderFolderItems(placed).map((x) => x.id), ['reading', 'nested', 'new', 'r2', 'review', 'r1']);
  assert.equal(orderFolderItems([{ id: 'a', placement: 'before:b' }, { id: 'b', placement: 'before:a' }]).length, 2);
});
test('demo exercises occupy the current and upcoming weeks', () => {
  const dates = Object.values(demoExerciseDueDates);
  assert.equal(dates.filter((date) => date >= '2026-11-02' && date <= '2026-11-08').length, 3);
  assert.equal(dates.filter((date) => date >= '2026-11-09' && date <= '2026-11-15').length, 3);
  assert.ok(dates.some((date) => date >= '2026-11-23' && date <= '2026-11-29'));
});
test('a nested section folder does not regenerate its parent chapter assignments', () => {
  assert.ok(getChapterAssignments('Chapter R. A Review of Basic Algebra')['Learn It'].length > 0);
  assert.equal(getChapterAssignments('Chapter R. A Review of Basic Algebra/section/R.1'), null);
});
test('schedule migration rebases old captured defaults once and preserves custom dates', () => {
  const saved = { activities: { old: { title: 'R.5 HW Factoring', dueDate: '2026-12-06' }, custom: { title: 'R.1 HW Sets of Real Numbers', dueDate: '2026-12-10' }, authored: { id: 'new-activity', originalTitle: 'R.5 HW Factoring', dueDate: '2026-12-06' } } };
  const migrated = migrateDemoSchedule(saved);
  assert.equal(migrated.activities.old.dueDate, '2026-11-12');
  assert.equal(migrated.activities.custom.dueDate, '2026-12-10');
  assert.equal(migrated.activities.authored.dueDate, '2026-12-06');
  migrated.activities.old.dueDate = '2026-12-06';
  assert.equal(migrateDemoSchedule(migrated).activities.old.dueDate, '2026-12-06');
});
