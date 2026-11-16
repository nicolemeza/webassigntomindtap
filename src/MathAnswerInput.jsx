import React, { forwardRef, useContext } from 'react';
import { Input, ThemeContext } from 'react-magma-dom';
import { CheckIcon, CloseIcon, VpnKeyIcon } from 'react-magma-icons';

const hiddenMessage = { position: 'absolute', width: 1, height: 1, padding: 0, margin: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)' };
const superscriptCharacters = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' };

function formatAnswerKeyExponent(value) {
  return String(value ?? '').replace(/\^([+-]?\d+)/g, (_, exponent) => [...exponent].map(character => superscriptCharacters[character] || character).join(''));
}

// Compose the Figma-connected Magma Input without changing the plain-text
// editor, Math Pad integration, or the question's existing dimensions.
export default forwardRef(function MathAnswerInput({ label, inputNumber, gradeState, invalid = false, answerKey = false, ...props }, ref) {
  const theme = useContext(ThemeContext);
  const error = answerKey ? undefined : invalid ? 'Check the validation message below.' : gradeState === 'incorrect' ? 'Incorrect answer.' : undefined;
  const displayedValue = answerKey ? formatAnswerKeyExponent(props.value) : props.value;
  return <div className="math-answer-input" data-numbered={inputNumber !== undefined ? true : undefined} data-answer-key={answerKey || undefined}>
    {inputNumber !== undefined && <span className="math-answer-number" aria-hidden="true">{inputNumber}</span>}
    <Input {...props} ref={ref} labelText={inputNumber !== undefined ? `Input ${inputNumber}, ${label}` : label} isLabelVisuallyHidden
    value={displayedValue}
    data-grade-state={gradeState}
    errorMessage={error}
    helperMessage={!answerKey && !invalid && gradeState === 'correct' ? 'Correct answer.' : undefined}
    messageStyle={hiddenMessage}
    containerStyle={{ margin: 0, width: '100%' }}
    inputWrapperStyle={{ margin: 0 }}
    inputStyle={props.disabled ? undefined : {
      borderColor: error ? theme.colors.danger : gradeState === 'correct' ? theme.colors.success : undefined,
      borderWidth: gradeState === 'correct' || gradeState === 'incorrect' ? 2 : undefined,
    }} />
    {answerKey && <span className="answer-key-input-icon" role="img" aria-label="Answer key"><VpnKeyIcon aria-hidden="true" /></span>}
  </div>;
});

export function GradedAnswerIcon({ state }) {
  if (!state) return null;
  const Icon = state === 'correct' ? CheckIcon : CloseIcon;
  return <span className={`graded-answer-icon is-${state}`} role="img" aria-label={state === 'correct' ? 'Correct answer' : 'Incorrect answer'}><Icon aria-hidden="true" /></span>;
}
