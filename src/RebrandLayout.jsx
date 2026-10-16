import React, { useState } from 'react';
import { Button, ButtonColor, ButtonVariant, IconButton } from 'react-magma-dom';
import BrandIcon from './BrandIcon';
import { SelectionCheckbox, useSelection } from './Selection';
import BulkSelectionToolbar from './BulkSelectionToolbar';

const navigation = [
  ['dashboard', 'Dashboard'], ['learning-path', 'Learning Path'],
  ['course-settings', 'Course Settings'], ['gradebook', 'Gradebook'],
  ['tools', 'More Tools'], ['support', 'Support'],
];

export default function RebrandLayout({ children, anyFoldersOpen, onToggleAll, showHidden, onToggleHidden, notify }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { selectedIds } = useSelection();
  return <div className={`rebrand-app ${collapsed ? 'nav-collapsed' : ''}`}>
    <aside className="rebrand-sidebar" aria-label="Course navigation">
      <div className="rebrand-logo"><img src="/rebrand/logo.svg" width="123" height="40" alt="Cengage MindTap" /></div>
      <IconButton className="sidebar-toggle" variant={ButtonVariant.link} icon={<BrandIcon name="sidebar-collapse" />} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setCollapsed(!collapsed)} />
      <nav>{navigation.map(([icon, label], index) => <React.Fragment key={icon}>
        {index === 4 && <div className="sidebar-separator"><img src="/rebrand/nav-separator.svg" width="224" height="16" alt="" /></div>}
        <button className={`sidebar-link ${icon === 'learning-path' ? 'active' : ''}`} aria-current={icon === 'learning-path' ? 'page' : undefined} title={collapsed ? label : undefined} onClick={() => icon !== 'learning-path' && notify(`${label} opened`)}><BrandIcon name={icon} /><span>{label}</span></button>
      </React.Fragment>)}</nav>
    </aside>
    <main className={`rebrand-main${selectedIds.length ? ' has-selection' : ''}`}>
      <header className="rebrand-topbar">
        <label className="course-selector"><span className="visually-hidden">Current course</span><select defaultValue="current"><option value="current">Contemporary Mathematics for Business &amp; Consumers</option></select><BrandIcon name="course-arrow" /></label>
        <div className="rebrand-top-actions">
          {searchOpen && <input autoFocus className="course-search-input" type="search" aria-label="Search this course" placeholder="Search this course" onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); if (event.key === 'Enter') notify(`Search: ${event.target.value}`); }} />}
          <IconButton className="rebrand-search" variant={ButtonVariant.link} icon={<BrandIcon name="search" />} aria-label="Search this course" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)} />
          <button className="rebrand-avatar" aria-label="User profile" onClick={() => notify('User profile opened')}>AB</button>
        </div>
      </header>
      <div className="learning-path-title"><h1>Learning Path</h1><div className="page-title-actions">
        <Button className="rebrand-button" variant={ButtonVariant.link} color={ButtonColor.primary} onClick={() => notify('Add to Learning Path opened')}>Add to Learning Path</Button>
        <Button className="rebrand-button rebrand-button-primary" variant={ButtonVariant.solid} color={ButtonColor.primary} onClick={() => notify('Activity menu opened')}>Create New Activity</Button>
      </div></div>
      <div className="learning-path-actions"><div className="learning-path-filters">
        <SelectionCheckbox all label="Select all learning path items" />
        <Button className="rebrand-button compact" variant={ButtonVariant.link} onClick={onToggleAll}><BrandIcon name="unfold" />{anyFoldersOpen ? 'Collapse all' : 'Expand All'}</Button>
        <Button className="rebrand-button compact" variant={ButtonVariant.link} aria-pressed={showHidden} onClick={onToggleHidden}><BrandIcon name="visibility" />{showHidden ? 'Hide Hidden' : 'Show Hidden'}</Button>
        <Button className="rebrand-button compact" variant={ButtonVariant.link} onClick={() => notify('Filters opened')}><BrandIcon name="filter" />Filters</Button>
      </div><div className="rebrand-view-tabs" role="group" aria-label="Learning path view">
        <Button className="rebrand-button compact selected" variant={ButtonVariant.link} aria-pressed="true"><BrandIcon name="list" />List View</Button>
        <Button className="rebrand-button compact" variant={ButtonVariant.link} aria-pressed="false" onClick={() => notify('Week view is not connected in this prototype')}><BrandIcon name="calendar" />Week View</Button>
      </div></div>
      <section className="left" aria-label="Learning path chapters">{children}</section>
      <BulkSelectionToolbar notify={notify} />
    </main>
  </div>;
}
