import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { assistantGreeting, assistantReply } from './studentAssistantReplies.js';

test('assistant greeting uses the active activity and question', () => {
  assert.match(assistantGreeting({ title: 'Graphs & Circles' }, { id: 'graphs-circles-question-26' }), /Graphs & Circles, question 26/);
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
