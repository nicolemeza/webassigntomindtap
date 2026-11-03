import React, { useState } from 'react';
import { useSelection } from './Selection';
import './bulk-selection-toolbar.css';
import { openCourseFlow } from './courseModel';

const actions = [
  ['hide', 'Hide'],
  ['show', 'Show'],
  ['dates', 'Set Dates'],
  ['points', 'Edit Points'],
  ['practice', 'Edit Practice Vs Graded'],
  ['accommodation', 'Edit Accommodation'],
];

function ToolbarIcon({ name }) {
  return <img src={`/rebrand/bulk-${name}.svg`} width="16" height="16" alt="" aria-hidden="true" />;
}

function Divider() {
  return <span className="bulk-toolbar-divider" aria-hidden="true"><img src="/rebrand/bulk-divider.svg" width="24" height="9" alt="" /></span>;
}

export default function BulkSelectionToolbar({ notify }) {
  const { selectedIds, setSelected } = useSelection();
  const [more, setMore] = useState(false);
  if (!selectedIds.length) return null;

  const clearSelection = () => {
    setSelected(new Set());
    document.querySelector('.learning-path-filters input[type="checkbox"]')?.focus();
  };
  const run = (type) => { setMore(false); openCourseFlow({ type: `bulk-${type}` }); };

  return <div className="bulk-selection-toolbar" role="region" aria-label="Selected learning path items">
    <div className="bulk-toolbar-selection">
      <button type="button" className="bulk-toolbar-button bulk-toolbar-icon" aria-label="Clear selection" onClick={clearSelection}><ToolbarIcon name="close" /></button>
      <span className="bulk-toolbar-count" role="status" aria-live="polite" aria-atomic="true">{selectedIds.length} selected</span>
    </div>
    <Divider />
    {actions.map(([icon, label]) => <button type="button" key={icon} className="bulk-toolbar-button" onClick={() => run(icon)}><ToolbarIcon name={icon} /><span>{label}</span></button>)}
    <span className="bulk-more-anchor"><button type="button" className="bulk-toolbar-button bulk-toolbar-icon" aria-label="More bulk actions" aria-expanded={more} onClick={() => setMore(!more)}><ToolbarIcon name="more" /></button>{more && <div className="bulk-more-menu" role="menu">{[['accommodation', 'Edit Accommodations'], ['template', 'Apply Settings Template'], ['password', 'Edit Password'], ['late', 'Edit Late Policy'], ['time', 'Edit Time Limit']].map(([type, label]) => <button type="button" role="menuitem" key={type} onClick={() => run(type)}>{label}</button>)}</div>}</span>
    <Divider />
    <button type="button" className="bulk-toolbar-button bulk-toolbar-remove" onClick={() => run('remove')}><ToolbarIcon name="remove" /><span>Remove</span></button>
  </div>;
}
