import React from 'react';
import { Tag, TagColor, TagSize } from 'react-magma-dom';
import { getQuestionCode } from './questionCodes';
import './webassign-question.css';

export default function QuestionIdentity({ question, badge = false }) {
  const code = getQuestionCode(question);
  if (!code) return null;
  return <div className={`question-identity${badge ? ' question-identity--badge' : ''}`} aria-label="Textbook question code">
    <Tag className={badge ? 'question-code-badge' : 'question-code'} color={TagColor.teal} size={TagSize.small}>{code}</Tag>
  </div>;
}
