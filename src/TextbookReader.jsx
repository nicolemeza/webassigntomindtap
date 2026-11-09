import React, { useMemo, useRef, useState } from 'react';
import { Button, ButtonColor, ButtonSize, ButtonVariant } from 'react-magma-dom';
import './textbook-reader.css';

const mathTags = new Set('math mrow mi mn mo mtext mspace msup msub msubsup mfrac msqrt mroot munder mover munderover mtable mtr mtd mstyle mpadded mphantom menclose'.split(' '));
const mathAttributes = new Set('display displaystyle scriptlevel mathvariant stretchy symmetric accent accentunder columnalign rowalign columnspacing rowspacing linethickness lspace rspace minsize maxsize width height depth mathsize mathcolor mathbackground notation fence separator'.split(' '));
function TextbookMath({ markup }) {
  return useMemo(() => {
    const document = new DOMParser().parseFromString(markup, 'application/xml');
    const render = (element, key) => {
      if (element.nodeType === 3) return element.nodeValue;
      if (element.nodeType !== 1 || ['annotation', 'annotation-xml'].includes(element.localName)) return null;
      const children = [...element.childNodes].map((child, index) => render(child, key + '-' + index));
      if (element.localName === 'mfenced') {
        const separator = element.getAttribute('separators') || ',';
        return <mrow key={key}><mo>{element.getAttribute('open') ?? '('}</mo>{children.flatMap((child, index) => index ? [<mo key={key + '-separator-' + index}>{separator[Math.min(index - 1, separator.length - 1)]}</mo>, child] : [child])}<mo>{element.getAttribute('close') ?? ')'}</mo></mrow>;
      }
      const tag = mathTags.has(element.localName) ? element.localName : 'mrow';
      const props = Object.fromEntries([...element.attributes].filter(attribute => mathAttributes.has(attribute.localName)).map(attribute => [attribute.localName, attribute.value]));
      return React.createElement(tag, { ...props, key }, ...children);
    };
    return render(document.documentElement, 'math');
  }, [markup]);
}

const tags = new Set('div span p em i b strong sup sub table thead tbody tfoot tr td th caption br hr ol ul li figure figcaption section h1 h2 h3 h4 h5 h6 blockquote dl dt dd var'.split(' '));
export default function TextbookReader({ reading }) {
  const [page, setPage] = useState(0);
  const [contents, setContents] = useState(true);
  const headingRef = useRef(null);
  const current = reading.pages[page];
  const go = index => { setPage(index); headingRef.current?.scrollIntoView({ block: 'start' }); headingRef.current?.focus(); };
  const render = (node, key) => {
    if (typeof node === 'string') return node;
    if (node.tag === 'math') return <TextbookMath key={key} markup={node.mml} />;
    if (node.tag === 'source-video') return <p className="textbook-video-reference" key={key}><a href={reading.sourceUrl} target="_blank" rel="noreferrer">{node.title} (opens in the textbook)</a></p>;
    if (node.tag === 'img') return /^https:\/\/(?:college|ng)\.cengage\.com\//.test(node.attrs?.src || '') ? <img key={key} src={node.attrs.src} alt={node.attrs.alt || ''} loading="lazy" referrerPolicy="no-referrer" /> : null;
    const tag = tags.has(node.tag) ? node.tag : 'span';
    return React.createElement(tag, { key, className: node.attrs?.class, ...(node.attrs?.colspan ? { colSpan: Number(node.attrs.colspan) } : {}), ...(node.attrs?.rowspan ? { rowSpan: Number(node.attrs.rowspan) } : {}) }, ...(['br', 'hr'].includes(tag) ? [] : (node.children || []).map((child, index) => render(child, key + '-' + index))));
  };
  const navigation = <div className="textbook-pagination"><Button type="button" size={ButtonSize.small} color={ButtonColor.secondary} variant={ButtonVariant.solid} disabled={page === 0} onClick={() => go(page - 1)}>Previous page</Button><span>{page + 1} of {reading.pages.length}</span><Button type="button" size={ButtonSize.small} color={ButtonColor.secondary} variant={ButtonVariant.solid} disabled={page === reading.pages.length - 1} onClick={() => go(page + 1)}>Next page</Button></div>;
  return <div className="textbook-reader">
    <div className="textbook-toolbar"><Button type="button" size={ButtonSize.small} variant={ButtonVariant.link} aria-expanded={contents} onClick={() => setContents(value => !value)}>{contents ? 'Hide contents' : 'Show contents'}</Button><a href={reading.sourceUrl} target="_blank" rel="noreferrer">Open in the textbook</a></div>
    <div className={'textbook-layout' + (contents ? '' : ' without-contents')}>
      {contents && <nav className="textbook-contents" aria-label="Section contents"><h3>{reading.title}</h3>{reading.pages.map((entry, index) => <button type="button" key={entry.id} aria-current={page === index ? 'page' : undefined} onClick={() => go(index)}>{index === 0 ? 'Overview' : entry.title}</button>)}</nav>}
      <article className="textbook-article"><h2 ref={headingRef} tabIndex={-1}>{current.title}</h2><div className="textbook-body">{current.content.map((node, index) => render(node, String(index)))}</div>{navigation}</article>
    </div>
  </div>;
}
