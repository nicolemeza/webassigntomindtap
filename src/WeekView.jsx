import React, { useEffect, useState } from 'react';
import ActivityRow from './ActivityRows';
import { allCourseActivities } from './LearningPathFlows';
import { matchesActivity, useCourseState } from './courseModel';
import { useLearningPathDisplay } from './LearningPathContext';

export default function WeekView({ chapters, notify, expandCommand }) {
  useCourseState();
  const { filters, showHidden } = useLearningPathDisplay();
  const rows = allCourseActivities(chapters).filter((a) => (!a.hidden || showHidden) && matchesActivity(a, filters));
  const groups = new Map();
  const weekKey = (date) => { if (!date) return 'Unscheduled'; const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  for (let index = 0; index < 8; index++) { const date = new Date('2026-11-02T12:00:00Z'); date.setUTCDate(date.getUTCDate() + index * 7); groups.set(date.toISOString().slice(0, 10), []); }
  rows.forEach((a) => { const key = weekKey(a.dueDate); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(a); });
  const [expanded, setExpanded] = useState(new Set(['2026-11-02']));
  useEffect(() => { if (expandCommand) setExpanded(expandCommand.expand ? new Set(groups.keys()) : new Set()); }, [expandCommand]);
  const label = (key) => { if (key === 'Unscheduled') return key; const end = new Date(`${key}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 6); const fmt = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date); return `${fmt(new Date(`${key}T12:00:00Z`))} – ${fmt(end)}`; };
  return <div className="week-list">{[...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, activities]) => <section key={key}><button className="week-heading" aria-expanded={expanded.has(key)} onClick={() => setExpanded((old) => { const next = new Set(old); next.has(key) ? next.delete(key) : next.add(key); return next; })}><span>{expanded.has(key) ? '⌃' : '⌄'}</span><strong>{key === 'Unscheduled' ? 'UNSCHEDULED' : `WEEK ${Math.floor((new Date(`${key}T12:00:00Z`) - new Date('2026-11-02T12:00:00Z')) / 604800000) + 1}`}</strong><span>{label(key)}</span>{key === '2026-11-02' && <span className="insight-change">CURRENT WEEK</span>}<small>{activities.length} {activities.length === 1 ? 'activity' : 'activities'}</small></button>{expanded.has(key) && <div className="week-content">{activities.length ? activities.map((activity) => <ActivityRow key={activity.stableKey} activity={activity} chapter={activity.chapter} section={activity.section} notify={notify} />) : <p className="course-empty">No Activities Added Yet.</p>}</div>}</section>)}</div>;
}
