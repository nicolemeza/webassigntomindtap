export function formatActivityDue(activity, month = 'short') {
  if (!activity.dueDate) return 'Not set';
  const date = new Intl.DateTimeFormat('en-US', { month, day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${activity.dueDate}T00:00:00Z`));
  return `${date}${activity.dueTime ? ` @ ${formatDueTime(activity)}` : ''}`;
}

export function formatDueTime(activity) {
  if (!activity.dueTime) return '';
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(`2000-01-01T${activity.dueTime}:00Z`));
  return `${time}${activity.dueTimeZone ? ` ${activity.dueTimeZone}` : ''}`;
}

export function activityDueDateTime(activity) {
  return activity.dueTime && activity.dueUtcOffset
    ? `${activity.dueDate}T${activity.dueTime}:00${activity.dueUtcOffset}`
    : activity.dueDate;
}
