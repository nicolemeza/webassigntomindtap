import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { assistantGreeting, assistantReply } from './studentAssistantReplies.js';
import { getAssistantExamples } from './studentAssistantExamples.js';
import { demoActivities } from './demoActivities.js';

test('assistant greeting uses the active activity and question', () => {
  assert.match(assistantGreeting({ title: 'Graphs & Circles' }, { id: 'graphs-circles-question-26' }), /Graphs & Circles, question 26/);
});

test('imported questions use their activity position instead of the source ID', () => {
  const activity = demoActivities[0];
  assert.match(assistantGreeting(activity, activity.questions[1]), /Demo Activity, question 2\./);
  const reordered = { ...activity, questions: [...activity.questions].reverse() };
  assert.match(assistantGreeting(reordered, activity.questions[1]), /question 3\./);
});

test('the three examples follow the demo question across saved edits and stay out of other questions', () => {
  const activity = structuredClone(demoActivities[0]);
  const question = activity.questions[1];
  const examples = getAssistantExamples(activity, question);
  assert.equal(examples.length, 3);
  assert.equal(new Set(examples.map(example => example.id)).size, 3);
  assert.deepEqual(getAssistantExamples({ ...activity, title: 'Renamed demo' }, question), examples);
  assert.deepEqual(getAssistantExamples(activity, { id: question.id }), examples);
  for (const other of activity.questions.filter(item => item.id !== question.id)) assert.deepEqual(getAssistantExamples(activity, other), []);
  assert.deepEqual(getAssistantExamples({ ...activity, id: 'another-activity' }, question), []);
  assert.deepEqual(getAssistantExamples({ title: 'Demo Activity' }, question), []);
});
test('sample guidance matches question content without claiming to grade', () => {
  const circle = { blocks: [{ type: 'text', text: 'Determine the center and radius of the circle.' }] };
  assert.match(assistantReply(circle, 'Help me start'), /positive square root/);
  assert.match(assistantReply(circle, 'Show an example'), /center \(2, −1\)/);
  assert.match(assistantReply(circle, 'Grade this'), /can’t grade or submit/);
  const intercepts = { blocks: [{ text: 'Find the intercepts.' }] };
  assert.match(assistantReply(intercepts, 'help'), /set x = 0/);
  assert.match(assistantReply(intercepts, 'example'), /\(−3, 0\)/);
  assert.match(assistantReply({ blocks: [{ text: 'Factor the expression.' }] }, 'example'), /3x\(2x \+ 3\)/);
  assert.match(assistantReply({}, 'hello'), /limited set of sample replies/);
});
test('assistant design assets are local, nonempty, and used at native icon dimensions', () => {
  for (const name of ['assistant', 'minimize', 'history', 'settings', 'add', 'math', 'keyboard', 'send', 'like', 'dislike', 'copy', 'listen', 'down', 'done']) {
    const path = new URL(`../public/student-assistant/${name}.svg`, import.meta.url);
    assert.ok(existsSync(path));
    const svg = readFileSync(path, 'utf8');
    const size = ['like', 'dislike', 'copy', 'listen', 'done'].includes(name) ? 20 : 24;
    assert.match(svg, new RegExp(`width="${size}" height="${size}"`));
  }
  assert.ok(readFileSync(new URL('../public/student-assistant/thinking.png', import.meta.url)).length > 0);
});
