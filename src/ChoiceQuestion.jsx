import React from 'react';
import { Checkbox, Radio, RadioGroup } from 'react-magma-dom';

export default function ChoiceQuestion({ question, value = [], onChange, disabled = false }) {
  return <fieldset className="author-choice-question" disabled={disabled}>
    <legend>{question.prompt}</legend>
    {question.multiple ? question.choices.map((choice) => <Checkbox key={choice} labelText={choice} checked={value.includes(choice)} onChange={() => onChange(value.includes(choice) ? value.filter((item) => item !== choice) : [...value, choice])} color="var(--brand-teal)" />)
      : <RadioGroup name={question.id} value={value[0] || ''} onChange={(event) => onChange([event.target.value])}>{question.choices.map((choice) => <Radio key={choice} labelText={choice} value={choice} color="var(--brand-teal)" />)}</RadioGroup>}
  </fieldset>;
}
