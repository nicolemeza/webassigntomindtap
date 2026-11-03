import { remainingR5Questions } from './r5Questions.js';
import { graphsQuestions, hasGraphQuestionResponse } from './graphsQuestions.js';
import { chapterRTestQuestions } from './chapterRTestQuestions.js';
import { getImportedQuestions } from './webassignCourse.js';

// Additional algebra practice uses the existing text-entry and true/false layout.
const algebraPractice = [
  ['Solve 3x + 6 = 21. x =', '5', 'Subtracting the same number from both sides preserves equality.', 'True'],
  ['Evaluate 2³. The result is', '8', 'A negative exponent always makes a number negative.', 'False'],
  ['Find the slope through (1, 2) and (3, 6). m =', '2', 'The slope of a vertical line is zero.', 'False'],
  ['Evaluate f(3) for f(x) = 2x + 1. f(3) =', '7', 'Each input of a function has exactly one output.', 'True'],
  ['Find the positive square root of 49. The result is', '7', 'The principal square root of 49 is negative.', 'False'],
  ['Complete the factorization x² − 9 = (x − 3)(x + a). a =', '3', 'A difference of squares can be factored over the real numbers.', 'True'],
  ['Find the radius of (x − 2)² + (y + 1)² = 16. r =', '4', 'The center of this circle is (2, −1).', 'True'],
  ['Solve 2x − 7 = 9. x =', '8', 'Multiplying an inequality by a negative number reverses its direction.', 'True'],
  ['Evaluate log₁₀(100). The result is', '2', 'A real logarithm is defined for every negative input.', 'False'],
  ['Find the sum 1 + 2 + 3 + 4 + 5. The result is', '15', 'The sequence 2, 4, 6, 8 is arithmetic.', 'True'],
];
export const sampleActivityQuestions = algebraPractice.map(([opening, answerKey, statement, statementAnswer], index) => ({
  id: `sample-question-${index + 1}`,
  points: 1,
  opening, answerKey, statementAnswer, responseFormat: 'text-and-truth',
  ending: '.',
  statement,
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
  const imported = getImportedQuestions(chapter, title);
  // Keep the existing playable 2.5 variants and local grading, attaching the
  // authoritative source identifiers in the course's original question order.
  if (imported && chapter === 'Chapter 2. Functions and Graphs' && title === '2.5 HW Graphs of Equations & Circles') return graphsQuestions.map((question, index) => ({ ...imported[index], ...question }));
  if (imported) return imported;
  if (chapter === 'Chapter 2. Functions and Graphs' && title === '2.5 HW Graphs of Equations & Circles') return graphsQuestions;
  if (chapter === 'Chapter R. A Review of Basic Algebra' && title === 'R.5 HW Factoring') {
    return [factoringQuestionOne, ...remainingR5Questions];
  }
  if (chapter === 'Chapter R. A Review of Basic Algebra' && title === 'Chapter R Test') return chapterRTestQuestions;
  return sampleActivityQuestions;
}

export function isQuestionAnswered(question, response) {
  if (question.kind === 'webassign') return question.fields.length
    ? question.fields.every(field => {
      const value = response?.values?.[['radio', 'checkbox'].includes(field.type) ? field.group : field.id];
      if (['graph', 'number-line'].includes(field.type)) { try { const graph = JSON.parse(value); return Boolean(graph.noSolution || graph.objects?.length); } catch { return false; } }
      return Boolean(value?.trim());
    })
    : Boolean(response?.values?.response?.trim());
  if (question.kind === 'choice') return Boolean(response?.selections?.length);
  if (question.id.startsWith('graphs-circles-question-')) return hasGraphQuestionResponse(question, response?.values);
  if (question.kind === 'math-response') {
    return question.inputs.length > 0 && question.inputs.every((input) => response?.values?.[input.id]?.trim());
  }
  return Boolean(response?.text?.trim() && (question.kind === 'greatest-common-factor' || response.choice));
}
