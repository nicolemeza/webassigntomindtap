import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { graphsQuestions, hasGraphQuestionResponse, hasAnyGraphQuestionResponse } from './graphsQuestions.js';
import { circleRadius, graphCoordinates, graphScale, readGraph } from './graphingGeometry.js';

test('graphs activity has 30 distinct, sequential questions and all graph-choice assets', () => {
  assert.equal(graphsQuestions.length, 30);
  graphsQuestions.forEach((question, index) => {
    assert.equal(question.id, `graphs-circles-question-${index + 1}`);
    assert.equal(new Set(question.inputs.map(field => field.id)).size, question.inputs.length);
    for (const block of question.blocks.filter(block => block.type === 'graph-choices')) {
      assert.equal(block.options.length, 4);
      block.options.forEach(option => assert.ok(existsSync(new URL(`../public${option.src}`, import.meta.url))));
    }
  });
  assert.equal(graphsQuestions.reduce((sum, question) => sum + question.points, 0), 30);
});
test('graphing pads appear only in questions 26 and 27; unseen Fix It steps are not invented', () => {
  assert.deepEqual(graphsQuestions.filter(q => q.blocks.some(b => b.type === 'graph-pad')).map(q => q.id), ['graphs-circles-question-26', 'graphs-circles-question-27']);
  assert.equal(graphsQuestions[27].followUpUnavailable, true);
});
test('math, symmetry, and graph-choice responses preserve zero-valued choices', () => {
  assert.equal(hasGraphQuestionResponse(graphsQuestions[5], { graph: '0' }), true);
  assert.equal(hasGraphQuestionResponse(graphsQuestions[7], { symmetries: '[]' }), false);
  assert.equal(hasGraphQuestionResponse(graphsQuestions[7], { symmetries: '[0]' }), true);
});
test('cleared graph responses are not counted as answered', () => {
  const values = { center: '-2,3', radius: '6', drawing: JSON.stringify({ objects: [], noSolution: false }) };
  assert.equal(hasGraphQuestionResponse(graphsQuestions[25], values), false);
  values.drawing = JSON.stringify({ objects: [{ type: 'circle', points: [[-2, 3], [4, 3]] }] });
  assert.equal(hasGraphQuestionResponse(graphsQuestions[25], values), true);
});
test('grade action becomes available for any nonempty response, but not cleared controls', () => {
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[0], {}), false);
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[0], { y: '   ' }), false);
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[0], { y: '0' }), true);
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[5], { graph: '0' }), true);
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[7], { symmetries: '[]' }), false);
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[7], { symmetries: '[3]' }), true);
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[25], { drawing: '{"objects":[],"noSolution":false}' }), false);
  assert.equal(hasAnyGraphQuestionResponse(graphsQuestions[25], { drawing: '{"objects":[],"noSolution":true}' }), true);
});
test('graph coordinates, circle radii, and responsive canvas scale are consistent', () => {
  assert.equal(circleRadius([[-2, 3], [4, 3]]), 6);
  const rect = { left: 10, top: 20, width: 500, height: 500 }, scale = graphScale(500, 500);
  assert.deepEqual(graphCoordinates(260, 270, rect), [0, 0]);
  assert.deepEqual(graphCoordinates(260 + 2 * scale, 270 - 3 * scale, rect), [2, 3]);
  assert.deepEqual(readGraph(undefined), { objects: [], noSolution: false });
});
