import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { getLearnItModules, learnItAfterIncorrectAnswer, learnItCatalog } from './learnItCatalog.js';
import { demoActivities, streetRepairProbabilityQuestion } from './demoActivities.js';

test('saved demo questions resolve verified learning modules without changing their content', () => {
  const savedQuestion = structuredClone(demoActivities[0].questions.find(question => question.sourceId === '5352779'));
  const before = structuredClone(savedQuestion);
  const modules = getLearnItModules(savedQuestion);
  assert.ok(modules.some(module => module.code === 'ColAlg1 2.1.LI.001.'));
  assert.ok(modules.every(module => module.sections.some(section => section.id === 'reading')));
  assert.deepEqual(savedQuestion, before);
});

test('Learn It is offered after an incorrect submission and never on the custom probability question', () => {
  const question = demoActivities[0].questions.find(question => question.sourceId === '5352779');
  assert.equal(learnItAfterIncorrectAnswer(question), false);
  assert.equal(learnItAfterIncorrectAnswer(question, { 'field-0': [true] }), false);
  assert.equal(learnItAfterIncorrectAnswer(question, { 'field-0': [false] }), true);
  assert.equal(learnItAfterIncorrectAnswer(question, { 'field-0': [false, true] }), false);
  assert.deepEqual(getLearnItModules({ ...streetRepairProbabilityQuestion, sourceId: question.sourceId, questionCode: question.questionCode }), []);
  assert.deepEqual(getLearnItModules({ id: 'unknown-source' }), []);
  assert.deepEqual(getLearnItModules({ id: 'webassign-5354417', sourceId: '5354417', questionCode: 'GHColAlg13 1.1.113.FI.' }), []);
});

test('every verified question link has imported content, including legacy Chapter R questions', () => {
  for (const [question, codes] of Object.entries(learnItCatalog.questions)) {
    assert.ok(codes.length, question);
    for (const code of codes) assert.ok(learnItCatalog.modules[code]?.sections.some(section => section.id === 'reading'), `${question}: ${code}`);
  }
  assert.ok(getLearnItModules({ id: 'chapter-r-test-question-20' }).length);
  assert.ok(getLearnItModules({ id: 'r5-factoring-question-1' }).length);
});

test('each lesson can load independently and contains complete math markup without session credentials or executable HTML', async () => {
  const visit = node => {
    if (typeof node === 'string') return;
    assert.ok(node && typeof node.tag === 'string');
    if (node.children) { assert.ok(Array.isArray(node.children)); node.children.forEach(visit); }
  };
  for (const module of Object.values(learnItCatalog.modules)) {
    assert.match(module.sourceUrl, /^https:\/\/www\.webassign\.net\/v4cgi\/questions\/preview\.tpl\?qid=\d+$/);
    assert.match(module.file, /^[A-Za-z0-9_]+\.json$/);
    const content = await fs.readFile(new URL(`./learnItLessons/${module.file}`, import.meta.url), 'utf8');
    assert.ok(!/\[MaxDepth\]|UserPass|userPass|javascript:|<script/.test(content), module.code);
    const lesson = JSON.parse(content);
    assert.equal(lesson.code, module.code);
    assert.deepEqual(lesson.sections.map(section => ({ id: section.id, title: section.title })), module.sections);
    assert.ok(lesson.sections.some(section => section.id === 'reading' && section.content.length), module.code);
    for (const section of lesson.sections) section.content.forEach(visit);
  }
});
