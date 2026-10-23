import React, { useId, useState } from 'react';
import { ButtonColor, ButtonVariant, Hyperlink, IconButton } from 'react-magma-dom';
import ActivityMenu from './ActivityMenu';
import ChapterIcon from './ChapterIcon';
import { getChapterAssignments } from './chapterAssignments';
import { SelectionCheckbox } from './Selection';
import { useActivitySettings } from './ActivitySettingsModal';
import { activityDueDateTime, formatActivityDue } from './activityDates';
import { activityHref } from './activityNavigation';
import { addCreatedActivities } from './createdActivities';

export const sectionActivities = {
  'Learn It': [
    { title: 'Check Your Understanding #.1', icon: 'assessment', type: 'PRACTICE', minutes: 10, points: 8 },
    { title: 'Check Your Understanding #.2', icon: 'assessment', type: 'PRACTICE', minutes: 15, points: 10 },
  ],
  'Study It': [
    { title: 'PowerPoints', icon: 'powerpoints' },
    { title: 'Flashcards', icon: 'flashcards' },
  ],
  'Apply It': [
    { title: 'Labeling', icon: 'assessment', type: 'COUNTS TOWARDS GRADE', minutes: 15, points: 10 },
    { title: 'Video', icon: 'assessment', type: 'COUNTS TOWARDS GRADE', minutes: 10, points: 5 },
    { title: 'Quiz', icon: 'assessment', type: 'COUNTS TOWARDS GRADE', minutes: 30, points: 20 },
  ],
};

export function getSectionActivities(chapter) {
  const activities = getChapterAssignments(chapter) || sectionActivities;
  return Object.fromEntries([...Object.entries(activities), ['chapter', []]].map(([section, rows]) => [section, addCreatedActivities(chapter, section, rows.map((activity) => ({
    dueDate: '2026-12-06',
    dueTime: '23:58',
    dueTimeZone: 'CST',
    dueUtcOffset: '-06:00',
    countsTowardsGrade: true,
    ...activity,
  })))]));
}

export function getChapterActivityCount(chapter) {
  return 1 + Object.values(getSectionActivities(chapter)).reduce((count, activities) => count + activities.length, 0);
}

export default function ActivityRow({ activity: originalActivity, chapter, section, notify }) {
  const [activity, setSavedActivity] = useActivitySettings(`${chapter}/${section}/${originalActivity.id || originalActivity.title}`, originalActivity);
  const [isHidden, setIsHidden] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const hasStats = activity.points !== undefined;
  const overviewHref = activityHref(chapter, section, originalActivity.id || originalActivity.title);
  const preview = () => { window.location.hash = overviewHref; };
  return <div className={`chapter-activity ${activity.type ? 'is-assessment' : ''} ${isHidden ? 'is-hidden' : ''}`}>
    <span className="row-selection"><SelectionCheckbox id={`chapter:${chapter}/${section}/${originalActivity.id || originalActivity.title}`} label={`Select ${activity.title} in ${chapter}`} /></span>
    <span className="chapter-activity-icon"><ChapterIcon name={activity.icon} /></span>
    <div className="chapter-activity-body">
      <div className="chapter-activity-main">
        <div className="chapter-activity-title">
          <Hyperlink className="chapter-reading-link" to={overviewHref} hasUnderline={false}>{activity.title}</Hyperlink>
          {activity.dueDate && <span className="chapter-activity-due">Due <time dateTime={activityDueDateTime(activity)}>{formatActivityDue(activity)}</time></span>}
          {activity.countsTowardsGrade ? <span className="chapter-activity-type is-graded"><ChapterIcon name="graded" />COUNTS TOWARDS GRADE</span> : <span className="chapter-activity-type">PRACTICE</span>}
          {isHidden && <span className="chapter-activity-hidden">Hidden from students</span>}
        </div>
        {hasStats && <div className="chapter-activity-stats">
          <span><strong>{activity.submitted ?? '0%'}</strong><small>submitted</small></span>
          <span><strong>{activity.averageScore ?? '--'}</strong><small>avg score</small></span>
          <span><strong>{activity.points}</strong><small>points</small></span>
        </div>}
        <span className="chapter-activity-menu"><ActivityMenu label={`${activity.title} in ${chapter}`} activity={activity} onSave={setSavedActivity} isHidden={isHidden} onHide={() => { setIsHidden(!isHidden); notify(`${activity.title} ${isHidden ? 'shown to' : 'hidden from'} students`); }} onPreview={preview} notify={notify} /></span>
      </div>
      {hasStats && activity.minutes !== undefined && <>
        <div className="chapter-activity-time">
          <span>Estimated time: {activity.minutes} minutes</span>
          <IconButton className={`activity-details-toggle ${detailsOpen ? 'is-open' : ''}`} variant={ButtonVariant.link} color={ButtonColor.primary} icon={<ChapterIcon name="expand-details" />} aria-label={`${detailsOpen ? 'Hide' : 'Show'} details for ${activity.title} in ${chapter}`} aria-expanded={detailsOpen} aria-controls={detailsId} onClick={() => setDetailsOpen(!detailsOpen)} />
        </div>
        <div id={detailsId} className="chapter-activity-details" hidden={!detailsOpen}>{activity.countsTowardsGrade ? 'Counts towards grade' : 'Practice activity'} · {activity.points} points · {chapter}</div>
      </>}
    </div>
  </div>;
}
