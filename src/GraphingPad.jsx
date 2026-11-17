import React, { useEffect, useRef, useState } from 'react';
import { Button, ButtonSize, ButtonVariant, Input, Modal, ModalSize } from 'react-magma-dom';
import { VpnKeyIcon } from 'react-magma-icons';
import { GRAPH_RANGE, circleRadius, graphCoordinates, graphScale, readGraph, translateGraphObject, validGraphPoints } from './graphingGeometry';
import './graphing-pad.css';

const toolLabel = { select: 'Select', line: 'Line', ray: 'Ray', segment: 'Segment', circle: 'Circle', parabola: 'Vertical parabola', 'horizontal-parabola': 'Horizontal parabola', point: 'Point', paint: 'Shade', 'no-solution': 'No solution', clear: 'Clear all', help: 'Help' };
const lineTools = ['line', 'ray', 'segment'], parabolaTools = ['parabola', 'horizontal-parabola'];
const drawingTools = [...lineTools, 'circle', ...parabolaTools, 'point'];
const asset = name => '/graphing-pad/' + name + '.svg';
const seedPoints = type => type === 'point' ? [[0, 0]] : type === 'circle' ? [[0, 0], [3, 0]] : [[0, 0], [1, 1]];
const ticks = Array.from({ length: 21 }, (_, index) => index - 10);
const gridLines = Array.from({ length: 43 }, (_, index) => (index - 21) / 2);
function ToolIcon({ name }) {
  const icon = ['ray', 'segment'].includes(name) ? 'line' : name === 'horizontal-parabola' ? 'parabola' : name;
  return <img src={asset(icon)} className={name === 'horizontal-parabola' ? 'graph-pad-horizontal-icon' : undefined} width="40" height="40" alt="" />;
}
function CoordinateInput({ value, label, disabled, answerKey = false, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <div className={`graph-pad-coordinate-input${answerKey ? ' graph-pad-answer-key-input' : ''}`}>
    <Input type="number" step={0.5} disabled={disabled} labelText={label} isLabelVisuallyHidden value={draft} containerStyle={{ minWidth: 0, width: '100%', margin: 0 }} inputWrapperStyle={{ margin: 0 }} inputStyle={{ height: 40, minWidth: 0, fontFamily: 'Verdana, sans-serif', padding: answerKey ? '4px 40px 4px 8px' : '4px 8px' }} onChange={event => setDraft(event.target.value)} onBlur={() => {
    const number = Number(draft);
    if (!draft.trim() || !Number.isFinite(number) || onCommit(number) === false) setDraft(String(value));
  }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} />
    {answerKey && <span className="graph-pad-answer-key-icon" role="img" aria-label="Answer key"><VpnKeyIcon aria-hidden="true" /></span>}
  </div>;
}
export default function GraphingPad({ value, onChange, label = 'Graph the circle.', disabled = false, answerKey = false }) {
  const data = readGraph(value);
  const [tool, setTool] = useState('select'), [selected, setSelected] = useState(null);
  const [collapsedObjectIds, setCollapsedObjectIds] = useState(() => new Set());
  const [pending, setPending] = useState(null), [hover, setHover] = useState(null), [dragPreview, setDragPreview] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false), [size, setSize] = useState(500);
  const [message, setMessage] = useState('Choose a drawing tool. Circle: place its center, then a point on its edge.');
  const canvasRef = useRef(null), toolbarRef = useRef(null), gestureRef = useRef(null), dragRef = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize(Math.min(entry.contentRect.width, entry.contentRect.height)));
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);
  const scale = graphScale(size, size);
  const save = next => { if (!disabled) onChange(JSON.stringify(next)); };
  const update = (id, changes) => save({ ...data, objects: data.objects.map(object => object.id === id ? { ...object, ...changes } : object) });
  const remove = id => { save({ ...data, objects: data.objects.filter(object => object.id !== id) }); if (selected === id) setSelected(null); setMessage('Object deleted.'); };
  const addObject = (points, type = tool) => {
    if (!validGraphPoints(type, points)) { setMessage(type === 'horizontal-parabola' ? 'The second point must have a different y-coordinate.' : type === 'parabola' ? 'The second point must have a different x-coordinate.' : 'Place the second point at a different position.'); return; }
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    save({ noSolution: false, objects: [...data.objects, { id, type, points, dashed: false, shaded: false }] });
    setSelected(id); setPending(null); setHover(null); setTool('select');
    setMessage(toolLabel[type] + ' added. Drag its points or edit the coordinates in Objects.');
  };
  const selectTool = next => {
    setTool(next); setPending(null); setHover(null);
    toolbarRef.current?.querySelectorAll('details[open]').forEach(menu => { menu.open = false; });
    setMessage(next === 'select' ? 'Select an object. Drag its points to reshape it, or drag the object to move it.' : next === 'paint' ? 'Select an object to toggle its shading.' : next === 'point' ? 'Click the graph to place a point.' : 'Place ' + (next === 'circle' ? 'the center, then a point on the circle' : parabolaTools.includes(next) ? 'the vertex, then a second point' : 'two points') + '. You can also click and drag.');
  };
  const pointAt = event => graphCoordinates(event.clientX, event.clientY, canvasRef.current.getBoundingClientRect());
  const capturePointer = event => canvasRef.current.setPointerCapture(event.pointerId);
  const beginDraw = event => {
    if (disabled || event.button !== 0) return;
    if (tool === 'select') { setSelected(null); return; }
    if (tool === 'paint') {
      const point = pointAt(event);
      const object = [...data.objects].reverse().find(object => object.type === 'circle' && Math.hypot(point[0] - object.points[0][0], point[1] - object.points[0][1]) < circleRadius(object.points));
      if (object) { update(object.id, { shaded: !object.shaded }); setSelected(object.id); }
      return;
    }
    event.preventDefault();
    const point = pointAt(event);
    gestureRef.current = { origin: pending || point, hadPending: Boolean(pending), client: [event.clientX, event.clientY], tool };
    if (!pending && tool !== 'point') setPending(point);
    setHover(point); capturePointer(event);
  };
  const beginEdit = (event, object, pointIndex = null) => {
    if (disabled || !['select', 'paint'].includes(tool) || event.button !== 0) return;
    event.stopPropagation(); event.preventDefault(); setSelected(object.id);
    if (tool === 'paint') { update(object.id, { shaded: !object.shaded }); return; }
    dragRef.current = { object, pointIndex, origin: pointAt(event), preview: object };
    capturePointer(event);
  };
  const move = event => {
    if (disabled) return;
    const point = pointAt(event), drag = dragRef.current;
    if (drag) {
      const next = drag.pointIndex === null ? translateGraphObject(drag.object, point.map((coordinate, axis) => coordinate - drag.origin[axis])) : { ...drag.object, points: drag.object.points.map((old, index) => index === drag.pointIndex ? point : old) };
      if (validGraphPoints(next.type, next.points)) { drag.preview = next; setDragPreview(next); }
    } else if (pending || gestureRef.current) setHover(point);
  };
  const end = event => {
    const drag = dragRef.current, gesture = gestureRef.current;
    if (drag) {
      update(drag.object.id, { points: drag.preview.points }); setDragPreview(null); dragRef.current = null; setMessage('Coordinates updated.');
    } else if (gesture) {
      const point = pointAt(event), moved = Math.hypot(event.clientX - gesture.client[0], event.clientY - gesture.client[1]) > 4;
      if (gesture.tool === 'point') addObject([point], 'point');
      else if (gesture.hadPending || moved) addObject([gesture.origin, point], gesture.tool);
      else setMessage('First point placed. Move the pointer to preview, then click the second point.');
      gestureRef.current = null;
    }
    if (canvasRef.current.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId);
  };
  const cancelGesture = () => { gestureRef.current = null; dragRef.current = null; setDragPreview(null); setPending(null); setHover(null); };
  const toolButton = (name, showText = false) => <button key={name} type="button" className={'graph-pad-tool' + (name === 'select' ? ' graph-pad-tool-select' : '')} disabled={disabled && name !== 'help'} aria-label={toolLabel[name]} title={toolLabel[name]} aria-pressed={drawingTools.includes(name) || ['select', 'paint'].includes(name) ? tool === name : name === 'no-solution' ? data.noSolution : undefined} onClick={() => {
    if (name === 'help') setHelpOpen(true);
    else if (name === 'clear') { save({ objects: [], noSolution: false }); setSelected(null); cancelGesture(); setTool('select'); setMessage('Graph cleared.'); }
    else if (name === 'no-solution') { save({ objects: [], noSolution: !data.noSolution }); setSelected(null); cancelGesture(); setTool('select'); setMessage(data.noSolution ? 'No solution cleared.' : 'No solution selected.'); }
    else selectTool(name);
  }}><ToolIcon name={name === 'select' && tool === 'select' ? 'select-active' : name} />{showText && <span>{toolLabel[name]}</span>}</button>;
  const toolMenu = (name, options) => <details className="graph-pad-tool-menu"><summary aria-label={name + ' tools'} aria-disabled={disabled}><ToolIcon name={options.includes(tool) ? tool : options[0]} /><span aria-hidden="true">▾</span></summary><div role="group" aria-label={name + ' tools'}>{options.map(name => toolButton(name, true))}</div></details>;
  const shape = (object, extra = {}) => {
    const [[x, y], [x2, y2] = [x, y]] = object.points;
    const common = { stroke: '#006298', strokeWidth: 2 / scale, strokeDasharray: object.dashed ? (6 / scale) + ' ' + (4 / scale) : undefined, fill: object.shaded ? '#cce0ea80' : 'none', ...extra };
    if (object.type === 'point') return <circle cx={x} cy={y} r={4 / scale} {...common} fill={extra.fill || '#006298'} />;
    if (object.type === 'circle') return <circle cx={x} cy={y} r={circleRadius(object.points)} {...common} />;
    if (lineTools.includes(object.type)) {
      const dx = x2 - x, dy = y2 - y, length = Math.hypot(dx, dy) || 1, span = GRAPH_RANGE * 4;
      return <line x1={object.type === 'line' ? x - dx / length * span : x} y1={object.type === 'line' ? y - dy / length * span : y} x2={object.type === 'segment' ? x2 : x + dx / length * span} y2={object.type === 'segment' ? y2 : y + dy / length * span} {...common} />;
    }
    const horizontal = object.type === 'horizontal-parabola';
    const coefficient = horizontal ? (x2 - x) / (y2 - y) ** 2 : (y2 - y) / (x2 - x) ** 2;
    const path = Array.from({ length: 241 }, (_, index) => { const position = -GRAPH_RANGE + index * GRAPH_RANGE / 120; return (index ? 'L' : 'M') + (horizontal ? coefficient * (position - y) ** 2 + x : position) + ',' + (horizontal ? position : coefficient * (position - x) ** 2 + y); }).join(' ');
    return <path d={path} {...common} />;
  };
  const draw = (stored, index) => {
    const object = dragPreview?.id === stored.id ? dragPreview : stored;
    return <g key={object.id} onPointerDown={event => beginEdit(event, object)} className="graph-pad-shape" style={{ pointerEvents: ['select', 'paint'].includes(tool) ? 'all' : 'none', cursor: disabled ? 'default' : 'grab' }}>
      {shape(object, { stroke: 'transparent', strokeWidth: 12 / scale, fill: object.type === 'point' ? 'transparent' : 'none' })}
      {shape(object)}
      {selected === object.id && object.points.map(([x, y], pointIndex) => <g key={pointIndex} onPointerDown={event => beginEdit(event, object, pointIndex)} style={{ cursor: 'move' }}>
        <circle cx={x} cy={y} r={9 / scale} fill="transparent" />
        <circle cx={x} cy={y} r={5 / scale} fill="white" stroke="#006298" strokeWidth={2 / scale} role="button" tabIndex={disabled ? -1 : 0} aria-label={'Move ' + toolLabel[object.type] + ' ' + (index + 1) + ' ' + (object.type === 'circle' && pointIndex === 0 ? 'center' : 'point ' + (pointIndex + 1))} onKeyDown={event => {
          if (disabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          const point = [x + (event.key === 'ArrowRight' ? 0.5 : event.key === 'ArrowLeft' ? -0.5 : 0), y + (event.key === 'ArrowUp' ? 0.5 : event.key === 'ArrowDown' ? -0.5 : 0)];
          const points = object.points.map((old, index) => index === pointIndex ? point : old);
          if (validGraphPoints(object.type, points)) update(object.id, { points });
        }} />
      </g>)}
    </g>;
  };
  const preview = pending && hover && validGraphPoints(tool, [pending, hover]) ? { type: tool, points: [pending, hover] } : null;
  return <section className={`graph-pad-container${answerKey ? ' graph-pad-container--answer-key' : ''}`} aria-label="Graphing pad">
    {!answerKey && <p>{label}</p>}
    <div className="graph-pad">
      <div className="graph-pad-drawing">
        <div ref={toolbarRef} className="graph-pad-toolbar" role="toolbar" aria-label="Graph drawing tools">
          {toolButton('select')}{toolMenu('Line', lineTools)}{toolButton('circle')}{toolMenu('Parabola', parabolaTools)}{toolButton('point')}
          <span className="graph-pad-divider" />{toolButton('paint')}{toolButton('no-solution')}
          <div className="graph-pad-end-tools">{toolButton('clear')}{toolButton('help')}</div>
        </div>
        <div ref={canvasRef} className="graph-pad-canvas" tabIndex={0} aria-label="Coordinate graph drawing area" aria-disabled={disabled} onPointerDown={beginDraw} onPointerMove={move} onPointerUp={end} onPointerCancel={cancelGesture} onKeyDown={event => {
          if (event.target.tagName.toLowerCase() === 'input') return;
          if (event.key === 'Escape') { cancelGesture(); selectTool('select'); }
          if (!disabled && ['Delete', 'Backspace'].includes(event.key) && selected) { event.preventDefault(); remove(selected); }
        }}>
          <svg viewBox={[-GRAPH_RANGE, -GRAPH_RANGE, GRAPH_RANGE * 2, GRAPH_RANGE * 2].join(' ')} role="img" aria-label={'Coordinate graph with ' + data.objects.length + (data.objects.length === 1 ? ' object' : ' objects') + (data.noSolution ? ', no solution selected' : '')}>
            <g aria-hidden="true" pointerEvents="none">
              {gridLines.map(position => <g key={position} stroke={Number.isInteger(position) ? '#b9cbd4' : '#e5ebef'} strokeWidth={1 / scale}><line x1={position} x2={position} y1={-GRAPH_RANGE} y2={GRAPH_RANGE} /><line x1={-GRAPH_RANGE} x2={GRAPH_RANGE} y1={position} y2={position} /></g>)}
              <path d={'M' + (-GRAPH_RANGE) + ',0H' + GRAPH_RANGE + ' M0,' + (-GRAPH_RANGE) + 'V' + GRAPH_RANGE} stroke="#526371" strokeWidth={1.5 / scale} />
              {ticks.filter(tick => tick !== 0).map(tick => <g key={tick} fill="#384851" fontSize="0.56" fontFamily="Arial,sans-serif"><text x={tick} y="0.8" textAnchor="middle">{tick}</text><text x="-0.35" y={-tick + 0.18} textAnchor="end">{tick}</text></g>)}
              <text x="-0.35" y="0.8" textAnchor="end" fontSize="0.56" fill="#384851">0</text>
            </g>
            <g transform="scale(1,-1)">{data.objects.map(draw)}{preview && <g pointerEvents="none">{shape(preview, { strokeDasharray: (4 / scale) + ' ' + (3 / scale), opacity: 0.65 })}</g>}{pending && <circle cx={pending[0]} cy={pending[1]} r={4 / scale} fill="#006298" pointerEvents="none" />}</g>
          </svg>
          {data.noSolution && <span className="graph-pad-no-solution">No solution</span>}
        </div>
      </div>
      <aside className="graph-pad-objects" aria-label="Graph objects">
        <header><strong>Objects</strong><span>{data.objects.length ? data.objects.length + ' object' + (data.objects.length === 1 ? '' : 's') : 'No objects'}</span></header>
        {!data.objects.length && <p>After you add an object to the graph you can use this panel to view and edit its properties.</p>}
        <div className="graph-pad-object-list">{data.objects.map((stored, index) => { const object = dragPreview?.id === stored.id ? dragPreview : stored; return <details className="graph-pad-object" key={object.id} open={!collapsedObjectIds.has(object.id)} onToggle={event => {
          const isOpen = event.currentTarget.open;
          setCollapsedObjectIds(current => {
            const next = new Set(current);
            if (isOpen) next.delete(object.id);
            else next.add(object.id);
            return next;
          });
          if (isOpen) setSelected(object.id);
        }}>
          <summary><img className="graph-pad-expanded" src={asset('expanded')} width="20" height="20" alt="" /><img className="graph-pad-collapsed" src={asset('collapsed')} width="20" height="20" alt="" />{toolLabel[object.type]} <span>{index + 1}</span></summary>
          <button type="button" className="graph-pad-remove" disabled={disabled} aria-label={'Delete ' + toolLabel[object.type] + ' ' + (index + 1)} onClick={() => remove(object.id)}><img src={asset('delete')} width="20" height="20" alt="" /></button>
          <div className="graph-pad-properties">{object.points.map((point, pointIndex) => <div key={pointIndex} className="graph-pad-coordinate"><span>{object.type === 'circle' ? pointIndex === 0 ? 'Center' : 'Point on circle' : 'Point ' + (pointIndex + 1)}</span><div><span>(</span>{point.map((coordinate, axis) => <React.Fragment key={axis}><CoordinateInput disabled={disabled} answerKey={answerKey} label={toolLabel[object.type] + ' ' + (index + 1) + ', ' + (object.type === 'circle' && pointIndex === 0 ? 'center' : 'point ' + (pointIndex + 1)) + ', ' + (axis ? 'y' : 'x')} value={coordinate} onCommit={number => {
            const points = object.points.map((old, index) => index === pointIndex ? old.map((value, dimension) => dimension === axis ? number : value) : old);
            if (!validGraphPoints(object.type, points)) return false;
            update(object.id, { points }); return true;
          }} />{axis === 0 && <span>,</span>}</React.Fragment>)}<span>)</span></div></div>)}
            {object.type === 'circle' && <p>Radius: {Number(circleRadius(object.points).toFixed(3))}</p>}
            <span className="graph-pad-style-label">Style</span><div className="graph-pad-styles">{['solid', 'dashed'].map(style => <button key={style} type="button" disabled={disabled} aria-pressed={object.dashed === (style === 'dashed')} onClick={() => update(object.id, { dashed: style === 'dashed' })}><img src={asset(style)} width="16" height="16" alt="" />{style}</button>)}</div>
          </div>
        </details>; })}</div>
        {drawingTools.includes(tool) && <Button disabled={disabled} size={ButtonSize.small} variant={ButtonVariant.outline} onClick={() => addObject(seedPoints(tool))}>Add {toolLabel[tool]}</Button>}
      </aside>
    </div>
    <p className="graph-pad-status" role="status">{message}</p>
    <Modal isOpen={helpOpen} header="Graphing pad help" headerLevel={2} size={ModalSize.medium} onClose={() => setHelpOpen(false)}><p>Choose a tool, then click the graph. Circle: place the center, then a point on the edge. Line, ray, or segment: place two points. Parabola: place the vertex and a second point. Point: click once. You can also draw a two-point object by clicking and dragging.</p><p>After drawing, Select becomes active. Drag a defining point to reshape the object, or drag the object to move it. Edit exact coordinates in Objects. Select a defining point and use the arrow keys to move it by half a unit. Delete removes the selected object; Escape cancels an unfinished drawing.</p><p>For keyboard entry, choose a tool and use its Add button, then edit its coordinates. Shade toggles an object's fill. Clear all removes the drawing.</p><Button onClick={() => setHelpOpen(false)}>Close help</Button></Modal>
  </section>;
}
