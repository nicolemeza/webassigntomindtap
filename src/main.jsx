import React, { useEffect, useState } from 'react';
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
  Toggle,
  ToggleTextPosition,
  Toast as MagmaToast,
  ToastsContainer,
} from 'react-magma-dom';
import {
  CreateNewFolderIcon,
  DeleteIcon,
  EditIcon,
  ExpandMoreIcon,
  PlaylistAddIcon,
  VisibilityOffIcon,
} from 'react-magma-icons';
import './magma-overrides.css';

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
const rail = [
  ['https://ng.cengage.com/static/nb/ui/images/my_content_icon.png','My Content'],
  ['https://ng.cengage.com/static/nb/ui/images/my-notes.png','My Notes'],
  ['https://ng.cengage.com/static/ltiapps/youseeu/images/youseeu.png','Bongo'],
  ['https://ng.cengage.com/static/nbapps/glossary/images/glossary-icon.png','Glossary'],
  ['https://ng.cengage.com/static/iloveapps/flashcard/images/flashcard.png','Flashcards'],
  ['https://ng.cengage.com/static/progress/client/img/progress.png','Progress'],
];
const folderMenuItems = [
  { label: 'Hide folder from students', icon: VisibilityOffIcon },
  { label: 'Edit folder details', icon: EditIcon },
  { label: 'Add activity to folder', icon: PlaylistAddIcon },
  { label: 'Add folder to folder', icon: CreateNewFolderIcon },
  { label: 'Remove folder', icon: DeleteIcon },
];
function SearchIcon(){return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M10.2812 6.28125C10.2812 5.17708 9.89062 4.23438 9.10938 3.45312C8.32812 2.67188 7.38542 2.28125 6.28125 2.28125C5.1875 2.28125 4.25 2.67188 3.46875 3.45312C2.67708 4.23438 2.28125 5.17708 2.28125 6.28125C2.28125 7.38542 2.67708 8.32812 3.46875 9.10938C4.25 9.89062 5.1875 10.2812 6.28125 10.2812C7.38542 10.2812 8.32812 9.89062 9.10938 9.10938C9.89062 8.32812 10.2812 7.38542 10.2812 6.28125ZM14.8594 13.7031C14.8594 14.0156 14.7448 14.2865 14.5156 14.5156C14.2969 14.7448 14.0312 14.8594 13.7188 14.8594C13.3958 14.8594 13.125 14.7448 12.9062 14.5156L9.84375 11.4531C8.78125 12.1927 7.59375 12.5625 6.28125 12.5625C5.4375 12.5625 4.625 12.401 3.84375 12.0781C3.07292 11.7448 2.40625 11.2969 1.84375 10.7344C1.28125 10.1719 0.833333 9.5 0.5 8.71875C0.166667 7.94792 0 7.13542 0 6.28125C0 5.42708 0.166667 4.61458 0.5 3.84375C0.833333 3.0625 1.28125 2.39062 1.84375 1.82812C2.40625 1.26562 3.07292 0.817708 3.84375 0.484375C4.625 0.161458 5.4375 0 6.28125 0C7.13542 0 7.95312 0.161458 8.73438 0.484375C9.50521 0.817708 10.1719 1.26562 10.7344 1.82812C11.2969 2.39062 11.7448 3.0625 12.0781 3.84375C12.4115 4.61458 12.5781 5.42708 12.5781 6.28125C12.5781 7.59375 12.2083 8.78125 11.4688 9.84375L14.5312 12.9062C14.75 13.125 14.8594 13.3906 14.8594 13.7031Z" fill="#3A8200"/></svg>}
function HelpIcon(){return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z" fill="#727272"/></svg>}
function UserIcon(){return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M12.9777 13.2285C13.6547 13.2285 14.298 13.1016 14.9073 12.8477C15.4998 12.5938 16.0203 12.2425 16.4689 11.7939C16.9174 11.3454 17.2771 10.8164 17.548 10.207C17.8019 9.59766 17.9288 8.95443 17.9288 8.27734C17.9288 7.58333 17.8019 6.9401 17.548 6.34766C17.2771 5.73828 16.9174 5.20931 16.4689 4.76074C16.0203 4.31217 15.4998 3.96094 14.9073 3.70703C14.298 3.45312 13.6547 3.32617 12.9777 3.32617C12.2837 3.32617 11.632 3.45312 11.0226 3.70703C10.4301 3.96094 9.90963 4.31217 9.46106 4.76074C9.01249 5.20931 8.66125 5.73828 8.40735 6.34766C8.13652 6.9401 8.0011 7.58333 8.0011 8.27734C8.0011 8.95443 8.13652 9.59766 8.40735 10.207C8.66125 10.8164 9.01249 11.3454 9.46106 11.7939C9.90963 12.2425 10.4301 12.5938 11.0226 12.8477C11.632 13.1016 12.2837 13.2285 12.9777 13.2285ZM12.9777 15.7168C12.1482 15.7168 11.158 15.8184 10.007 16.0215C8.87284 16.2415 7.78951 16.5547 6.75696 16.9609C5.72441 17.3672 4.85266 17.8835 4.14172 18.5098C3.41386 19.1361 3.04993 19.8555 3.04993 20.668V23.1562H22.88V20.668C22.88 19.8385 22.5161 19.1191 21.7882 18.5098C21.0773 17.8835 20.2055 17.363 19.173 16.9482C18.1404 16.5335 17.0571 16.2246 15.923 16.0215C14.7719 15.8184 13.7902 15.7168 12.9777 15.7168Z" fill="#727272"/></svg>}
function CalendarIcon(){return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 3H19V2C19 1.45 18.55 1 18 1C17.45 1 17 1.45 17 2V3H7V2C7 1.45 6.55 1 6 1C5.45 1 5 1.45 5 2V3H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM19 21H5C4.45 21 4 20.55 4 20V8H20V20C20 20.55 19.55 21 19 21Z" fill="white"/></svg>}
function OutlineIcon(){return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 13C4.55 13 5 12.55 5 12C5 11.45 4.55 11 4 11C3.45 11 3 11.45 3 12C3 12.55 3.45 13 4 13ZM4 17C4.55 17 5 16.55 5 16C5 15.45 4.55 15 4 15C3.45 15 3 15.45 3 16C3 16.55 3.45 17 4 17ZM4 9C4.55 9 5 8.55 5 8C5 7.45 4.55 7 4 7C3.45 7 3 7.45 3 8C3 8.55 3.45 9 4 9ZM8 13H20C20.55 13 21 12.55 21 12C21 11.45 20.55 11 20 11H8C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13ZM8 17H20C20.55 17 21 16.55 21 16C21 15.45 20.55 15 20 15H8C7.45 15 7 15.45 7 16C7 16.55 7.45 17 8 17ZM7 8C7 8.55 7.45 9 8 9H20C20.55 9 21 8.55 21 8C21 7.45 20.55 7 20 7H8C7.45 7 7 7.45 7 8ZM4 13C4.55 13 5 12.55 5 12C5 11.45 4.55 11 4 11C3.45 11 3 11.45 3 12C3 12.55 3.45 13 4 13ZM4 17C4.55 17 5 16.55 5 16C5 15.45 4.55 15 4 15C3.45 15 3 15.45 3 16C3 16.55 3.45 17 4 17ZM4 9C4.55 9 5 8.55 5 8C5 7.45 4.55 7 4 7C3.45 7 3 7.45 3 8C3 8.55 3.45 9 4 9ZM8 13H20C20.55 13 21 12.55 21 12C21 11.45 20.55 11 20 11H8C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13ZM8 17H20C20.55 17 21 16.55 21 16C21 15.45 20.55 15 20 15H8C7.45 15 7 15.45 7 16C7 16.55 7.45 17 8 17ZM7 8C7 8.55 7.45 9 8 9H20C20.55 9 21 8.55 21 8C21 7.45 20.55 7 20 7H8C7.45 7 7 7.45 7 8Z" fill="white"/></svg>}
function FilterIcon(){return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M3.13019 4.32414C4.55799 6.15794 6.66866 8.87181 6.66866 8.87181V11.9487C6.66866 12.6257 7.22253 13.1795 7.89946 13.1795C8.57639 13.1795 9.13019 12.6257 9.13019 11.9487V8.87181C9.13019 8.87181 11.241 6.15794 12.6687 4.32414C12.9825 3.91794 12.6933 3.33334 12.1764 3.33334H3.61639C3.10559 3.33334 2.81639 3.91801 3.13019 4.32414Z" fill="#006298"/></svg>}
function FolderIcon(){return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M14.12 6.12001C13.6133 5.61334 12.9333 5.33334 12.2267 5.33334H5.33334C3.86667 5.33334 2.68001 6.53334 2.68001 8.00001L2.66667 24C2.66667 25.4667 3.86667 26.6667 5.33334 26.6667H26.6667C28.1333 26.6667 29.3333 25.4667 29.3333 24V10.6667C29.3333 9.20001 28.1333 8.00001 26.6667 8.00001H16L14.12 6.12001Z" fill="#454545"/></svg>}
function OpenFolderIcon(){return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M4.4 10.2C4.4 8.6536 5.6536 7.4 7.2 7.4H13.1L15.3 9.8H25.5C27.0464 9.8 28.3 11.0536 28.3 12.6V23.2C28.3 24.7464 27.0464 26 25.5 26H7.2C5.6536 26 4.4 24.7464 4.4 23.2V10.2Z" fill="#454545"/><path d="M3.7 13.1H26.8L24.7 24H5.8L3.7 13.1Z" fill="#fff" stroke="#454545" strokeWidth="1.4" strokeLinejoin="round"/></svg>}
function BrandLogo(){return <img src="/cengage-mindtap.png" alt="Cengage MindTap" />}

function Toast({ message }) { return <div className={`toast ${message ? 'show' : ''}`}>{message}</div>; }
function App() {
  const [hiddenChapters, setHiddenChapters] = useState(() => new Set());
  const [openFolders, setOpenFolders] = useState(() => new Set());
  const [openMenu, setOpenMenu] = useState(null);
  const [pendingHideChapter, setPendingHideChapter] = useState(null);
  const [successChapter, setSuccessChapter] = useState(null);
  const [bulk, setBulk] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [selectedRail, setSelectedRail] = useState(0);
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
  const allFoldersOpen = displayedChapters.length > 0 && displayedChapters.every((chapter) => openFolders.has(chapter));
  const toggleFolder = (chapter) => {
    setOpenMenu(null);
    setOpenFolders((current) => {
      const next = new Set(current);
      if (next.has(chapter)) next.delete(chapter); else next.add(chapter);
      return next;
    });
  };
  const toggleAllFolders = () => {
    setOpenFolders(allFoldersOpen ? new Set() : new Set(displayedChapters));
    notify(allFoldersOpen ? 'Folders collapsed' : 'All folders expanded');
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
  return <>
    <header className="topbar"><div className="brand"><BrandLogo /></div><div className="top-actions"><div className="search"><SearchIcon /> Search this course</div><div className="help"><HelpIcon /></div><div className="user"><UserIcon /> User⌄</div></div></header>
    <main className="shell"><section className="left"><div className="course-head"><div className="course-line"><div className="course-title">Contemporary Mathematics for Business &amp; Consumers <button className="edit" title="Edit display title">✎</button></div><div className="view-tabs"><button><CalendarIcon /></button><button className="active"><OutlineIcon /></button></div></div><div className="settings"><div className="switch-line"><Toggle labelText="Bulk Edit" textPosition={ToggleTextPosition.right} isInverse checked={bulk} onChange={() => { setBulk(!bulk); notify(`Bulk edit ${!bulk ? 'enabled' : 'disabled'}`); }} /></div><div className="switch-line view-hidden-control"><Toggle labelText="View Hidden" textPosition={ToggleTextPosition.left} isInverse checked={hidden} trackStyle={{ background: '#003865', borderColor: hidden ? '#9bd7ed' : 'rgba(255,255,255,.5)' }} thumbStyle={{ background: '#fff' }} onChange={() => { setHidden(!hidden); notify(`Hidden folders ${!hidden ? 'shown' : 'hidden'}`); }} /></div></div></div>
      <div className="toolbar"><Button color={ButtonColor.primary} variant={ButtonVariant.outline} size={ButtonSize.small} className="expand" onClick={toggleAllFolders}>Expand all <span aria-hidden="true">⌄</span></Button><div><Button color={ButtonColor.success} variant={ButtonVariant.solid} size={ButtonSize.medium} className="add" onClick={() => notify('Activity menu opened')}>＋ Activity</Button><Button color={ButtonColor.primary} variant={ButtonVariant.link} size={ButtonSize.small} className="filter" onClick={() => notify('Filters opened')}><FilterIcon /> FILTERS</Button></div></div>
      <div className="folders">{displayedChapters.map((chapter) => { const isOpen = openFolders.has(chapter); const isMenuOpen = openMenu === chapter; const isHidden = hiddenChapters.has(chapter); return <div className={`folder-group ${isOpen ? 'is-open' : ''} ${isHidden ? 'is-hidden' : ''}`} key={chapter}><div className="folder"><IconButton className={`folder-chevron ${isOpen ? 'is-open' : ''}`} color={ButtonColor.primary} variant={ButtonVariant.link} size={ButtonSize.small} icon={<ExpandMoreIcon />} onClick={() => toggleFolder(chapter)} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${chapter}`} /><span className="folder-icon">{isHidden ? <VisibilityOffIcon aria-hidden="true" /> : isOpen ? <OpenFolderIcon /> : <FolderIcon />}</span><span className="folder-name">{chapter}</span><span className="activity-count">2 activities</span><span className="folder-menu-anchor"><button className={`dots ${isMenuOpen ? 'is-active' : ''}`} type="button" aria-label={`More actions for ${chapter}`} aria-haspopup="menu" aria-expanded={isMenuOpen} onClick={() => setOpenMenu(isMenuOpen ? null : chapter)}>⋮</button>{isMenuOpen && <div className="folder-menu" role="menu">{folderMenuItems.map(({ label, icon: MenuIcon }) => <button className="folder-menu-item" type="button" role="menuitem" key={label} onClick={() => selectFolderMenuItem(chapter, label)}><MenuIcon aria-hidden="true" /><span>{label}</span></button>)}</div>}</span></div>{isOpen && <div className="folder-drawer" aria-hidden="true" />}</div>; })}</div>
    </section><section className="right"><div className="card average"><div className="label">Class Average</div><div className="score">0%</div></div><div className="card report"><h2>Performance Reports</h2><p>Generate reports to view performance on individual activities. You can break down activity performance by key concept.</p><Button color={ButtonColor.primary} variant={ButtonVariant.solid} size={ButtonSize.medium} className="primary" onClick={() => notify('Reports dashboard opened')}>View Reports Dashboard</Button></div><div className="card recent"><h2>Recent Activity Scores</h2><p>This chart shows the average scores for activities that recently reached their due date. Hover over an activity dot for more information.</p><div className="chart"><div className="grid">{['100%','90%','80%','70%','60%','50%','40%','30%','20%','10%','5%','0%'].map((x, i) => <span style={{top:`${i * 9.1}%`}} key={x}>{x}</span>)}</div><div className="empty">This chart is blank because no activities have reached their due date.</div></div><Button color={ButtonColor.primary} variant={ButtonVariant.solid} size={ButtonSize.small} className="gradebook" onClick={() => notify('Gradebook opened')}>Open Gradebook</Button></div></section><aside className="rail">{rail.map(([icon, label], i) => <button title={label} key={label} className={i === selectedRail ? 'selected' : ''} onClick={() => { setSelectedRail(i); notify(`${label} selected`); }}><img src={icon} alt="" /></button>)}</aside></main><Toast message={message} />
    <Modal className="hide-folder-modal" header="Hide Activities with Attempts?" headerLevel={2} isOpen={Boolean(pendingHideChapter)} size={ModalSize.medium} onClose={() => setPendingHideChapter(null)}>
      <p className="hide-modal-copy">You are hiding <strong>{pendingHideChapter}</strong> from this course. Some students may have opened or submitted activities within this folder. Do you want to continue?</p>
      <div className="hide-modal-actions"><Button color={ButtonColor.primary} variant={ButtonVariant.outline} size={ButtonSize.medium} onClick={() => setPendingHideChapter(null)}>Cancel</Button><Button color={ButtonColor.primary} variant={ButtonVariant.solid} size={ButtonSize.medium} onClick={hideFolder}>Hide</Button></div>
    </Modal>
    <ToastsContainer>{successChapter && <MagmaToast key={successChapter} variant={AlertVariant.success} toastDuration={5000} onDismiss={() => setSuccessChapter(null)}>{successChapter} is now hidden from the student learning path.</MagmaToast>}</ToastsContainer>
  </>;
}
createRoot(document.getElementById('app')).render(<App />);
