import React from 'react';

// Small presentation-only parser for the polynomial notation in the source activity.
// MathML keeps powers, groups, and fractional exponents semantic and selectable.
export default function MathExpression({ expression }) {
  const tokens = expression.match(/\d+(?:,\d{3})*(?:\.\d+)?|[A-Za-z]|[^\s]/g) || [];
  let position = 0;
  let key = 0;
  function sequence(stop) {
    const children = [];
    while (position < tokens.length && tokens[position] !== stop) {
      const token = tokens[position++];
      let atom;
      if (token === '(' || token === '[') {
        const close = token === '(' ? ')' : ']';
        const inside = sequence(close);
        const closed = tokens[position] === close;
        if (closed) position++;
        atom = <mrow><mo>{token}</mo>{inside}{closed && <mo>{close}</mo>}</mrow>;
      } else if (/^\d/.test(token)) atom = <mn>{token}</mn>;
      else if (/^[A-Za-z]$/.test(token)) atom = <mi mathvariant="normal">{token}</mi>;
      else atom = <mo>{token}</mo>;
      if (tokens[position] === '^') {
        position++;
        let power;
        if (tokens[position] === '{') {
          position++;
          const exponent = [];
          while (position < tokens.length && tokens[position] !== '}') exponent.push(tokens[position++]);
          if (tokens[position] === '}') position++;
          const slash = exponent.indexOf('/');
          power = slash >= 0 ? <mfrac><mn>{exponent.slice(0, slash).join('')}</mn><mn>{exponent.slice(slash + 1).join('')}</mn></mfrac> : <mn>{exponent.join('')}</mn>;
        } else power = <mn>{tokens[position++] || ''}</mn>;
        atom = <msup>{atom}{power}</msup>;
      }
      children.push(<React.Fragment key={key++}>{atom}</React.Fragment>);
    }
    return children;
  }
  return <math className="r5-expression" aria-label={expression}><mrow>{sequence()}</mrow></math>;
}
