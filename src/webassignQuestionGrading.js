import { questionResponseFields } from './questionResponseFields.js';

const canonical = value => String(value).trim().toLowerCase().replace(/[−–]/g, '-').replace(/\s+/g, '');
const numericText = value => /^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(value.trim()) ? value.replaceAll(',', '') : value;

export function importedGradingFields(question, matchesAnswer) {
  const responses = questionResponseFields(question);
  const total = Math.round(question.points * 100);
  const share = Math.floor(total / responses.length);
  return responses.flatMap((response, index) => {
    const points = (index === responses.length - 1 ? total - share * index : share) / 100;
    const base = { id: response.id, points };
    if (['radio', 'checkbox'].includes(response.type)) {
      const choices = question.fields.filter(field => field.group === response.id);
      const correct = choices.filter(field => field.correct === true).map(field => field.value);
      if (!correct.length) return [];
      return [{ ...base, validate: value => value.split('\u001f').filter(Boolean).sort().join('\u001f') === [...correct].sort().join('\u001f') }];
    }
    if (typeof response.expected !== 'string' || !response.expected.trim()) return [];
    if (response.type === 'select') {
      const correct = response.options?.find(option => canonical(option.label) === canonical(response.expected));
      return correct ? [{ ...base, validate: value => value === correct.value }] : [];
    }
    if (response.type !== 'text') return [];
    return [{ ...base, expected: response.expected, requireFactored: /factor (?:the .+? )?completely|factor completely/i.test(question.prompt || ''), validate: value => {
      if (canonical(value) === canonical(response.expected)) return true;
      return matchesAnswer(numericText(value), numericText(response.expected), /factor (?:the .+? )?completely|factor completely/i.test(question.prompt || ''));
    } }];
  });
}
