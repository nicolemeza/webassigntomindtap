import React, { useState } from 'react';
import { ButtonColor, ButtonVariant, Dropdown, DropdownAlignment, DropdownButton, DropdownContent, DropdownMenuItem } from 'react-magma-dom';
import ChapterIcon from './ChapterIcon';
import ActivitySettingsModal from './ActivitySettingsModal';
import { openCourseFlow, useCourseState } from './courseModel';
import { hasStudentAttempts, isAssessmentActivity } from './activityManagement';

export default function ActivityMenu({ label, activity, onSave, isHidden, onHide, onPreview, notify }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState(null);
  const course = useCourseState();
  const assessment = isAssessmentActivity(activity);
  const attempted = hasStudentAttempts(activity, course.sessions?.[activity?.stableKey]);
  return <><Dropdown className="activity-menu" alignment={DropdownAlignment.end} width={332} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
    <DropdownButton className={`chapter-content-menu ${isOpen ? 'is-active' : ''}`} variant={ButtonVariant.link} color={ButtonColor.primary} icon={<ChapterIcon name={isOpen ? 'more-vert-active' : 'more-vert'} />} aria-label={`More actions for ${label}`} />
    <DropdownContent className="activity-menu-content">
      {[
      ...(assessment && attempted ? [<DropdownMenuItem key="attempts" icon={<ChapterIcon name="delete" />} onClick={() => openCourseFlow({ type: 'delete-attempts', activity })}>Delete student attempts</DropdownMenuItem>] : []),
      <DropdownMenuItem key="preview" icon={<ChapterIcon name="preview" />} onClick={onPreview}>Preview activity</DropdownMenuItem>,
      <DropdownMenuItem key="visibility" icon={<ChapterIcon name="visibility-off" />} onClick={onHide}>{isHidden ? 'Show activity to students' : 'Hide activity from students'}</DropdownMenuItem>,
      <DropdownMenuItem key="move" icon={<ChapterIcon name="move" />} onClick={() => openCourseFlow({ type: 'move', activity })}>Move activity</DropdownMenuItem>,
      <DropdownMenuItem key="settings" icon={<ChapterIcon name="settings" />} onClick={() => setSettingsOpen(true)}>{assessment ? 'Manage activity settings' : 'Manage activity title and settings'}</DropdownMenuItem>,
      ...(assessment ? [<DropdownMenuItem key="edit" icon={<ChapterIcon name="edit" />} onClick={() => openCourseFlow({ type: 'edit-activity', activity })}>Edit activity title and content</DropdownMenuItem>, <DropdownMenuItem key="duplicate" icon={<ChapterIcon name="copy" />} onClick={() => openCourseFlow({ type: 'duplicate-activity', activity })}>Duplicate activity</DropdownMenuItem>, <DropdownMenuItem key="remove" icon={<ChapterIcon name="delete" />} onClick={() => openCourseFlow({ type: 'remove-activity', activity })}>Remove activity</DropdownMenuItem>] : []),
      ]}
    </DropdownContent>
  </Dropdown>{settingsOpen && <ActivitySettingsModal activity={activity || savedSettings || { title: label }} onClose={() => setSettingsOpen(false)} onSave={(updated) => { setSavedSettings(updated); onSave?.(updated); setSettingsOpen(false); notify('Activity settings saved'); }} />}</>;
}
