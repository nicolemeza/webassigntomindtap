import { getImportedQuestions } from './webassignCourse.js';
import { exploreItQuestions } from './exploreItQuestions.js';

const chapter = 'Chapter R. A Review of Basic Algebra';
export const demoActivityFolder = `${chapter}/section/R.2`;

// Transcribed from the supplied common-error assistance screenshot.
export const streetRepairProbabilityQuestion = {
  id: 'demo-street-repair-probability',
  kind: 'math-response',
  points: 1,
  rejoinder: false,
  resourceKey: 'demo-linear-equations',
  prompt: 'Find the probability that at most a third of the streets will need repairs in any given year.',
  blocks: [
    { type: 'text', text: 'The fraction of streets in the downtown section of a certain city that need repairs in a given year is a random variable with a distribution described by the probability density function' },
    { type: 'answer-row', parts: [{ math: 'f(x) = 12x^2(1 − x)' }, { math: '(0 ≤ x ≤ 1).' }] },
    { type: 'text', text: 'Find the probability that at most a third of the streets will need repairs in any given year.' },
    { type: 'answer-row', parts: [{ input: 'probability', label: 'Probability that at most a third of the streets need repairs' }] },
  ],
  inputs: [{
    id: 'probability',
    label: 'Probability that at most a third of the streets need repairs',
    expected: '1/9',
    incorrectFeedback: { '9/1': 'You entered the numerator and denominator in the opposite order.' },
  }],
};

// Bundle the authored demo with the prototype so a new browser does not need
// the browser storage from the session in which the activity was created.
export const demoActivities = [{
  id: 'created-77fc5961-3d94-4a97-9383-ac56b24248f8',
  demoContentVersion: 4,
  title: 'Demo Activity',
  chapter: demoActivityFolder,
  section: 'chapter',
  placement: 'end',
  description: 'Find a probability with common-error assistance, solve a linear equation in multiple parts, practice graphing a circle, and use Explore It to investigate stretching and shrinking of graphs.',
  icon: 'assessment',
  type: 'HOMEWORK',
  countsTowardsGrade: true,
  points: 4,
  availableDate: '',
  dueDate: '',
  password: '',
  academicIntegrity: 'none',
  accommodations: {},
  settings: { template: 'Apply It', attempts: '2', gradingPolicy: 'Best Activity Attempt', creditType: 'graded' },
  questions: [
    streetRepairProbabilityQuestion,
    { ...getImportedQuestions('Chapter 1. Equations and Inequalities', '1.1 HW Linear Equations & Rational Equations').find(question => question.sourceId === '5352779'), resourceKey: 'demo-linear-equations' },
    getImportedQuestions('Chapter 2. Functions and Graphs', '2.5 HW Graphs of Equations & Circles').find(question => question.sourceId === '5352735'),
    exploreItQuestions[0],
  ],
}];

export function migrateDemoActivity(activity) {
  if (activity.id !== demoActivities[0].id || activity.demoContentVersion >= 4 || !Array.isArray(activity.questions)) return activity;
  const missing = (activity.demoContentVersion || 0) < 2 && !activity.questions.some(question => question.id === streetRepairProbabilityQuestion.id);
  let questions = missing ? [...activity.questions, structuredClone(streetRepairProbabilityQuestion)] : [...activity.questions];
  const matchesSource = (question, sourceId) => question.sourceId === sourceId || question.id === `webassign-${sourceId}`;
  const linear = questions.find(question => matchesSource(question, '5352779'));
  const circle = questions.find(question => matchesSource(question, '5352735'));
  if ((activity.demoContentVersion || 0) < 3 && linear && circle) questions = [linear, circle, ...questions.filter(question => question !== linear && question !== circle)];
  const probability = questions.find(question => question.id === streetRepairProbabilityQuestion.id);
  if (probability) questions = [probability, ...questions.filter(question => question !== probability)];
  questions = questions.map(question => matchesSource(question, '5352779') || question.id === streetRepairProbabilityQuestion.id ? { ...question, resourceKey: 'demo-linear-equations' } : question);
  return {
    ...activity,
    demoContentVersion: 4,
    questions,
    ...(missing ? {
      points: (activity.points ?? activity.questions.reduce((sum, question) => sum + question.points, 0)) + streetRepairProbabilityQuestion.points,
    } : {}),
  };
}

export function mergeDemoActivities(saved) {
  const activities = Array.isArray(saved) ? saved.map(migrateDemoActivity) : [];
  const savedIds = new Set(activities.map(activity => activity.id));
  return [...structuredClone(demoActivities.filter(activity => !savedIds.has(activity.id))), ...activities];
}

export function mergeDemoFolders(saved = {}) {
  return {
    ...saved,
    [demoActivityFolder]: {
      title: 'R.2 Integer Exponents & Scientific Notation',
      parent: chapter,
      kind: 'section',
      sourceChapter: chapter,
      sectionActivity: { title: 'R.2 HW Integer Exponents & Scientific Notation' },
      ...saved[demoActivityFolder],
    },
  };
}
