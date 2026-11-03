import React, { useState } from 'react';
import MathAnswerInput from './MathAnswerInput';
import GraphingPad from './GraphingPad';
import NumberLinePad from './NumberLinePad';
import { questionResponseFields } from './questionResponseFields';
import './webassign-question.css';

const allowedTags = new Set(['div', 'span', 'p', 'em', 'i', 'b', 'strong', 'sup', 'sub', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'br', 'hr', 'ol', 'ul', 'li', 'figure', 'figcaption', 'section', 'h2', 'h3', 'fieldset', 'legend', 'var']);
const svgTags = new Set(['svg', 'g', 'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text', 'tspan', 'desc', 'title', 'defs', 'marker']);
function safeStyle(value = '') {
  return Object.fromEntries(value.split(';').filter(Boolean).map(rule => {
    const colon = rule.indexOf(':');
    return [rule.slice(0, colon).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), rule.slice(colon + 1).trim()];
  }).filter(([key, value]) => /^(fontStyle|fontWeight|verticalAlign|textAlign|borderTop|borderBottom|borderLeft|borderRight|paddingLeft|paddingRight|display|width|height)$/.test(key) && !/url|expression/i.test(value)));
}
export default function WebassignQuestion({ question, values = {}, onChange, instructor = false, disabled = false }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const fields = new Map(question.fields.map(field => [field.id, field]));
  const responseFields = questionResponseFields(question);
  const render = (node, key) => {
    if (typeof node === 'string') return node;
    if (node.answerKey && !(instructor && showAnswers)) return null;
    if (node.tag === 'field') {
      const field = fields.get(node.id);
      if (!field) return null;
      const id = `${question.id}-${field.id}`;
      const label = field.label || `Answer ${question.fields.indexOf(field) + 1} for ${question.questionCode}`;
      const correct = instructor && showAnswers && field.correct;
      if (field.type === 'graph') return <GraphingPad key={key} label={field.label} value={values[field.id]} onChange={value => onChange(field.id, value)} />;
      if (field.type === 'number-line') return <NumberLinePad key={key} label={field.label} value={values[field.id]} onChange={value => onChange(field.id, value)} />;
      if (['radio', 'checkbox'].includes(field.type)) {
        const selected = (values[field.group] || '').split('\u001f');
        return <span className="imported-choice-control" key={key}><input id={id} aria-label={label} type={field.type} name={`${question.id}-${field.group}`} disabled={disabled} checked={selected.includes(field.value)} onChange={event => onChange(field.group, field.type === 'radio' ? field.value : (event.target.checked ? [...selected.filter(Boolean), field.value] : selected.filter(v => v !== field.value)).sort().join('\u001f'))} />{correct && <span className="imported-correct-key">Key</span>}</span>;
      }
      if (field.type === 'select') return <select key={key} id={id} aria-label={label} disabled={disabled} value={values[field.id] || ''} onChange={event => onChange(field.id, event.target.value)}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
      const inputNumber = responseFields.length > 1 ? responseFields.findIndex(response => response.id === field.id) + 1 : undefined;
      return <span className="imported-math-input" key={key}><MathAnswerInput id={id} label={label} inputNumber={inputNumber} disabled={disabled} autoComplete="off" value={values[field.id] || ''} onChange={event => onChange(field.id, event.target.value)} /></span>;
    }
    if (node.tag === 'img') {
      const { src, alt } = node.attrs || {};
      if (!/^https:\/\/(?:www\.webassign\.net|[^/]+\.cloudfront\.net|[^/]*cengage\.com)\//.test(src || '')) return null;
      return <img key={key} src={src} alt={alt || 'Question illustration'} className={node.answerKey ? 'imported-answer-key' : 'imported-question-image'} loading="lazy" referrerPolicy="no-referrer" />;
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
    return React.createElement(tag, { key, className: `${attrs.class || ''}${node.answerKey ? ' imported-answer-key' : ''}`, style: safeStyle(attrs.style), ...(attrs.colspan ? { colSpan: Number(attrs.colspan) } : {}), ...(attrs.rowspan ? { rowSpan: Number(attrs.rowspan) } : {}) }, ...(['br', 'hr'].includes(tag) ? [] : (node.children || []).map((child, index) => render(child, `${key}-${index}`))));
  };
  return <div className="webassign-question">
    {instructor && <div className="imported-key-toolbar"><button type="button" className="author-text-button" aria-pressed={showAnswers} onClick={() => setShowAnswers(!showAnswers)}>{showAnswers ? 'Hide answer key' : 'Show answer key'}</button></div>}
    <div className="imported-question-content">{question.content.map((node, index) => render(node, String(index)))}</div>
    {!question.fields.length && <label className="imported-written-response">Your response<textarea value={values.response || ''} disabled={disabled} onChange={event => onChange('response', event.target.value)} /></label>}
  </div>;
}
