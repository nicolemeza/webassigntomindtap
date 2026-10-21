import React, { useEffect } from 'react';
import QuestionAttempts from './QuestionAttempts';
import './edge-cases.css';

const question = {
  id: 'edge-cases-many-fields',
  points: 24,
  inputs: Array.from({ length: 24 }, (_, index) => ({ id: `edge-field-${index + 1}` })),
};
// Include unused, incorrect, correct, and exhausted fields in the fixture.
const history = Object.fromEntries(question.inputs.map((field, index) => [
  field.id,
  Array.from({ length: index % 6 }, (_, attempt) => index % 3 === 0 && attempt === 1),
]));

const manyAttemptsQuestion = {
  id: 'edge-cases-many-attempts',
  points: 4,
  inputs: Array.from({ length: 4 }, (_, index) => ({ id: `twenty-attempt-field-${index + 1}` })),
};
const manyAttemptsHistory = Object.fromEntries(manyAttemptsQuestion.inputs.map((field, index) => [
  field.id,
  Array.from({ length: [0, 7, 15, 20][index] }, (_, attempt) => index === 2 && attempt === 10),
]));

export default function EdgeCases() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Edge cases · MindTap prototype';
    return () => { document.title = previousTitle; };
  }, []);

  return <main className="edge-cases-page">
    <header className="edge-cases-header">
      <p className="edge-cases-eyebrow">Prototype documentation</p>
      <h1>Edge cases</h1>
      <p>An isolated workspace for testing unusual question-area states. These examples use mock data and do not affect activity responses.</p>
    </header>
    <section className="edge-case-example" aria-labelledby="attempts-overflow-title">
      <h2 id="attempts-overflow-title">Attempts table: many fields</h2>
      <p>24 fields · 5 attempts per field · 4 visible fields · 274px maximum table height</p>
      <p>Scroll inside the table to inspect later fields. The header stays visible; narrow screens also support horizontal scrolling.</p>
      <div className="edge-case-preview">
        <QuestionAttempts question={question} history={history} earnedScore={Object.values(history).filter(attempts => attempts.includes(true)).length} defaultExpanded />
      </div>
    </section>
    <section className="edge-case-example edge-case-many-attempts" aria-labelledby="attempts-wrap-title">
      <h2 id="attempts-wrap-title">Attempts table: many attempts</h2>
      <p>4 fields · 20 attempts per field · wrapping attempt indicators · 274px maximum table height</p>
      <p>Icons wrap within their column with 4px gaps, following the original design. Field details stay aligned to the top of each row.</p>
      <div className="edge-case-preview">
        <QuestionAttempts question={manyAttemptsQuestion} history={manyAttemptsHistory} earnedScore={1} maxAttempts={20} defaultExpanded />
      </div>
    </section>
  </main>;
}
