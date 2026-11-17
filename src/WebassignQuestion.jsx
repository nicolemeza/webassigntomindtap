import React, { useState } from 'react';
import { Tooltip } from 'react-magma-dom';
import MathAnswerInput, { GradedAnswerIcon } from './MathAnswerInput';
import GraphingPad from './GraphingPad';
import NumberLinePad from './NumberLinePad';
import { questionResponseFields } from './questionResponseFields';
import { fieldComplete, gradedAnswerState } from './questionGrading';
import { nextQuestionRandomization, supportsQuestionRandomization, withQuestionRandomization } from './questionRandomization';
import './webassign-question.css';

const allowedTags = new Set(['div', 'span', 'p', 'em', 'i', 'b', 'strong', 'sup', 'sub', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'br', 'hr', 'ol', 'ul', 'li', 'figure', 'figcaption', 'section', 'h2', 'h3', 'h4', 'h5', 'h6', 'fieldset', 'legend', 'var']);
const svgTags = new Set(['svg', 'g', 'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text', 'tspan', 'desc', 'title', 'defs', 'marker']);
function safeStyle(value = '') {
  return Object.fromEntries(value.split(';').filter(Boolean).map(rule => {
    const colon = rule.indexOf(':');
    return [rule.slice(0, colon).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), rule.slice(colon + 1).trim()];
  }).filter(([key, value]) => /^(fontStyle|fontWeight|verticalAlign|textAlign|borderTop|borderBottom|borderLeft|borderRight|paddingLeft|paddingRight|display|width|height)$/.test(key) && !/url|expression/i.test(value)));
}
export default function WebassignQuestion({ question: originalQuestion, values = {}, onChange, instructor = false, disabled = false, showWrittenResponse = true, history = {}, lastSubmitted = {}, solutionAvailable = false, answerKeyVisible = false, answerKeyMode = false }) {
  const [showAnswers, setShowAnswers] = useState(answerKeyVisible);
  const [randomizedPreview, setRandomizedPreview] = useState(null);
  const canRandomize = instructor && supportsQuestionRandomization(originalQuestion);
  const question = canRandomize ? randomizedPreview || withQuestionRandomization(originalQuestion) : originalQuestion;
  // Preview versions have their own blank responses and no student grading state.
  if (canRandomize) { values = {}; history = {}; lastSubmitted = {}; }
  const answersAvailable = instructor || solutionAvailable;
  const fields = new Map(question.fields.map(field => [field.id, field]));
  const responseFields = questionResponseFields(question);
  const render = (node, key) => {
    if (typeof node === 'string') return node;
    if (node.answerKey && (answerKeyMode || !(answersAvailable && showAnswers))) return null;
    if (node.tag === 'field') {
      const field = fields.get(node.id);
      if (!field) return null;
      const id = `${question.id}-${field.id}`;
      const label = field.label || `Answer ${question.fields.indexOf(field) + 1} for ${question.questionCode}`;
      const correct = answersAvailable && showAnswers && field.correct;
      const responseId = ['radio', 'checkbox'].includes(field.type) ? field.group : field.id;
      const gradeState = answerKeyMode ? undefined : gradedAnswerState(values[responseId], history[responseId], lastSubmitted[responseId]);
      const fieldDisabled = disabled || canRandomize || fieldComplete(history[responseId]);
      if (field.type === 'graph') {
        const graphAnswer = answersAvailable && showAnswers && field.answerGraph;
        return <GraphingPad key={`${key}-${graphAnswer ? 'key' : 'response'}`} label={graphAnswer ? 'Answer key: graph of the circle.' : field.label} disabled={fieldDisabled || Boolean(graphAnswer)} answerKey={Boolean(graphAnswer)} value={graphAnswer || values[field.id]} onChange={value => onChange(field.id, value)} />;
      }
      if (field.type === 'number-line') return <NumberLinePad key={key} label={field.label} value={values[field.id]} onChange={value => onChange(field.id, value)} />;
      if (['radio', 'checkbox'].includes(field.type)) {
        const selected = (values[field.group] || '').split('\u001f');
        return <span className="imported-choice-control" key={key} data-grade-state={selected.includes(field.value) ? gradeState : undefined}><input id={id} aria-label={label} type={field.type} name={`${question.id}-${field.group}`} disabled={fieldDisabled} checked={selected.includes(field.value)} onChange={event => onChange(field.group, field.type === 'radio' ? field.value : (event.target.checked ? [...selected.filter(Boolean), field.value] : selected.filter(v => v !== field.value)).sort().join('\u001f'))} /><GradedAnswerIcon state={selected.includes(field.value) ? gradeState : undefined} />{correct && !answerKeyMode && <span className="imported-correct-key">Key</span>}</span>;
      }
      if (field.type === 'select') return <span className="imported-select-input" key={key} data-grade-state={gradeState}><select id={id} aria-label={label} aria-invalid={gradeState === 'incorrect' || undefined} disabled={fieldDisabled} value={values[field.id] || ''} onChange={event => onChange(field.id, event.target.value)}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><GradedAnswerIcon state={gradeState} /></span>;
      const inputNumber = responseFields.length > 1 ? responseFields.findIndex(response => response.id === field.id) + 1 : undefined;
      const answerKeyValue = answerKeyMode
        ? values[field.id] || field.expected || question.instructorAnswerKey?.[field.id] || field.answer || ''
        : values[field.id] || '';
      // Answer-key fields remain immutable, but use readOnly rather than disabled so
      // instructors can select and copy the displayed answer.
      return <span className="imported-math-input" key={key} data-grade-state={gradeState}><MathAnswerInput id={id} label={label} inputNumber={inputNumber} gradeState={gradeState} answerKey={answerKeyMode} disabled={answerKeyMode ? false : fieldDisabled} readOnly={answerKeyMode || undefined} autoComplete="off" value={answerKeyValue} onChange={event => onChange(field.id, event.target.value)} /><GradedAnswerIcon state={gradeState} /></span>;
    }
    if (node.tag === 'img') {
      const { src, alt } = node.attrs || {};
      if (!/^https:\/\/(?:www\.webassign\.net|[^/]+\.cloudfront\.net|[^/]*cengage\.com)\//.test(src || '')) return null;
      return <img key={key} src={src} alt={alt ?? 'Question illustration'} className={node.answerKey ? 'imported-answer-key' : 'imported-question-image'} loading="lazy" referrerPolicy="no-referrer" />;
    }
    if (svgTags.has(node.tag)) {
      const props = {};
      for (const [name, value] of Object.entries(node.attrs || {})) {
        if (/^(viewBox|width|height|d|x|y|dx|dy|cx|cy|r|rx|ry|x1|x2|y1|y2|points|fill|stroke|stroke-width|transform|text-anchor|font-size|font-family|opacity)$/.test(name) && !/url|javascript/i.test(value)) props[name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      }
      return React.createElement(node.tag, { ...props, key }, ...(node.children || []).map((child, index) => render(child, `${key}-${index}`)));
    }
    const tag = allowedTags.has(node.tag) ? node.tag : 'span';
    const attrs = node.attrs || {};
    const isRandomizedValue = instructor && node.randomized;
    const randomizedValue = isRandomizedValue ? (node.children || []).filter(child => typeof child === 'string').join('') : '';
    const children = ['br', 'hr'].includes(tag) ? [] : (node.children || []).map((child, index) => render(child, `${key}-${index}`));
    const renderedNode = React.createElement(tag, {
      key,
      className: `${attrs.class || ''}${node.answerKey ? ' imported-answer-key' : ''}${isRandomizedValue ? ' imported-randomized-value' : ''}`,
      style: safeStyle(attrs.style),
      ...(isRandomizedValue ? { tabIndex: 0, 'aria-label': `${randomizedValue}. Randomized assignment value.` } : {}),
      ...(attrs.colspan ? { colSpan: Number(attrs.colspan) } : {}),
      ...(attrs.rowspan ? { rowSpan: Number(attrs.rowspan) } : {}),
    }, ...children);
    return isRandomizedValue ? (
      <Tooltip
        key={`${key}-randomization-tooltip`}
        content="This number is randomized for each assignment."
        tooltipStyle={{ maxWidth: '280px', whiteSpace: 'normal', overflowWrap: 'break-word' }}
      >
        {renderedNode}
      </Tooltip>
    ) : renderedNode;
  };
  return <div className="webassign-question">
    {answersAvailable && !answerKeyVisible && <div className="imported-key-toolbar">
      {canRandomize && <button type="button" className="author-text-button" onClick={() => setRandomizedPreview(current => nextQuestionRandomization(current || question))}>See new randomization</button>}
      <button type="button" className="author-text-button" aria-pressed={showAnswers} onClick={() => setShowAnswers(!showAnswers)}>{solutionAvailable ? showAnswers ? 'Hide solution' : 'Show solution' : showAnswers ? 'Hide answer key' : 'Show answer key'}</button>
    </div>}
    {canRandomize && <span className="visually-hidden" role="status">{randomizedPreview ? 'New randomization shown. Randomized values have a dotted underline.' : ''}</span>}
    {question.exploration?.url === 'https://college.cengage.com/mathematics/precalculus/explore_it/topic7/stretching.html' && <section className="imported-exploration" aria-label="Explore It">
      <h3>Explore It: {question.exploration.title}</h3>
      <iframe title={`Explore It: ${question.exploration.title}`} src={question.exploration.url} loading="lazy" referrerPolicy="no-referrer" />
      <a href={question.exploration.url} target="_blank" rel="noreferrer">Open Explore It in a new window</a>
    </section>}
    <div className="imported-question-content">{question.content.map((node, index) => render(node, String(index)))}</div>
    {showWrittenResponse && !question.fields.length && <label className="imported-written-response">Your response<textarea value={values.response || ''} disabled={disabled} onChange={event => onChange('response', event.target.value)} /></label>}
  </div>;
}
