import React, { useRef, useState } from 'react';
import { ButtonSize, ButtonVariant, IconButton } from 'react-magma-dom';
import { KeyboardIcon } from 'react-magma-icons';
import MathPad from './MathPad';
import MathAnswerInput, { GradedAnswerIcon } from './MathAnswerInput';

function VariablePower({ variable, power }) {
  return power === 1 ? <mi mathvariant="normal">{variable}</mi> : <msup><mi mathvariant="normal">{variable}</mi><mn>{power}</mn></msup>;
}

export default function FactoringQuestion({ question, value, onChange, onOpenMathKeyboard, disabled = false, invalid = false, gradeState, answerKeyMode = false }) {
  const answerId = `answer-${question.id}`;
  const inputRef = useRef(null);
  const [mathPadOpen, setMathPadOpen] = useState(false);
  const padId = `${question.id}-math-pad`;
  return <div className="player-factoring-question">
    <p className="player-factoring-prompt" id={`${question.id}-prompt`}>{question.prompt}</p>
    <div className="player-factorizations">
      {question.terms.map((term) => <math key={term.coefficient} display="block" aria-label={`${term.coefficient} x to the power ${term.xPower} y to the power ${term.yPower} equals ${term.factors.join(' times ')}`}>
        <mrow><mn>{term.coefficient}</mn><VariablePower variable="x" power={term.xPower} /><VariablePower variable="y" power={term.yPower} /><mo>=</mo>
          {term.factors.map((factor, index) => <React.Fragment key={index}>{index > 0 && <mo>·</mo>}{/^\d+$/.test(factor) ? <mn>{factor}</mn> : <mi mathvariant="normal">{factor}</mi>}</React.Fragment>)}
        </mrow>
      </math>)}
    </div>
    <fieldset disabled={answerKeyMode ? false : disabled} className="player-factoring-answer r5-graded-field" data-grade-state={gradeState}>
      <MathAnswerInput ref={inputRef} id={answerId} type="text" label="Greatest common factor" gradeState={answerKeyMode ? undefined : gradeState} answerKey={answerKeyMode} disabled={answerKeyMode ? false : disabled} readOnly={answerKeyMode || undefined} invalid={invalid} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby={`${question.id}-prompt${invalid ? ` grade-feedback-${question.id}` : ''}`} />
      <GradedAnswerIcon state={answerKeyMode ? undefined : gradeState} />
      {!answerKeyMode && <IconButton className="player-math-keyboard-button" type="button" aria-label={mathPadOpen ? 'Close math keyboard' : 'Open math keyboard'} aria-expanded={mathPadOpen} aria-controls={mathPadOpen ? padId : undefined} variant={ButtonVariant.link} size={ButtonSize.small} icon={<KeyboardIcon />} onClick={() => { setMathPadOpen(!mathPadOpen); if (mathPadOpen) inputRef.current?.focus(); else onOpenMathKeyboard?.(); }} />}
    </fieldset>
    {mathPadOpen && !disabled && <MathPad id={padId} value={value} onChange={onChange} onClose={() => { setMathPadOpen(false); inputRef.current?.focus(); }} />}
  </div>;
}
