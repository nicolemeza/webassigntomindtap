export function activityHref(chapter, section, title) {
  return `#/activity/${[chapter, section, title].map(encodeURIComponent).join('/')}`;
}

export function resolveActivityRoute(hash, chapters, getActivities) {
  if (!hash.startsWith('#/activity/')) return null;
  try {
    const parts = hash.slice('#/activity/'.length).split('/').map(decodeURIComponent);
    if (parts.length !== 3 && !(parts.length === 4 && parts[3] === 'play')) return null;
    const [chapter, section, title] = parts;
    if (!chapters.includes(chapter)) return null;
    const activity = getActivities(chapter)[section]?.find((item) => item.title === title);
    return activity ? { chapter, section, activity, page: parts[3] === 'play' ? 'player' : 'overview' } : null;
  } catch {
    return null;
  }
}
