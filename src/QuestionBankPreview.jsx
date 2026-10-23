import React, { useState } from 'react';
import { Button } from 'react-magma-dom';
import MathQuestion from './MathQuestion';
import FactoringQuestion from './FactoringQuestion';
import ChoiceQuestion from './ChoiceQuestion';
import QuestionAttempts from './QuestionAttempts';
import { fieldComplete, gradedAnswerState, gradingFields, submitQuestion } from './questionGrading';

export default function QuestionBankPreview({ question }) {
  const [answer, setAnswer] = useState({});
  const [result, setResult] = useState({ history: {}, lastSubmitted: {}, emptyFields: [], unchangedFields: [] });
  const update = (field, value) => { setAnswer((current) => ({ ...current, [field]: value })); setResult((current) => ({ ...current, message: '', emptyFields: [], unchangedFields: [] })); };
  const fields = gradingFields(question);
  const complete = fields.length && fields.every((field) => fieldComplete(result.history[field.id]));
  const invalid = [...result.emptyFields, ...result.unchangedFields];
  return <div className="bank-question-preview player-question-integrated" aria-label={`Preview of ${question.title}`}>
    <div className="question-surface"><QuestionAttempts question={question} history={result.history} />
      <div className="player-question-content">
        {question.kind === 'choice' ? <ChoiceQuestion question={question} value={answer.selections} disabled={Boolean(complete)} onChange={(value) => update('selections', value)} />
          : question.kind === 'greatest-common-factor' ? <FactoringQuestion question={question} value={answer.text || ''} onChange={(value) => update('text', value)} disabled={Boolean(complete)} invalid={invalid.includes('answer')} gradeState={gradedAnswerState(answer.text, result.history.answer, result.lastSubmitted.answer)} />
            : <MathQuestion question={question} values={answer.values} history={result.history} lastSubmitted={result.lastSubmitted} invalidFields={invalid} onChange={(id, value) => update('values', { ...answer.values, [id]: value })} />}
        <Button className="rebrand-button bank-check-answer" disabled={!fields.length || Boolean(complete)} onClick={() => setResult(submitQuestion(question, answer, result.history, result.lastSubmitted))}>Check Answer</Button>
        <p id={`grade-feedback-${question.id}`} className="bank-answer-feedback" role="status">{result.message || (result.submitted ? result.history.answer?.at(-1) === true ? 'Correct answer.' : Object.values(result.history).every((history) => history.at(-1)) ? 'Correct answer.' : 'That answer is not correct. Try again.' : '')}</p>
      </div>
    </div>
  </div>;
}
