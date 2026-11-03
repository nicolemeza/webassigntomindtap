import data from './webassignCourseData.json' with { type: 'json' };

export const webassignAssignments = data.assignments;
const assignmentsByTitle = new Map(webassignAssignments.map(assignment => [assignment.title, assignment]));
export function getWebassignAssignment(chapter, title) {
  const match = chapter.match(/^Chapter ([1-8])(?:\.|$)/);
  if (!match) return undefined;
  const assignment = assignmentsByTitle.get(title);
  const number = title.match(/^(?:Chapter )?([1-8])(?:\.| )/)?.[1];
  return number === match[1] ? assignment : undefined;
}
export function webassignQuestionType(question) {
  const types = new Set(question.fields.map(field => field.type));
  if (types.size === 1 && types.has('radio')) return 'Multiple choice';
  if (types.size === 1 && types.has('checkbox')) return 'Multiple select';
  if (types.size === 1 && types.has('select')) return 'Cloze with Drop-Down';
  return 'Math';
}
export function webassignQuestionMetadata(question, chapter, assignment) {
  return { ...question, chapter, assignment, assignments: [assignment], title: question.questionCode, questionType: webassignQuestionType(question), source: 'Test Bank', properties: [
    ...(question.fields.length ? ['Gradable'] : []),
    ...(new Set(question.fields.map(field => ['radio', 'checkbox'].includes(field.type) ? field.group : field.id)).size > 1 ? ['Multiple parts'] : []),
    ...(JSON.stringify(question.content).includes('"tag":"img"') ? ['Includes an image'] : []),
  ] };
}
export function getImportedQuestions(chapter, title) {
  return getWebassignAssignment(chapter, title)?.questions.map(question => webassignQuestionMetadata(question, chapter, title));
}
