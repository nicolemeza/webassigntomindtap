// Display references verified against the R.5 course preview. These remain
// separate from question content and internal keys used for saved responses.
const factoringCodes = [
  '001.', '002.', '004.', '017.', '020.', '024.', '026.', '032.',
  '035.', '038.', '042.', '046.', '050.EP.', '054.', '060.', '062.EP.',
  '068.', '070.', '074.', '082.', '088.', '098.', '112.', '116.',
  '120.', '126.', '136.', '143.FI.', '146.',
];
const legacyQuestionCodes = new Map(factoringCodes.map((code, index) => [`r5-factoring-question-${index + 1}`, `GHColAlg13 R.5.${code}`]));
// Authored choice variants use the same source exercise as their math version.
legacyQuestionCodes.set('algebra-r5-common-factor-choice', legacyQuestionCodes.get('r5-factoring-question-1'));
legacyQuestionCodes.set('algebra-r5-factoring-select', legacyQuestionCodes.get('r5-factoring-question-6'));

export function getQuestionCode(question) {
  return question.questionCode || legacyQuestionCodes.get(question.id) || (/^GHCol\S+\s/.test(question.title || '') ? question.title : undefined);
}
