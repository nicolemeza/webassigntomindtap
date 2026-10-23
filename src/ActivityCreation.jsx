import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertVariant, Button, ButtonVariant, IconButton, Input, Modal, ModalSize, Spinner, Toast, ToastsContainer } from 'react-magma-dom';
import { CloseIcon, DeleteIcon, EditIcon, ExpandLessIcon, ExpandMoreIcon, VisibilityIcon } from 'react-magma-icons';
import ActivityPlayer from './ActivityPlayer';
import ActivitySettingsModal from './ActivitySettingsModal';
import { defaultActivitySettings } from './ActivityBehaviorSettings';
import QuestionBank from './QuestionBank';
import QuestionBankPreview from './QuestionBankPreview';
import { questionSummary } from './questionBankData';
import { readActivityDraft, saveActivityDraft } from './createdActivities';
import { scaleQuestionPoints, totalQuestionPoints } from './activityAuthoring';
import './activity-creation.css';

function EmptyQuestions() {
  return <div className="author-empty"><svg className="author-empty-box" viewBox="0 0 128 112" fill="none" aria-hidden="true"><path d="m64 27 35-20 25 26-35 20-25-26Zm0 0L29 7 4 33l35 20 25-26Zm0 1L29 49 4 74l35 20 25-26 25 26 35-20-25-25-35-21Zm-35 53v17l35 12 35-12V81M64 69v41" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /></svg><h3>Nothing here yet</h3><p>Browse the question bank to add questions to your activity.</p></div>;
}

export default function ActivityCreation({ chapters, onCancel, onAssign }) {
  const [initial] = useState(() => readActivityDraft());
  const [draft, setDraft] = useState(() => initial || { id: `created-${crypto.randomUUID()}`, title: '', questions: [], description: '', points: 0, icon: 'assessment', type: 'HOMEWORK', countsTowardsGrade: true, settings: { ...defaultActivitySettings } });
  const [loading, setLoading] = useState(true);
  const [titleOpen, setTitleOpen] = useState(!initial);
  const [title, setTitle] = useState(initial?.title || '');
  const [titleError, setTitleError] = useState('');
  const [screen, setScreen] = useState('editor');
  const [saved, setSaved] = useState(Boolean(initial));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const heading = useRef(null);
  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 650); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (!loading && !titleOpen) heading.current?.focus(); }, [loading, titleOpen, screen]);
  const change = (next) => { setDraft((current) => ({ ...current, ...next })); setSaved(false); setError(''); };
  const totalPoints = totalQuestionPoints(draft.questions);
  const validPoints = draft.questions.every((question) => question.points !== '' && Number.isFinite(Number(question.points)) && Number(question.points) >= 0);
  const activity = { ...draft, points: totalPoints };
  const save = (next = activity) => {
    if (!validPoints) { setError('Enter points of zero or greater for every question.'); return false; }
    try { saveActivityDraft(next); setSaved(true); setMessage('Activity has been saved.'); setError(''); return true; }
    catch { setError('The activity could not be saved in this browser. Please try again.'); return false; }
  };
  const close = () => { if (!saved && draft.title) setDiscardOpen(true); else onCancel(); };
  const move = (index, direction) => {
    const questions = [...draft.questions];
    [questions[index], questions[index + direction]] = [questions[index + direction], questions[index]];
    change({ questions });
  };
  if (loading) return <section className="activity-creation-page author-loading" aria-label="Loading activity creator" aria-busy="true"><Spinner /><p role="status">Preparing your activity…</p></section>;
  return <section className="activity-creation-page" aria-label="Create New Activity">
    <header className="author-header"><IconButton className="author-close" variant={ButtonVariant.link} icon={<CloseIcon />} aria-label="Close activity creator" onClick={close} /><h1 tabIndex={-1} ref={heading}>Create New Activity</h1><Button className="rebrand-button rebrand-button-primary" disabled={!draft.title || !draft.questions.length || !validPoints || screen === 'bank'} onClick={() => { if (save()) setSettingsOpen(true); }}>Assign this activity</Button></header>
    {screen === 'bank' ? <QuestionBank chapters={chapters} addedQuestions={draft.questions} onAdd={(questions) => { const added = questions.filter((question) => !draft.questions.some((item) => item.id === question.id)); change({ questions: [...draft.questions, ...added] }); setMessage(`${added.length} ${added.length === 1 ? 'question added' : 'questions added'} to activity.`); }} onBack={() => setScreen('editor')} />
      : screen === 'preview' ? <div className="author-activity-preview"><ActivityPlayer key={draft.id} chapter="Activity preview" section="Questions" activity={activity} sessionKey={`builder-preview/${draft.id}`} onBack={() => setScreen('editor')} backLabel="Back to edit" onActivityChange={(updated) => change({ ...updated, questions: scaleQuestionPoints(updated.questions, updated.points) })} /></div>
        : <div className="author-editor">
          <div className="author-title-row"><div><span className="author-field-label">Title</span><button className="author-title-button" aria-label={`Edit title: ${draft.title || 'Untitled activity'}`} onClick={() => { setTitle(draft.title); setTitleOpen(true); }}>{draft.title || 'Untitled activity'}<EditIcon aria-hidden="true" /></button></div><div className="author-editor-actions"><span className="author-save-status" aria-live="polite">{saved ? 'All changes saved' : draft.title ? 'Unsaved changes' : ''}</span><Button className="rebrand-button" disabled={!draft.questions.length || !validPoints} onClick={() => setScreen('preview')}><VisibilityIcon />Preview</Button><Button className="rebrand-button rebrand-button-primary" disabled={!draft.title} onClick={() => save()}>Save</Button></div></div>
          <div className="author-section-title"><h2>Questions <span className="author-count">{draft.questions.length}</span></h2></div>
          <div className="author-question-toolbar"><Button className="rebrand-button" disabled={!draft.title} onClick={() => setScreen('bank')}><img src="/rebrand/search.svg" width="20" height="20" alt="" />Browse Question Bank</Button><span className="author-total"><strong>{Number.isFinite(totalPoints) ? Number(totalPoints.toFixed(2)) : '—'}</strong> Total Points</span>{draft.questions.length > 0 && <Button className="rebrand-button compact" variant={ButtonVariant.link} onClick={() => change({ questions: draft.questions.map((question) => ({ ...question, points: 1 })) })}>Reset points</Button>}</div>
          {error && <p className="author-error" role="alert">{error}</p>}
          <div className="author-question-list">
            {!draft.questions.length ? <EmptyQuestions /> : draft.questions.map((question, index) => <article className="author-selected-question" key={question.id}>
              <div className="author-selected-row"><span className="author-question-number">{index + 1}.</span><div className="author-reorder"><IconButton variant={ButtonVariant.link} icon={<ExpandLessIcon />} disabled={index === 0} aria-label={`Move question ${index + 1} up`} onClick={() => move(index, -1)} /><IconButton variant={ButtonVariant.link} icon={<ExpandMoreIcon />} disabled={index === draft.questions.length - 1} aria-label={`Move question ${index + 1} down`} onClick={() => move(index, 1)} /></div><IconButton className="bank-preview-button" variant={ButtonVariant.link} icon={previewQuestion === question.id ? <CloseIcon /> : <VisibilityIcon />} aria-label={`${previewQuestion === question.id ? 'Close preview of' : 'Preview'} question ${index + 1}`} aria-expanded={previewQuestion === question.id} onClick={() => setPreviewQuestion(previewQuestion === question.id ? null : question.id)} /><div className="author-selected-info"><h3>{question.title}</h3><p>{questionSummary(question)}</p><span>{question.questionType} · {question.assignment}</span></div><label className="author-question-points">Points<input type="number" min="0" step="0.25" aria-label={`Points for question ${index + 1}`} value={question.points} onChange={(event) => change({ questions: draft.questions.map((item) => item.id === question.id ? { ...item, points: event.target.value === '' ? '' : Number(event.target.value) } : item) })} /></label><IconButton className="author-remove" variant={ButtonVariant.link} icon={<DeleteIcon />} aria-label={`Remove question ${index + 1}`} onClick={() => change({ questions: draft.questions.filter((item) => item.id !== question.id) })} /></div>
              {previewQuestion === question.id && <QuestionBankPreview question={question} />}
            </article>)}
          </div>
        </div>}
    <Modal className="author-modal" header="Title this Activity" headerLevel={2} isOpen={titleOpen} size={ModalSize.medium} onClose={() => draft.title ? setTitleOpen(false) : onCancel()}>
      <form onSubmit={(event) => { event.preventDefault(); if (!title.trim()) { setTitleError('Enter an activity title.'); return; } change({ title: title.trim() }); setTitleOpen(false); }} noValidate><p>To save this activity, you must give it a title.</p><Input labelText="Activity title *" value={title} autoFocus required onChange={(event) => { setTitle(event.target.value); setTitleError(''); }} errorMessage={titleError} /><div className="author-modal-actions"><Button type="button" className="rebrand-button" onClick={() => draft.title ? setTitleOpen(false) : onCancel()}>Cancel</Button><Button type="submit" className="rebrand-button rebrand-button-primary">Save</Button></div></form>
    </Modal>
    {settingsOpen && <ActivitySettingsModal activity={activity} saveLabel="Save and Close" onClose={() => setSettingsOpen(false)} onSave={(updated) => {
      const next = { ...updated, points: Math.round(updated.points * 100) / 100, questions: scaleQuestionPoints(updated.questions, updated.points) };
      if (save(next)) { setDraft(next); setSettingsOpen(false); onAssign(next); }
    }} />}
    <Modal className="author-modal" header="Leave activity creator?" isOpen={discardOpen} onClose={() => setDiscardOpen(false)} size={ModalSize.medium}><p>Your latest changes haven’t been saved.</p><div className="author-modal-actions"><Button className="rebrand-button" onClick={() => setDiscardOpen(false)}>Keep editing</Button><Button className="rebrand-button" onClick={onCancel}>Discard changes</Button><Button className="rebrand-button rebrand-button-primary" onClick={() => { if (save()) onCancel(); }}>Save and close</Button></div></Modal>
    <ToastsContainer>{message && <Toast key={message} variant={AlertVariant.success} toastDuration={4000} onDismiss={() => setMessage('')}>{message}</Toast>}</ToastsContainer>
  </section>;
}

export function ActivityLocationModal({ activity, chapters, onCancel, onSave }) {
  const id = useId();
  const [folder, setFolder] = useState(JSON.stringify([chapters.find((chapter) => chapter.startsWith('Chapter 2.')) || chapters[0], 'chapter']));
  const [placement, setPlacement] = useState('end');
  const [error, setError] = useState('');
  return <Modal className="author-modal" header="Choose Activity’s Location" headerLevel={2} size={ModalSize.medium} isOpen onClose={onCancel}>
    <form className="author-location-form" onSubmit={(event) => { event.preventDefault(); const [chapter, section] = JSON.parse(folder); try { onSave({ ...activity, chapter, section, placement }); } catch { setError('The activity could not be saved. Please try again.'); } }}>
      <p>Choose location for <strong>{activity.title}</strong></p>
      <div className="author-location-field"><label htmlFor={`${id}-folder`}>Folder</label><select id={`${id}-folder`} value={folder} onChange={(event) => setFolder(event.target.value)}><option value={JSON.stringify(['Learning Path', 'chapter'])}>College Algebra (Directly on the Learning Path)</option>{chapters.map((chapter) => <optgroup key={chapter} label={chapter}><option value={JSON.stringify([chapter, 'chapter'])}>{chapter}</option>{['Learn It', 'Study It', 'Apply It'].map((section) => <option key={section} value={JSON.stringify([chapter, section])}>{chapter} / {section}</option>)}</optgroup>)}</select></div>
      <div className="author-location-field"><label htmlFor={`${id}-placement`}>Placement</label><select id={`${id}-placement`} value={placement} onChange={(event) => setPlacement(event.target.value)}><option value="end">At end</option><option value="start">At beginning</option></select></div>
      {error && <p className="author-error" role="alert">{error}</p>}
      <div className="author-modal-actions"><Button type="button" className="rebrand-button" onClick={onCancel}>Cancel</Button><Button className="rebrand-button rebrand-button-primary" type="submit">Add to Learning Path</Button></div>
    </form>
  </Modal>;
}
