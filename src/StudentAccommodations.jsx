import React, { forwardRef, useId, useImperativeHandle, useState } from 'react';
import { Button, ButtonVariant, Checkbox, IconButton, Input } from 'react-magma-dom';
import { accommodationStudents, applyAccommodations, emptyAccommodationEditor, hasAccommodationEdits } from './accommodationData';
import './student-accommodations.css';
import { formatActivityDue } from './activityDates';

function AccommodationIcon({ name, size = 20 }) {
  return <img src={`/rebrand/accommodation-${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}

function StudentCheck({ label, checked, onChange, remove = false }) {
  return <span className={`accommodation-check ${remove ? 'is-remove' : ''}`}><Checkbox labelText={remove ? 'Remove Accommodation' : label} ariaLabel={label} checked={checked} onChange={onChange} isTextVisuallyHidden={!remove} color="#0b1f3a" /></span>;
}

function NumberField({ field, label, value, disabled, onChange }) {
  return <div className="accommodation-number"><Input type="number" labelText={label} placeholder="Number" min={0} step={1} disabled={disabled} value={value} onChange={(event) => onChange(field, event.target.value)} /><div className="accommodation-stepper">{[1, -1].map((delta) => <button type="button" key={delta} disabled={disabled} aria-label={`${delta > 0 ? 'Increase' : 'Decrease'} ${label.toLowerCase()}`} onClick={() => onChange(field, String(Math.max(0, Number(value || 0) + delta)))}><img src={`/rebrand/settings-step-${delta > 0 ? 'up' : 'down'}.svg`} width="16" height="16" alt="" aria-hidden="true" /></button>)}</div></div>;
}

function dateLabel(date) {
  return date ? new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)) : 'Not set';
}
function durationLabel(duration) {
  return duration ? `${duration.days}d ${duration.hours}h` : '';
}

const StudentAccommodations = forwardRef(function StudentAccommodations({ activity, value, onChange, hidden, panelId, tabId }, ref) {
  const id = useId();
  const [selected, setSelected] = useState(new Set());
  const [editor, setEditor] = useState({ ...emptyAccommodationEditor });
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const filtered = accommodationStudents.filter((student) => filter === 'selected' ? selected.has(student.id) : filter === 'accommodated' ? Boolean(value[student.id]) : filter === 'unaccommodated' ? !value[student.id] : true);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
  const start = currentPage * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const allSelected = visible.length > 0 && visible.every((student) => selected.has(student.id));
  const range = `${filtered.length ? start + 1 : 0}-${start + visible.length} of ${filtered.length}`;
  const update = (field, next) => { setError(''); setMessage(''); setEditor((previous) => ({ ...previous, [field]: next })); };
  const toggle = (studentId) => setSelected((previous) => { const next = new Set(previous); next.has(studentId) ? next.delete(studentId) : next.add(studentId); return next; });
  useImperativeHandle(ref, () => ({ commit: () => applyAccommodations(value, [...selected], editor) }), [value, selected, editor]);
  function apply() {
    const result = applyAccommodations(value, [...selected], editor);
    if (result.error) { setError(result.error); return; }
    onChange(result.value);
    setMessage(`Accommodations set for ${selected.size} ${selected.size === 1 ? 'student' : 'students'}. Confirm to save, or select students to add more.`);
    setEditor({ ...emptyAccommodationEditor });
    setSelected(new Set());
  }
  const remove = (field, label) => <StudentCheck remove label={label} checked={editor[field]} onChange={(event) => update(field, event.target.checked)} />;
  return <div className="student-accommodations" role="tabpanel" id={panelId} aria-labelledby={tabId} hidden={hidden}>
    <div className="accommodation-roster">
      <div className="accommodation-filter"><label htmlFor={`${id}-filter`}>Filter by Group</label><select id={`${id}-filter`} value={filter} onChange={(event) => { setFilter(event.target.value); setPage(0); }}><option value="all">Selected (0)</option><option value="selected">Selected students ({selected.size})</option><option value="accommodated">With accommodations</option><option value="unaccommodated">Without accommodations</option></select><span>{range}</span></div>
      <div className="accommodation-table-frame"><div className="accommodation-table-scroll"><table aria-label="Student accommodations (sample roster)"><colgroup><col className="student-select-column" /><col className="student-name-column" /><col /><col /><col /><col /></colgroup><thead><tr><th><StudentCheck label="Select all students on this page" checked={allSelected} onChange={() => setSelected((previous) => { const next = new Set(previous); visible.forEach((student) => allSelected ? next.delete(student.id) : next.add(student.id)); return next; })} /></th>{['Name', 'Release Early', 'Extend Due', 'Attempts', 'Extend Time'].map((title) => <th key={title} scope="col">{title}</th>)}</tr></thead><tbody>{visible.map((student) => {
        const accommodation = value[student.id] || {};
        return <tr key={student.id} className={selected.has(student.id) ? 'is-selected' : ''}><td><StudentCheck label={`Select ${student.name} (student ${student.id.replace('sample-student-', '')})`} checked={selected.has(student.id)} onChange={() => toggle(student.id)} /></td><th scope="row">{student.name}</th><td>{durationLabel(accommodation.releaseEarly)}</td><td>{durationLabel(accommodation.extendDue)}</td><td>{accommodation.attempts}</td><td>{accommodation.timeLimit}</td></tr>;
      })}{!visible.length && <tr><td colSpan={6} className="accommodation-empty">No students match this filter.</td></tr>}</tbody></table></div>
      <div className="accommodation-pagination"><label htmlFor={`${id}-rows`}>Rows per page<select id={`${id}-rows`} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}>{[10, 14, 25].map((number) => <option key={number}>{number}</option>)}</select></label><span aria-live="polite">{range}</span><div><IconButton type="button" className="accommodation-page-button" variant={ButtonVariant.link} disabled={currentPage === 0} aria-label="Previous student page" icon={<AccommodationIcon name="previous" />} onClick={() => setPage(currentPage - 1)} /><IconButton type="button" className="accommodation-page-button" variant={ButtonVariant.link} disabled={start + visible.length >= filtered.length} aria-label="Next student page" icon={<AccommodationIcon name="next" />} onClick={() => setPage(currentPage + 1)} /></div></div></div>
    </div>
    <div className="accommodation-editor" aria-label="Set accommodations for selected students">
      <section><h3>Date Available</h3><p>Assignment Available: <strong>{dateLabel(activity.availableDate)}</strong></p><div className="accommodation-number-pair"><NumberField field="earlyDays" label="Days to release early" value={editor.earlyDays} disabled={editor.removeEarly} onChange={update} /><NumberField field="earlyHours" label="Hours to release early" value={editor.earlyHours} disabled={editor.removeEarly} onChange={update} /></div><small>Calendar days</small>{remove('removeEarly', 'Remove Accommodation for date available')}</section>
      <section><h3>Date Due</h3><p>Assignment Due: <strong>{formatActivityDue(activity, 'numeric')}</strong></p><div className="accommodation-number-pair"><NumberField field="dueDays" label="Days to extend due" value={editor.dueDays} disabled={editor.removeDue} onChange={update} /><NumberField field="dueHours" label="Hours to extend due" value={editor.dueHours} disabled={editor.removeDue} onChange={update} /></div><small>Calendar days</small>{remove('removeDue', 'Remove Accommodation for date due')}</section>
      <section><h3>Attempts</h3><p>Assignment Attempts: <strong>{activity.settings.attempts}</strong></p><label htmlFor={`${id}-attempts`}>Number of attempts accommodation</label><select id={`${id}-attempts`} disabled={editor.removeAttempts} value={editor.attempts} onChange={(event) => update('attempts', event.target.value)}><option value="">Select option</option>{['1', '2', '3', '4', '5', '10', 'Unlimited'].map((option) => <option key={option}>{option}</option>)}</select>{remove('removeAttempts', 'Remove Accommodation for attempts')}</section>
      <section><h3>Time Limit</h3><p>Assignment Time Limit: <strong>{activity.settings.timeLimit || 'No time limit'}</strong></p><label htmlFor={`${id}-time`}>Time limit accommodation</label><select id={`${id}-time`} disabled={editor.removeTime} value={editor.timeLimit} onChange={(event) => update('timeLimit', event.target.value)}><option value="">Select option</option><option value="1.5×">1.5× assignment time</option><option value="2×">2× assignment time</option><option value="Unlimited">No time limit</option></select>{remove('removeTime', 'Remove Accommodation for time limit')}</section>
      <Button type="button" className="rebrand-button accommodation-apply" variant={ButtonVariant.link} disabled={!selected.size || !hasAccommodationEdits(editor)} onClick={apply}><AccommodationIcon name="apply" size={24} />Set and add more accommodations</Button>
      {error && <p className="settings-error" role="alert">{error}</p>}{message && <p className="accommodation-message" role="status">{message}</p>}
    </div>
  </div>;
});

export default StudentAccommodations;
