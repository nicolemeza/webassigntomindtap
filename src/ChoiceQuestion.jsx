import React from 'react';
import { Checkbox, Radio, RadioGroup } from 'react-magma-dom';

export default function ChoiceQuestion({ question, value = [], onChange, disabled = false, answerKeyMode = false }) {
  const answerKeyColor = answerKeyMode ? '#00844b' : 'var(--brand-teal)';
  const inputDisabled = disabled && !answerKeyMode;

  return <fieldset className={`author-choice-question${answerKeyMode ? ' author-choice-question--answer-key' : ''}`} disabled={inputDisabled} aria-disabled={answerKeyMode || undefined}>
    <legend>{question.prompt}</legend>
    {question.multiple ? question.choices.map((choice) => <Checkbox key={choice} labelText={choice} checked={value.includes(choice)} disabled={inputDisabled} tabIndex={answerKeyMode ? -1 : undefined} onChange={() => onChange(value.includes(choice) ? value.filter((item) => item !== choice) : [...value, choice])} color={answerKeyColor} />)
      : <RadioGroup name={question.id} value={value[0] || ''} onChange={(event) => onChange([event.target.value])}>{question.choices.map((choice) => <Radio key={choice} labelText={choice} value={choice} disabled={inputDisabled} tabIndex={answerKeyMode ? -1 : undefined} color={answerKeyColor} />)}</RadioGroup>}
  </fieldset>;
}
