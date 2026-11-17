import React from 'react';
import { CancelIcon, CheckCircleIcon } from 'react-magma-icons';
import LearnIt from './LearnIt.jsx';
import { hasLearnIt } from './learnItCatalog';
import './question-rejoinder.css';

export default function QuestionRejoinder({ question, status }) {
  const correct = status === 'correct';
  const learningAvailable = !correct && hasLearnIt(question);

  return <>
    <section className={`question-rejoinder question-rejoinder--${status}`} aria-live="polite" aria-label="Answer feedback">
      <div className="question-rejoinder-heading">
        {correct ? <CheckCircleIcon aria-hidden="true" size={20} /> : <CancelIcon aria-hidden="true" size={20} />}
        <h3>{correct ? 'Yes, that’s right!' : 'Hmm, not quite.'}</h3>
      </div>
      <p>{correct ? 'Your answer is correct.' : learningAvailable ? 'Use Learn It to review this concept, then try again.' : 'Check your response and try again.'}</p>
      {learningAvailable && <LearnIt key={question.id} question={question} />}
    </section>
  </>;
}
