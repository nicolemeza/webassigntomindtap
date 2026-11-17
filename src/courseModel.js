import { useSyncExternalStore } from 'react';
import { migrateDemoSchedule } from './demoCourseSchedule.js';
import { mergeDemoFolders, migrateDemoActivity } from './demoActivities.js';

export const courseChapters = [
  'Chapter R. A Review of Basic Algebra', 'Chapter 1. Equations and Inequalities',
  'Chapter 2. Functions and Graphs', 'Chapter 3. Functions',
  'Chapter 4. Polynomial and Rational Functions', 'Chapter 5. Exponential and Logarithmic Functions',
  'Chapter 6. Systems of Linear Equations, Matrices, and Inequalities',
  'Chapter 7. Conic Sections and Systems of Nonlinear Equations',
  'Chapter 8. Sequences, Series, Induction, and Probability', 'Appendix I. A Proof of the Binomial Theorem',
];
const key = 'mindtap-course-state-v2';
const defaults = {
  activities: {}, folders: {}, feedback: {}, notes: [],
  settings: { rollingWeek: true, defaultView: 'list', studentAssistant: true, collectIds: false, idLength: '', idInstructions: '', zeroAtEnd: false, permissions: { instructor: { activities: true, gradebook: true }, ta: { activities: false, gradebook: true } } },
  templates: {},
};
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Start with course defaults if storage is unavailable. */ }
let state = migrateDemoSchedule({ ...defaults, ...saved, activities: Object.fromEntries(Object.entries(saved?.activities || {}).map(([key, activity]) => [key, migrateDemoActivity(activity)])), folders: mergeDemoFolders(saved?.folders), settings: { ...defaults.settings, ...saved?.settings } });
const listeners = new Set();
export const getCourseState = () => state;
export function useCourseState() { return useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn); }, getCourseState); }
export function saveCourseState(patch) {
  const next = { ...state, ...patch };
  localStorage.setItem(key, JSON.stringify(next));
  state = next;
  listeners.forEach((fn) => fn());
}
export function saveCourseSettings(patch) { saveCourseState({ settings: { ...state.settings, ...patch } }); }
export const activityKey = (chapter, section, activity) => activity.stableKey || `${chapter}/${section}/${activity.id || activity.title}`;
export function readingSectionInfo(title) {
  const [, number, name] = title.match(/^(.+?\.\d+) HW (.+)$/) || [];
  return { number: number || 'Section', name: name || title, token: number || encodeURIComponent(title) };
}
export function updateCourseActivities(updates) {
  const next = { ...state.activities };
  updates.forEach(({ activity, patch }) => {
    const id = activity.stableKey || activityKey(activity.chapter, activity.section, activity);
    next[id] = { ...activity, ...next[id], ...patch, stableKey: id, originalTitle: activity.originalTitle || activity.title };
  });
  saveCourseState({ activities: next });
}
export function deleteStudentAttempts(activity, selectedIds) {
  const stableKey = activity.stableKey || activityKey(activity.chapter, activity.section, activity);
  const selected = new Set(selectedIds);
  const remaining = (activity.studentAttempts || []).filter((attempt) => !selected.has(attempt.id));
  const sessions = { ...state.sessions };
  if (selected.has('preview')) delete sessions[stableKey];
  const updated = { ...activity, studentAttempts: remaining, stableKey, originalTitle: activity.originalTitle || activity.title };
  if (!remaining.length && !sessions[stableKey]) { updated.submitted = '0%'; updated.averageScore = '--'; }
  saveCourseState({ activities: { ...state.activities, [stableKey]: updated }, sessions });
}
export function courseRows(chapter, section, rows) {
  const own = rows.map((row) => {
    const stableKey = activityKey(chapter, section, row);
    return { ...row, chapter, section, originalChapter: row.originalChapter || chapter, originalTitle: row.originalTitle || row.title, stableKey, ...state.activities[stableKey] };
  }).filter((row) => !row.removed && row.chapter === chapter && row.section === section);
  const moved = Object.values(state.activities).filter((row) => row.chapter === chapter && row.section === section && !row.removed && !own.some((item) => item.stableKey === row.stableKey));
  const all = [...own, ...moved];
  const ordered = [...all.filter((row) => row.placement === 'start'), ...all.filter((row) => !/^(before|after):/.test(row.placement || '') && row.placement !== 'start')];
  all.filter((row) => /^(before|after):/.test(row.placement || '')).forEach((row) => { const split = row.placement.indexOf(':'); const position = row.placement.slice(0, split); const target = row.placement.slice(split + 1); const index = ordered.findIndex((item) => item.stableKey === target); ordered.splice(index < 0 ? ordered.length : index + (position === 'after' ? 1 : 0), 0, row); });
  return ordered;
}
export function saveFolder(id, patch) { saveCourseState({ folders: { ...state.folders, [id]: { ...state.folders[id], ...patch } } }); }
export function folderVisibility(id) {
  let hidden = false; let removed = false; let current = id; const seen = new Set();
  while (current && !seen.has(current)) { seen.add(current); const folder = state.folders[current]; hidden ||= Boolean(folder?.hidden); removed ||= Boolean(folder?.removed); current = folder?.parent || (current.includes('/section/') ? current.split('/section/')[0] : undefined); }
  return { hidden, removed };
}
export function activityVisibility(activity) {
  const parent = folderVisibility(activity.chapter);
  const number = (activity.originalTitle || activity.title || '').match(/^(.+?\.\d+) HW /)?.[1];
  const section = number ? folderVisibility(`${activity.chapter}/section/${number}`) : {};
  return { hidden: Boolean(activity.hidden || parent.hidden || section.hidden), removed: Boolean(activity.removed || parent.removed || section.removed) };
}
export function openCourseFlow(flow) { window.dispatchEvent(new CustomEvent('mindtap-course-flow', { detail: flow })); }
export function matchesActivity(activity, filters = []) {
  const matches = {
    'Counts towards grade': activity.countsTowardsGrade !== false,
    Practice: activity.countsTowardsGrade === false,
    'Auto graded': activity.points !== undefined && !activity.manual,
    'Manually graded': Boolean(activity.manual), Scheduled: Boolean(activity.dueDate), 'Not Scheduled': !activity.dueDate,
  };
  const groups = [['Counts towards grade', 'Practice'], ['Auto graded', 'Manually graded'], ['Scheduled', 'Not Scheduled'], ['Communication', 'Critical Thinking', 'Professionalism', 'Career & Self-Development', 'Equity & Inclusion', 'Leadership', 'Teamwork']];
  return groups.every((group) => { const selected = group.filter((name) => filters.includes(name)); return !selected.length || selected.some((name) => matches[name] ?? activity.skills?.includes(name)); });
}
export const demoStudents = [
  { id: '10021', name: 'Jordan Lee', score: 68, engagement: 72, struggle: true, skill: 'Factoring polynomials', strength: 'Linear equations', summary: 'Jordan solves linear equations confidently but needs more practice recognizing factoring patterns and working with rational expressions.' },
  { id: '10034', name: 'Morgan Chen', score: 62, engagement: 64, struggle: true, skill: 'Graphs of equations and circles', strength: 'Exponent rules', summary: 'Morgan understands exponent rules and is developing confidence identifying circle centers, radii, and graph intercepts.' },
  { id: '10052', name: 'Taylor Rivera', score: 71, engagement: 81, struggle: true, skill: 'Rational expressions', strength: 'Sets of real numbers', summary: 'Taylor participates regularly and benefits from guided practice finding common denominators and checking domain restrictions.' },
  { id: '10068', name: 'Alex Kim', score: 94, engagement: 96, struggle: false, skill: 'Polynomial applications', strength: 'Functions and graphs', summary: 'Alex consistently applies algebraic methods and explains the connections between function equations and their graphs.' },
];
