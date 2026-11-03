import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ButtonColor, ButtonSize, ButtonVariant, IconButton } from 'react-magma-dom';
import './magma-overrides.css';
import ChapterContents, { SectionFolder } from './ChapterContents';
import ActivityRow, { getChapterActivityCount, getSectionActivities } from './ActivityRows';
import ActivityCreation, { ActivityLocationModal } from './ActivityCreation';
import { clearActivityDraft, saveCreatedActivity, useCreatedActivities } from './createdActivities';
import RebrandLayout from './RebrandLayout';
import BrandIcon from './BrandIcon';
import { SelectionCheckbox, SelectionProvider } from './Selection';
import ActivityOverview from './ActivityOverview';
import ActivityPlayer from './ActivityPlayer';
import EdgeCases from './EdgeCases';
import { resolveActivityRoute } from './activityNavigation';
import Gradebook from './Gradebook';
import LearningPathFlows, { allCourseActivities, courseReadings, FolderActions } from './LearningPathFlows';
import { courseChapters, folderVisibility, matchesActivity, useCourseState } from './courseModel';
import { LearningPathContext } from './LearningPathContext';
import { ResourceDialog } from './CourseResources';
import ResourceActivity from './ResourceActivity';
import { orderFolderItems } from './activityManagement';
import './rebrand.css';

function App() {
  useCreatedActivities();
  const course = useCourseState();
  const [creatingActivity, setCreatingActivity] = useState(false); const [createFolder, setCreateFolder] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null); const [pageHash, setPageHash] = useState(window.location.hash);
  const [openFolders, setOpenFolders] = useState(new Set()); const [expandCommand, setExpandCommand] = useState(null);
  const [reading, setReading] = useState(null); const [showHidden, setShowHidden] = useState(false); const [message, setMessage] = useState('');
  const [filters, setFilters] = useState([]); const [view, setView] = useState(course.settings.defaultView || 'list');
  const previousActivityHash = useRef(null); const timer = useRef(null);
  const customFolders = Object.entries(course.folders).filter(([, f]) => f.custom || f.kind === 'section').map(([id]) => id);
  const chapters = [...courseChapters, ...customFolders];
  const activeSection = pageHash.startsWith('#/activity/') ? 'learning-path' : ['dashboard', 'course-settings', 'gradebook', 'tools', 'support'].find((name) => pageHash === `#/${name}`) || 'learning-path';
  const activityRoute = resolveActivityRoute(pageHash, [...chapters, 'Learning Path'], getSectionActivities);
  useEffect(() => { const sync = () => { setPageHash(window.location.hash); setCreatingActivity(false); }; window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
  useEffect(() => { setView(course.settings.rollingWeek ? course.settings.defaultView || 'list' : 'list'); }, [course.settings.defaultView, course.settings.rollingWeek]);
  useEffect(() => {
    if (pageHash.startsWith('#/activity/')) { previousActivityHash.current = pageHash.replace(/\/play$/, ''); return; }
    const frame = requestAnimationFrame(() => Array.from(document.querySelectorAll('.chapter-reading-link[href]')).find((link) => link.getAttribute('href') === previousActivityHash.current)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pageHash]);
  const notify = (text) => { setMessage(text); clearTimeout(timer.current); timer.current = setTimeout(() => setMessage(''), 4000); };
  const navigate = (name) => { setCreatingActivity(false); setPendingPlacement(null); window.location.hash = `#/${name}`; };
  const back = () => navigate('learning-path');
  const create = (folder = null) => { setCreateFolder(folder); setCreatingActivity(true); };
  const added = (activity) => { if (activity.chapter !== 'Learning Path') setOpenFolders((old) => new Set(old).add(activity.chapter)); setView('list'); };
  const visibleFolder = (id) => { const f = folderVisibility(id); return !f.removed && (!f.hidden || showHidden); };
  const learningItems = [...allCourseActivities(chapters), ...courseReadings(chapters)].filter((a) => visibleFolder(a.chapter) && (!a.hidden || showHidden) && matchesActivity(a, filters));
  const selectionId = (a) => a.selectionId || `chapter:${a.chapter}/${a.section}/${a.id || a.title}`;
  const selectionIds = learningItems.map(selectionId);
  const belongsTo = (item, parent) => { let current = item.chapter; const seen = new Set(); while (current && !seen.has(current)) { if (current === parent) return true; seen.add(current); current = course.folders[current]?.parent; } return false; };
  const anyFoldersOpen = chapters.some((chapter) => visibleFolder(chapter) && openFolders.has(chapter));
  const toggleAll = () => { setOpenFolders(anyFoldersOpen ? new Set() : new Set(chapters)); setExpandCommand({ expand: !anyFoldersOpen, at: Date.now() }); };
  const toggleFolder = (chapter) => setOpenFolders((old) => { const next = new Set(old); next.has(chapter) ? next.delete(chapter) : next.add(chapter); return next; });
  const renderFolder = (chapter, seen = new Set()) => {
    if (seen.has(chapter) || !visibleFolder(chapter)) return null;
    const nextSeen = new Set(seen).add(chapter); const folder = course.folders[chapter] || {}; const title = folder.title || chapter; const isOpen = openFolders.has(chapter);
    if (folder.kind === 'section') return folder.parent !== folder.sourceChapter ? <SectionFolder key={chapter} activity={folder.sectionActivity} chapter={folder.sourceChapter} onRead={setReading} notify={notify} relocated renderNested={(id) => nestedFolders(id, nextSeen)} /> : null;
    return <div className={`folder-group ${isOpen ? 'is-open' : ''} ${folder.hidden ? 'is-hidden' : ''}`} key={chapter}><div className="folder"><SelectionCheckbox id={`chapter:${chapter}`} idsOverride={learningItems.filter((a) => belongsTo(a, chapter)).map(selectionId)} label={`Select ${title}`} group /><IconButton className={`folder-chevron ${isOpen ? 'is-open' : ''}`} color={ButtonColor.primary} variant={ButtonVariant.link} size={ButtonSize.small} icon={<BrandIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />} aria-expanded={isOpen} onClick={() => toggleFolder(chapter)} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title}`} /><span className="folder-name">{title}</span><span className="activity-count">{getChapterActivityCount(chapter)} activities</span><FolderActions folderId={chapter} title={title} parent={folder.parent || 'Learning Path'} /></div>{isOpen && <><ChapterContents chapter={chapter} isCustom={!courseChapters.includes(chapter)} onRead={setReading} notify={notify} renderNested={(id) => nestedFolders(id, nextSeen)} /></>}</div>;
  };
  const nestedFolders = (parent, seen) => chapters.filter((id) => course.folders[id]?.parent === parent && !(course.folders[id]?.kind === 'section' && course.folders[id]?.sourceChapter === parent)).map((id) => ({ id, placement: course.folders[id]?.placement, node: <div className="folder-child">{renderFolder(id, seen)}</div> }));
  const rootItems = orderFolderItems([
    ...getSectionActivities('Learning Path').chapter.filter((a) => a.placement === 'start').map((activity) => ({ id: activity.stableKey, placement: activity.placement, activity })),
    ...chapters.filter((id) => !course.folders[id]?.parent || course.folders[id].parent === 'Learning Path').map((id) => ({ id, placement: course.folders[id]?.placement })),
    ...getSectionActivities('Learning Path').chapter.filter((a) => a.placement !== 'start').map((activity) => ({ id: activity.stableKey, placement: activity.placement, activity })),
  ]);
  if (pageHash === '#/edge-cases') return <EdgeCases />;
  const detail = creatingActivity ? <ActivityCreation chapters={chapters} onCancel={() => setCreatingActivity(false)} onAssign={(activity) => { setCreatingActivity(false); setPendingPlacement(createFolder ? { ...activity, chapter: createFolder, section: 'chapter' } : activity); }} /> : activityRoute ? activityRoute.activity.resourceKind ? <ResourceActivity {...activityRoute} onBack={back} notify={notify} /> : activityRoute.page === 'player' ? <ActivityPlayer key={pageHash} {...activityRoute} /> : <ActivityOverview key={pageHash} {...activityRoute} onBack={back} /> : null;
  return <LearningPathContext.Provider value={{ showHidden, filters, expandCommand }}><SelectionProvider itemIds={selectionIds}>
    <RebrandLayout chapters={chapters} anyFoldersOpen={anyFoldersOpen} onToggleAll={toggleAll} showHidden={showHidden} onToggleHidden={() => setShowHidden(!showHidden)} notify={notify} onLearningPath={back} onNavigate={navigate} activeSection={activeSection} gradebookPage={<Gradebook />} onCreateActivity={() => create()} shellless={creatingActivity} detailPage={detail} filters={filters} onFilters={setFilters} view={view} onView={setView}>
      <div className="folders">{rootItems.map((item) => item.activity ? <div className="root-created-activity" key={item.id}><ActivityRow activity={item.activity} chapter="Learning Path" section="chapter" notify={notify} /></div> : renderFolder(item.id))}</div>
    </RebrandLayout>
    <LearningPathFlows chapters={chapters} notify={notify} onCreate={create} onAdded={added} />
    {pendingPlacement && <ActivityLocationModal activity={pendingPlacement} chapters={chapters} onCancel={() => { setPendingPlacement(null); setCreatingActivity(true); }} onSave={(activity) => { saveCreatedActivity(activity); clearActivityDraft(); setPendingPlacement(null); added(activity); notify(`${activity.title} added to ${activity.chapter}`); }} />}
    {reading && <ResourceDialog title={typeof reading === 'string' ? reading : reading.title || reading.chapter} onClose={() => setReading(null)} />}
    <div className={`toast ${message ? 'show' : ''}`} role="status">{message}</div>
  </SelectionProvider></LearningPathContext.Provider>;
}
const appRoot = window.__mindtapRoot || createRoot(document.getElementById('app'));
window.__mindtapRoot = appRoot;
appRoot.render(<App />);
