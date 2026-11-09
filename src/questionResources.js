import demoResources from './demoQuestionResources.json' with { type: 'json' };

export function getVerifiedQuestionResources(question) {
  return question?.resourceKey === 'demo-linear-equations' ? demoResources : null;
}
