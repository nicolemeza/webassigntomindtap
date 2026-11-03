import React, { useId, useRef, useState } from 'react';
import { ButtonColor, ButtonIconPosition, ButtonSize, ButtonVariant, IconButton, Modal, ModalSize, Button } from 'react-magma-dom';
import { AutoStoriesIcon, AutoAwesomeIcon, PlayCircleOutlineIcon } from 'react-magma-icons';
import './activity-resources.css';
import StudentAssistant from './StudentAssistant';
import { ResourceDialog } from './CourseResources';
import { useCourseState } from './courseModel';

export default function ActivityResources({ activity, question, variant, rejoinder = null }) {
  const { settings } = useCourseState();
  const headingId = useId();
  const [resource, setResource] = useState(null);
  const assistantId = useId();
  const assistantTrigger = useRef(null);
  return <>
    <section className={`activity-resources${rejoinder ? ' activity-resources--with-rejoinder' : ''}`} aria-labelledby={headingId}>
      {rejoinder && <div className="activity-resource-rejoinder">{rejoinder}</div>}
      <div className="activity-resources-main">
        <h3 id={headingId}>Resources</h3>
        {variant === 'sidebar' && <p className="activity-resource-intro">Review the reading or get guided help.</p>}
        <div className={`activity-resource-actions${variant === 'sidebar' || variant === 'integrated' ? ' activity-resource-actions-magma' : ''}`}>
          <IconButton className="activity-resource-read" color={ButtonColor.subtle} variant={ButtonVariant.solid} size={ButtonSize.small} icon={<AutoStoriesIcon />} iconPosition={ButtonIconPosition.left} onClick={() => setResource('reading')}>Read it</IconButton>
          {question?.hasWatchIt && <IconButton className="activity-resource-watch" color={ButtonColor.subtle} variant={ButtonVariant.solid} size={ButtonSize.small} icon={<PlayCircleOutlineIcon />} iconPosition={ButtonIconPosition.left} onClick={() => setResource('video')}>Watch it</IconButton>}
          {settings.studentAssistant && activity.settings?.studentAssistant !== false && <IconButton ref={assistantTrigger} className="activity-resource-assistant" color={variant === 'integrated' ? ButtonColor.subtle : ButtonColor.secondary} variant={ButtonVariant.solid} size={ButtonSize.small} icon={<AutoAwesomeIcon />} iconPosition={ButtonIconPosition.left} aria-haspopup="dialog" aria-expanded={resource === 'assistant'} aria-controls={resource === 'assistant' ? assistantId : undefined} onClick={() => setResource('assistant')}>Ask Student assistant</IconButton>}
        </div>
      </div>
    </section>
    <StudentAssistant key={question.id} open={resource === 'assistant'} id={assistantId} activity={activity} question={question} onClose={() => { setResource(null); assistantTrigger.current?.focus(); }} />
    {(resource === 'reading' || resource === 'video') && <ResourceDialog title={activity.title} video={resource === 'video'} onClose={() => setResource(null)} />}
  </>;
}
