import React, { useEffect, useId, useState } from 'react';
import { ButtonColor, ButtonSize, ButtonVariant, Hyperlink, IconButton } from 'react-magma-dom';
import ChapterIcon from './ChapterIcon';
import ActivityMenu from './ActivityMenu';
import ActivityRow, { getSectionActivities, sectionActivities } from './ActivityRows';
import { getChapterAssignments } from './chapterAssignments';
import './chapter-contents.css';
import { SelectionCheckbox } from './Selection';
import { useActivitySettings } from './ActivitySettingsModal';
import BrandIcon from './BrandIcon';
import { matchesActivity, readingSectionInfo, useCourseState } from './courseModel';
import { FolderActions } from './LearningPathFlows';
import { useLearningPathDisplay } from './LearningPathContext';
import { orderFolderItems } from './activityManagement';

export function SectionFolder({ activity, chapter, onRead, notify, relocated = false, renderNested }) {
  const sourceTitle = activity.originalTitle || activity.title;
  const { number, name, token } = readingSectionInfo(sourceTitle);
  const homework = getSectionActivities(chapter)['Learn It'].find((row) => (row.originalTitle || row.title) === sourceTitle);
  const course = useCourseState();
  const { showHidden, filters, expandCommand } = useLearningPathDisplay();
  const folderId = `${chapter}/section/${token}`;
  const folder = course.folders[folderId] || {};
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { if (expandCommand) setIsOpen(expandCommand.expand); }, [expandCommand]);
  const panelId = useId();
  const [readingActivity, saveReadingActivity] = useActivitySettings(`${chapter}/Learn It/${token}/reading`, { title: `${number} Read it: ${name}`, icon: 'book', resourceKind: 'reading', chapter, section: 'reading' });
  const readingHidden = Boolean(readingActivity.hidden);
  if (folder.removed || (folder.hidden && !showHidden) || (!relocated && folder.parent && folder.parent !== chapter)) return null;

  return <section className={`chapter-section ${isOpen ? 'is-open' : ''}`}>
    <div className="chapter-section-header">
      <SelectionCheckbox id={`chapter:${chapter}/Learn It/${token}`} label={`Select ${number} section`} idsOverride={[`chapter:${chapter}/Learn It/${token}/reading`, ...(homework ? [`chapter:${chapter}/Learn It/${homework.id || homework.title}`] : []), ...getSectionActivities(folderId).chapter.map((item) => `chapter:${folderId}/chapter/${item.id || item.title}`)]} group />
      <IconButton className="chapter-section-toggle" color={ButtonColor.primary} variant={ButtonVariant.link} size={ButtonSize.small} icon={<BrandIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${number} section`} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setIsOpen(!isOpen)} />
      <span className="chapter-section-title">{folder.title || `${number} ${name}`}</span>
      <span className="activity-count">{1 + Number(Boolean(homework)) + getSectionActivities(folderId).chapter.length} activities</span>
      <FolderActions folderId={folderId} title={folder.title || `${number} ${name}`} parent={chapter} sectionActivity={activity} />
    </div>
    <div id={panelId} className="chapter-section-panel" hidden={!isOpen}>
      <div className={`chapter-reading ${readingHidden ? 'is-hidden' : ''}`} hidden={readingActivity.removed || readingActivity.chapter !== chapter || readingActivity.section !== 'reading' || (readingHidden && !showHidden) || !matchesActivity(readingActivity, filters)}>
        <span className="row-selection"><SelectionCheckbox id={`chapter:${chapter}/Learn It/${token}/reading`} label={`Select ${number} reading`} /></span>
        <span className="chapter-reading-icon"><ChapterIcon name="book" /></span>
        <Hyperlink className="chapter-reading-link" to={`#ebook-${number.toLowerCase()}`} hasUnderline={false} onClick={(event) => { event.preventDefault(); onRead(readingActivity); }}>{readingActivity.title}{readingHidden && <span className="chapter-activity-hidden">Hidden from students</span>}</Hyperlink>
        <span className="chapter-reading-menu"><ActivityMenu label={`${number} reading`} activity={readingActivity} onSave={saveReadingActivity} isHidden={readingHidden} onHide={() => saveReadingActivity({ ...readingActivity, hidden: !readingHidden })} onPreview={() => onRead(readingActivity)} notify={notify} /></span>
      </div>
      {orderFolderItems([
        ...(homework ? [{ id: homework.stableKey, node: <ActivityRow activity={homework} chapter={chapter} section="Learn It" notify={notify} /> }] : []),
        ...getSectionActivities(folderId).chapter.map((item) => ({ id: item.stableKey, placement: item.placement, node: <ActivityRow activity={item} chapter={folderId} section="chapter" notify={notify} /> })),
        ...(renderNested?.(folderId) || []),
      ]).map((item) => <React.Fragment key={item.id}>{item.node}</React.Fragment>)}
    </div>
  </section>;
}

export { default as ChapterIcon } from './ChapterIcon';

export default function ChapterContents({ chapter, onRead, notify, isCustom, renderNested }) {
  const course = useCourseState();
  const { showHidden, filters } = useLearningPathDisplay();
  const separator = chapter.indexOf('. ');
  const chapterNumber = chapter.slice(0, separator);
  const chapterTitle = chapter.slice(separator + 2);
  const [readingActivity, saveReadingActivity] = useActivitySettings(`${chapter}/reading`, { title: 'Chapter Introduction', icon: 'book', resourceKind: 'reading', chapter, section: 'reading' });
  const readingHidden = Boolean(readingActivity.hidden);
  const baseLearn = getChapterAssignments(chapter)?.['Learn It'] || (isCustom ? [] : sectionActivities['Learn It']);
  const currentLearn = getSectionActivities(chapter)['Learn It'];
  const ebookId = chapterNumber.toLowerCase().replace(/\s+/g, '-');
  const reading = <div className={`chapter-reading ${readingHidden ? 'is-hidden' : ''}`} hidden={isCustom || readingActivity.removed || readingActivity.chapter !== chapter || readingActivity.section !== 'reading' || (readingHidden && !showHidden) || !matchesActivity(readingActivity, filters)}>
      <span className="row-selection"><SelectionCheckbox id={`chapter:${chapter}/Learn It/reading`} label={`Select ${chapterNumber} reading`} /></span>
      <span className="chapter-reading-icon"><ChapterIcon name="book" /></span>
      <Hyperlink className="chapter-reading-link" to={`#ebook-${ebookId}`} hasUnderline={false} onClick={(event) => { event.preventDefault(); onRead({ ...readingActivity, title: chapter }); }}>
        {readingActivity.title}{readingHidden && <span className="chapter-activity-hidden">Hidden from students</span>}
      </Hyperlink>
      <span className="chapter-reading-menu"><ActivityMenu label={`${chapterNumber} reading`} activity={readingActivity} onSave={saveReadingActivity} isHidden={readingHidden} onHide={() => saveReadingActivity({ ...readingActivity, hidden: !readingHidden })} onPreview={() => onRead({ ...readingActivity, title: chapter })} notify={notify} /></span>
    </div>;
  const activityItem = (activity, section) => ({ id: activity.stableKey, placement: activity.placement, node: <ActivityRow activity={activity} chapter={chapter} section={section} notify={notify} /> });
  const items = [
    { id: `${chapter}/reading`, node: reading },
    ...getSectionActivities(chapter).chapter.filter((a) => a.placement === 'start').map((activity) => activityItem(activity, 'chapter')),
    ...baseLearn.map((base) => { const id = `${chapter}/section/${readingSectionInfo(base.title).token}`; return { id, placement: course.folders[id]?.placement, node: <SectionFolder activity={currentLearn.find((row) => (row.originalTitle || row.title) === base.title) || base} chapter={chapter} onRead={onRead} notify={notify} renderNested={renderNested} /> }; }),
    ...currentLearn.filter((activity) => !baseLearn.some((base) => base.title === (activity.originalTitle || activity.title))).map((activity) => activityItem(activity, 'Learn It')),
    ...['Study It', 'Apply It'].flatMap((section) => getSectionActivities(chapter)[section].map((activity) => activityItem(activity, section))),
    ...getSectionActivities(chapter).chapter.filter((a) => a.placement !== 'start').map((activity) => activityItem(activity, 'chapter')),
    ...(renderNested?.(chapter) || []),
  ];
  return <div className="chapter-contents">{orderFolderItems(items).map((item) => <React.Fragment key={item.id}>{item.node}</React.Fragment>)}</div>;
}
