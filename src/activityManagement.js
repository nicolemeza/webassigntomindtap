export function isAssessmentActivity(activity = {}) {
  return activity.points !== undefined && !activity.resourceKind;
}

export function hasStudentAttempts(activity = {}, session) {
  return Boolean(activity.studentAttempts?.length || Number.parseFloat(activity.submitted) > 0 || session?.completedAt || Object.keys(session?.answers || {}).length);
}

export function duplicateActivity(source, questions, id) {
  const copy = structuredClone(source);
  delete copy.stableKey;
  delete copy.selectionId;
  delete copy.studentAttempts;
  delete copy.removed;
  delete copy.hidden;
  return { ...copy, id, title: `${source.title} (Copy)`, originalTitle: source.originalTitle || source.title, originalChapter: source.originalChapter || source.chapter, questions: structuredClone(questions), accommodations: {}, submitted: '0%', averageScore: '--', placement: 'end' };
}

export function orderFolderItems(items) {
  const remaining = items.filter((item) => !/^(before|after):/.test(item.placement || ''));
  const ordered = [...remaining.filter((item) => item.placement === 'start'), ...remaining.filter((item) => !['start', 'end'].includes(item.placement)), ...remaining.filter((item) => item.placement === 'end')];
  let pending = items.filter((item) => /^(before|after):/.test(item.placement || ''));
  while (pending.length) {
    const deferred = [];
    for (const item of pending) {
      const split = item.placement.indexOf(':');
      const target = item.placement.slice(split + 1);
      const index = ordered.findIndex((sibling) => sibling.id === target);
      if (index < 0) deferred.push(item);
      else ordered.splice(index + (item.placement.startsWith('after:') ? 1 : 0), 0, item);
    }
    if (deferred.length === pending.length) { ordered.push(...deferred); break; }
    pending = deferred;
  }
  return ordered;
}
