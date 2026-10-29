import React, { useEffect, useState } from 'react';
import { Button, ButtonColor, ButtonVariant, IconButton } from 'react-magma-dom';
import BrandIcon from './BrandIcon';
import { SelectionCheckbox, useSelection } from './Selection';
import BulkSelectionToolbar from './BulkSelectionToolbar';
import LearningPathMenus from './LearningPathMenus';
import WeekView, { learningWeeks } from './WeekView';

const navigation = [
  ['dashboard', 'Dashboard'], ['learning-path', 'Learning Path'],
  ['course-settings', 'Course Settings'], ['gradebook', 'Gradebook'],
  ['tools', 'More Tools'], ['support', 'Support'],
];

export default function RebrandLayout({ children, anyFoldersOpen, onToggleAll, showHidden, onToggleHidden, notify, detailPage, onLearningPath, onCreateActivity, gradebookPage, activeSection = 'learning-path', onGradebook, shellless = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [learningPathView, setLearningPathView] = useState('list');
  const [openWeeks, setOpenWeeks] = useState(new Set());
  const { selectedIds, setSelected } = useSelection();
  const isDetailPage = Boolean(detailPage);
  const showingGradebook = activeSection === 'gradebook' && !isDetailPage;
  const isWeekView = learningPathView === 'week';
  const allWeeksOpen = openWeeks.size === learningWeeks.length;
  const toggleWeeks = () => setOpenWeeks(allWeeksOpen ? new Set() : new Set(learningWeeks.map(({ id }) => id)));
  const toggleWeek = (weekId) => setOpenWeeks((current) => { const next = new Set(current); next.has(weekId) ? next.delete(weekId) : next.add(weekId); return next; });
  useEffect(() => {
    if (isDetailPage) setSelected((current) => current.size ? new Set() : current);
  }, [isDetailPage, setSelected]);
  useEffect(() => {
    if (showingGradebook) setSelected((current) => current.size ? new Set() : current);
  }, [showingGradebook, setSelected]);
  return <div className={`rebrand-app ${collapsed ? 'nav-collapsed' : ''}${shellless ? ' is-shellless' : ''}`}>
    <div className="rebrand-update-banner"><span>You're viewing the updated MindTap look.</span><button type="button" onClick={() => notify('This prototype is showing the updated MindTap look.')}>Return to Original Look <span aria-hidden="true">→</span></button></div>
    {!shellless && <aside className="rebrand-sidebar" aria-label="Course navigation">
      <div className="rebrand-logo"><img src="/rebrand/logo.svg" width="123" height="40" alt="Cengage MindTap" /></div>
      <IconButton className="sidebar-toggle" variant={ButtonVariant.link} icon={<BrandIcon name="sidebar-collapse" />} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setCollapsed(!collapsed)} />
      <nav>{navigation.map(([icon, label], index) => <React.Fragment key={icon}>
        {index === 4 && <div className="sidebar-separator"><img src="/rebrand/nav-separator.svg" width="224" height="16" alt="" /></div>}
        <button className={`sidebar-link ${(icon === 'learning-path' && activeSection === 'learning-path' || icon === 'gradebook' && activeSection === 'gradebook') ? 'active' : ''}`} aria-current={(icon === 'learning-path' && activeSection === 'learning-path' || icon === 'gradebook' && activeSection === 'gradebook') ? 'page' : undefined} title={collapsed ? label : undefined} onClick={() => icon === 'learning-path' ? onLearningPath?.() : icon === 'gradebook' ? onGradebook?.() : notify(`${label} opened`)}><BrandIcon name={icon} /><span>{label}</span></button>
      </React.Fragment>)}</nav>
    </aside>}
    <main className={`rebrand-main${selectedIds.length ? ' has-selection' : ''}`}>
      {!shellless && <header className="rebrand-topbar">
        <label className="course-selector"><span className="visually-hidden">Current course</span><select defaultValue="current"><option value="current">College Algebra</option></select><BrandIcon name="course-arrow" /></label>
        <div className="rebrand-top-actions">
          {searchOpen && <input autoFocus className="course-search-input" type="search" aria-label="Search this course" placeholder="Search this course" onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); if (event.key === 'Enter') notify(`Search: ${event.target.value}`); }} />}
          <IconButton className="rebrand-search" variant={ButtonVariant.link} icon={<BrandIcon name="search" />} aria-label="Search this course" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)} />
          <button className="rebrand-avatar" aria-label="User profile" onClick={() => notify('User profile opened')}>AB</button>
        </div>
      </header>}
      {!detailPage && !showingGradebook && <><div className="learning-path-title"><h1>Learning Path</h1><div className="page-title-actions">
        <LearningPathMenus notify={notify} onCreateActivity={onCreateActivity} />
      </div></div>
      <div className="learning-path-actions"><div className="learning-path-filters">
        <SelectionCheckbox all label="Select all learning path items" />
        <Button className="rebrand-button compact" variant={ButtonVariant.link} onClick={isWeekView ? toggleWeeks : onToggleAll}><BrandIcon name="unfold" />{isWeekView ? (allWeeksOpen ? 'Collapse all' : 'Expand All') : (anyFoldersOpen ? 'Collapse all' : 'Expand All')}</Button>
        <Button className="rebrand-button compact" variant={ButtonVariant.link} aria-pressed={showHidden} onClick={onToggleHidden}><BrandIcon name="visibility" />{showHidden ? 'Hide Hidden' : 'Show Hidden'}</Button>
        <Button className="rebrand-button compact" variant={ButtonVariant.link} onClick={() => notify('Filters opened')}><BrandIcon name="filter" />Filters</Button>
      </div><div className="rebrand-view-tabs" role="group" aria-label="Learning path view">
        <Button className={`rebrand-button compact${!isWeekView ? ' selected' : ''}`} variant={ButtonVariant.link} aria-pressed={!isWeekView} onClick={() => setLearningPathView('list')}><BrandIcon name="list" />List View</Button>
        <Button className={`rebrand-button compact${isWeekView ? ' selected' : ''}`} variant={ButtonVariant.link} aria-pressed={isWeekView} onClick={() => setLearningPathView('week')}><BrandIcon name="calendar" />Week View</Button>
      </div></div></>}
      <section className="left" aria-label={showingGradebook ? 'Gradebook' : isWeekView ? 'Learning path weeks' : 'Learning path chapters'} hidden={Boolean(detailPage)}><div hidden={showingGradebook || isWeekView}>{children}</div><div hidden={!showingGradebook}>{gradebookPage}</div><div hidden={showingGradebook || !isWeekView}><WeekView openWeeks={openWeeks} onToggleWeek={toggleWeek} /></div></section>
      {detailPage || showingGradebook || isWeekView || <BulkSelectionToolbar notify={notify} />}
    </main>
  </div>;
}
