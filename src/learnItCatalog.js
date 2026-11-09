import data from './learnItData.json' with { type: 'json' };
import { getQuestionCode } from './questionCodes.js';

// Resolve against the verified catalog at render time so saved assignments also
// receive source corrections without replacing their questions or responses.
export function getLearnItModules(question) {
  if (!question || question.id === 'demo-street-repair-probability') return [];
  const sourceId = question.sourceId || question.id?.match(/^webassign-(\d+)$/)?.[1];
  const codes = data.questions[sourceId] || data.questions[getQuestionCode(question)] || [];
  return codes.map(code => data.modules[code]).filter(module => module?.sections?.length);
}

export function hasLearnIt(question) {
  return getLearnItModules(question).length > 0;
}

export function learnItAfterIncorrectAnswer(question, history = {}) {
  return Object.values(history).some(attempts => attempts.at(-1) === false) && hasLearnIt(question);
}

export const learnItCatalog = data;
