import React, { useId, useState } from 'react';
import { ButtonColor, ButtonIconPosition, ButtonSize, ButtonVariant, IconButton, Modal, ModalSize, Button } from 'react-magma-dom';
import { AutoStoriesIcon, AutoAwesomeIcon, PlayCircleOutlineIcon } from 'react-magma-icons';
import './activity-resources.css';

export default function ActivityResources({ activity, question, variant }) {
  const headingId = useId();
  const [resource, setResource] = useState(null);
  return <>
    <section className="activity-resources" aria-labelledby={headingId}>
      <h3 id={headingId}>Resources</h3>
      {variant === 'sidebar' && <p className="activity-resource-intro">Review the reading or get guided help.</p>}
      <div className={`activity-resource-actions${variant === 'sidebar' || variant === 'integrated' ? ' activity-resource-actions-magma' : ''}`}>
        <IconButton className="activity-resource-read" color={ButtonColor.subtle} variant={ButtonVariant.solid} size={ButtonSize.small} icon={<AutoStoriesIcon />} iconPosition={ButtonIconPosition.left} onClick={() => setResource('reading')}>Read it</IconButton>
        {question?.hasWatchIt && <IconButton className="activity-resource-watch" color={ButtonColor.subtle} variant={ButtonVariant.solid} size={ButtonSize.small} icon={<PlayCircleOutlineIcon />} iconPosition={ButtonIconPosition.left} onClick={() => setResource('video')}>Watch it</IconButton>}
        <IconButton className="activity-resource-assistant" color={ButtonColor.secondary} variant={ButtonVariant.solid} size={ButtonSize.small} icon={<AutoAwesomeIcon />} iconPosition={ButtonIconPosition.left} onClick={() => setResource('assistant')}>Ask Student assistant</IconButton>
      </div>
    </section>
    <Modal isOpen={Boolean(resource)} header={resource === 'reading' ? `Read it · ${activity.title}` : resource === 'video' ? `Watch it · ${activity.title}` : 'Student assistant'} headerLevel={2} size={ModalSize.medium} onClose={() => setResource(null)}>
      <p>{resource === 'reading' ? 'The ebook resource is not connected in this prototype.' : resource === 'video' ? 'The video resource is not connected in this prototype.' : 'Student assistant is not connected in this prototype.'}</p>
      <Button className="rebrand-button" variant={ButtonVariant.link} onClick={() => setResource(null)}>Back to question</Button>
    </Modal>
  </>;
}
