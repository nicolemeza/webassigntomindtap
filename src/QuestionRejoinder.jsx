import React, { useEffect, useId, useRef, useState } from 'react';
import { CancelIcon, CheckCircleIcon, MenuBookIcon } from 'react-magma-icons';
import './question-rejoinder.css';

export default function QuestionRejoinder({ activity, question, status }) {
  const [citationOpen, setCitationOpen] = useState(false);
  const citationId = useId();
  const citationRef = useRef(null);
  const correct = status === 'correct';
  const topic = activity.title.replace('HW ', '');

  useEffect(() => {
    if (!citationOpen) return undefined;
    const closeCitation = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') setCitationOpen(false);
      if (event.type === 'pointerdown' && !citationRef.current?.contains(event.target)) setCitationOpen(false);
    };
    document.addEventListener('keydown', closeCitation);
    document.addEventListener('pointerdown', closeCitation);
    return () => {
      document.removeEventListener('keydown', closeCitation);
      document.removeEventListener('pointerdown', closeCitation);
    };
  }, [citationOpen]);

  return <>
    <section className={`question-rejoinder question-rejoinder--${status}`} aria-live="polite" aria-label="Answer feedback">
      <div className="question-rejoinder-heading">
        {correct ? <CheckCircleIcon aria-hidden="true" size={20} /> : <CancelIcon aria-hidden="true" size={20} />}
        <h3>{correct ? 'Yes, that’s right!' : 'Hmm, not quite.'}</h3>
      </div>
      <p>{correct
        ? 'Your answer is correct. Nice work applying the factoring strategy.'
        : 'Review your factoring steps and try again. Check that the expression is completely factored and that each factor is correct.'}</p>
      <div className="question-rejoinder-citation" ref={citationRef}>
        <button className="question-rejoinder-topic" type="button" aria-expanded={citationOpen} aria-controls={citationOpen ? citationId : undefined} onClick={() => setCitationOpen((open) => !open)}><MenuBookIcon aria-hidden="true" size={16} />{topic}</button>
        {citationOpen && <section id={citationId} className="question-rejoinder-citation-popover" role="dialog" aria-label={`Textbook preview for ${topic}`}>
          <header><span>Citation 1 of 1</span><button type="button" aria-label="Close textbook preview" onClick={() => setCitationOpen(false)}>×</button></header>
          <div className="question-rejoinder-citation-copy">
            <h4>{topic}</h4>
            <strong>Greatest common factor</strong>
            <p>To find the greatest common factor, identify the factors common to every term. Use the smallest exponent shared by each variable.</p>
          </div>
        </section>}
      </div>
    </section>
  </>;
}
