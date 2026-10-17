import React from 'react';
import { ButtonColor, ButtonVariant, Dropdown, DropdownAlignment, DropdownButton, DropdownContent, DropdownMenuItem } from 'react-magma-dom';
import './learning-path-menus.css';

const initialItems = [['bank', 'Add Activity from Activity Bank'], ['folder', 'Add Folder']];
const extras = [['flashcards', 'Flashcards'], ['bongo', 'Bongo'], ['outline', 'Outline Builder'], ['tutor', 'NetTutor'], ['turnitin', 'Turnitin']];
const external = [['drive', 'Google Drive'], ['video', 'WebVideo Search'], ['link', 'Web Link Activity'], ['external', 'Non MindTap Activity'], ['onedrive', 'Microsoft OneDrive']];
const createItems = [['create', 'Create New Activity'], ['pool', 'Create a Question Pool Activity']];

function ActionIcon({ name }) {
  if (name === 'bongo') return <span className="learning-action-icon action-bongo"><img src="/rebrand/action-bongoCircle.svg" width="24" height="24" alt="" /><img className="action-bongo-wordmark" src="/rebrand/action-bongo.png" width="21" height="8" alt="" /></span>;
  const size = ['outline', 'turnitin'].includes(name) ? 28 : 24;
  return <span className="learning-action-icon"><img src={`/rebrand/action-${name}.svg`} width={size} height={size} alt="" /></span>;
}

function ActionItems({ items, notify }) {
  return items.map(([icon, label]) => <DropdownMenuItem className="learning-action-item" key={label} icon={<ActionIcon name={icon} />} onClick={() => notify(`${label} is not connected in this prototype`)}>{label}</DropdownMenuItem>);
}

export default function LearningPathMenus({ notify }) {
  return <>
    <Dropdown className="learning-path-action-dropdown" alignment={DropdownAlignment.start} width={321} maxHeight={529}>
      <DropdownButton className="rebrand-button" variant={ButtonVariant.link} color={ButtonColor.primary}>Add to Learning Path</DropdownButton>
      <DropdownContent className="learning-path-action-menu learning-path-add-menu" aria-label="Add to Learning Path">
        <ActionItems items={initialItems} notify={notify} />
        <div className="learning-action-group-title" role="presentation">Add Mindtap Extras</div>
        <ActionItems items={extras} notify={notify} />
        <div className="learning-action-divider" role="separator" />
        <div className="learning-action-group-title" role="presentation">Add External Content</div>
        <ActionItems items={external} notify={notify} />
      </DropdownContent>
    </Dropdown>
    <Dropdown className="learning-path-action-dropdown" alignment={DropdownAlignment.end} width={309} maxHeight={529}>
      <DropdownButton className="rebrand-button rebrand-button-primary" variant={ButtonVariant.solid} color={ButtonColor.primary}>Create New Activity</DropdownButton>
      <DropdownContent className="learning-path-action-menu learning-path-create-menu" aria-label="Create New Activity">
        <ActionItems items={createItems} notify={notify} />
      </DropdownContent>
    </Dropdown>
  </>;
}
