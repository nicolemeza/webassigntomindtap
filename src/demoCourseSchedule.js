export const demoExerciseDueDates = {
  'R.1 HW Sets of Real Numbers': '2026-11-03',
  'R.2 HW Integer Exponents & Scientific Notation': '2026-11-05',
  'R.3 HW Rational Exponents & Radicals': '2026-11-08',
  'R.4 HW Polynomials & Operations on Radicals': '2026-11-10',
  'R.5 HW Factoring': '2026-11-12',
  'R.6 HW Rational Expressions': '2026-11-15',
  'Chapter R Review': '2026-11-18',
  'Chapter R Test': '2026-11-20',
  '1.1 HW Linear Equations & Rational Equations': '2026-11-22',
  '2.5 HW Graphs of Equations & Circles': '2026-11-26',
};

// Earlier saves captured the original common due date during unrelated edits.
// Rebase those defaults once; retain dates that an instructor customized.
export function migrateDemoSchedule(saved = {}) {
  if (saved.demoScheduleVersion === 1) return saved;
  const activities = Object.fromEntries(Object.entries(saved.activities || {}).map(([key, activity]) => {
    const dueDate = demoExerciseDueDates[activity.originalTitle || activity.title];
    const oldDefault = ['2026-12-06', '2027-01-30'].includes(activity.dueDate);
    return [key, dueDate && oldDefault && !activity.id ? { ...activity, dueDate } : activity];
  }));
  return { ...saved, activities, demoScheduleVersion: 1 };
}
