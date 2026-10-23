import { useSyncExternalStore } from 'react';

const storageKey = 'mindtap-prototype-created-activities-v1';
const draftKey = 'mindtap-prototype-activity-draft-v1';
const listeners = new Set();
function read(key, fallback) {
  try { return JSON.parse(window.localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
let activities = read(storageKey, []);
if (!Array.isArray(activities)) activities = [];
export function getCreatedActivities() { return activities; }
export function useCreatedActivities() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, getCreatedActivities);
}
export function saveCreatedActivity(activity) {
  const index = activities.findIndex((item) => item.id === activity.id);
  const next = [...activities];
  if (index < 0) next.push(activity); else next[index] = activity;
  // Persist before publishing so a failed write leaves the current course intact.
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  activities = next;
  listeners.forEach((listener) => listener());
}
export function readActivityDraft() { return read(draftKey, null); }
export function saveActivityDraft(draft) { window.localStorage.setItem(draftKey, JSON.stringify(draft)); }
export function clearActivityDraft() { window.localStorage.removeItem(draftKey); }
export function addCreatedActivities(chapter, section, originals = []) {
  const added = activities.filter((item) => item.chapter === chapter && item.section === section);
  return [...added.filter((item) => item.placement === 'start').reverse(), ...originals, ...added.filter((item) => item.placement !== 'start')];
}
