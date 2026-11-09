import test from 'node:test';
import assert from 'node:assert/strict';
import { demoActivities, demoActivityFolder, mergeDemoActivities, mergeDemoFolders, migrateDemoActivity, streetRepairProbabilityQuestion } from './demoActivities.js';
import { activityHref, resolveActivityRoute } from './activityNavigation.js';
import { earnedPoints, submitQuestion } from './questionGrading.js';
import { getVerifiedQuestionResources } from './questionResources.js';

test('new browsers get the same four-question Demo Activity without saved data', async () => {
  const { getCreatedActivities } = await import('./createdActivities.js');
  const activity = getCreatedActivities().find(activity => activity.id === demoActivities[0].id);
  assert.equal(activity.title, 'Demo Activity');
  assert.equal(activity.chapter, demoActivityFolder);
  assert.equal(activity.dueDate, '');
  assert.equal(activity.points, activity.questions.reduce((sum, question) => sum + question.points, 0));
  assert.deepEqual(activity.questions.map(question => question.id), [streetRepairProbabilityQuestion.id, 'webassign-5352779', 'webassign-5352735', 'webassign-4260657']);
  assert.equal(activity.questions.length, 4);
  assert.equal(activity.questions[0].id, streetRepairProbabilityQuestion.id);
  assert.ok(activity.questions[2].fields.some(field => field.type === 'graph'));
  assert.equal(activity.questions[1].fields.length, 3);
  assert.ok(activity.questions[3].exploration.url);
  for (const saved of [undefined, [], { invalid: true }]) assert.equal(mergeDemoActivities(saved).length, 1);
});

test('version-two demos reorder the original exercises without losing edits or restoring deliberately removed questions', () => {
  const [, linear, circle, explore] = structuredClone(demoActivities[0].questions);
  delete linear.resourceKey;
  linear.points = 2;
  const legacy = { ...structuredClone(demoActivities[0]), demoContentVersion: 2, title: 'Edited Demo', points: 4, questions: [circle, linear, explore] };
  const migrated = migrateDemoActivity(legacy);
  assert.deepEqual(migrated.questions.map(question => question.id), [linear.id, circle.id, explore.id]);
  assert.equal(migrated.questions[0].points, 2);
  assert.equal(migrated.questions[0].resourceKey, 'demo-linear-equations');
  assert.equal(migrated.title, 'Edited Demo');
  assert.equal(migrated.points, 4);
  assert.deepEqual(migrateDemoActivity(migrated), migrated);
  assert.deepEqual(legacy.questions.map(question => question.id), [circle.id, linear.id, explore.id]);
});

test('the probability and multi-step questions share the actual Read It section and verified Watch It', () => {
  const resources = getVerifiedQuestionResources(demoActivities[0].questions[0]);
  assert.equal(resources, getVerifiedQuestionResources(demoActivities[0].questions[1]));
  assert.equal(resources.sourceQuestionId, '5352779');
  assert.equal(resources.readIt.contentId, 'FMBWTG6NSLJLY1AE1453');
  assert.equal(resources.readIt.pages.length, 5);
  assert.ok(resources.readIt.pages.some(page => page.title === '2. Solve Linear Equation in One Variable'));
  assert.ok(resources.readIt.pages.some(page => JSON.stringify(page).includes('m:math')));
  const countMath = node => typeof node === 'string' ? 0 : (node.tag === 'math' ? 1 : 0) + (node.children || []).reduce((sum, child) => sum + countMath(child), 0);
  for (const page of resources.readIt.pages) assert.equal(page.content.reduce((sum, node) => sum + countMath(node), 0), page.expectedMath, page.title);
  assert.equal(resources.watchIt.status, 'available');
  assert.equal(resources.watchIt.sourceQuestionId, '5312321');
  assert.notEqual(resources.watchIt.sourceQuestionId, resources.sourceQuestionId);
  assert.equal(new URL(resources.watchIt.url).searchParams.get('asset'), 'gfcolalg9_01_01_026');
  assert.match(resources.watchIt.mediaUrl, /^https:\/\/wowzahttp\.cengage\.com\/.*_med\.mp4$/);
  assert.match(resources.watchIt.transcriptUrl, /^https:\/\/college\.cengage\.com\/.*\.txt$/);
  assert.ok(!/UserPass|token=|\[MaxDepth\]/i.test(JSON.stringify(resources)));
  assert.equal(getVerifiedQuestionResources(demoActivities[0].questions[2]), null);
});

test('version-three demos move probability first, share resources, and preserve the other questions and edits', () => {
  const [probability, linear, circle, explore] = structuredClone(demoActivities[0].questions);
  delete probability.resourceKey;
  probability.prompt = 'Edited probability prompt';
  const legacy = { ...structuredClone(demoActivities[0]), demoContentVersion: 3, title: 'My Demo', questions: [linear, circle, explore, probability] };
  const migrated = migrateDemoActivity(legacy);
  assert.deepEqual(migrated.questions.map(question => question.id), [probability.id, linear.id, circle.id, explore.id]);
  assert.equal(migrated.title, 'My Demo');
  assert.equal(migrated.points, legacy.points);
  assert.equal(migrated.questions[0].prompt, probability.prompt);
  assert.equal(migrated.questions[0].resourceKey, linear.resourceKey);
  assert.deepEqual(migrated.questions[0].inputs, probability.inputs);
  assert.deepEqual(migrated.questions.slice(1), legacy.questions.slice(0, 3));
  assert.deepEqual(migrateDemoActivity(migrated), migrated);
  assert.equal(legacy.questions[3].resourceKey, undefined);
});

test('existing saved demos and course overrides gain the probability question once while preserving edits', () => {
  const legacy = { ...structuredClone(demoActivities[0]), title: 'Edited Demo', points: 6, questions: structuredClone(demoActivities[0].questions.filter(question => question.id !== streetRepairProbabilityQuestion.id)) };
  delete legacy.demoContentVersion;
  const [migrated] = mergeDemoActivities([legacy]);
  assert.equal(migrated.title, 'Edited Demo');
  assert.equal(migrated.points, 7);
  assert.deepEqual(migrated.questions.slice(1), legacy.questions);
  assert.equal(migrated.questions[0].id, streetRepairProbabilityQuestion.id);
  assert.deepEqual(migrateDemoActivity(legacy), migrated);
  assert.deepEqual(mergeDemoActivities([migrated]), [migrated]);
  assert.equal(legacy.questions.length, 3);
  const removedAfterUpgrade = { ...migrated, questions: migrated.questions.slice(1), points: 6 };
  assert.deepEqual(mergeDemoActivities([removedAfterUpgrade]), [removedAfterUpgrade]);
  const alreadyAdded = { ...legacy, questions: structuredClone(demoActivities[0].questions) };
  assert.equal(migrateDemoActivity(alreadyAdded).questions.length, 4);
  assert.equal(migrateDemoActivity(alreadyAdded).points, 6);
});

test('the street-repair question grades fractions and gives the exact swapped-fraction assistance', () => {
  const question = streetRepairProbabilityQuestion;
  const submit = (value) => submitQuestion(question, { values: { probability: value } });
  for (const value of ['9/1', ' 9 / 1 ']) {
    const incorrect = submit(value);
    assert.deepEqual(incorrect.history, { probability: [false] });
    assert.equal(incorrect.message, 'You entered the numerator and denominator in the opposite order.');
    assert.equal(earnedPoints(question, incorrect.history), 0);
  }
  for (const value of ['1/9', '2/18']) {
    const correct = submit(value);
    assert.deepEqual(correct.history, { probability: [true] });
    assert.equal(correct.message, '');
    assert.equal(earnedPoints(question, correct.history), 1);
  }
  assert.equal(submit('2/9').message, '');
  assert.deepEqual(submit('2/9').history, { probability: [false] });
  assert.equal(submit('').submitted, 0);
  assert.equal(submit('').message, '');
  const first = submit('9/1');
  const corrected = submitQuestion(question, { values: { probability: '1/9' } }, first.history, first.lastSubmitted);
  assert.deepEqual(corrected.history, { probability: [false, true] });
  assert.equal(corrected.message, '');
});

test('bundled demo defaults preserve saved edits and other authored activities without duplication', () => {
  const edited = { ...structuredClone(demoActivities[0]), title: 'Edited Demo', points: 6 };
  const other = { id: 'another-activity', title: 'My Activity' };
  assert.deepEqual(mergeDemoActivities([edited, other]), [edited, other]);
  assert.equal(mergeDemoActivities([other]).length, 2);
  const fresh = mergeDemoActivities([]);
  fresh[0].questions[0].points = 99;
  assert.equal(mergeDemoActivities([])[0].questions[0].points, 1);
});

test('the R.2 folder and original activity link work without browser-specific folder registration', () => {
  const folders = mergeDemoFolders();
  const activity = mergeDemoActivities([])[0];
  assert.equal(folders[demoActivityFolder].parent, 'Chapter R. A Review of Basic Algebra');
  const route = resolveActivityRoute(`${activityHref(activity.chapter, activity.section, activity.id)}/play`, Object.keys(folders), () => ({ chapter: [activity] }));
  assert.equal(route.activity.id, demoActivities[0].id);
  assert.equal(route.page, 'player');
  const saved = { [demoActivityFolder]: { title: 'Renamed R.2', hidden: true, removed: true }, custom: { title: 'Custom' } };
  const merged = mergeDemoFolders(saved);
  assert.equal(merged[demoActivityFolder].title, 'Renamed R.2');
  assert.equal(merged[demoActivityFolder].kind, 'section');
  assert.equal(merged[demoActivityFolder].hidden, true);
  assert.equal(merged[demoActivityFolder].removed, true);
  assert.deepEqual(merged.custom, saved.custom);
});
