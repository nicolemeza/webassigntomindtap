import React, { useId, useState } from 'react';
import { ButtonColor, ButtonSize, ButtonVariant, Hyperlink, IconButton, Modal, ModalSize } from 'react-magma-dom';
import ChapterIcon from './ChapterIcon';
import ActivityMenu from './ActivityMenu';
import ActivityRow, { getSectionActivities } from './ActivityRows';
import './chapter-contents.css';

const sections = ['Learn It', 'Study It', 'Apply It'];

export { default as ChapterIcon } from './ChapterIcon';

function ChapterSection({ title, chapter, notify, onPreview }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  return <div className={`chapter-section ${isOpen ? 'is-open' : ''}`}>
    <div className="chapter-section-header">
      <IconButton
        className="chapter-section-toggle"
        color={ButtonColor.primary}
        variant={ButtonVariant.link}
        size={ButtonSize.small}
        icon={<ChapterIcon name="expand-more" />}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} for ${chapter}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
      />
      <span className="chapter-section-icon"><ChapterIcon name={isOpen ? 'folder-open' : 'folder'} /></span>
      <span className="chapter-section-title">{title}</span>
      <IconButton className="chapter-content-menu" variant={ButtonVariant.link} color={ButtonColor.primary} icon={<ChapterIcon name="more-vert" />} aria-label={`More actions for ${title} in ${chapter}`} onClick={() => notify(`${title} options · ${chapter}`)} />
    </div>
    <div id={panelId} className="chapter-section-panel" hidden={!isOpen}>
      {getSectionActivities(chapter)[title].map((activity) => <ActivityRow key={activity.title} activity={activity} chapter={chapter} onPreview={onPreview} notify={notify} />)}
    </div>
  </div>;
}

export default function ChapterContents({ chapter, onRead, notify }) {
  const [readingHidden, setReadingHidden] = useState(false);
  const [previewActivity, setPreviewActivity] = useState(null);
  const separator = chapter.indexOf('. ');
  const chapterNumber = chapter.slice(0, separator);
  const chapterTitle = chapter.slice(separator + 2);
  const ebookId = chapterNumber.toLowerCase().replace(/\s+/g, '-');
  return <div className="chapter-contents">
    <div className={`chapter-reading ${readingHidden ? 'is-hidden' : ''}`}>
      <span className="chapter-reading-icon"><ChapterIcon name="book" /></span>
      <Hyperlink className="chapter-reading-link" to={`#ebook-${ebookId}`} hasUnderline={false} onClick={(event) => { event.preventDefault(); onRead(chapter); }}>
        {chapterNumber} Read it: {chapterTitle}{readingHidden && <span className="chapter-activity-hidden">Hidden from students</span>}
      </Hyperlink>
      <span className="chapter-reading-menu"><ActivityMenu label={`${chapterNumber} reading`} isHidden={readingHidden} onHide={() => { setReadingHidden(!readingHidden); notify(`Reading ${readingHidden ? 'shown to' : 'hidden from'} students`); }} onPreview={() => onRead(chapter)} notify={notify} /></span>
    </div>
    {sections.map((title) => <ChapterSection key={title} title={title} chapter={chapter} notify={notify} onPreview={setPreviewActivity} />)}
    <Modal header={previewActivity?.title || 'Activity preview'} headerLevel={2} isOpen={Boolean(previewActivity)} size={ModalSize.medium} onClose={() => setPreviewActivity(null)}>
      <p>{chapter}</p>
      {previewActivity?.type && <p>{previewActivity.type}{previewActivity.points !== undefined && ` · ${previewActivity.points} points`}{previewActivity.minutes !== undefined && ` · Estimated time: ${previewActivity.minutes} minutes`}</p>}
      <p>Activity content is not connected in this prototype.</p>
    </Modal>
  </div>;
}
