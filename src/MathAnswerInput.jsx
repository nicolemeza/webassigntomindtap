import React, { forwardRef, useContext } from 'react';
import { Input, ThemeContext } from 'react-magma-dom';

const hiddenMessage = { position: 'absolute', width: 1, height: 1, padding: 0, margin: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)' };

// Compose the Figma-connected Magma Input without changing the plain-text
// editor, Math Pad integration, or the question's existing dimensions.
export default forwardRef(function MathAnswerInput({ label, gradeState, invalid = false, ...props }, ref) {
  const theme = useContext(ThemeContext);
  const error = invalid ? 'Check the validation message below.' : gradeState === 'incorrect' ? 'Incorrect answer.' : undefined;
  return <div className="math-answer-input"><Input {...props} ref={ref} labelText={label} isLabelVisuallyHidden
    data-grade-state={gradeState}
    errorMessage={error}
    helperMessage={!invalid && gradeState === 'correct' ? 'Correct answer.' : undefined}
    messageStyle={hiddenMessage}
    containerStyle={{ margin: 0, width: '100%' }}
    inputWrapperStyle={{ margin: 0 }}
    inputStyle={{
      borderColor: props.disabled ? theme.colors.border : error ? theme.colors.danger : gradeState === 'correct' ? theme.colors.success : undefined,
      backgroundColor: props.disabled ? theme.colors.neutral200 : undefined,
    }} /></div>;
});

export function GradedAnswerIcon({ state }) {
  if (!state) return null;
  return <img className="graded-answer-icon" src={`/rebrand/answer-${state}.svg`} width="16" height="16" alt={state === 'correct' ? 'Correct answer' : 'Incorrect answer'} />;
}
