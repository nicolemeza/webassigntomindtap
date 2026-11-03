import React from 'react';
import { getQuestionCode } from './questionCodes';
import './webassign-question.css';

export default function QuestionIdentity({ question, badge = false }) {
  const code = getQuestionCode(question);
  if (!code) return null;
  return <div className={`question-identity${badge ? ' question-identity--badge' : ''}`} aria-label="Textbook question code">
    <span className={badge ? 'question-code-badge' : 'question-code'}>{code}</span>
  </div>;
}
