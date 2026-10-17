export const mathPadCategories = ['ops', 'functions', 'symbols', 'relations', 'sets', 'vectors', 'trig', 'greek'];

export const mathPadKeys = {
  ops: [
    { icon: 'plus', label: 'Add', text: '+' },
    { icon: 'minus', label: 'Subtract', text: '−' },
    { icon: 'multiply', label: 'Multiply', text: '×' },
    { icon: 'divide', label: 'Divide', text: '÷' },
    { icon: 'fraction', label: 'Fraction', text: '()/()', cursor: 1 },
    { icon: 'power', label: 'Exponent', text: '^()', cursor: 2 },
    { icon: 'root', label: 'Square root', text: 'sqrt()', cursor: 5 },
    { icon: 'factorial', label: 'Factorial', text: '!' },
  ],
  functions: ['abs', 'ln', 'log', 'exp'].map((name) => ({ label: name, text: `${name}()`, cursor: name.length + 1 })),
  symbols: ['π', '∞', 'e', 'i', '±', '%'].map((text) => ({ label: text, text })),
  relations: ['=', '≠', '<', '>', '≤', '≥', '≈'].map((text) => ({ label: text, text })),
  sets: ['∈', '∉', '∪', '∩', '⊂', '⊆', '∅'].map((text) => ({ label: text, text })),
  vectors: [{ label: 'Vector', text: 'vec()', cursor: 4 }, { label: 'Dot product', text: '·' }, { label: 'Cross product', text: '×' }],
  trig: ['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan'].map((name) => ({ label: name, text: `${name}()`, cursor: name.length + 1 })),
  greek: ['α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'σ', 'φ', 'ω'].map((text) => ({ label: text, text })),
};

export function insertMathPadKey(value, start, end, key) {
  return { value: value.slice(0, start) + key.text + value.slice(end), cursor: start + (key.cursor ?? key.text.length) };
}
