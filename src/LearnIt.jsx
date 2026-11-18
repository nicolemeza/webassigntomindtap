import React, { useEffect, useRef, useState } from 'react';
import { Accordion, AccordionButton, AccordionIconPosition, AccordionItem, AccordionPanel, Button, ButtonColor, ButtonIconPosition, ButtonSize, ButtonVariant, IconButton, Modal, ModalSize } from 'react-magma-dom';
import { CloseIcon, MenuBookIcon } from 'react-magma-icons';
import WebassignQuestion from './WebassignQuestion';
import { getLearnItModules } from './learnItCatalog';
import { gradingFields, submitQuestion } from './questionGrading';
import { questionResponseFields } from './questionResponseFields';
import './learn-it.css';

const lessonLoaders = import.meta.glob('./learnItLessons/*.json', { import: 'default' });
const lessonCache = new Map();

function LearningContent({ module }) {
  const [lesson, setLesson] = useState(() => lessonCache.get(module.code));
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    const load = lessonLoaders[`./learnItLessons/${module.file}`];
    Promise.resolve().then(() => lessonCache.get(module.code) || load()).then(content => {
      lessonCache.set(module.code, content);
      if (active) setLesson(content);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [module.code, module.file, retry]);
  if (failed) return <div role="alert"><p>The lesson could not be loaded.</p><Button color={ButtonColor.secondary} variant={ButtonVariant.solid} onClick={() => setRetry(value => value + 1)}>Try loading again</Button></div>;
  if (!lesson) return <p role="status">Loading lesson…</p>;
  return <Accordion className="learn-it-accordions" defaultIndex={[0]} isMulti iconPosition={AccordionIconPosition.right}>
    {lesson.sections.map((section, index) => <LearningSection key={`${lesson.code}-${section.id}`} index={index} section={section} module={lesson} />)}
  </Accordion>;
}

function LearningSection({ index, section, module }) {
  const [values, setValues] = useState({});
  const [submission, setSubmission] = useState(null);
  const textOf = node => typeof node === 'string' ? node : node.answerKey ? '' : (node.children || []).map(textOf).join(' ');
  const question = { id: `learn-it-${module.code}-${section.id}`, kind: 'webassign', points: 1, questionCode: module.code, prompt: (section.content || []).map(textOf).join(' '), content: section.content || [], fields: section.fields || [] };
  const gradable = gradingFields(question);
  const canCheck = gradable.length > 0 && gradable.length === questionResponseFields(question).length;
  const check = () => setSubmission(submitQuestion(question, { values }));
  const checked = submission?.submitted > 0;
  const correct = checked && Object.values(submission.history).every(attempts => attempts.at(-1));
  const isPractice = section.id.startsWith('practice');
  return <AccordionItem className="learn-it-section" index={index}>
    <AccordionButton className="learn-it-section-button">{section.title}</AccordionButton>
    <AccordionPanel className="learn-it-section-content">
      {section.content?.length > 0 && <div className={section.id === 'reading' ? 'learn-it-reading-content' : undefined}>
        <WebassignQuestion
          question={question} values={values} showWrittenResponse={false}
          solutionAvailable={isPractice}
          history={submission?.history} lastSubmitted={submission?.lastSubmitted}
          onChange={(id, value) => { setValues(current => ({ ...current, [id]: value })); setSubmission(null); }}
          renderAnswerActions={isPractice && canCheck ? solutionToggle => <div className="learn-it-practice-actions">
            <Button color={ButtonColor.secondary} variant={ButtonVariant.solid} size={ButtonSize.small} disabled={!gradable.some(field => values[field.id]?.trim())} onClick={check}>Check answer</Button>
            {solutionToggle}
            {checked && <p className={`learn-it-practice-feedback${correct ? ' is-correct' : ''}`} role="status">{correct ? 'Correct!' : 'Review the solution and try again.'}</p>}
          </div> : undefined}
        />
      </div>}
      {section.video?.url && <><iframe className="learn-it-video" title={section.video.title || section.title} src={section.video.url} loading="lazy" referrerPolicy="no-referrer" allowFullScreen /><a className="learn-it-video-link" href={section.video.url} target="_blank" rel="noreferrer" aria-label={`${section.video.title || 'Watch the video'} (opens in a new tab)`}>Open video in a new window</a></>}
    </AccordionPanel>
  </AccordionItem>;
}

export default function LearnIt({ question }) {
  const modules = getLearnItModules(question);
  const [selected, setSelected] = useState(null);
  const trigger = useRef(null);
  if (!modules.length) return null;
  const close = () => { setSelected(null); trigger.current?.focus(); };
  return <div className="learn-it-help">
    {modules.map(module => <IconButton
      key={module.code} className="learn-it-trigger"
      color={ButtonColor.subtle} variant={ButtonVariant.solid} size={ButtonSize.small}
      icon={<MenuBookIcon />} iconPosition={ButtonIconPosition.left}
      aria-haspopup="dialog" aria-label={`Learn It: ${module.title}`}
      aria-expanded={selected?.code === module.code}
      onClick={event => { trigger.current = event.currentTarget; setSelected(module); }}
    >Learn It<span className="learn-it-trigger-topic">: {module.title}</span></IconButton>)}
    {selected && <Modal className="learn-it-modal" isOpen ariaLabel={`Learn It: ${selected.title}`} isCloseButtonHidden size={ModalSize.large} onClose={close} containerStyle={{ width: '100vw', maxWidth: 'none', height: '100dvh', maxHeight: '100dvh', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', boxSizing: 'border-box', padding: 0 }}>
      <header className="learn-it-modal-header">
        <IconButton className="learn-it-modal-close" aria-label="Close Learn It" color={ButtonColor.subtle} variant={ButtonVariant.link} icon={<CloseIcon />} onClick={close} />
        <div className="learn-it-modal-title">
          <p>Learn It</p>
        </div>
      </header>
      <div className="learn-it-content">
        <h2 className="learn-it-modal-lesson-title">{selected.title}</h2>
        <p className="learn-it-introduction">Review this concept, then return to your question and try again.</p>
        <LearningContent key={selected.code} module={selected} />
        <div className="learn-it-footer"><Button color={ButtonColor.secondary} variant={ButtonVariant.solid} onClick={close}>Back to question</Button></div>
      </div>
    </Modal>}
  </div>;
}
