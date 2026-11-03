import React from 'react';
import { Button, ButtonVariant, Modal, ModalSize } from 'react-magma-dom';
import './course-pages.css';
import { saveCourseState, useCourseState } from './courseModel';

export function ActionButton({ children, primary, ...props }) { return <Button className={`rebrand-button${primary ? ' rebrand-button-primary' : ''}`} variant={ButtonVariant.solid} {...props}>{children}</Button>; }
export function CourseDialog({ title, children, onClose, onSave, saveLabel = 'Save', wide, disabled }) {
  return <Modal className="course-dialog" header={title} headerLevel={2} isOpen size={wide ? ModalSize.large : ModalSize.medium} onClose={onClose}><form className="course-form" onSubmit={(event) => { event.preventDefault(); onSave?.(); }}>
    {children}{onSave && <footer className="course-dialog-actions"><ActionButton type="button" onClick={onClose}>Cancel</ActionButton><ActionButton primary type="submit" disabled={disabled}>{saveLabel}</ActionButton></footer>}
  </form></Modal>;
}
export function Check({ children, checked, onChange, disabled }) { return <label className="course-check"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} disabled={disabled} /><span>{children}</span></label>; }
export function Field({ label, children, ...props }) { return <label className="course-field"><span>{label}</span>{children || <input {...props} />}</label>; }
export function Tile({ title, description, icon = '⚙', onClick }) { return <button type="button" className="course-tile" onClick={onClick}><span className="course-tile-icon" aria-hidden="true">{icon}</span><span><strong>{title}</strong>{description && <small>{description}</small>}</span><span className="course-tile-arrow" aria-hidden="true">›</span></button>; }
export function ResponseActions({ text, id, notify }) {
  const state = useCourseState();
  const vote = state.feedback[`vote:${id}`] || '';
  const setVote = (value) => saveCourseState({ feedback: { ...state.feedback, [`vote:${id}`]: value } });
  const copy = async () => { try { await navigator.clipboard.writeText(text); notify?.('Copied to clipboard'); } catch { notify?.('Clipboard access unavailable. Select the text to copy it.'); } };
  return <div className="response-actions"><button type="button" title="Copy response" aria-label="Copy response to clipboard" onClick={copy}><img src="/student-assistant/copy.svg" width="20" height="20" alt="" /></button><button type="button" title="Helpful" aria-label="Mark response as helpful" aria-pressed={vote === 'helpful'} onClick={() => { setVote(vote === 'helpful' ? '' : 'helpful'); notify?.('Feedback saved'); }}><img src="/student-assistant/like.svg" width="20" height="20" alt="" /></button><button type="button" title="Not helpful" aria-label="Mark response as not helpful" aria-pressed={vote === 'unhelpful'} onClick={() => { setVote(vote === 'unhelpful' ? '' : 'unhelpful'); notify?.('Feedback saved'); }}><img src="/student-assistant/dislike.svg" width="20" height="20" alt="" /></button></div>;
}
