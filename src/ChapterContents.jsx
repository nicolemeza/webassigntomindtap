import React, { useState } from 'react';
import { Hyperlink } from 'react-magma-dom';
import ChapterIcon from './ChapterIcon';
import ActivityMenu from './ActivityMenu';
import ActivityRow, { getSectionActivities } from './ActivityRows';
import './chapter-contents.css';
import { SelectionCheckbox } from './Selection';
import { useActivitySettings } from './ActivitySettingsModal';

const sections = ['Learn It', 'Study It', 'Apply It'];

export { default as ChapterIcon } from './ChapterIcon';

export default function ChapterContents({ chapter, onRead, notify }) {
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
    {reading}
    {sections.flatMap((section) => getSectionActivities(chapter)[section].map((activity) => <ActivityRow key={`${section}-${activity.title}`} activity={activity} chapter={chapter} section={section} notify={notify} />))}
  </div>;
}
