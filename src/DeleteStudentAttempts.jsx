import React, { useState } from 'react';
import { Check, CourseDialog, Field } from './CourseUI';
import { deleteStudentAttempts, useCourseState } from './courseModel';
import { hasStudentAttempts } from './activityManagement';

export default function DeleteStudentAttempts({ activity, onClose, notify }) {
  const state = useCourseState();
  const session = state.sessions?.[activity.stableKey];
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Submitted Date (New-Old)');
  const [selected, setSelected] = useState([]);
  const attempts = [...(activity.studentAttempts || []), ...(hasStudentAttempts({}, session) ? [{ id: 'preview', name: 'Instructor Student Preview', startedAt: session.startedAt, submittedAt: session.completedAt, score: 'Saved preview responses', attempt: 1 }] : [])];
  const visible = attempts.filter((attempt) => attempt.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'Student Name (A-Z)' ? a.name.localeCompare(b.name) : (a.submittedAt || '').localeCompare(b.submittedAt || '') * (sort === 'Submitted Date (New-Old)' ? -1 : 1));
  const date = (value) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/New_York' }).format(new Date(value)) : 'Not submitted';
  return <CourseDialog title={`Delete Student Attempts from ${activity.title}`} onClose={onClose} saveLabel={`Delete ${selected.length} ${selected.length === 1 ? 'Attempt' : 'Attempts'}`} disabled={!selected.length} onSave={() => { deleteStudentAttempts(activity, selected); onClose(); notify('Selected student attempts deleted'); }}>
    <Field label="Search by student name and surname"><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></Field>
    <Field label="Sort by"><select value={sort} onChange={(event) => setSort(event.target.value)}>{['Submitted Date (New-Old)', 'Submitted Date (Old-New)', 'Student Name (A-Z)'].map((name) => <option key={name}>{name}</option>)}</select></Field>
    <Check checked={visible.length > 0 && visible.every((attempt) => selected.includes(attempt.id))} onChange={(checked) => setSelected(checked ? [...new Set([...selected, ...visible.map((attempt) => attempt.id)])] : selected.filter((id) => !visible.some((attempt) => attempt.id === id)))}>Select all {visible.length} {visible.length === 1 ? 'Attempt' : 'Attempts'}</Check>
    {visible.map((attempt) => <article className="attempt-management-row" key={attempt.id}><Check checked={selected.includes(attempt.id)} onChange={(checked) => setSelected(checked ? [...selected, attempt.id] : selected.filter((id) => id !== attempt.id))}>{attempt.name}</Check><p><strong>Attempt:</strong> {attempt.attempt || 1} of {activity.settings?.attempts || 2} attempted</p><p><strong>Started on:</strong> {date(attempt.startedAt)}</p><p><strong>Submitted on:</strong> {date(attempt.submittedAt)}</p><p><strong>Score:</strong> {attempt.score}</p></article>)}
    {!visible.length && <p className="course-empty">No student attempts found.</p>}
  </CourseDialog>;
}
