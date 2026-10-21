import React, { useEffect, useRef, useState } from 'react';
import { Button, ButtonSize, ButtonVariant, Input, Modal, ModalSize } from 'react-magma-dom';
import { circleRadius, graphCoordinates, graphScale, readGraph } from './graphingGeometry';
import './graphing-pad.css';

const tools = ['select', 'line', 'circle', 'parabola', 'point'];
const toolLabel = { select: 'Select', line: 'Line', circle: 'Circle', parabola: 'Parabola', point: 'Point', paint: 'Shade', 'no-solution': 'No solution', clear: 'Clear all', help: 'Help' };
const asset = name => `/graphing-pad/${name}.svg`;
const seedPoints = tool => tool === 'point' ? [[0, 0]] : [[0, 0], [1, 1]];

export default function GraphingPad({ value, onChange, label = 'Graph the circle.' }) {
  const data = readGraph(value);
  const [tool, setTool] = useState('select');
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [message, setMessage] = useState('Select a drawing tool, then place points on the graph.');
  const [size, setSize] = useState({ width: 500, height: 500 });
  const canvasRef = useRef(null);
  const pickerRef = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);
  const save = next => onChange(JSON.stringify(next));
  const addObject = (points = seedPoints(tool)) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    save({ noSolution: false, objects: [...data.objects, { id, type: tools.includes(tool) && tool !== 'select' ? tool : 'circle', points, dashed: false, shaded: false }] });
    setSelected(id); setPending(null); setMessage('Object added. Edit its coordinates in the Objects panel.');
  };
  const update = (id, changes) => save({ ...data, objects: data.objects.map(object => object.id === id ? { ...object, ...changes } : object) });
  const remove = id => { save({ ...data, objects: data.objects.filter(object => object.id !== id) }); if (selected === id) setSelected(null); };
  const selectTool = next => { setTool(next); setPending(null); if (pickerRef.current) pickerRef.current.open = false; setMessage(next === 'select' ? 'Select an object to edit its properties.' : next === 'paint' ? 'Select an object to toggle its shading.' : next === 'point' ? 'Click the graph to place a point.' : `Place ${next === 'circle' ? 'the center, then a point on the circle' : next === 'parabola' ? 'the vertex, then a point on the parabola' : 'two points on the line'}.`); };
  const place = event => {
    if (tool === 'select' || tool === 'paint') return;
    const point = graphCoordinates(event.clientX, event.clientY, canvasRef.current.getBoundingClientRect());
    if (tool === 'point') addObject([point]);
    else if (pending) {
      if (pending[0] === point[0] && pending[1] === point[1]) { setMessage('Place the second point at a different position.'); return; }
      if (tool === 'parabola' && pending[0] === point[0]) { setMessage('The second point must have a different x-coordinate.'); return; }
      addObject([pending, point]);
    } else { setPending(point); setMessage('First point placed. Click to place the second point.'); }
  };
  const toolbarButton = name => <button key={name} type="button" className={`graph-pad-tool${name === 'select' ? ' graph-pad-tool-select' : ''}`} aria-label={toolLabel[name]} title={toolLabel[name]} aria-pressed={tools.includes(name) || name === 'paint' ? tool === name : name === 'no-solution' ? data.noSolution : undefined} onClick={() => {
    if (name === 'help') setHelpOpen(true);
    else if (name === 'clear') { save({ objects: [], noSolution: false }); setSelected(null); setPending(null); setMessage('Graph cleared.'); }
    else if (name === 'no-solution') { save({ objects: [], noSolution: !data.noSolution }); setPending(null); setMessage(data.noSolution ? 'No solution cleared.' : 'No solution selected.'); }
    else selectTool(name);
  }}><img src={asset(name === 'select' && tool === 'select' ? 'select-active' : name)} width="40" height="40" alt="" /></button>;
  const scale = graphScale(size.width, size.height);
  const halfX = size.width / scale / 2, halfY = size.height / scale / 2;
  const draw = object => {
    const [[x, y], second = [x, y]] = object.points;
    const [x2, y2] = second;
    const common = { stroke: '#006298', strokeWidth: 2 / scale, strokeDasharray: object.dashed ? `${6 / scale} ${4 / scale}` : undefined, fill: object.shaded ? '#cce0ea80' : 'none' };
    const selectObject = event => { if (!['select', 'paint'].includes(tool)) return; event.stopPropagation(); setSelected(object.id); if (tool === 'paint') update(object.id, { shaded: !object.shaded }); };
    let shape;
    if (object.type === 'point') shape = <circle cx={x} cy={y} r={4 / scale} {...common} fill="#006298" />;
    else if (object.type === 'circle') shape = <circle cx={x} cy={y} r={circleRadius(object.points)} {...common} />;
    else if (object.type === 'line') {
      const dx = x2 - x, dy = y2 - y, length = Math.hypot(dx, dy) || 1, span = Math.max(halfX, halfY) * 4;
      shape = <line x1={x - dx / length * span} y1={y - dy / length * span} x2={x + dx / length * span} y2={y + dy / length * span} {...common} />;
    } else {
      const coefficient = (y2 - y) / ((x2 - x) ** 2 || 1);
      const path = Array.from({ length: 241 }, (_, index) => { const px = -halfX + index * halfX / 120; return `${index ? 'L' : 'M'}${px},${coefficient * (px - x) ** 2 + y}`; }).join(' ');
      shape = <path d={path} {...common} />;
    }
    return <g key={object.id} onClick={selectObject} style={{ pointerEvents: 'all', cursor: tool === 'select' || tool === 'paint' ? 'pointer' : 'crosshair' }}>
      {shape}
      {selected === object.id && object.points.map(([px, py], index) => <circle key={index} cx={px} cy={py} r={4 / scale} fill="white" stroke="#006298" strokeWidth={2 / scale} />)}
    </g>;
  };
  return <section className="graph-pad-container" aria-label="Graphing pad">
    <p>{label}</p>
    <div className="graph-pad">
      <div className="graph-pad-drawing">
        <div className="graph-pad-toolbar" role="toolbar" aria-label="Graph drawing tools">
          <div className="graph-pad-desktop-tools">{tools.map(toolbarButton)}</div>
          <details ref={pickerRef} className="graph-pad-tool-picker"><summary aria-label="Choose drawing tool"><img src={asset(tools.includes(tool) ? tool === 'select' ? 'select-active' : tool : 'select')} width="40" height="40" alt="" /></summary><div>{tools.map(toolbarButton)}</div></details>
          <span className="graph-pad-divider" />
          <div className="graph-pad-extra-tools">{toolbarButton('paint')}{toolbarButton('no-solution')}</div>
          <div className="graph-pad-end-tools">{toolbarButton('clear')}<span className="graph-pad-divider" />{toolbarButton('help')}</div>
        </div>
        <div ref={canvasRef} className="graph-pad-canvas" onClick={place}>
          <img className="graph-pad-grid" src="/graphing-pad/grid.png" alt="" />
          <svg viewBox={`${-halfX} ${-halfY} ${halfX * 2} ${halfY * 2}`} role="img" aria-label={`Coordinate graph with ${data.objects.length} objects${data.noSolution ? ', no solution selected' : ''}`}>
            <g transform="scale(1,-1)">{data.objects.map(draw)}{pending && <circle cx={pending[0]} cy={pending[1]} r={4 / scale} fill="#006298" />}</g>
          </svg>
          {data.noSolution && <span className="graph-pad-no-solution">No solution</span>}
        </div>
      </div>
      <aside className="graph-pad-objects" aria-label="Graph objects">
        <header><strong>Objects</strong><span>{data.objects.length ? `${data.objects.length} object${data.objects.length === 1 ? '' : 's'}` : 'No objects'}</span></header>
        {!data.objects.length && <p>After you add an object to the graph you can use this panel to view and edit its properties.</p>}
        <div className="graph-pad-object-list">{data.objects.map((object, index) => <details className="graph-pad-object" key={object.id} open={selected === object.id} onToggle={event => { if (event.currentTarget.open) setSelected(object.id); }}>
          <summary><img className="graph-pad-expanded" src={asset('expanded')} width="20" height="20" alt="" /><img className="graph-pad-collapsed" src={asset('collapsed')} width="20" height="20" alt="" />{toolLabel[object.type]} <span>{index + 1}</span></summary>
          <button type="button" className="graph-pad-remove" aria-label={`Delete ${toolLabel[object.type]} ${index + 1}`} onClick={() => remove(object.id)}><img src={asset('delete')} width="20" height="20" alt="" /></button>
          <div className="graph-pad-properties">{object.points.map((point, pointIndex) => <div key={pointIndex} className="graph-pad-coordinate"><span>{object.type === 'circle' ? pointIndex === 0 ? 'Center' : 'Point on circle' : `Point ${pointIndex + 1}`}</span><div><span>(</span>{point.map((coordinate, axis) => <React.Fragment key={axis}><Input type="number" step={0.5} labelText={`${toolLabel[object.type]} ${index + 1}, ${object.type === 'circle' && pointIndex === 0 ? 'center' : `point ${pointIndex + 1}`}, ${axis ? 'y' : 'x'}`} isLabelVisuallyHidden value={coordinate} containerStyle={{ minWidth: 0, width: '100%', margin: 0 }} inputWrapperStyle={{ margin: 0 }} inputStyle={{ height: 40, minWidth: 0, fontFamily: 'Verdana, sans-serif', padding: '4px 8px' }} onChange={event => { const number = event.target.valueAsNumber; if (!Number.isFinite(number)) return; update(object.id, { points: object.points.map((p, i) => i === pointIndex ? p.map((v, a) => a === axis ? number : v) : p) }); }} />{axis === 0 && <span>,</span>}</React.Fragment>)}<span>)</span></div></div>)}
            {object.type === 'circle' && <p>Radius: {Number(circleRadius(object.points).toFixed(3))}</p>}
            <span className="graph-pad-style-label">Style</span><div className="graph-pad-styles">{['solid', 'dashed'].map(style => <button key={style} type="button" aria-pressed={object.dashed === (style === 'dashed')} onClick={() => update(object.id, { dashed: style === 'dashed' })}><img src={asset(style)} width="16" height="16" alt="" />{style}</button>)}</div>
          </div>
        </details>)}</div>
        {tool !== 'select' && tool !== 'paint' && <Button size={ButtonSize.small} variant={ButtonVariant.outline} onClick={() => addObject()}>Add {toolLabel[tool]}</Button>}
      </aside>
    </div>
    <p className="graph-pad-status" role="status">{message}</p>
    <Modal isOpen={helpOpen} header="Graphing pad help" headerLevel={2} size={ModalSize.medium} onClose={() => setHelpOpen(false)}><p>Select a tool, then click the graph. Circle: click its center and a point on its edge. Line: click two points. Parabola: click its vertex and a second point. Point: click once.</p><p>For keyboard entry, select a tool and use its Add button in the Objects panel, then edit its coordinates. Use Select to edit an existing object, or Shade to toggle its fill. Clear all removes the drawing. Responses are saved locally while navigating this activity.</p><Button onClick={() => setHelpOpen(false)}>Close help</Button></Modal>
  </section>;
}
