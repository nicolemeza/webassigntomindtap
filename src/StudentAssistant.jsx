import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, ButtonSize, ButtonVariant, IconButton, Input } from 'react-magma-dom';
import { assistantGreeting, assistantQuestionNumber, assistantReply } from './studentAssistantReplies';
import { getAssistantExamples } from './studentAssistantExamples';
import './student-assistant.css';

const conversations = new Map();
const asset = name => `/student-assistant/${name}.svg`;
const symbols = ['x', 'y', '²', '³', '√', '−', '×', '÷', '(', ')', 'π', '∞'];

function Tool({ name, label, small = false, ...props }) {
  return <IconButton className={`sa-icon-button${small ? ' sa-icon-small' : ''}`} variant={ButtonVariant.link} size={ButtonSize.medium} icon={<img src={asset(name)} width={small ? 20 : 24} height={small ? 20 : 24} alt="" />} aria-label={label} title={label} {...props} />;
}

export default function StudentAssistant({ open, id, activity, question, onClose }) {
  const titleId = useId();
  const key = `${activity.title}/${question.id}`;
  const examples = getAssistantExamples(activity, question);
  const [exampleId, setExampleId] = useState(null);
  const example = examples.find(item => item.id === exampleId);
  const [messages, setMessages] = useState(() => conversations.get(key) || (examples.length ? [] : [{ role: 'assistant', text: assistantGreeting(activity, question) }]));
  // Older page sessions may still contain the former automatic greeting.
  const chatMessages = examples.length && messages[0]?.role === 'assistant' ? messages.slice(1) : messages;
  const visibleMessages = example ? example.messages : chatMessages;
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [panel, setPanel] = useState(null);
  const [mathOpen, setMathOpen] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [notice, setNotice] = useState('');
  const [readAloud, setReadAloud] = useState(null);
  const [atBottom, setAtBottom] = useState(true);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const timer = useRef(null);
  const exampleHeadingRef = useRef(null);
  const suggestionRefs = useRef({});

  useEffect(() => { conversations.set(key, messages); }, [key, messages]);
  useEffect(() => { if (open) (example ? exampleHeadingRef : inputRef).current?.focus(); }, [open, example]);
  useEffect(() => { if (open && logRef.current) { logRef.current.scrollTop = example ? 0 : logRef.current.scrollHeight; setAtBottom(logRef.current.scrollHeight - logRef.current.clientHeight < 40); } }, [open, messages, thinking, panel, example]);
  useEffect(() => () => { clearTimeout(timer.current); window.speechSynthesis?.cancel(); }, []);

  const close = () => { window.speechSynthesis?.cancel(); setReadAloud(null); onClose(); };
  const resetActions = () => { window.speechSynthesis?.cancel(); setReadAloud(null); setFeedback({}); setNotice(''); setPanel(null); setMathOpen(false); setDraft(''); };
  const startConversation = () => { setExampleId(null); setMessages(examples.length ? [] : [{ role: 'assistant', text: assistantGreeting(activity, question) }]); resetActions(); };
  const backToExamples = () => {
    const previousId = exampleId;
    if (example) { setExampleId(null); resetActions(); } else startConversation();
    requestAnimationFrame(() => (suggestionRefs.current[previousId] || suggestionRefs.current[examples[0]?.id])?.focus());
  };
  const send = event => {
    event.preventDefault();
    if (!draft.trim() || thinking) return;
    const text = draft.trim();
    setMessages(current => [...current, { role: 'user', text }]);
    setDraft(''); setPanel(null); setThinking(true); setNotice('');
    timer.current = setTimeout(() => {
      setMessages(current => [...current, { role: 'assistant', text: assistantReply(question, text) }]);
      setThinking(false);
    }, 450);
    inputRef.current?.focus();
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); setNotice('Response copied.'); }
    catch { setNotice('Copy is unavailable. You can select and copy the response text.'); }
  };
  const listen = (text, index) => {
    if (!window.speechSynthesis) { setNotice('Read aloud is not supported in this browser.'); return; }
    window.speechSynthesis.cancel();
    if (readAloud === index) { setReadAloud(null); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = utterance.onerror = () => setReadAloud(null);
    setReadAloud(index); window.speechSynthesis.speak(utterance);
  };

  if (!open) return null;
  return createPortal(<section id={id} className="student-assistant" role="dialog" aria-modal="false" aria-labelledby={titleId} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
    <header className="sa-header">
      <div className="sa-brand"><img src={asset('assistant')} width="24" height="24" alt="" /><h2 id={titleId}>Student Assistant</h2></div>
      <div className="sa-header-tools">
        <Tool name="history" label="Conversation history" aria-pressed={panel === 'history'} onClick={() => setPanel(panel === 'history' ? null : 'history')} />
        <Tool name="settings" label="Assistant settings" aria-pressed={panel === 'settings'} onClick={() => setPanel(panel === 'settings' ? null : 'settings')} />
        <Tool name="minimize" label="Minimize Student Assistant" onClick={close} />
      </div>
    </header>
    {panel && <section className="sa-panel" aria-label={panel === 'settings' ? 'Assistant settings' : 'Conversation history'}>
      <h3>{panel === 'settings' ? 'Assistant settings' : 'Conversation history'}</h3>
      <p>{panel === 'settings' ? 'Prototype mode: replies are scripted, not AI-generated. Messages stay in memory for this page session and are not sent to a server. The assistant cannot grade your work.' : `This conversation is about ${activity.title}, question ${assistantQuestionNumber(activity, question) || ''}. Your conversation is kept when you minimize this panel.`}</p>
      {panel === 'history' && <Button variant={ButtonVariant.link} onClick={startConversation} disabled={thinking}>Start a new conversation</Button>}
      <Button variant={ButtonVariant.link} onClick={() => { setPanel(null); inputRef.current?.focus(); }}>Back to chat</Button>
    </section>}
    {examples.length > 0 && (example || chatMessages.length > 0) && <nav className="sa-example-nav" aria-label="Example navigation">
      <Button className="sa-back-examples" variant={ButtonVariant.link} onClick={backToExamples} disabled={thinking}><span aria-hidden="true">←</span> Back to examples</Button>
      {example && <div><span className="sa-example-label">Example conversation</span><h3 ref={exampleHeadingRef} tabIndex={-1}>{example.title}</h3></div>}
    </nav>}
    <div className="sa-log-wrap"><div className="sa-messages" role="log" aria-label="Conversation" aria-live={example ? 'off' : 'polite'} aria-relevant="additions" ref={logRef} onScroll={event => { const log = event.currentTarget; setAtBottom(log.scrollHeight - log.scrollTop - log.clientHeight < 40); }}>
      {visibleMessages.map((message, index) => <div className={`sa-message sa-message-${message.role}`} key={`${exampleId || 'chat'}-${index}`}>
        <p>{message.text}</p>
        {message.role === 'assistant' && <>
          {index === 0 && !examples.length && <p className="sa-prototype-note">Prototype · Guided sample replies, not live AI.</p>}
          <div className="sa-reactions" aria-label="Response actions">
            <Tool small name="like" label="Helpful response" aria-pressed={feedback[index] === 'like'} onClick={() => { setFeedback(current => ({ ...current, [index]: 'like' })); setNotice('Thanks for your feedback!'); }} />
            <Tool small name="dislike" label="Unhelpful response" aria-pressed={feedback[index] === 'dislike'} onClick={() => { setFeedback(current => ({ ...current, [index]: 'dislike' })); setNotice('Thanks for your feedback!'); }} />
            <Tool small name="copy" label="Copy response" onClick={() => copy(message.text)} />
            <Tool small name="listen" label={readAloud === index ? 'Stop reading response' : 'Read response aloud'} aria-pressed={readAloud === index} onClick={() => listen(message.text, index)} />
          </div>
        </>}
      </div>)}
      {examples.length > 0 && !example && chatMessages.length === 0 && <section className="sa-suggestions" aria-labelledby={`${titleId}-examples`}>
        <h3 id={`${titleId}-examples`}>Explore example conversations</h3>
        <p>Choose a student question to see how the conversation unfolds.</p>
        <div>{examples.map(item => <button ref={element => { suggestionRefs.current[item.id] = element; }} key={item.id} type="button" className="sa-suggestion" onClick={() => { resetActions(); setExampleId(item.id); }}><span><strong>{item.title}</strong><span>{item.description}</span></span><span className="sa-suggestion-arrow" aria-hidden="true">→</span></button>)}</div>
      </section>}
      {example && <div className="sa-example-end"><p>Ready to explore another way to get help?</p><Button variant={ButtonVariant.link} onClick={backToExamples}>Try another example</Button></div>}
      {thinking && <div className="sa-thinking" role="status"><img src="/student-assistant/thinking.png" width="24" height="24" alt="" />Thinking…</div>}
    </div>{!atBottom && <Tool name="down" label="Jump to latest message" className="sa-icon-button sa-jump" onClick={() => { logRef.current.scrollTop = logRef.current.scrollHeight; }} />}</div>
    {notice && <div className="sa-notice" role="status">{notice === 'Thanks for your feedback!' && <img src={asset('done')} width="20" height="20" alt="" />}{notice}</div>}
    {!example && <div className="sa-compose-area">
      <form className="sa-composer" onSubmit={send} aria-label="Message Student Assistant">
        <Input ref={inputRef} labelText="Message Student Assistant" isLabelVisuallyHidden placeholder="How can student assistant help" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} hasCharacterCounter={false} containerStyle={{ width: '100%' }} inputWrapperStyle={{ border: 0, outline: 'none', boxShadow: 'none', background: 'transparent' }} inputStyle={{ border: 0, boxShadow: 'none', padding: '0 2px', fontFamily: 'inherit', fontSize: 16 }} />
        {mathOpen && <div className="sa-symbols" role="group" aria-label="Math symbols">{symbols.map(symbol => <button type="button" key={symbol} onClick={() => { setDraft(current => (current + symbol).slice(0, 2000)); inputRef.current?.focus(); }}>{symbol}</button>)}</div>}
        <div className="sa-composer-tools"><div>
          <Tool name="add" label="Include current question" onClick={() => { setDraft(current => `${current}${current ? '\n' : ''}Help me with ${activity.title}, question ${assistantQuestionNumber(activity, question) || ''}.`.slice(0, 2000)); inputRef.current?.focus(); }} />
          <Tool name="math" label="Math mode" aria-pressed={mathOpen} onClick={() => setMathOpen(!mathOpen)} />
          <Tool name="keyboard" label="Symbol keyboard" aria-expanded={mathOpen} onClick={() => setMathOpen(!mathOpen)} />
        </div><Tool name="send" label="Send message" className="sa-icon-button sa-send" type="submit" disabled={!draft.trim() || thinking} /></div>
      </form>
    </div>}
  </section>, document.body);
}
