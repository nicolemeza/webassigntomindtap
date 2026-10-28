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
  return <div className="author-empty"><svg className="author-empty-box" width="116" height="111" viewBox="0 0 116 111" fill="none" aria-hidden="true"><path d="M103.103 39.3233L115.336 27.0224C115.841 26.516 116.078 25.7997 115.977 25.0904C115.877 24.3812 115.45 23.76 114.825 23.4148L100.118 15.2946C99.0212 14.6894 97.6441 15.0926 97.0414 16.1951C96.4396 17.2986 96.8397 18.6832 97.9371 19.2884L109.998 25.9474L99.4991 36.5032L61.7383 15.6541L72.2363 5.09825L99.5009 20.1845C100.597 20.7896 101.975 20.3874 102.577 19.2839C103.18 18.1814 102.779 16.7958 101.682 16.1907L72.9266 0.281297C72.0434 -0.20636 70.946 -0.0488506 70.2344 0.667508L58 12.9693L45.7656 0.667508C45.0532 -0.0488506 43.9557 -0.205471 43.0734 0.281297L1.17511 23.4148C0.55029 23.76 0.122829 24.3803 0.0228226 25.0904C-0.0780687 25.7997 0.159115 26.516 0.663572 27.0224L12.8971 39.3233L0.663572 51.6233C0.159115 52.1305 -0.0780687 52.846 0.0228226 53.5561C0.122829 54.2653 0.55029 54.8865 1.17511 55.2309L13.8361 62.2218V85.5884C13.8361 86.4205 14.2866 87.1858 15.0114 87.5862L56.9097 110.719C57.2495 110.907 57.6248 111 58 111C58.3752 111 58.7505 110.907 59.0903 110.719L100.989 87.5862C101.713 87.1858 102.164 86.4205 102.164 85.5884V62.2218L114.825 55.2317C115.45 54.8865 115.877 54.2653 115.977 53.5561C116.078 52.8469 115.841 52.1305 115.336 51.6241L103.103 39.3233ZM58 59.8565L20.8091 39.3224L58 18.7874L95.1909 39.3224L58 59.8565ZM43.7646 5.09825L54.2617 15.6541L16.5009 36.5032L6.00285 25.9474L43.7646 5.09825ZM16.5026 42.1424L54.2635 62.9915L43.7646 73.5483L6.00285 52.6991L16.5026 42.1424ZM97.6326 84.2411L60.2656 104.872V67.9162C60.2656 66.6579 59.2514 65.6381 58 65.6381C56.7486 65.6381 55.7344 66.6579 55.7344 67.9162V104.872L18.3674 84.2411V64.7242L43.0734 78.3652C43.4159 78.5539 43.7911 78.6464 44.1628 78.6464C44.7496 78.6464 45.3302 78.4168 45.7656 77.979L58 65.6772L70.2344 77.979C70.6698 78.4177 71.2504 78.6464 71.8372 78.6464C72.2089 78.6464 72.5841 78.5539 72.9266 78.3652L97.6326 64.7242V84.2411ZM72.2363 73.5483L61.7374 62.9907L99.4983 42.1424L109.998 52.6982L72.2363 73.5483Z" fill="#007D95" /></svg><h3>Nothing here yet</h3><p>Browse the question bank to add questions to your activity.</p></div>;
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
