import { remainingR5Questions } from './r5Questions';
import { graphsQuestions, hasGraphQuestionResponse } from './graphsQuestions';
import { chapterRTestQuestions } from './chapterRTestQuestions';

// Fallback sample content for activities that have not yet been populated.
// Answers are intentionally not graded or submitted by this prototype.
export const sampleActivityQuestions = Array.from({ length: 10 }, (_, index) => ({
  id: `sample-question-${index + 1}`,
  points: 1,
  opening: `Sample question ${index + 1}: Enter a response`,
  ending: 'to complete this statement.',
  statement: `This is placeholder content for question ${index + 1}. We can replace the statement and answer choices next.`,
  choices: ['True', 'False'],
}));

const factoringQuestionOne = {
  id: 'r5-factoring-question-1',
  kind: 'greatest-common-factor',
  points: 1,
  prompt: 'The prime factorizations of three terms are shown below. Find their greatest common factor.',
  terms: [
    { coefficient: 28, xPower: 3, yPower: 2, factors: ['2', '2', '7', 'x', 'x', 'x', 'y', 'y'] },
    { coefficient: 42, xPower: 1, yPower: 4, factors: ['2', '3', '7', 'x', 'y', 'y', 'y', 'y'] },
    { coefficient: 70, xPower: 2, yPower: 3, factors: ['2', '5', '7', 'x', 'x', 'y', 'y', 'y'] },
  ],
};

export function getActivityQuestions(chapter, title) {
  if (chapter === 'Chapter 2. Functions and Graphs' && title === '2.5 HW Graphs of Equations & Circles') return graphsQuestions;
  if (chapter === 'Chapter R. A Review of Basic Algebra' && title === 'R.5 HW Factoring') {
    return [factoringQuestionOne, ...remainingR5Questions];
  }
  if (chapter === 'Chapter R. A Review of Basic Algebra' && title === 'Chapter R Test') return chapterRTestQuestions;
  return sampleActivityQuestions;
}

export function isQuestionAnswered(question, response) {
  if (question.id.startsWith('graphs-circles-question-')) return hasGraphQuestionResponse(question, response?.values);
  if (question.kind === 'math-response') {
    return question.inputs.length > 0 && question.inputs.every((input) => response?.values?.[input.id]?.trim());
  }
  return Boolean(response?.text?.trim() && (question.kind === 'greatest-common-factor' || response.choice));
}
