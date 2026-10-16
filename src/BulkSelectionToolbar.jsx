import React from 'react';
import { useSelection } from './Selection';
import './bulk-selection-toolbar.css';

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
  if (!selectedIds.length) return null;

  const clearSelection = () => {
    setSelected(new Set());
    document.querySelector('.learning-path-filters input[type="checkbox"]')?.focus();
  };
  const previewAction = (label) => notify(`${label} for ${selectedIds.length} selected ${selectedIds.length === 1 ? 'item' : 'items'} is not connected in this prototype`);

  return <div className="bulk-selection-toolbar" role="region" aria-label="Selected learning path items">
    <div className="bulk-toolbar-selection">
      <button type="button" className="bulk-toolbar-button bulk-toolbar-icon" aria-label="Clear selection" onClick={clearSelection}><ToolbarIcon name="close" /></button>
      <span className="bulk-toolbar-count" role="status" aria-live="polite" aria-atomic="true">{selectedIds.length} selected</span>
    </div>
    <Divider />
    {actions.map(([icon, label]) => <button type="button" key={icon} className="bulk-toolbar-button" onClick={() => previewAction(label)}><ToolbarIcon name={icon} /><span>{label}</span></button>)}
    <button type="button" className="bulk-toolbar-button bulk-toolbar-icon" aria-label="More bulk actions" onClick={() => previewAction('More bulk actions')}><ToolbarIcon name="more" /></button>
    <Divider />
    <button type="button" className="bulk-toolbar-button bulk-toolbar-remove" onClick={() => previewAction('Remove')}><ToolbarIcon name="remove" /><span>Remove</span></button>
  </div>;
}
