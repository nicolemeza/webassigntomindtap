import React, { useId, useState } from 'react';
import { ButtonColor, ButtonSize, ButtonVariant, Hyperlink, IconButton } from 'react-magma-dom';
import ChapterIcon from './ChapterIcon';
import ActivityMenu from './ActivityMenu';
import ActivityRow, { getSectionActivities } from './ActivityRows';
import './chapter-contents.css';
import { SelectionCheckbox } from './Selection';
import { useActivitySettings } from './ActivitySettingsModal';
import BrandIcon from './BrandIcon';

function sectionDetails(title) {
  const [, number, name] = title.match(/^(.+?\.\d+) HW (.+)$/) || [];
  return { number: number || 'Section', name: name || title };
}

function SectionFolder({ activity, chapter, onRead, notify }) {
  const { number, name } = sectionDetails(activity.title);
  const [isOpen, setIsOpen] = useState(false);
  const [readingHidden, setReadingHidden] = useState(false);
  const panelId = useId();
  const [readingActivity, saveReadingActivity] = useActivitySettings(`${chapter}/Learn It/${number}/reading`, { title: `${number} Read it: ${name}` });

  return <section className={`chapter-section ${isOpen ? 'is-open' : ''}`}>
    <div className="chapter-section-header">
      <SelectionCheckbox id={`chapter:${chapter}/Learn It/${number}`} label={`Select ${number} section`} group />
      <IconButton className="chapter-section-toggle" color={ButtonColor.primary} variant={ButtonVariant.link} size={ButtonSize.small} icon={<BrandIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${number} section`} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setIsOpen(!isOpen)} />
      <span className="chapter-section-title">{number} {name}</span>
      <span className="activity-count">2 activities</span>
      <IconButton className="chapter-content-menu" variant={ButtonVariant.link} color={ButtonColor.primary} icon={<ChapterIcon name="more-vert" />} aria-label={`More actions for ${number} in ${chapter}`} onClick={() => notify(`${number} options · ${chapter}`)} />
    </div>
    <div id={panelId} className="chapter-section-panel" hidden={!isOpen}>
      <div className={`chapter-reading ${readingHidden ? 'is-hidden' : ''}`}>
        <span className="row-selection"><SelectionCheckbox id={`chapter:${chapter}/Learn It/${number}/reading`} label={`Select ${number} reading`} /></span>
        <span className="chapter-reading-icon"><ChapterIcon name="book" /></span>
        <Hyperlink className="chapter-reading-link" to={`#ebook-${number.toLowerCase()}`} hasUnderline={false} onClick={(event) => { event.preventDefault(); onRead(chapter); }}>{readingActivity.title}{readingHidden && <span className="chapter-activity-hidden">Hidden from students</span>}</Hyperlink>
        <span className="chapter-reading-menu"><ActivityMenu label={`${number} reading`} activity={readingActivity} onSave={saveReadingActivity} isHidden={readingHidden} onHide={() => { setReadingHidden(!readingHidden); notify(`Reading ${readingHidden ? 'shown to' : 'hidden from'} students`); }} onPreview={() => onRead(chapter)} notify={notify} /></span>
      </div>
      <ActivityRow activity={activity} chapter={chapter} section="Learn It" notify={notify} />
    </div>
  </section>;
}

export { default as ChapterIcon } from './ChapterIcon';

export default function ChapterContents({ chapter, onRead, notify }) {
  const [readingHidden, setReadingHidden] = useState(false);
  const separator = chapter.indexOf('. ');
  const chapterNumber = chapter.slice(0, separator);
  const chapterTitle = chapter.slice(separator + 2);
  const [readingActivity, saveReadingActivity] = useActivitySettings(`${chapter}/reading`, { title: 'Chapter Introduction' });
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
    {reading}
    {getSectionActivities(chapter)['Learn It'].map((activity) => <SectionFolder key={activity.title} activity={activity} chapter={chapter} onRead={onRead} notify={notify} />)}
    {['Study It', 'Apply It'].flatMap((section) => getSectionActivities(chapter)[section].map((activity) => <ActivityRow key={`${section}-${activity.title}`} activity={activity} chapter={chapter} section={section} notify={notify} />))}
  </div>;
}
