// Local, deterministic grading for the transcribed R.5 exercise only.
// No expression is evaluated as JavaScript or sent to a gradebook.
export const MAX_ATTEMPTS = 5;
const solutions = {
  1: { answer: '14xy^2' }, 2: { answer: '8x^4(y-2)^2' },
  3: { a: '1', b: '6x' }, 4: { answer: '8x^2(2+x)' },
  5: { answer: '6yz(5y-3z)' }, 6: { answer: '(x+5)(x+y)' },
  7: { answer: '(4z-5)(4z+5)' }, 8: { answer: '(x-y-4)(x-y+4)' },
  9: { answer: '(b-7)^2' }, 10: { answer: '(r-4s)^2' },
  11: { answer: '(x+2)(x+9)' }, 12: { answer: '(5q-4)(q-5)' },
  13: { a: '9y', b: '10z', answer: '(9y+10z)(81y^2-90yz+100z^2)' },
  14: { answer: '(3y-5z)(9y^2+15yz+25z^2)' },
  15: { answer: '(9a-b)(x+9y)' },
  16: { gcf: '2x', factor: '2x', inside: '2xy^3+6y', answer: '2x(2y+1)(xy^2+3)' },
  17: { answer: '(z-5)(z+5)(z^2+25)' }, 18: { answer: '4xy(x-1)(x+1)' },
  19: { answer: 'PRIME' }, 20: { answer: '(5s-7r)(2r+5s)' },
  21: { answer: '(x^2-10)(x^2+9)' }, 22: { answer: '3(y+6)(y^2-6y+36)' },
  23: { answer: 'x^2(x-4)(x+4)(x-2)(x+2)' },
  24: { answer: '(y^2-2y+6)(y^2+2y+6)' },
  25: { answer: '(x+4)(2x+1-y)' }, 26: { answer: '7(x^2-2x/7-9/7)' },
  27: { answer: '5x^(1/7)(x^(2/7)-2)' }, 29: { answer: '16(4-t)(4+t)' },
};

// Sparse polynomials permit exact structural comparisons up to floating-point
// tolerance, including reordered factors, implicit products and rational powers.
const tidy = (poly) => { if ([...poly.values()].some((n) => !Number.isFinite(n))) throw Error('Invalid coefficient'); return new Map([...poly].filter(([, value]) => Math.abs(value) > 1e-9)); };
const constant = (n) => new Map([['', n]]);
const powerKey = (powers) => Object.entries(powers).filter(([, n]) => Math.abs(n) > 1e-9).sort().map(([v, n]) => `${v}:${Math.round(n * 1e9) / 1e9}`).join(',');
const powersOf = (key) => Object.fromEntries(key ? key.split(',').map((part) => { const [v, n] = part.split(':'); return [v, Number(n)]; }) : []);
function add(a, b, sign = 1) {
  const result = new Map(a);
  for (const [key, value] of b) result.set(key, (result.get(key) || 0) + sign * value);
  return tidy(result);
}
function multiply(a, b) {
  const result = new Map();
  for (const [ka, va] of a) for (const [kb, vb] of b) {
    const powers = powersOf(ka);
    for (const [v, n] of Object.entries(powersOf(kb))) powers[v] = (powers[v] || 0) + n;
    const key = powerKey(powers);
    result.set(key, (result.get(key) || 0) + va * vb);
  }
  if (result.size > 500) throw Error('Expression too large');
  return tidy(result);
}
function raise(poly, exponent) {
  if (!Number.isFinite(exponent) || Math.abs(exponent) > 20) throw Error('Invalid exponent');
  if (poly.size === 1) {
    const [key, value] = [...poly][0];
    const coefficient = value ** exponent;
    if (!Number.isFinite(coefficient)) throw Error('Invalid power');
    return new Map([[powerKey(Object.fromEntries(Object.entries(powersOf(key)).map(([v, n]) => [v, n * exponent]))), coefficient]]);
  }
  if (!Number.isInteger(exponent) || exponent < 0) throw Error('Polynomial power must be a nonnegative integer');
  let result = constant(1);
  for (let i = 0; i < exponent; i++) result = multiply(result, poly);
  return result;
}
function polynomial(node) {
  if (node.op === 'value') return node.poly;
  const a = polynomial(node.a);
  if (node.op === '^') {
    const b = polynomial(node.b);
    if (b.size !== 1 || !b.has('')) throw Error('Exponent must be numeric');
    return raise(a, b.get(''));
  }
  const b = polynomial(node.b);
  if (node.op === '+') return add(a, b);
  if (node.op === '-') return add(a, b, -1);
  if (node.op === '/') {
    if (b.size !== 1 || [...b.values()][0] === 0) throw Error('Only monomial divisors supported');
    return multiply(a, raise(b, -1));
  }
  return multiply(a, b);
}
function parse(value) {
  const source = value.replace(/[−–]/g, '-').replace(/[×·⋅]/g, '*').replace(/[{}\[\]]/g, (c) => '{['.includes(c) ? '(' : ')').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/\s/g, '');
  if (source.length > 300 || !/^[0-9a-z.+*/^()-]+$/.test(source)) throw Error('Unsupported expression');
  const tokens = source.match(/\d*\.\d+|\d+|[a-z]|[()+*/^\-]/g) || [];
  let i = 0;
  const valueNode = (poly) => ({ op: 'value', poly });
  const operation = (op, a, b) => ({ op, a, b });
  function atom() {
    const token = tokens[i++];
    if (token === '(') { const node = sum(); if (tokens[i++] !== ')') throw Error('Unbalanced parentheses'); return node; }
    if (/^[a-z]$/.test(token || '')) return valueNode(new Map([[`${token}:1`, 1]]));
    if (token && /^(\d*\.)?\d+$/.test(token)) return valueNode(constant(Number(token)));
    throw Error('Expected a number or variable');
  }
  function power() { let node = atom(); if (tokens[i] === '^') { i++; node = operation('^', node, unary()); } return node; }
  function unary() { if (tokens[i] === '+') { i++; return unary(); } if (tokens[i] === '-') { i++; return operation('*', valueNode(constant(-1)), unary()); } return power(); }
  function product() {
    let node = unary();
    while (i < tokens.length && ![')', '+', '-'].includes(tokens[i])) {
      const op = ['*', '/'].includes(tokens[i]) ? tokens[i++] : '*';
      node = operation(op, node, unary());
    }
    return node;
  }
  function sum() { let node = product(); while (['+', '-'].includes(tokens[i])) { const op = tokens[i++]; node = operation(op, node, product()); } return node; }
  const node = sum();
  if (i !== tokens.length) throw Error('Unexpected token');
  return node;
}
const equal = (a, b) => tidy(add(a, b, -1)).size === 0;
// Compare non-monomial factors up to constant multiples. This rejects expanded
// or only partly factored answers when the prompt asks for complete factoring.
function factors(node) {
  if (node.op === '*') return [...factors(node.a), ...factors(node.b)];
  if (node.op === '/' && polynomial(node.b).size === 1) return factors(node.a);
  if (node.op === '^') {
    const exponent = polynomial(node.b).get('');
    if (Number.isInteger(exponent) && exponent >= 0 && exponent <= 20) return Array.from({ length: exponent }, () => factors(node.a)).flat();
  }
  const poly = polynomial(node);
  if (poly.size <= 1) return [];
  const sorted = [...poly].sort(([a], [b]) => a.localeCompare(b));
  const divisor = sorted[0][1];
  return [new Map(sorted.map(([key, n]) => [key, n / divisor]))];
}
export function matchesAnswer(value, expected, requireFactored = true) {
  if (expected === 'PRIME') return value.trim().toUpperCase() === 'PRIME';
  try {
    const actual = parse(value), target = parse(expected);
    if (!equal(polynomial(actual), polynomial(target))) return false;
    if (!requireFactored) return true;
    const wanted = factors(target), given = factors(actual);
    if (!wanted.length) return true;
    if (wanted.length !== given.length) return false;
    return wanted.every((factor) => { const index = given.findIndex((candidate) => equal(factor, candidate)); if (index < 0) return false; given.splice(index, 1); return true; });
  } catch { return false; }
}
export function gradingFields(question) {
  if (question.kind === 'choice' && question.correctChoices?.length) return [{ id: 'answer', expected: [...question.correctChoices].sort().join('\u001f'), points: question.points }];
  const number = Number(question.id.replace('r5-factoring-question-', ''));
  const answers = solutions[number];
  if (!answers || !question.id.startsWith('r5-factoring-question-')) return [];
  const fields = question.inputs?.length ? question.inputs : [{ id: 'answer' }];
  const total = Math.round(question.points * 100), share = Math.floor(total / fields.length);
  return fields.map((field, index) => ({ ...field, expected: answers[field.id], requireFactored: number !== 2 && !(number === 16 && ['gcf', 'factor', 'inside'].includes(field.id)), points: (index === fields.length - 1 ? total - share * index : share) / 100 }));
}
export function fieldComplete(history = []) { return history.length >= MAX_ATTEMPTS; }
export function gradedAnswerState(value = '', history = [], lastSubmitted) {
  if (!history.length || lastSubmitted === undefined || !value.trim() || value.replace(/\s+/g, '') !== lastSubmitted) return undefined;
  return history[history.length - 1] ? 'correct' : 'incorrect';
}
export function earnedPoints(question, history = {}) {
  return Math.round(gradingFields(question).reduce((sum, field) => sum + (history[field.id]?.includes(true) ? field.points : 0), 0) * 100) / 100;
}
export function submitQuestion(question, response = {}, history = {}, lastSubmitted = {}) {
  const fields = gradingFields(question);
  if (!fields.length) return { history, lastSubmitted, message: '', emptyFields: [], unchangedFields: [], submitted: 0 };
  const next = { ...history };
  const nextSubmitted = { ...lastSubmitted };
  let submitted = 0;
  const emptyFields = [];
  const unchangedFields = [];
  for (const field of fields) {
    const previous = history[field.id] || [];
    const value = question.kind === 'choice' ? [...(response.selections || [])].sort().join('\u001f') : question.kind === 'greatest-common-factor' ? response.text : response.values?.[field.id];
    if (fieldComplete(previous)) continue;
    if (!value?.trim()) { emptyFields.push(field.id); continue; }
    // Whitespace-only edits do not constitute a new mathematical response.
    const normalized = question.kind === 'choice' ? value : value.replace(/\s+/g, '');
    if (normalized === lastSubmitted[field.id]) { unchangedFields.push(field.id); continue; }
    const result = question.kind === 'choice' ? value === field.expected : matchesAnswer(value, field.expected, field.requireFactored);
    next[field.id] = [...previous, result];
    nextSubmitted[field.id] = normalized;
    submitted++;
  }
  const unchangedMessage = unchangedFields.length ? fields.length === 1 ? 'The input was not changed.' : `The input was not changed for ${unchangedFields.map((id) => `Field ${fields.findIndex((field) => field.id === id) + 1}`).join(', ')}.` : '';
  const message = [unchangedMessage, emptyFields.length ? 'Enter an answer in the empty field(s). Blank fields do not use an attempt.' : ''].filter(Boolean).join(' ');
  return { history: next, lastSubmitted: nextSubmitted, message, emptyFields, unchangedFields, submitted };
}
