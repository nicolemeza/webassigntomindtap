import React, { useState } from 'react';
import { ButtonColor, ButtonVariant, Dropdown, DropdownAlignment, DropdownButton, DropdownContent, DropdownMenuItem } from 'react-magma-dom';
import ChapterIcon from './ChapterIcon';

export default function ActivityMenu({ label, isHidden, onHide, onPreview, notify }) {
  const [isOpen, setIsOpen] = useState(false);
  return <Dropdown className="activity-menu" alignment={DropdownAlignment.end} width={332} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
    <DropdownButton className={`chapter-content-menu ${isOpen ? 'is-active' : ''}`} variant={ButtonVariant.link} color={ButtonColor.primary} icon={<ChapterIcon name={isOpen ? 'more-vert-active' : 'more-vert'} />} aria-label={`More actions for ${label}`} />
    <DropdownContent className="activity-menu-content">
      <DropdownMenuItem icon={<ChapterIcon name="preview" />} onClick={onPreview}>Preview activity</DropdownMenuItem>
      <DropdownMenuItem icon={<ChapterIcon name="visibility-off" />} onClick={onHide}>{isHidden ? 'Show activity to students' : 'Hide activity from students'}</DropdownMenuItem>
      <DropdownMenuItem icon={<ChapterIcon name="move" />} onClick={() => notify(`Move activity · ${label}`)}>Move activity</DropdownMenuItem>
      <DropdownMenuItem icon={<ChapterIcon name="settings" />} onClick={() => notify(`Manage activity title and settings · ${label}`)}>Manage activity title and settings</DropdownMenuItem>
    </DropdownContent>
  </Dropdown>;
}
