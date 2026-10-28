import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertVariant,
  Button,
  ButtonColor,
  ButtonSize,
  ButtonVariant,
  IconButton,
  Modal,
  ModalSize,
  Toast as MagmaToast,
  ToastsContainer,
} from 'react-magma-dom';
import {
  CreateNewFolderIcon,
  DeleteIcon,
  EditIcon,
  PlaylistAddIcon,
  VisibilityOffIcon,
} from 'react-magma-icons';
import './magma-overrides.css';
import ChapterContents, { ChapterIcon } from './ChapterContents';
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
import './rebrand.css';

const chapters = [
  'Chapter R. A Review of Basic Algebra',
  'Chapter 1. Equations and Inequalities',
  'Chapter 2. Functions and Graphs',
  'Chapter 3. Functions',
  'Chapter 4. Polynomial and Rational Functions',
  'Chapter 5. Exponential and Logarithmic Functions',
  'Chapter 6. Systems of Linear Equations, Matrices, and Inequalities',
  'Chapter 7. Conic Sections and Systems of Nonlinear Equations',
  'Chapter 8. Sequences, Series, Induction, and Probability',
  'Appendix I. A Proof of the Binomial Theorem',
];
const folderMenuItems = [
  { label: 'Hide folder from students', icon: VisibilityOffIcon },
  { label: 'Edit folder details', icon: EditIcon },
  { label: 'Add activity to folder', icon: PlaylistAddIcon },
  { label: 'Add folder to folder', icon: CreateNewFolderIcon },
  { label: 'Remove folder', icon: DeleteIcon },
];

function Toast({ message }) { return <div className={`toast ${message ? 'show' : ''}`}>{message}</div>; }
function App() {
  const createdActivities = useCreatedActivities();
  const [activeSection, setActiveSection] = useState('learning-path');
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [revealedActivity, setRevealedActivity] = useState(null);
  const [pageHash, setPageHash] = useState(window.location.hash);
  const previousActivityHash = useRef(null);
  const activityRoute = resolveActivityRoute(pageHash, [...chapters, 'Learning Path'], getSectionActivities);
  useEffect(() => {
    if (pageHash.startsWith('#/activity/')) {
      previousActivityHash.current = pageHash.replace(/\/play$/, '');
      return undefined;
    }
    if (!previousActivityHash.current) return undefined;
    const frame = window.requestAnimationFrame(() => {
      Array.from(document.querySelectorAll('.chapter-reading-link[href]')).find((link) => link.getAttribute('href') === previousActivityHash.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageHash]);
  useEffect(() => {
    const syncLocation = () => {
      setPageHash(window.location.hash);
    };
    window.addEventListener('hashchange', syncLocation);
    return () => window.removeEventListener('hashchange', syncLocation);
  }, []);
  const returnToLearningPath = () => {
    setCreatingActivity(false);
    setPendingPlacement(null);
    setActiveSection('learning-path');
    if (!activityRoute) return;
    window.location.hash = '';
  };
  const [hiddenChapters, setHiddenChapters] = useState(() => new Set());
  const [openFolders, setOpenFolders] = useState(() => new Set());
  const [readingChapter, setReadingChapter] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [pendingHideChapter, setPendingHideChapter] = useState(null);
  const [successChapter, setSuccessChapter] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!openMenu) return undefined;
    const closeMenuOnOutsideClick = (event) => {
      if (!event.target.closest('.folder-menu-anchor')) setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeMenuOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeMenuOnOutsideClick);
  }, [openMenu]);
  const notify = (text) => { setMessage(text); window.clearTimeout(window.__toast); window.__toast = window.setTimeout(() => setMessage(''), 1800); };
  const displayedChapters = hidden ? chapters : chapters.filter((chapter) => !hiddenChapters.has(chapter));
  const selectionIds = displayedChapters.flatMap((chapter) => {
    const root = `chapter:${chapter}`;
    return [root, `${root}/Learn It/reading`, ...Object.entries(getSectionActivities(chapter)).filter(([section, activities]) => section !== 'chapter' || activities.length).flatMap(([section, activities]) => [`${root}/${section}`, ...activities.map((activity) => `${root}/${section}/${activity.id || activity.title}`)])];
  });
  selectionIds.push(...createdActivities.filter((activity) => activity.chapter === 'Learning Path').map((activity) => `chapter:Learning Path/chapter/${activity.id}`));
  const rootActivityRows = (placement) => getSectionActivities('Learning Path').chapter.filter((activity) => activity.placement === placement).map((activity) => <div className="root-created-activity" key={activity.id}><ActivityRow activity={activity} chapter="Learning Path" section="chapter" notify={notify} /></div>);
  const anyFoldersOpen = displayedChapters.some((chapter) => openFolders.has(chapter));
  const toggleFolder = (chapter) => {
    setOpenMenu(null);
    setOpenFolders((current) => {
      const next = new Set(current);
      if (next.has(chapter)) next.delete(chapter); else next.add(chapter);
      return next;
    });
  };
  const toggleAllFolders = () => {
    setOpenFolders(anyFoldersOpen ? new Set() : new Set(displayedChapters));
    notify(anyFoldersOpen ? 'Folders collapsed' : 'All folders expanded');
  };
  const selectFolderMenuItem = (chapter, label) => {
    setOpenMenu(null);
    if (label === 'Hide folder from students') {
      setPendingHideChapter(chapter);
      return;
    }
    notify(`${label} · ${chapter}`);
  };
  const hideFolder = () => {
    if (!pendingHideChapter) return;
    const chapterToHide = pendingHideChapter;
    setHiddenChapters((current) => new Set(current).add(chapterToHide));
    setOpenFolders((current) => {
      const next = new Set(current);
      next.delete(chapterToHide);
      return next;
    });
    setPendingHideChapter(null);
    setSuccessChapter(chapterToHide);
  };
  if (pageHash === '#/edge-cases') return <EdgeCases />;
  return <>
    <SelectionProvider itemIds={selectionIds}>
      <RebrandLayout anyFoldersOpen={anyFoldersOpen} onToggleAll={toggleAllFolders} showHidden={hidden} onToggleHidden={() => setHidden(!hidden)} notify={notify} onLearningPath={returnToLearningPath} onGradebook={() => setActiveSection('gradebook')} activeSection={activeSection} gradebookPage={<Gradebook />} onCreateActivity={() => { setCreatingActivity(true); window.location.hash = ''; }} detailPage={creatingActivity ? <ActivityCreation chapters={chapters} onCancel={() => setCreatingActivity(false)} onAssign={(activity) => { setCreatingActivity(false); setPendingPlacement(activity); }} /> : activityRoute && (activityRoute.page === 'player' ? <ActivityPlayer key={pageHash} {...activityRoute} /> : <ActivityOverview key={pageHash} {...activityRoute} onBack={returnToLearningPath} />)}>
<div className="folders">{rootActivityRows('start')}{displayedChapters.map((chapter) => { const isOpen = openFolders.has(chapter); const isMenuOpen = openMenu === chapter; const isHidden = hiddenChapters.has(chapter); return <div className={`folder-group ${isOpen ? 'is-open' : ''} ${isHidden ? 'is-hidden' : ''}`} key={chapter}><div className="folder"><SelectionCheckbox id={`chapter:${chapter}`} label={`Select ${chapter}`} group /><IconButton className={`folder-chevron ${isOpen ? 'is-open' : ''}`} color={ButtonColor.primary} variant={ButtonVariant.link} size={ButtonSize.small} icon={<BrandIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />} aria-expanded={isOpen} onClick={() => toggleFolder(chapter)} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${chapter}`} /><span className="folder-name">{chapter}</span><span className="activity-count">{getChapterActivityCount(chapter)} activities</span><span className="folder-menu-anchor"><IconButton className="chapter-content-menu" variant={ButtonVariant.link} color={ButtonColor.primary} icon={<ChapterIcon name="more-vert" />} aria-label={`More actions for ${chapter}`} aria-haspopup="menu" aria-expanded={isMenuOpen} onClick={() => setOpenMenu(isMenuOpen ? null : chapter)} />{isMenuOpen && <div className="folder-menu" role="menu">{folderMenuItems.map(({ label, icon: MenuIcon }) => <button className="folder-menu-item" type="button" role="menuitem" key={label} onClick={() => selectFolderMenuItem(chapter, label)}><MenuIcon aria-hidden="true" /><span>{label}</span></button>)}</div>}</span></div>{isOpen && <ChapterContents chapter={chapter} onRead={setReadingChapter} notify={notify} revealSection={revealedActivity?.chapter === chapter ? revealedActivity.section : null} />}</div>; })}{rootActivityRows('end')}</div>
      </RebrandLayout>
    </SelectionProvider>
    {pendingPlacement && <ActivityLocationModal activity={pendingPlacement} chapters={chapters} onCancel={() => { setPendingPlacement(null); setCreatingActivity(true); }} onSave={(activity) => {
      saveCreatedActivity(activity);
      clearActivityDraft();
      setRevealedActivity(activity);
      setPendingPlacement(null);
      if (activity.chapter !== 'Learning Path') setOpenFolders((current) => new Set(current).add(activity.chapter));
      notify(`${activity.title} added to ${activity.chapter === 'Learning Path' ? 'Learning Path' : activity.chapter}`);
    }} />}
    <Toast message={message} />
    <Modal header={readingChapter ? `Ebook · ${readingChapter}` : 'Ebook'} headerLevel={2} isOpen={Boolean(readingChapter)} size={ModalSize.large} onClose={() => setReadingChapter(null)}>
      <p>The ebook chapter is not connected in this prototype.</p>
      <Button color={ButtonColor.primary} variant={ButtonVariant.link} onClick={() => setReadingChapter(null)}>Back to activities</Button>
    </Modal>
    <Modal className="hide-folder-modal" header="Hide Activities with Attempts?" headerLevel={2} isOpen={Boolean(pendingHideChapter)} size={ModalSize.medium} onClose={() => setPendingHideChapter(null)}>
      <p className="hide-modal-copy">You are hiding <strong>{pendingHideChapter}</strong> from this course. Some students may have opened or submitted activities within this folder. Do you want to continue?</p>
      <div className="hide-modal-actions"><Button color={ButtonColor.primary} variant={ButtonVariant.outline} size={ButtonSize.medium} onClick={() => setPendingHideChapter(null)}>Cancel</Button><Button color={ButtonColor.primary} variant={ButtonVariant.solid} size={ButtonSize.medium} onClick={hideFolder}>Hide</Button></div>
    </Modal>
    <ToastsContainer>{successChapter && <MagmaToast key={successChapter} variant={AlertVariant.success} toastDuration={5000} onDismiss={() => setSuccessChapter(null)}>{successChapter} is now hidden from the student learning path.</MagmaToast>}</ToastsContainer>
  </>;
}
createRoot(document.getElementById('app')).render(<App />);
