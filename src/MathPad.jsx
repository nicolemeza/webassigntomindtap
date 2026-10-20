import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { mathPadCategories, mathPadKeys, insertMathPadKey } from './mathPadKeys';
import './math-pad.css';
import './math-entry.css';

function PadIcon({ name }) {
  const size = ['settings', 'done', 'previous', 'next'].includes(name) ? 24 : name === 'help' ? 16 : 20;
  return <img src={`/rebrand/mathpad-${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}

export default function MathPad({ id, value, onChange, onClose, inputCount = 1, inputIndex = 0, onInputChange, showSettings = false }) {
  const [category, setCategory] = useState('ops');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const inputRef = useRef(null);
  const tabsRef = useRef(null);
  const selectionRef = useRef({ start: value.length, end: value.length });
  const pendingCursor = useRef(null);

  useLayoutEffect(() => {
    const field = inputRef.current;
    if (!field) return undefined;
    const resizeToContent = () => {
      const scrollTop = field.scrollTop;
      field.style.height = '0px';
      field.style.height = `${Math.max(96, field.scrollHeight)}px`;
      field.scrollTop = scrollTop;
    };
    resizeToContent();
    let previousWidth = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== previousWidth) {
        previousWidth = field.clientWidth;
        resizeToContent();
      }
    });
    observer.observe(field);
    window.addEventListener('resize', resizeToContent);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeToContent);
    };
  }, [value, largeText, category, settingsOpen, helpOpen, inputCount]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(value.length, value.length);
    selectionRef.current = { start: value.length, end: value.length };
    // Reset the caret when switching answer fields, not on synchronized edits.
  }, [inputIndex]);
  useEffect(() => {
    if (pendingCursor.current !== null) {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pendingCursor.current, pendingCursor.current);
      pendingCursor.current = null;
    }
  }, [value]);
  const rememberSelection = () => {
    const field = inputRef.current;
    if (field) selectionRef.current = { start: field.selectionStart, end: field.selectionEnd };
  };
  const insert = (key) => {
    const { start, end } = selectionRef.current;
    const result = insertMathPadKey(value, Math.min(start, value.length), Math.min(end, value.length), key);
    pendingCursor.current = result.cursor;
    selectionRef.current = { start: result.cursor, end: result.cursor };
    onChange(result.value);
  };
  const chooseCategory = (next) => {
    setCategory(next);
    tabsRef.current?.querySelector(`[data-category="${next}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  return createPortal(<section id={id} className="math-pad" role="dialog" aria-modal="false" aria-labelledby={`${id}-title`} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }}>
    <header className="math-pad-header"><h2 id={`${id}-title`}>Math Pad</h2>{showSettings && <button type="button" className="math-pad-header-button" aria-label="Math pad settings" aria-expanded={settingsOpen} onClick={() => { setSettingsOpen(!settingsOpen); setHelpOpen(false); }}><PadIcon name="settings" /></button>}<button type="button" className="math-pad-header-button" aria-label="Done with math pad" onClick={onClose}><PadIcon name="done" /></button></header>
    <div className="math-pad-toolbar">
      <div className="math-pad-tabs-container"><div className="math-pad-tabs" ref={tabsRef} role="tablist" aria-label="Math symbols">
        {mathPadCategories.map((name, index) => <button key={name} type="button" role="tab" id={`${id}-${name}-tab`} data-category={name} aria-selected={category === name} aria-controls={`${id}-keys`} tabIndex={category === name ? 0 : -1} onClick={() => chooseCategory(name)} onKeyDown={(event) => {
          if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? mathPadCategories.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + mathPadCategories.length) % mathPadCategories.length;
            chooseCategory(mathPadCategories[nextIndex]);
            tabsRef.current?.querySelector(`[data-category="${mathPadCategories[nextIndex]}"]`)?.focus();
          }
        }}>{name}</button>)}
      </div><div className="math-pad-more"><button type="button" aria-label="More math categories" onClick={() => { const next = mathPadCategories[(mathPadCategories.indexOf(category) + 1) % mathPadCategories.length]; chooseCategory(next); }}><PadIcon name="more" /></button></div></div>
      <div className="math-pad-keys" id={`${id}-keys`} role="tabpanel" aria-labelledby={`${id}-${category}-tab`}>
        {mathPadKeys[category].map((key) => <button key={key.label} type="button" aria-label={key.label} title={key.label} onPointerDown={(event) => event.preventDefault()} onClick={() => insert(key)}>{key.icon ? <PadIcon name={key.icon} /> : key.label}</button>)}
      </div>
    </div>
    <div className="math-pad-divider" aria-hidden="true"><img src="/rebrand/mathpad-divider.svg" width="500" height="1" alt="" /></div>
    <div className="math-pad-input-area">{inputCount > 1 && <div className="math-pad-context"><span className="math-pad-input-label">Input {inputIndex + 1}</span><div className="math-pad-input-navigation"><button type="button" aria-label="Previous math input" disabled={inputIndex === 0 || !onInputChange} onClick={() => onInputChange?.(inputIndex - 1)}><PadIcon name="previous" /></button><span>{inputIndex + 1} of {inputCount}</span><button type="button" aria-label="Next math input" disabled={inputIndex >= inputCount - 1 || !onInputChange} onClick={() => onInputChange?.(inputIndex + 1)}><PadIcon name="next" /></button></div></div>}
      <textarea ref={inputRef} className={largeText ? 'large' : ''} aria-label="Math pad expression" value={value} rows={1} spellCheck={false} autoCapitalize="none" autoComplete="off" onChange={(event) => { onChange(event.target.value.replace(/[\r\n]/g, '')); rememberSelection(); }} onSelect={rememberSelection} onKeyUp={rememberSelection} onClick={rememberSelection} onBlur={rememberSelection} />
    </div>
    <footer className="math-pad-footer"><button type="button" aria-expanded={helpOpen} onClick={() => { setHelpOpen(!helpOpen); setSettingsOpen(false); }}>Help<PadIcon name="help" /></button></footer>
    {showSettings && settingsOpen && <div className="math-pad-popover"><h3>Math pad settings</h3><label><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} />Larger expression text</label></div>}
    {helpOpen && <div className="math-pad-popover"><h3>Using Math Pad</h3><p>Type your expression or insert symbols with the keys above. Use ^ for powers, / for fractions, and sqrt() for square roots. Your answer updates as you type. Choose Done to close the pad.</p></div>}
  </section>, document.body);
}
