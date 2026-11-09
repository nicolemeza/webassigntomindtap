import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAccommodationOperations, emptyAccommodationEditor } from './accommodationData.js';

const storage = new Map();
let failWrites = false;
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => { if (failWrites) throw Error('Storage unavailable'); storage.set(key, value); } };
const model = await import('./courseModel.js');
const chapter = model.courseChapters[0];
const other = model.courseChapters[1];
const original = { title: 'R.5 HW Factoring', points: 20, chapter, section: 'Learn It' };
const decorated = () => model.courseRows(chapter, 'Learn It', [original])[0];

test('renaming an activity keeps one stable record and its source question title', () => {
  const activity = decorated();
  model.updateCourseActivities([{ activity, patch: { title: 'Factoring Review', points: 30 } }]);
  const rows = model.courseRows(chapter, 'Learn It', [original]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, 'Factoring Review');
  assert.equal(rows[0].originalTitle, 'R.5 HW Factoring');
  assert.equal(rows[0].points, 30);
});
test('moving an activity removes its source row and inserts it only at its destination', () => {
  model.updateCourseActivities([{ activity: decorated(), patch: { chapter: other, section: 'chapter', placement: 'start' } }]);
  assert.equal(model.courseRows(chapter, 'Learn It', [original]).length, 0);
  const moved = model.courseRows(other, 'chapter', []);
  assert.equal(moved.length, 1);
  assert.equal(moved[0].originalTitle, original.title);
  model.updateCourseActivities([{ activity: moved[0], patch: { chapter, section: 'Learn It' } }]);
  assert.equal(model.courseRows(other, 'chapter', []).length, 0);
  assert.equal(model.courseRows(chapter, 'Learn It', [original]).length, 1);
});
test('folder visibility and removal follow parent folders in Week View and List View', () => {
  model.saveFolder('nested', { parent: 'outer' });
  model.saveFolder('outer', { hidden: true });
  assert.equal(model.activityVisibility({ chapter: 'nested' }).hidden, true);
  model.saveFolder('outer', { hidden: false, removed: true });
  assert.equal(model.activityVisibility({ chapter: 'nested' }).removed, true);
  model.saveFolder('cycle-a', { parent: 'cycle-b' });
  model.saveFolder('cycle-b', { parent: 'cycle-a' });
  assert.deepEqual(model.folderVisibility('cycle-a'), { hidden: false, removed: false });
});
test('filters combine alternatives within a group and intersect different groups', () => {
  const activity = { countsTowardsGrade: false, points: 10, dueDate: '2026-12-06' };
  assert.equal(model.matchesActivity(activity, ['Practice', 'Counts towards grade', 'Scheduled']), true);
  assert.equal(model.matchesActivity(activity, ['Practice', 'Not Scheduled']), false);
  assert.equal(model.matchesActivity(activity, ['Manually graded']), false);
});
test('course settings and activity edits survive a fresh module load', async () => {
  model.saveCourseSettings({ collectIds: true, idLength: '8', studentAssistant: false });
  const reloaded = await import('./courseModel.js?reload');
  assert.equal(reloaded.getCourseState().settings.idLength, '8');
  assert.equal(reloaded.getCourseState().settings.studentAssistant, false);
  assert.equal(Object.values(reloaded.getCourseState().activities)[0].points, 30);
});
test('a failed save does not publish unsaved state', () => {
  const before = model.getCourseState();
  failWrites = true;
  assert.throws(() => model.saveCourseSettings({ idLength: '12' }), /Storage unavailable/);
  assert.equal(model.getCourseState(), before);
  failWrites = false;
});
test('bulk accommodation removals respect different assignment baselines', () => {
  const operations = [{ selectedIds: ['student-1'], editor: { ...emptyAccommodationEditor, removeAttempts: true } }];
  const first = { 'student-1': { extendDue: { days: 1, hours: 0 } } };
  const second = { 'student-1': { attempts: '3', extendDue: { days: 2, hours: 0 } }, 'student-2': { attempts: '4' } };
  assert.deepEqual(applyAccommodationOperations(first, operations).value, first);
  assert.deepEqual(applyAccommodationOperations(second, operations).value, { 'student-1': { extendDue: { days: 2, hours: 0 } }, 'student-2': { attempts: '4' } });
  const addThenRemove = [{ selectedIds: ['student-1'], editor: { ...emptyAccommodationEditor, attempts: '5' } }, ...operations];
  assert.deepEqual(applyAccommodationOperations({}, addThenRemove).value, {});
});
test('deleting selected attempts clears only those students and the selected preview session', () => {
  const activity = { ...decorated(), studentAttempts: [{ id: 'student-1', name: 'Jordan Lee' }, { id: 'student-2', name: 'Morgan Chen' }] };
  model.saveCourseState({ sessions: { [activity.stableKey]: { answers: { q1: { text: '5' } } }, another: { answers: { q2: { text: '8' } } } } });
  model.deleteStudentAttempts(activity, ['student-1', 'preview']);
  assert.deepEqual(model.getCourseState().activities[activity.stableKey].studentAttempts.map((attempt) => attempt.id), ['student-2']);
  assert.equal(model.getCourseState().sessions[activity.stableKey], undefined);
  assert.equal(model.getCourseState().sessions.another.answers.q2.text, '8');
});

test('loading saved demo settings preserves progress and exposes the new question through course rows', async () => {
  const { demoActivities, demoActivityFolder, streetRepairProbabilityQuestion } = await import('./demoActivities.js');
  const legacy = { ...structuredClone(demoActivities[0]), title: 'My Demo', points: 3, questions: structuredClone(demoActivities[0].questions.filter(question => question.id !== streetRepairProbabilityQuestion.id)) };
  delete legacy.demoContentVersion;
  const key = model.activityKey(demoActivityFolder, 'chapter', legacy);
  const sessions = { [key]: { current: 2, answers: { [legacy.questions[1].id]: { values: { 'field-0': '5' } } } } };
  model.saveCourseState({ activities: { ...model.getCourseState().activities, [key]: legacy }, sessions });
  const reloaded = await import('./courseModel.js?demo-probability-upgrade');
  const [activity] = reloaded.courseRows(demoActivityFolder, 'chapter', demoActivities);
  assert.equal(activity.title, 'My Demo');
  assert.equal(activity.points, 4);
  assert.equal(activity.questions.length, 4);
  assert.equal(activity.questions[0].id, streetRepairProbabilityQuestion.id);
  assert.deepEqual(activity.questions.slice(1), legacy.questions);
  assert.deepEqual(reloaded.getCourseState().sessions, sessions);
});
