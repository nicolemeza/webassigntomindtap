import { chapterAssignments } from './chapterAssignments.js';
import { getActivityQuestions } from './activityQuestions.js';
import { webassignAssignments, webassignQuestionMetadata } from './webassignCourse.js';
import { courseChapters } from './courseModel.js';
import { getQuestionCode } from './questionCodes.js';
import { exploreItQuestions } from './exploreItQuestions.js';

export const questionTypes = ['Multiple choice', 'Multiple select', 'Cloze with Drop-Down', 'Cloze with text', 'Cloze with drag & drop', 'Choice Matrix', 'Match List', 'Order List', 'Classification List', 'Essay', 'Essay (with rich text)', 'Label Image (drop down)', 'Label Image (drag & drop)', 'Label Image (text)', 'Label Image (math)', 'Other (file upload)', 'Highlight', 'Hotspot', 'Math', 'Math (with rich text)', 'Math (with image)', 'Cloze math'];
export const questionSources = ['Test Bank', 'Test Prep.', 'A&R'];
export const itemProperties = ['Gradable', 'Multiple parts', 'Includes an image'];
const chapter = 'Chapter R. A Review of Basic Algebra';
const assignment = 'R.5 HW Factoring';
const choiceQuestions = [
  { id: 'algebra-r5-common-factor-choice', kind: 'choice', title: 'R.5 · Recognize a greatest common factor', prompt: 'What is the greatest common factor of 28x³y², 42xy⁴, and 70x²y³?', choices: ['7xy', '14xy²', '14x²y³', '28x³y⁴'], correctChoices: ['14xy²'], points: 1, questionType: 'Multiple choice' },
  { id: 'algebra-r5-factoring-select', kind: 'choice', multiple: true, title: 'R.5 · Equivalent factorizations', prompt: 'Which expressions are equivalent to x² + 5x + xy + 5y? Check all that apply.', choices: ['(x + 5)(x + y)', '(x + y)(x + 5)', '(x − 5)(x + y)', '(x + 5)(x − y)'], correctChoices: ['(x + 5)(x + y)', '(x + y)(x + 5)'], points: 1, questionType: 'Multiple select' },
];
export function questionSummary(question) {
  return question.prompt || question.blocks?.find((block) => block.type === 'text')?.text || question.opening || '';
}
const existingQuestions = [
  ...choiceQuestions,
  ...getActivityQuestions(chapter, assignment).map((question, index) => ({ ...question, title: `R.5 · Factoring · Question ${index + 1}`, questionType: question.blocks?.some((block) => block.type === 'image') ? 'Math (with image)' : 'Math' })),
].map((question) => ({ ...question, chapter, assignment, source: 'Test Bank', properties: [
  ...(!question.followUpUnavailable ? ['Gradable'] : []),
  ...(question.inputs?.length > 1 ? ['Multiple parts'] : []),
  ...(question.blocks?.some((block) => block.type === 'image') ? ['Includes an image'] : []),
] }));
const importedBank = new Map();
for (const activity of webassignAssignments) {
  const number = activity.title.match(/^(?:Chapter )?([1-8])(?:\.| )/)[1];
  const chapterTitle = courseChapters.find(title => title.startsWith(`Chapter ${number}.`));
  for (const question of activity.questions) {
    const previous = importedBank.get(question.id);
    if (previous) previous.assignments.push(activity.title);
    else importedBank.set(question.id, webassignQuestionMetadata(question, chapterTitle, activity.title));
  }
}
export const questionBank = [...existingQuestions, ...importedBank.values(), ...exploreItQuestions];
export function getSubchapters(chapterTitle) {
  return chapterAssignments[chapterTitle.slice(0, chapterTitle.indexOf('. '))] || [];
}
export function filterQuestions(questions, filters, search = '') {
  const query = search.trim().toLowerCase();
  return questions.filter((question) => (!query || [question.title, getQuestionCode(question), question.sourceId, question.id, questionSummary(question), ...(question.assignments || [question.assignment]), question.chapter, ...question.blocks?.filter((block) => block.type === 'math').map((block) => block.expression) || []].join(' ').toLowerCase().includes(query))
    && (!filters.chapters.length || filters.chapters.includes(question.chapter))
    && (!filters.subchapters.length || (question.assignments || [question.assignment]).some(title => filters.subchapters.includes(title)))
    && (!filters.types.length || filters.types.includes(question.questionType))
    && (!filters.sources.length || filters.sources.includes(question.source))
    && (!filters.properties.length || filters.properties.every((property) => question.properties.includes(property))));
}
export const emptyBankFilters = { chapters: [], subchapters: [], types: [], sources: [], properties: [] };
