// GHColAlg13 1.1.065.EP. (5352779), verified against its WebAssign editor:
// c = randnum(7, 9, 2); d = c === 9 ? 4 : 3;
// numerator = 3*c; denominator = 6*d - 5; d6 = 6*d.
export function supportsQuestionRandomization(question) {
  return question.kind === 'webassign' && ['5352779', '4260657'].includes(sourceId(question));
}

const sourceId = question => question.sourceId || question.id?.replace(/^webassign-/, '');

const numericSpan = node => node?.tag === 'span' && node.children?.length === 1 && typeof node.children[0] === 'string' && /^\d+$/.test(node.children[0]);
const hasField = (node, id) => typeof node !== 'string' && (node.tag === 'field' && node.id === id || node.children?.some(child => hasField(child, id)));
const findConstant = nodes => {
  for (const node of nodes || []) {
    if (numericSpan(node) && ['7', '9'].includes(node.children[0])) return Number(node.children[0]);
    const nested = typeof node !== 'string' && findConstant(node.children);
    if (nested) return nested;
  }
};

export function questionRandomizationValue(question) {
  if (!supportsQuestionRandomization(question)) return undefined;
  if (sourceId(question) === '4260657') return question.randomizationValues || { shrink: 3, stretch: 2, targetScale: 4 };
  return findConstant(question.content?.filter(node => node.attrs?.class === 'wa1given'));
}

function mapContent(node, replace) {
  if (typeof node === 'string') return node;
  const replacement = replace(node);
  if (replacement) return replacement;
  return { ...node, ...(node.children ? { children: node.children.map(child => mapContent(child, replace)) } : {}) };
}

const randomValue = (node, value) => ({ ...node, randomized: true, children: [String(value)] });
const answerKey = value => ({ tag: 'span', answerKey: true, children: [value] });
const contentText = node => typeof node === 'string' ? node : node.answerKey ? '' : (node.children || []).map(contentText).join('');

export function withQuestionRandomization(question, c = questionRandomizationValue(question)) {
  if (!supportsQuestionRandomization(question)) return question;
  if (sourceId(question) === '4260657') return withExploreItRandomization(question, c);
  if (![7, 9].includes(c)) throw new RangeError('This question supports only 7 or 9.');
  const d = c === 9 ? 4 : 3;
  const numerator = 3 * c;
  const expected = { 'field-0': '6', 'field-1': `5x + ${6 + numerator}`, 'field-2': `${numerator}/${6 * d - 5}` };
  const content = question.content.map(block => {
    if (block.attrs?.class === 'wa1given') return mapContent(block, node => {
      if (!numericSpan(node)) return;
      if (['7', '9'].includes(node.children[0])) return randomValue(node, c);
      if (['3', '4'].includes(node.children[0])) return randomValue(node, d);
    });
    const fieldId = Object.keys(expected).find(id => hasField(block, id));
    if (!fieldId) return block;
    return mapContent(block, node => {
      // Replace captured answer-key images as well as text with current values.
      if (node.answerKey) return answerKey(expected[fieldId]);
      if (fieldId === 'field-1' && numericSpan(node) && ['18', '24'].includes(node.children[0])) return randomValue(node, 6 * d);
    });
  });
  return {
    ...question,
    content,
    prompt: content.map(contentText).join(' ').replace(/\s+/g, ' ').trim(),
    fields: question.fields.map(field => expected[field.id] ? { ...field, expected: expected[field.id] } : field),
  };
}

export function nextQuestionRandomization(question, random = Math.random) {
  if (!supportsQuestionRandomization(question)) return question;
  if (sourceId(question) === '4260657') {
    const current = questionRandomizationValue(question);
    const variants = [2, 3, 4].flatMap(shrink => [2, 3, 4].flatMap(stretch => [4, 9, 16].map(targetScale => ({ shrink, stretch, targetScale }))));
    const alternatives = variants.filter(variant => ['shrink', 'stretch', 'targetScale'].some(key => variant[key] !== current[key]));
    return withExploreItRandomization(question, alternatives[Math.floor(random() * alternatives.length)]);
  }
  // There are exactly two permitted versions. Always show the other one.
  return withQuestionRandomization(question, questionRandomizationValue(question) === 9 ? 7 : 9);
}

function withExploreItRandomization(question, { shrink, stretch, targetScale }) {
  // The source Explore It exercise is fixed. These prototype variants retain
  // its parent f(x) = x² - 3 and use y = stretch * f(shrink * x).
  if (![2, 3, 4].includes(shrink) || ![2, 3, 4].includes(stretch) || ![4, 9, 16].includes(targetScale)) throw new RangeError('Unsupported Explore It transformation.');
  const number = value => randomValue({ tag: 'span' }, value);
  const expected = {
    function: `${stretch * shrink ** 2}x^2-${3 * stretch}`,
    horizontal: targetScale === 4 ? '0.5' : targetScale === 9 ? '1/3' : '0.25',
    vertical: String(targetScale),
  };
  const content = question.content.map(block => {
    const text = contentText(block);
    if (block.tag === 'p' && text.startsWith('(a)')) return { ...block, children: ['(a) Find the modified function if the horizontal shrink is set to ', number(shrink), ' and the vertical stretch is set to ', number(stretch), '.'] };
    if (block.tag === 'p' && text.startsWith('(b)')) return { ...block, children: ['(b) Find the horizontal factor and vertical factor for the modified function y = x² − ', number(3 * targetScale), '.'] };
    const fieldId = Object.keys(expected).find(id => hasField(block, id));
    if (!fieldId) return block;
    // Rebuild keys from the current parameters rather than appending old keys.
    const withoutKeys = { ...block, children: (block.children || []).filter(node => !node.answerKey) };
    return { ...withoutKeys, children: [...withoutKeys.children, answerKey(expected[fieldId])] };
  });
  return {
    ...question,
    randomizationValues: { shrink, stretch, targetScale },
    content,
    prompt: content.map(contentText).join(' ').replace(/\s+/g, ' ').trim(),
    fields: question.fields.map(field => ({ ...field, expected: expected[field.id] || field.expected })),
  };
}
