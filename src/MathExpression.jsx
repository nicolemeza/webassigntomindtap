import React from 'react';

// Small presentation-only parser for the polynomial notation in the source activity.
// MathML keeps powers, groups, and fractional exponents semantic and selectable.
export default function MathExpression({ expression }) {
  const tokens = expression.match(/\d+(?:,\d{3})*(?:\.\d+)?|[A-Za-z]|[^\s]/g) || [];
  let position = 0;
  let key = 0;
  const fraction = (numerator, denominator) => <mfrac><mstyle scriptlevel="0">{numerator}</mstyle><mstyle scriptlevel="0">{denominator}</mstyle></mfrac>;
  const squareRoot = (radicand) => <mrow className="r5-radical"><mo stretchy="false">√</mo><mover accent="true"><mrow>{radicand}</mrow><mo stretchy="true">¯</mo></mover></mrow>;
  function atom() {
    const token = tokens[position++];
    let value;
    if (token === '√') value = squareRoot(atom());
    else if (token === '∛') value = <mroot>{atom()}<mn>3</mn></mroot>;
    else if (token === '(' || token === '[' || token === '{') {
      const close = token === '(' ? ')' : token === '[' ? ']' : '}';
      const inside = sequence(close);
      const closed = tokens[position] === close;
      if (closed) position++;
      const fenceClass = token === '{' ? 'r5-set-fence' : undefined;
      value = <mrow><mo className={fenceClass} fence="true" stretchy="true">{token}</mo>{inside}{closed && <mo className={fenceClass} fence="true" stretchy="true">{close}</mo>}</mrow>;
    } else if (/^\d/.test(token)) value = <mn>{token}</mn>;
    else if (/^[A-Za-z]$/.test(token)) value = <mi mathvariant="normal">{token}</mi>;
    else value = <mo>{token}</mo>;
    if (tokens[position] === '^') {
      position++;
      let power;
      if (tokens[position] === '{') {
        position++;
        const exponent = [];
        while (position < tokens.length && tokens[position] !== '}') exponent.push(tokens[position++]);
        if (tokens[position] === '}') position++;
        const slash = exponent.indexOf('/');
        power = slash >= 0 ? fraction(<mn>{exponent.slice(0, slash).join('')}</mn>, <mn>{exponent.slice(slash + 1).join('')}</mn>) : <mn>{exponent.join('')}</mn>;
      } else {
        const sign = tokens[position] === '−' || tokens[position] === '-' || tokens[position] === '+'
          ? tokens[position++]
          : '';
        const exponent = tokens[position++] || '';
        power = sign
          ? <mrow><mo>{sign}</mo><mn>{exponent}</mn></mrow>
          : <mn>{exponent}</mn>;
      }
      value = <msup>{value}{power}</msup>;
    }
    return value;
  }
  function sequence(stop) {
    const children = [];
    while (position < tokens.length && tokens[position] !== stop) {
      let value = atom();
      if (tokens[position] === '/') {
        position++;
        value = fraction(value, atom());
      }
      children.push(<React.Fragment key={key++}>{value}</React.Fragment>);
    }
    return children;
  }
  return <math className="r5-expression" aria-label={expression} displaystyle="true"><mrow>{sequence()}</mrow></math>;
}
