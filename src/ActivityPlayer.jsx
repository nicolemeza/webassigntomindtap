import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, ButtonColor, ButtonSize, ButtonVariant, InputMessage, Modal, ModalSize, ThemeContext } from 'react-magma-dom';
import { WarningIcon } from 'react-magma-icons';
import ActivitySettingsModal, { useActivitySettings } from './ActivitySettingsModal';
import { activityHref } from './activityNavigation';
import { formatActivityDue } from './activityDates';
import { getActivityQuestions, isQuestionAnswered } from './activityQuestions';
import { hasAnyGraphQuestionResponse } from './graphsQuestions';
import FactoringQuestion from './FactoringQuestion';
import ActivityResources from './ActivityResources';
import QuestionRejoinder from './QuestionRejoinder';
import QuestionAttempts from './QuestionAttempts';
import MathQuestion from './MathQuestion';
import ChoiceQuestion from './ChoiceQuestion';
import './activity-player.css';
import './activity-question-integrated.css';
import { gradingFields, fieldComplete, gradedAnswerState, submitQuestion } from './questionGrading';

const playerSessions = new Map();
const iconSizes = { selected: [16, 16], print: [16, 16], edit: [16, 16], details: [16, 16], radioChecked: [24, 24], radioUnchecked: [24, 24], accessibility: [24, 26.0321], previous: [20, 20], next: [20, 20], pageMarker: [4.41421, 4.41421] };
const emptyQuestionAnswer = (question) => question.kind === 'choice'
  ? { selections: [] }
  : question.kind === 'math-response'
    ? { values: {} }
    : { text: '', choice: '' };
function PlayerIcon({ name }) {
  const [width, height] = iconSizes[name] || [24, 24];
  return <img src={`/rebrand/player-${name}.svg`} width={width} height={height} alt="" aria-hidden="true" />;
}

export default function ActivityPlayer({ chapter, section, activity: originalActivity, onBack, backLabel = 'Back', onActivityChange, sessionKey }) {
  const theme = useContext(ThemeContext);
  const activityKey = sessionKey || `${chapter}/${section}/${originalActivity.id || originalActivity.title}`;
  const [storedActivity, saveActivity] = useActivitySettings(activityKey, originalActivity);
  const activity = onActivityChange ? originalActivity : storedActivity;
  const questions = activity.questions || getActivityQuestions(chapter, originalActivity.title);
  const [session, setSession] = useState(() => {
    const previous = playerSessions.get(activityKey) || { current: 0, answers: {}, flags: [] };
    return { ...previous, current: Math.min(previous.current, questions.length - 1) };
  });
  const [view, setView] = useState('student');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tool, setTool] = useState(null);
  const [railOpen, setRailOpen] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const headingRef = useRef(null);
  const question = questions[session.current];
  const alternativeLayout = question.id.startsWith('r5-factoring-question-') ||
    question.kind === 'choice' ||
    (chapter === 'Chapter 2. Functions and Graphs' && originalActivity.title === '2.5 HW Graphs of Equations & Circles') ||
    (chapter === 'Chapter R. A Review of Basic Algebra' && originalActivity.title === 'Chapter R Test');
  const hideQuestionResources = chapter === 'Chapter R. A Review of Basic Algebra' && originalActivity.title === 'Chapter R Test';
  const hideQuestionAttempts = hideQuestionResources;
  const answer = session.answers[question.id] || { text: '', choice: '' };
  const savedAt = session.savedAt?.[question.id];
  const history = session.grades?.[question.id] || {};
  // An unchanged response is feedback-only: it is not an incorrect answer.
  const invalidFields = [];
  const fields = gradingFields(question);
  const retryPending = Boolean(session.retryPending?.[question.id]);
  const allAttemptsExhausted = fields.length > 0 && fields.every((field) => fieldComplete(history[field.id]));
  const gradeActionLabel = hideQuestionResources ? 'Save Answer' : retryPending ? 'Try Again' : 'Grade Answer';
  const responseFieldIds = question.kind === 'math-response'
    ? [...new Set([
      ...(question.inputs || []).map((field) => field.id),
      ...question.blocks.filter((block) => block.type === 'selections' || block.type === 'graph-choices' || block.type === 'graph-pad' || block.type === 'number-line').map((block) => block.id),
    ])]
    : fields.map((field) => field.id);
  const isGraphsQuestion = question.id.startsWith('graphs-circles-question-');
  const hasResponse = isGraphsQuestion
    ? hasAnyGraphQuestionResponse(question, answer.values)
    : responseFieldIds.some((fieldId) => {
      const value = question.kind === 'greatest-common-factor' ? answer.text : answer.values?.[fieldId];
      return Boolean(value?.trim() && value !== '[]');
    });
  const gradeUnavailable = hideQuestionResources
    ? !hasResponse
    : allAttemptsExhausted || (!retryPending && (!fields.length || !hasResponse));
  const flagged = session.flags.includes(question.id);
  const answered = questions.filter((item) => isQuestionAnswered(item, session.answers[item.id])).length;
  const updateSession = (change) => setSession((current) => {
    const next = { ...current, ...change(current) };
    playerSessions.set(activityKey, next);
    return next;
  });
  const updateAnswer = (field, value) => updateSession((current) => ({
    answers: { ...current.answers, [question.id]: { ...current.answers[question.id], [field]: value } },
    feedback: { ...current.feedback, [question.id]: null },
  }));
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
  const back = onBack || (() => { window.location.hash = activityHref(chapter, section, originalActivity.id || originalActivity.title); });
  const gradeQuestion = () => {
    if (hideQuestionResources) {
      setSavingQuestionId(question.id);
      window.setTimeout(() => {
        updateSession((current) => ({ savedAt: { ...current.savedAt, [question.id]: new Date().toISOString() } }));
        setSavingQuestionId(null);
      }, 500);
      return;
    }
    if (retryPending) {
      updateSession((current) => ({
        answers: { ...current.answers, [question.id]: emptyQuestionAnswer(question) },
        feedback: { ...current.feedback, [question.id]: null },
        rejoinders: { ...current.rejoinders, [question.id]: null },
        retryPending: { ...current.retryPending, [question.id]: false },
      }));
      return;
    }
    updateSession((current) => {
      const result = submitQuestion(question, current.answers[question.id], current.grades?.[question.id], current.lastSubmitted?.[question.id]);
      const isCorrect = result.submitted > 0 && fields.length > 0 && fields.every((field) => {
        const attempts = result.history[field.id] || [];
        return attempts[attempts.length - 1] === true;
      });
      const attemptsExhausted = fields.length > 0 && fields.every((field) => fieldComplete(result.history[field.id]));
      return {
        grades: { ...current.grades, [question.id]: result.history },
        lastSubmitted: { ...current.lastSubmitted, [question.id]: result.lastSubmitted },
        feedback: { ...current.feedback, [question.id]: { message: result.message, emptyFields: result.emptyFields, unchangedFields: result.unchangedFields } },
        rejoinders: { ...current.rejoinders, [question.id]: result.submitted > 0 ? (isCorrect ? 'correct' : 'incorrect') : current.rejoinders?.[question.id] },
        retryPending: { ...current.retryPending, [question.id]: result.submitted > 0 && !attemptsExhausted },
      };
    });
  };
  const isSaving = savingQuestionId === question.id;
  const gradeButton = <Button className={alternativeLayout ? 'player-grade-question-magma' : 'player-grade-question'} color={ButtonColor.secondary} variant={ButtonVariant.solid} size={ButtonSize.medium} disabled={gradeUnavailable || view === 'instructor' || isSaving} onClick={gradeQuestion}>{gradeActionLabel}</Button>;
  const questionFeedback = session.feedback?.[question.id];
  const gradeFeedback = questionFeedback?.message;
  const isUnchangedFeedback = Boolean(questionFeedback?.unchangedFields?.length && !questionFeedback?.emptyFields?.length);

  return <section className="activity-player-page" aria-labelledby="player-title">
    <div className="overview-secondary-nav">
      <Button className="rebrand-button compact overview-back" variant={ButtonVariant.link} onClick={back}><img src="/rebrand/overview-back.svg" width="16" height="16" alt="" />{backLabel}</Button>
      <h1 id="player-title">{activity.title}</h1>
    </div>
    <div className="player-workspace">
      <div className="player-toolbar">
        <div className="player-view-tools"><div className="player-view-switch" role="group" aria-label="Activity preview mode">
          {['instructor', 'student'].map((mode) => <Button key={mode} className={`rebrand-button compact${view === mode ? ' selected' : ''}`} variant={ButtonVariant.link} aria-pressed={view === mode} onClick={() => setView(mode)}>{view === mode && <PlayerIcon name="selected" />}View as {mode === 'student' ? 'Student' : 'Instructor'}</Button>)}
        </div><Button className="rebrand-button compact player-icon-button" variant={ButtonVariant.link} aria-label="Print activity" onClick={() => window.print()}><PlayerIcon name="print" /></Button><Button className="rebrand-button compact player-icon-button" variant={ButtonVariant.link} aria-label="Edit activity settings" onClick={() => setSettingsOpen(true)}><PlayerIcon name="edit" /></Button></div>
        <button className="player-details-button" type="button" aria-expanded={detailsOpen} aria-controls="player-details" onClick={() => setDetailsOpen(!detailsOpen)}>Activity Details<PlayerIcon name="details" /></button>
      </div>
      {detailsOpen && <div className="player-activity-details" id="player-details"><p><strong>Due:</strong> {formatActivityDue(activity)}</p><p><strong>Points possible:</strong> {activity.points ?? '--'}</p><p>{activity.countsTowardsGrade === false ? 'Practice activity' : 'Counts toward grade'} · Scores and responses are kept locally for this session only, not sent to a gradebook.</p></div>}
      <div className="player-body">
        <div className={`player-question-main${alternativeLayout ? ' player-question-integrated' : ''}${hideQuestionResources ? ' player-question-integrated--test' : ''}`} style={{ '--border': theme.colors.border, '--field-validation-color': theme.colors.danger }}>
          <div className="player-progress"><div ref={headingRef} tabIndex={-1} className="player-question-counter" role="heading" aria-level={2} aria-live="polite"><span>{session.current + 1} of {questions.length}</span><span className="player-counter-divider" aria-hidden="true">|</span><span>{question.points} {question.points === 1 ? 'Point' : 'Points'}</span></div><div className="player-progress-track" role="progressbar" aria-label="Question position" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={session.current + 1}><span style={{ width: `${(session.current + 1) / questions.length * 100}%` }} /></div></div>
          <div className={alternativeLayout ? 'question-surface' : undefined}>
          <QuestionAttempts key={`attempts-${question.id}`} question={question} history={history}>{({ summary, details }) => <>
          {!alternativeLayout && <section className="question-attempts" aria-label="Attempts">{summary}{details}</section>}
          <div className={`player-question-content${largeText ? ' large-text' : ''}`}>
            {view === 'instructor' && <p className="player-instructor-note">Instructor preview · Responses are not graded.</p>}
            {question.kind === 'choice' ? <ChoiceQuestion question={question} value={answer.selections} disabled={fieldComplete(history.answer) || view === 'instructor' || retryPending} onChange={(value) => updateAnswer('selections', value)} /> : question.kind === 'math-response' ? <MathQuestion key={question.id} question={question} values={answer.values} disabled={view === 'instructor' || retryPending} history={history} lastSubmitted={session.lastSubmitted?.[question.id]} invalidFields={invalidFields} onChange={(id, value) => updateAnswer('values', { ...answer.values, [id]: value })} /> : question.kind === 'greatest-common-factor' ? <FactoringQuestion question={question} value={answer.text || ''} disabled={fieldComplete(history.answer) || view === 'instructor' || retryPending} invalid={invalidFields.includes('answer')} gradeState={gradedAnswerState(answer.text, history.answer, session.lastSubmitted?.[question.id]?.answer)} onChange={(value) => updateAnswer('text', value)} /> : <><div className="player-fill-question"><label htmlFor={`answer-${question.id}`}>{question.opening}</label><input id={`answer-${question.id}`} type="text" aria-label={`Fill in the blank for question ${session.current + 1}`} value={answer.text} onChange={(event) => updateAnswer('text', event.target.value)} autoComplete="off" disabled={view === 'instructor' || retryPending} /><span>{question.ending}</span></div>
            <fieldset className="player-choice-question"><legend>{question.statement}</legend>{question.choices.map((choice) => <label className="player-radio" key={choice}><input type="radio" name={question.id} value={choice} checked={answer.choice === choice} disabled={view === 'instructor' || retryPending} onChange={() => updateAnswer('choice', choice)} /><PlayerIcon name={answer.choice === choice ? 'radioChecked' : 'radioUnchecked'} /><span>{choice}</span></label>)}</fieldset></>}
            {gradeFeedback && (isUnchangedFeedback
              ? <div id={`grade-feedback-${question.id}`} className="player-grade-feedback player-grade-feedback-warning" role="status"><WarningIcon aria-hidden="true" size={theme.iconSizes.small} /><span>{gradeFeedback}</span></div>
              : <InputMessage id={`grade-feedback-${question.id}`} className="player-grade-feedback" hasError role="alert">{gradeFeedback}</InputMessage>)}
          </div>
          {alternativeLayout && !hideQuestionResources && <ActivityResources key={`resources-${question.id}`} activity={activity} question={question} variant="integrated" rejoinder={session.rejoinders?.[question.id] && <QuestionRejoinder key={`rejoinder-${question.id}-${session.rejoinders[question.id]}`} activity={activity} question={question} status={session.rejoinders[question.id]} />} />}
          {alternativeLayout && !hideQuestionResources && <div className="player-question-grading-footer" style={{ backgroundColor: theme.colors.neutral100 }}><div className="player-question-grade-action">{gradeButton}</div>{!hideQuestionAttempts && summary}</div>}
          {alternativeLayout && !hideQuestionAttempts && details}
          {!alternativeLayout && !hideQuestionResources && <ActivityResources key={question.id} activity={activity} question={question} />}
          {!alternativeLayout && gradeButton}
          </>}</QuestionAttempts>
          </div>
        </div>
        <aside className={`player-tools${railOpen ? '' : ' is-collapsed'}`} aria-label="Question tools">
          {railOpen && <div className="player-tool-buttons"><button type="button" aria-label="Question list" aria-expanded={tool === 'questions'} onClick={() => setTool(tool === 'questions' ? null : 'questions')}><PlayerIcon name="checklist" /></button><button type="button" aria-label="Accessibility options" aria-expanded={tool === 'accessibility'} onClick={() => setTool(tool === 'accessibility' ? null : 'accessibility')}><PlayerIcon name="accessibility" /></button><button type="button" aria-label={flagged ? 'Unflag question' : 'Flag question'} aria-pressed={flagged} onClick={() => updateSession((current) => ({ flags: flagged ? current.flags.filter((id) => id !== question.id) : [...current.flags, question.id] }))}><PlayerIcon name="flag" /></button></div>}
          <button type="button" className="player-rail-toggle" aria-label={railOpen ? 'Collapse question tools' : 'Expand question tools'} aria-expanded={railOpen} onClick={() => { setRailOpen(!railOpen); setTool(null); }}><PlayerIcon name="collapse" /></button>
        </aside>
        {tool && <div className="player-tool-panel"><div className="player-tool-heading"><h2>{tool === 'questions' ? 'Questions' : 'Accessibility'}</h2><button type="button" onClick={() => setTool(null)} aria-label="Close question tools panel">×</button></div>{tool === 'questions' ? <><p>{answered} of {questions.length} answered</p><ol>{questions.map((item, index) => <li key={item.id}><button type="button" onClick={() => goToQuestion(index)}>Question {index + 1}{session.flags.includes(item.id) ? ' · Flagged' : ''}{isQuestionAnswered(item, session.answers[item.id]) ? ' · Answered' : ''}</button></li>)}</ol></> : <label className="player-text-size"><input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} />Larger question text</label>}</div>}
      </div>
    </div>
      <nav className="player-pagination" aria-label="Question navigation">
        <Button className="rebrand-button player-previous" variant={ButtonVariant.link} disabled={session.current === 0} aria-label="Previous question" onClick={() => goToQuestion(session.current - 1)}><PlayerIcon name="previous" /></Button>
        <select className="player-question-select" aria-label="Go to question" value={session.current} onChange={(event) => goToQuestion(Number(event.target.value))}>
          {questions.map((item, index) => <option key={item.id} value={index}>{index + 1} of {questions.length}{session.flags.includes(item.id) ? ' · Flagged' : ''}</option>)}
        </select>
        <Button className="rebrand-button rebrand-button-primary player-next" onClick={() => session.current < questions.length - 1 ? goToQuestion(session.current + 1) : setFinishOpen(true)}>{session.current === questions.length - 1 ? 'Finish' : 'Next'}<PlayerIcon name="next" /></Button>
      </nav>
    {settingsOpen && <ActivitySettingsModal activity={activity} onSave={(updated) => { if (onActivityChange) onActivityChange(updated); else saveActivity(updated); setSettingsOpen(false); }} onClose={() => setSettingsOpen(false)} />}
    <Modal isOpen={finishOpen} header="Activity preview complete" headerLevel={2} size={ModalSize.medium} onClose={() => setFinishOpen(false)}><p>You have answered {answered} of {questions.length} questions. Scores and responses are kept locally for this session only. Nothing is submitted to a gradebook.</p><Button className="rebrand-button" variant={ButtonVariant.link} onClick={() => setFinishOpen(false)}>Keep reviewing</Button><Button className="rebrand-button rebrand-button-primary" onClick={back}>{onBack ? backLabel : 'Back to overview'}</Button></Modal>
  </section>;
}
