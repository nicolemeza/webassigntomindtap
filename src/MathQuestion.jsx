import React, { useRef, useState } from 'react';
import { Button, ButtonSize, ButtonVariant, IconButton } from 'react-magma-dom';
import { KeyboardIcon } from 'react-magma-icons';
import MathExpression from './MathExpression';
import MathPad from './MathPad';
import './math-question.css';

export default function MathQuestion({ question, values = {}, onChange }) {
  const [activeInput, setActiveInput] = useState(null);
  const [begun, setBegun] = useState(false);
  const inputRefs = useRef({});
  const padId = `${question.id}-math-pad`;
  const inputIndex = question.inputs.findIndex((item) => item.id === activeInput);
  const renderInput = (part) => {
    const inputId = `${question.id}-${part.input}`;
    return <span className="player-factoring-answer r5-answer-field" key={part.input}>
      <input ref={(element) => { inputRefs.current[part.input] = element; }} id={inputId} type="text" aria-label={part.label} value={values[part.input] || ''} onChange={(event) => onChange(part.input, event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} />
      <IconButton className="player-math-keyboard-button" type="button" aria-label={`${activeInput === part.input ? 'Close' : 'Open'} math keyboard for ${part.label}`} aria-expanded={activeInput === part.input} aria-controls={activeInput === part.input ? padId : undefined} variant={ButtonVariant.link} size={ButtonSize.small} icon={<KeyboardIcon />} onClick={() => { if (activeInput === part.input) { setActiveInput(null); inputRefs.current[part.input]?.focus(); } else setActiveInput(part.input); }} />
    </span>;
  };
  return <div className="r5-question">
    {question.blocks.map((block, index) => {
      if (block.type === 'text') return <p key={index}>{block.text}</p>;
      if (block.type === 'notice') return <p className="r5-sequence-notice" key={index}>{block.text}</p>;
      if (block.type === 'math') return <div className="r5-math-line" key={index}><MathExpression expression={block.expression} /></div>;
      if (block.type === 'image') return <img className="r5-question-diagram" key={index} src={block.src} alt={block.alt} width={block.width} height={block.height} />;
      if (block.type === 'answer-row') return <div className="r5-answer-row" key={index}>{block.parts.map((part, partIndex) => part.input ? renderInput(part) : part.math ? <MathExpression key={partIndex} expression={part.math} /> : <span key={partIndex}>{part.text}</span>)}</div>;
      if (block.type === 'fix-it') return <section className="r5-fix-it" key={index} aria-label="Fix It">
        <h3>{block.title}</h3><p>{block.prompt}</p><div className="r5-incorrect-solution"><p>Factor completely.</p><MathExpression expression={block.expression} /><ol>{block.steps.map((step, stepIndex) => <li key={step}><span>STEP {stepIndex + 1}: </span><MathExpression expression={step} /></li>)}</ol></div>
        <Button className="rebrand-button" variant={ButtonVariant.outline} onClick={() => setBegun(true)}>Click here to begin</Button>
        {begun && <p className="r5-follow-up-note" role="status">The follow-up parts are not visible in the supplied screenshot. This preview includes the original introduction and incorrect solution; the remaining steps need source content.</p>}
      </section>;
      return null;
    })}
    {inputIndex >= 0 && <MathPad id={padId} value={values[activeInput] || ''} onChange={(value) => onChange(activeInput, value)} inputCount={question.inputs.length} inputIndex={inputIndex} onInputChange={(index) => setActiveInput(question.inputs[index].id)} onClose={() => { inputRefs.current[activeInput]?.focus(); setActiveInput(null); }} />}
  </div>;
}
