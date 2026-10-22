import React, { useRef, useState } from 'react';
import { Button, ButtonSize, ButtonVariant, Checkbox, IconButton } from 'react-magma-dom';
import { KeyboardIcon } from 'react-magma-icons';
import MathExpression from './MathExpression';
import MathPad from './MathPad';
import GraphingPad from './GraphingPad';
import NumberLinePad from './NumberLinePad';
import './math-question.css';
import { fieldComplete, gradedAnswerState } from './questionGrading';
import MathAnswerInput, { GradedAnswerIcon } from './MathAnswerInput';

export default function MathQuestion({ question, values = {}, onChange, history = {}, invalidFields = [], lastSubmitted = {} }) {
  const [activeInput, setActiveInput] = useState(null);
  const [begun, setBegun] = useState(false);
  const inputRefs = useRef({});
  const padId = `${question.id}-math-pad`;
  const mathInputs = question.inputs.filter(field => question.blocks.some(block => block.parts?.some(part => part.input === field.id)));
  const inputIndex = mathInputs.findIndex((item) => item.id === activeInput);
  const renderInput = (part) => {
    const inputId = `${question.id}-${part.input}`;
    const gradeState = gradedAnswerState(values[part.input], history[part.input], lastSubmitted[part.input]);
    const disabled = fieldComplete(history[part.input]);
    const inputNumber = mathInputs.length > 1 ? mathInputs.findIndex((field) => field.id === part.input) + 1 : undefined;
    return <fieldset disabled={disabled} className="player-factoring-answer r5-answer-field r5-graded-field" data-grade-state={gradeState} key={part.input}>
      <MathAnswerInput ref={(element) => { inputRefs.current[part.input] = element; }} id={inputId} type="text" label={part.label} inputNumber={inputNumber} gradeState={gradeState} disabled={disabled} invalid={invalidFields.includes(part.input)} aria-describedby={invalidFields.includes(part.input) ? `grade-feedback-${question.id}` : undefined} value={values[part.input] || ''} onChange={(event) => onChange(part.input, event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} />
      <GradedAnswerIcon state={gradeState} />
      <IconButton className="player-math-keyboard-button" type="button" aria-label={`${activeInput === part.input ? 'Close' : 'Open'} math keyboard for ${part.label}`} aria-expanded={activeInput === part.input} aria-controls={activeInput === part.input ? padId : undefined} variant={ButtonVariant.link} size={ButtonSize.small} icon={<KeyboardIcon />} onClick={() => { if (activeInput === part.input) { setActiveInput(null); inputRefs.current[part.input]?.focus(); } else setActiveInput(part.input); }} />
    </fieldset>;
  };
  return <div className="r5-question">
    {question.blocks.map((block, index) => {
      if (block.type === 'text') return <p key={index}>{block.text}</p>;
      if (block.type === 'notice') return <p className="r5-sequence-notice" key={index}>{block.text}</p>;
      if (block.type === 'math') return <div className="r5-math-line" key={index}><MathExpression expression={block.expression} /></div>;
      if (block.type === 'image') return <img className="r5-question-diagram" key={index} src={block.src} alt={block.alt} width={block.width} height={block.height} />;
      if (block.type === 'answer-row') return <div className="r5-answer-row" key={index}>{block.parts.map((part, partIndex) => part.input ? renderInput(part) : part.math ? <MathExpression key={partIndex} expression={part.math} /> : <span key={partIndex}>{part.text}</span>)}</div>;
      if (block.type === 'selections') {
        let selected = [];
        try { selected = JSON.parse(values[block.id] || '[]'); } catch { /* Empty response. */ }
        const gradeState = gradedAnswerState(values[block.id], history[block.id], lastSubmitted[block.id]);
        return <fieldset key={index} className="question-selection-group"><legend>{block.label}</legend>{block.options.map((option, optionIndex) => {
          const optionText = typeof option === 'string' ? option : option.label;
          const optionDisplay = block.mathOptions ? <MathExpression expression={optionText} /> : optionText;
          const isSelected = block.multiple ? selected.includes(optionIndex) : values[block.id] === String(optionIndex);
          return <div className="question-selection-option" data-grade-state={isSelected ? gradeState : undefined} key={optionText}>{block.multiple
            ? <Checkbox labelText={optionDisplay} aria-label={optionText} name={`${question.id}-${block.id}`} checked={isSelected} containerStyle={{ margin: '8px 0' }} onChange={() => onChange(block.id, JSON.stringify(isSelected ? selected.filter(value => value !== optionIndex) : [...selected, optionIndex]))} />
            : <label><input type="radio" name={`${question.id}-${block.id}`} checked={isSelected} onChange={() => onChange(block.id, String(optionIndex))} />{optionDisplay}</label>}<span className="graded-answer-indicator" aria-hidden="true">{isSelected && <GradedAnswerIcon state={gradeState} />}</span></div>;
        })}</fieldset>;
      }
      if (block.type === 'graph-choices') {
        const gradeState = gradedAnswerState(values[block.id], history[block.id], lastSubmitted[block.id]);
        return <fieldset key={index} className="question-graph-choices"><legend>{block.label}</legend><div>{block.options.map((option, optionIndex) => {
          const selected = values[block.id] === String(optionIndex);
          return <label key={option.src} className={selected ? 'is-selected' : ''} data-grade-state={selected ? gradeState : undefined}><img src={option.src} width="328" height="350" alt={option.description} /><span><input type="radio" name={`${question.id}-${block.id}`} checked={selected} onChange={() => onChange(block.id, String(optionIndex))} />{option.label}{selected && <GradedAnswerIcon state={gradeState} />}</span></label>;
        })}</div></fieldset>;
      }
      if (block.type === 'graph-pad') return <GraphingPad key={index} value={values[block.id]} label={block.label} onChange={value => onChange(block.id, value)} />;
      if (block.type === 'number-line') return <NumberLinePad key={index} value={values[block.id]} label={block.label} onChange={value => onChange(block.id, value)} />;
      if (block.type === 'fix-it') return <section className="r5-fix-it" key={index} aria-label="Fix It">
        <h3>{block.title}</h3>{block.notice && <p className="r5-sequence-notice">{block.notice}</p>}<p>{block.prompt}</p><div className="r5-incorrect-solution"><p>{block.solutionPrompt || 'Factor completely.'}</p>{block.expression && <MathExpression expression={block.expression} />}<ol>{block.steps.map((step, stepIndex) => <li key={step}><span>STEP {stepIndex + 1}: </span><MathExpression expression={step} /></li>)}</ol></div>
        <Button className="rebrand-button" variant={ButtonVariant.outline} onClick={() => setBegun(true)}>Click here to begin</Button>
        {begun && <p className="r5-follow-up-note" role="status">The follow-up parts are not visible in the supplied screenshot. This preview includes the original introduction and incorrect solution; the remaining steps need source content.</p>}
      </section>;
      return null;
    })}
    {inputIndex >= 0 && !fieldComplete(history[activeInput]) && <MathPad id={padId} value={values[activeInput] || ''} onChange={(value) => onChange(activeInput, value)} inputCount={mathInputs.length} inputIndex={inputIndex} onInputChange={(index) => setActiveInput(mathInputs[index].id)} onClose={() => { inputRefs.current[activeInput]?.focus(); setActiveInput(null); }} />}
  </div>;
}
