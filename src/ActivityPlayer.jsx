import React, { useEffect, useRef, useState } from 'react';
import { Button, ButtonColor, ButtonSize, ButtonVariant, Modal, ModalSize } from 'react-magma-dom';
import ActivitySettingsModal, { useActivitySettings } from './ActivitySettingsModal';
import { activityHref } from './activityNavigation';
import { formatActivityDue } from './activityDates';
import { getActivityQuestions, isQuestionAnswered } from './activityQuestions';
import FactoringQuestion from './FactoringQuestion';
import ActivityResources from './ActivityResources';
import QuestionAttempts from './QuestionAttempts';
import MathQuestion from './MathQuestion';
import './activity-player.css';

const playerSessions = new Map();
const iconSizes = { selected: [16, 16], print: [16, 16], edit: [16, 16], details: [16, 16], radioChecked: [24, 24], radioUnchecked: [24, 24], accessibility: [24, 26.0321], previous: [20, 20], next: [20, 20], pageMarker: [4.41421, 4.41421] };
function PlayerIcon({ name }) {
  const [width, height] = iconSizes[name] || [24, 24];
  return <img src={`/rebrand/player-${name}.svg`} width={width} height={height} alt="" aria-hidden="true" />;
}

export default function ActivityPlayer({ chapter, section, activity: originalActivity }) {
  const activityKey = `${chapter}/${section}/${originalActivity.title}`;
  const [activity, saveActivity] = useActivitySettings(activityKey, originalActivity);
  const [session, setSession] = useState(() => playerSessions.get(activityKey) || { current: 0, answers: {}, flags: [] });
  const [view, setView] = useState('student');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tool, setTool] = useState(null);
  const [railOpen, setRailOpen] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const headingRef = useRef(null);
  const questions = getActivityQuestions(chapter, originalActivity.title);
  const question = questions[session.current];
  const answer = session.answers[question.id] || { text: '', choice: '' };
  const flagged = session.flags.includes(question.id);
  const answered = questions.filter((item) => isQuestionAnswered(item, session.answers[item.id])).length;
  const updateSession = (change) => setSession((current) => {
    const next = { ...current, ...change(current) };
    playerSessions.set(activityKey, next);
    return next;
  });
  const updateAnswer = (field, value) => updateSession((current) => ({ answers: { ...current.answers, [question.id]: { ...current.answers[question.id], [field]: value } } }));
  const goToQuestion = (current) => {
    updateSession(() => ({ current }));
    setTool(null);
    headingRef.current?.focus();
  };
  useEffect(() => {
    headingRef.current?.focus();
    const previous = document.title;
    document.title = `${activity.title} · Activity · MindTap`;
    return () => { document.title = previous; };
  }, [activity.title]);
  const back = () => { window.location.hash = activityHref(chapter, section, originalActivity.title); };

  return <section className="activity-player-page" aria-labelledby="player-title">
    <div className="overview-secondary-nav">
      <Button className="rebrand-button compact overview-back" variant={ButtonVariant.link} onClick={back}><img src="/rebrand/overview-back.svg" width="16" height="16" alt="" />Back</Button>
      <h1 id="player-title">{activity.title}</h1>
    </div>
    <div className="player-workspace">
      <div className="player-toolbar">
        <div className="player-view-tools"><div className="player-view-switch" role="group" aria-label="Activity preview mode">
          {['instructor', 'student'].map((mode) => <Button key={mode} className={`rebrand-button compact${view === mode ? ' selected' : ''}`} variant={ButtonVariant.link} aria-pressed={view === mode} onClick={() => setView(mode)}>{view === mode && <PlayerIcon name="selected" />}View as {mode === 'student' ? 'Student' : 'Instructor'}</Button>)}
        </div><Button className="rebrand-button compact player-icon-button" variant={ButtonVariant.link} aria-label="Print activity" onClick={() => window.print()}><PlayerIcon name="print" /></Button><Button className="rebrand-button compact player-icon-button" variant={ButtonVariant.link} aria-label="Edit activity settings" onClick={() => setSettingsOpen(true)}><PlayerIcon name="edit" /></Button></div>
        <button className="player-details-button" type="button" aria-expanded={detailsOpen} aria-controls="player-details" onClick={() => setDetailsOpen(!detailsOpen)}>Activity Details<PlayerIcon name="details" /></button>
      </div>
      {detailsOpen && <div className="player-activity-details" id="player-details"><p><strong>Due:</strong> {formatActivityDue(activity)}</p><p><strong>Points possible:</strong> {activity.points ?? '--'}</p><p>{activity.countsTowardsGrade === false ? 'Practice activity' : 'Counts toward grade'} · Responses are kept for this session and are not graded.</p></div>}
      <div className="player-body">
        <div className="player-question-main">
          <div className="player-progress"><div ref={headingRef} tabIndex={-1} className="player-question-counter" role="heading" aria-level={2} aria-live="polite"><span>{session.current + 1} of {questions.length}</span><span className="player-counter-divider" aria-hidden="true">|</span><span>{question.points} {question.points === 1 ? 'Point' : 'Points'}</span></div><div className="player-progress-track" role="progressbar" aria-label="Question position" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={session.current + 1}><span style={{ width: `${(session.current + 1) / questions.length * 100}%` }} /></div></div>
          <QuestionAttempts key={`attempts-${question.id}`} question={question} />
          <div className={`player-question-content${largeText ? ' large-text' : ''}`}>
            {view === 'instructor' && <p className="player-instructor-note">Instructor preview · Responses are not graded.</p>}
            {question.kind === 'math-response' ? <MathQuestion key={question.id} question={question} values={answer.values} onChange={(id, value) => updateAnswer('values', { ...answer.values, [id]: value })} /> : question.kind === 'greatest-common-factor' ? <FactoringQuestion question={question} value={answer.text || ''} onChange={(value) => updateAnswer('text', value)} /> : <><div className="player-fill-question"><label htmlFor={`answer-${question.id}`}>{question.opening}</label><input id={`answer-${question.id}`} type="text" aria-label={`Fill in the blank for question ${session.current + 1}`} value={answer.text} onChange={(event) => updateAnswer('text', event.target.value)} autoComplete="off" /><span>{question.ending}</span></div>
            <fieldset className="player-choice-question"><legend>{question.statement}</legend>{question.choices.map((choice) => <label className="player-radio" key={choice}><input type="radio" name={question.id} value={choice} checked={answer.choice === choice} onChange={() => updateAnswer('choice', choice)} /><PlayerIcon name={answer.choice === choice ? 'radioChecked' : 'radioUnchecked'} /><span>{choice}</span></label>)}</fieldset></>}
          </div>
          <ActivityResources key={question.id} activity={activity} question={question} />
          <Button className="player-grade-question" color={ButtonColor.secondary} variant={ButtonVariant.solid} size={ButtonSize.medium} onClick={() => setGradeOpen(true)}>Grade Question</Button>
        </div>
        <aside className={`player-tools${railOpen ? '' : ' is-collapsed'}`} aria-label="Question tools">
          {railOpen && <div className="player-tool-buttons"><button type="button" aria-label="Question list" aria-expanded={tool === 'questions'} onClick={() => setTool(tool === 'questions' ? null : 'questions')}><PlayerIcon name="checklist" /></button><button type="button" aria-label="Accessibility options" aria-expanded={tool === 'accessibility'} onClick={() => setTool(tool === 'accessibility' ? null : 'accessibility')}><PlayerIcon name="accessibility" /></button><button type="button" aria-label={flagged ? 'Unflag question' : 'Flag question'} aria-pressed={flagged} onClick={() => updateSession((current) => ({ flags: flagged ? current.flags.filter((id) => id !== question.id) : [...current.flags, question.id] }))}><PlayerIcon name="flag" /></button></div>}
          <button type="button" className="player-rail-toggle" aria-label={railOpen ? 'Collapse question tools' : 'Expand question tools'} aria-expanded={railOpen} onClick={() => { setRailOpen(!railOpen); setTool(null); }}><PlayerIcon name="collapse" /></button>
        </aside>
        {tool && <div className="player-tool-panel"><div className="player-tool-heading"><h2>{tool === 'questions' ? 'Questions' : 'Accessibility'}</h2><button type="button" onClick={() => setTool(null)} aria-label="Close question tools panel">×</button></div>{tool === 'questions' ? <><p>{answered} of {questions.length} answered</p><ol>{questions.map((item, index) => <li key={item.id}><button type="button" onClick={() => goToQuestion(index)}>Question {index + 1}{session.flags.includes(item.id) ? ' · Flagged' : ''}{isQuestionAnswered(item, session.answers[item.id]) ? ' · Answered' : ''}</button></li>)}</ol></> : <label className="player-text-size"><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} />Larger question text</label>}</div>}
      </div>
      <nav className="player-pagination" aria-label="Question navigation">
        <Button className="rebrand-button player-previous" variant={ButtonVariant.link} disabled={session.current === 0} aria-label="Previous question" onClick={() => goToQuestion(session.current - 1)}><PlayerIcon name="previous" /></Button>
        <select className="player-question-select" aria-label="Go to question" value={session.current} onChange={(event) => goToQuestion(Number(event.target.value))}>
          {questions.map((item, index) => <option key={item.id} value={index}>{index + 1} of {questions.length}{session.flags.includes(item.id) ? ' · Flagged' : ''}</option>)}
        </select>
        <Button className="rebrand-button rebrand-button-primary player-next" onClick={() => session.current < questions.length - 1 ? goToQuestion(session.current + 1) : setFinishOpen(true)}>{session.current === questions.length - 1 ? 'Finish' : 'Next'}<PlayerIcon name="next" /></Button>
      </nav>
    </div>
    {settingsOpen && <ActivitySettingsModal activity={activity} onSave={(updated) => { saveActivity(updated); setSettingsOpen(false); }} onClose={() => setSettingsOpen(false)} />}
    <Modal isOpen={gradeOpen} header="Grade Question" headerLevel={2} size={ModalSize.medium} onClose={() => setGradeOpen(false)}><p>Question grading is not connected in this prototype. Your answer is preserved, and no attempt or score has been recorded.</p><Button className="rebrand-button" variant={ButtonVariant.link} onClick={() => setGradeOpen(false)}>Back to question</Button></Modal>
    <Modal isOpen={finishOpen} header="Activity preview complete" headerLevel={2} size={ModalSize.medium} onClose={() => setFinishOpen(false)}><p>You have answered {answered} of {questions.length} questions. Responses are kept for this session only. No grades or submissions are recorded.</p><Button className="rebrand-button" variant={ButtonVariant.link} onClick={() => setFinishOpen(false)}>Keep reviewing</Button><Button className="rebrand-button rebrand-button-primary" onClick={back}>Back to overview</Button></Modal>
  </section>;
}
