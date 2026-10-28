import React, { useState } from 'react';
import { Modal, ModalSize, Button } from 'react-magma-dom';
import './number-line-pad.css';

const emptyLine = { objects: [], noSolution: false };
const readLine = (value) => {
  try {
    const parsed = JSON.parse(value || '');
    return Array.isArray(parsed?.objects) ? { objects: parsed.objects, noSolution: Boolean(parsed.noSolution) } : emptyLine;
  } catch { return emptyLine; }
};
const labels = { select: 'Select', open: 'Open endpoint', closed: 'Closed endpoint', segment: 'Interval', left: 'Ray left', right: 'Ray right', erase: 'Erase', clear: 'Clear all', 'no-solution': 'No solution', help: 'Help' };
const icons = { select: '↖', open: '○', closed: '●', segment: '━', left: '←', right: '→', erase: '⌫', 'no-solution': 'NS', help: '?' };
const toX = (number) => 4 + ((number + 10) / 20) * 92;

export default function NumberLinePad({ value, onChange, label = 'Use the number line to enter your answer.' }) {
  const data = readLine(value);
  const [tool, setTool] = useState('select');
  const [pending, setPending] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [message, setMessage] = useState(label);
  const save = (next) => onChange(JSON.stringify(next));
  const selectTool = (next) => { setTool(next); setPending(null); setMessage(labels[next] === 'Select' ? 'Select a drawing tool, then click the number line.' : `${labels[next]} selected.`); };
  const add = (object) => save({ ...data, noSolution: false, objects: [...data.objects, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...object }] });
  const eraseAt = (number) => {
    const candidates = data.objects.map((object, index) => ({ index, distance: Math.min(...object.points.map((point) => Math.abs(point - number))) }));
    const closest = candidates.sort((a, b) => a.distance - b.distance)[0];
    if (!closest || closest.distance > 1) { setMessage('Click closer to an object to erase it.'); return; }
    save({ ...data, objects: data.objects.filter((_, index) => index !== closest.index) });
    setMessage('Object erased.');
  };
  const place = (event) => {
    if (tool === 'select') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const number = Math.max(-10, Math.min(10, Math.round(((event.clientX - rect.left) / rect.width) * 20 - 10)));
    if (tool === 'erase') return eraseAt(number);
    if (['open', 'closed', 'left', 'right'].includes(tool)) { add({ type: tool, points: [number] }); setMessage(`${labels[tool]} placed at ${number}.`); return; }
    if (pending === null) { setPending(number); setMessage('First endpoint placed. Click to place the second endpoint.'); return; }
    add({ type: 'segment', points: [pending, number] }); setPending(null); setMessage('Interval placed.');
  };
  const renderObject = (object) => {
    const [first, second] = object.points;
    const x = toX(first);
    const endpoint = (point, open = false, key) => <circle key={key} cx={`${toX(point)}%`} cy="50%" r="7" fill={open ? 'white' : '#006298'} stroke="#006298" strokeWidth="2" />;
    if (object.type === 'segment') return <g key={object.id}><line x1={`${toX(first)}%`} y1="50%" x2={`${toX(second)}%`} y2="50%" className="number-line-object" />{endpoint(first, false, 'first')}{endpoint(second, false, 'second')}</g>;
    if (object.type === 'left' || object.type === 'right') {
      const edge = object.type === 'left' ? -10 : 10;
      return <g key={object.id}><line x1={`${toX(edge)}%`} y1="50%" x2={`${x}%`} y2="50%" className="number-line-object" markerStart={object.type === 'left' ? 'url(#number-line-arrow-left)' : undefined} markerEnd={object.type === 'right' ? 'url(#number-line-arrow-right)' : undefined} />{endpoint(first, false, 'endpoint')}</g>;
    }
    return <g key={object.id}>{endpoint(first, object.type === 'open', 'point')}</g>;
  };
  const button = (name) => <button key={name} type="button" className={`number-line-tool${tool === name ? ' is-active' : ''}`} aria-label={labels[name]} aria-pressed={['select', 'open', 'closed', 'segment', 'left', 'right', 'erase'].includes(name) ? tool === name : name === 'no-solution' ? data.noSolution : undefined} onClick={() => {
    if (name === 'help') setHelpOpen(true);
    else if (name === 'clear') { save(emptyLine); setPending(null); setMessage('Number line cleared.'); }
    else if (name === 'no-solution') { save({ objects: [], noSolution: !data.noSolution }); setPending(null); setMessage(data.noSolution ? 'No solution cleared.' : 'No solution selected.'); }
    else selectTool(name);
  }}><span aria-hidden="true">{name === 'clear' ? '⌫' : icons[name]}</span></button>;
  return <section className="number-line-pad" aria-label="Number line tool">
    <p className="number-line-status" role="status">{message}</p>
    <div className="number-line-pad-frame">
      <div className="number-line-canvas" onClick={place}>
        <svg viewBox="0 0 1000 150" preserveAspectRatio="none" role="img" aria-label={`Number line from negative 10 to 10 with ${data.objects.length} object${data.objects.length === 1 ? '' : 's'}`}>
          <defs><marker id="number-line-arrow-right" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10" fill="none" stroke="#006298" strokeWidth="1.5" /></marker><marker id="number-line-arrow-left" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,0 L0,5 L10,10" fill="none" stroke="#006298" strokeWidth="1.5" /></marker></defs>
          <line x1="0" y1="50%" x2="1000" y2="50%" className="number-line-axis" />
          <path d="M18,64 L0,75 L18,86 M982,64 L1000,75 L982,86" className="number-line-axis" />
          {Array.from({ length: 21 }, (_, index) => { const number = index - 10; return <g key={number}><line x1={`${toX(number)}%`} y1="38%" x2={`${toX(number)}%`} y2="62%" className="number-line-tick" />{number % 2 === 0 && <text x={`${toX(number)}%`} y="84%" textAnchor="middle">{number}</text>}</g>; })}
          {data.objects.map(renderObject)}
          {pending !== null && <circle cx={`${toX(pending)}%`} cy="50%" r="7" fill="white" stroke="#006298" strokeWidth="2" />}
        </svg>
        {data.noSolution && <span className="number-line-no-solution">No solution</span>}
      </div>
      <div className="number-line-toolbar" role="toolbar" aria-label="Number line tools">
        {['select', 'open', 'closed', 'segment', 'left', 'right', 'erase'].map(button)}<span className="number-line-divider" />{button('clear')}<span className="number-line-divider" />{button('no-solution')}<span className="number-line-spacer" />{button('help')}
      </div>
    </div>
    <Modal isOpen={helpOpen} header="Number line help" headerLevel={2} size={ModalSize.medium} onClose={() => setHelpOpen(false)}><p>Choose a tool and click the number line. Use open or closed endpoints for individual values, Interval for a finite segment, and the arrow tools for rays. Erase removes the nearest object; Clear all starts over.</p><Button onClick={() => setHelpOpen(false)}>Close help</Button></Modal>
  </section>;
}
