import React, { useEffect, useId, useState } from 'react';
import { ButtonColor, ButtonSize, ButtonVariant, Hyperlink, IconButton } from 'react-magma-dom';
import ChapterIcon from './ChapterIcon';
import ActivityMenu from './ActivityMenu';
import ActivityRow, { getSectionActivities } from './ActivityRows';
import './chapter-contents.css';
import BrandIcon from './BrandIcon';
import { SelectionCheckbox } from './Selection';
import { useActivitySettings } from './ActivitySettingsModal';

const sections = ['Learn It', 'Study It', 'Apply It'];

export { default as ChapterIcon } from './ChapterIcon';

function ChapterSection({ title, chapter, notify, reading, revealSection }) {
  const [isOpen, setIsOpen] = useState(title === revealSection);
  useEffect(() => { if (title === revealSection) setIsOpen(true); }, [title, revealSection]);
  const panelId = useId();
  const count = getSectionActivities(chapter)[title].length + (reading ? 1 : 0);
  return <div className={`chapter-section ${isOpen ? 'is-open' : ''}`}>
    <div className="chapter-section-header">
      <SelectionCheckbox id={`chapter:${chapter}/${title}`} label={`Select ${title} for ${chapter}`} group />
      <IconButton
        className="chapter-section-toggle"
        color={ButtonColor.primary}
        variant={ButtonVariant.link}
        size={ButtonSize.small}
        icon={<BrandIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} for ${chapter}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
      />
      <span className="chapter-section-title">{title}</span>
      <span className="activity-count">{count} {count === 1 ? 'activity' : 'activities'}</span>
      <IconButton className="chapter-content-menu" variant={ButtonVariant.link} color={ButtonColor.primary} icon={<ChapterIcon name="more-vert" />} aria-label={`More actions for ${title} in ${chapter}`} onClick={() => notify(`${title} options · ${chapter}`)} />
    </div>
    <div id={panelId} className="chapter-section-panel" hidden={!isOpen}>
      {reading}
      {getSectionActivities(chapter)[title].map((activity) => <ActivityRow key={activity.id || activity.title} activity={activity} chapter={chapter} section={title} notify={notify} />)}
    </div>
  </div>;
}

export default function ChapterContents({ chapter, onRead, notify, revealSection }) {
  const [readingHidden, setReadingHidden] = useState(false);
  const separator = chapter.indexOf('. ');
  const chapterNumber = chapter.slice(0, separator);
  const chapterTitle = chapter.slice(separator + 2);
  const [readingActivity, saveReadingActivity] = useActivitySettings(`${chapter}/reading`, { title: `${chapterNumber} Read it: ${chapterTitle}` });
  const ebookId = chapterNumber.toLowerCase().replace(/\s+/g, '-');
  const reading = <div className={`chapter-reading ${readingHidden ? 'is-hidden' : ''}`}>
      <span className="row-selection"><SelectionCheckbox id={`chapter:${chapter}/Learn It/reading`} label={`Select ${chapterNumber} reading`} /></span>
      <span className="chapter-reading-icon"><ChapterIcon name="book" /></span>
      <Hyperlink className="chapter-reading-link" to={`#ebook-${ebookId}`} hasUnderline={false} onClick={(event) => { event.preventDefault(); onRead(chapter); }}>
        {readingActivity.title}{readingHidden && <span className="chapter-activity-hidden">Hidden from students</span>}
      </Hyperlink>
      <span className="chapter-reading-menu"><ActivityMenu label={`${chapterNumber} reading`} activity={readingActivity} onSave={saveReadingActivity} isHidden={readingHidden} onHide={() => { setReadingHidden(!readingHidden); notify(`Reading ${readingHidden ? 'shown to' : 'hidden from'} students`); }} onPreview={() => onRead(chapter)} notify={notify} /></span>
    </div>;
  return <div className="chapter-contents">
    {getSectionActivities(chapter).chapter?.filter((activity) => activity.placement === 'start').map((activity) => <ActivityRow key={activity.id} activity={activity} chapter={chapter} section="chapter" notify={notify} />)}
    {sections.map((title) => <ChapterSection key={title} title={title} chapter={chapter} notify={notify} reading={title === 'Learn It' ? reading : null} revealSection={revealSection} />)}
    {getSectionActivities(chapter).chapter?.filter((activity) => activity.placement !== 'start').map((activity) => <ActivityRow key={activity.id} activity={activity} chapter={chapter} section="chapter" notify={notify} />)}
  </div>;
}
