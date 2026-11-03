import React, { useMemo, useState } from 'react';
import './gradebook.css';

const initialStudents = [
  { id: '10021', name: 'Jordan Lee', status: 'Active', license: 'Active', scores: [92, 86, 78, 94] },
  { id: '10034', name: 'Morgan Chen', status: 'Active', license: 'Active', scores: [84, 91, 88, 79] },
  { id: '10052', name: 'Taylor Rivera', status: 'Active', license: 'Trial access', scores: [67, 73, 81, 69] },
  { id: '10068', name: 'Alex Kim', status: 'Active', license: 'Active', scores: [96, 89, 93, 97] },
];

const initialAssignments = [
  { id: 'a1', title: 'R.1 HW Sets of Real Numbers', group: 'Chapter R · A Review of Basic Algebra', category: 'Practice', due: '2026-10-28', points: 10, submitted: 4, average: 84 },
  { id: 'a2', title: 'R.5 HW Factoring', group: 'Chapter R · A Review of Basic Algebra', category: 'Homework', due: '2026-10-30', points: 20, submitted: 4, average: 87 },
  { id: 'a3', title: 'Chapter R Test', group: 'Chapter R · A Review of Basic Algebra', category: 'Assessments', due: '2026-11-02', points: 50, submitted: 3, average: 78 },
  { id: 'a4', title: '2.5 HW Graphs of Equations & Circles', group: 'Chapter 2 · Functions and Graphs', category: 'Practice', due: '2026-11-05', points: 10, submitted: 2, average: 76 },
];

const initialCategories = [
  { name: 'Practice', weight: 20, drop: 0 },
  { name: 'Homework', weight: 30, drop: 1 },
  { name: 'Assessments', weight: 50, drop: 0 },
];

const tabs = ['Home', 'Gradebook', 'Settings', 'Reports', 'Roster'];
const average = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

function IconButton({ children, className = '', ...props }) {
  return <button className={`gb-button ${className}`} type="button" {...props}>{children}</button>;
}

function Modal({ title, children, onClose, actions }) {
  return <div className="gb-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="gb-modal" role="dialog" aria-modal="true" aria-labelledby="gb-modal-title">
      <header><h2 id="gb-modal-title">{title}</h2><button className="gb-icon-button" type="button" aria-label="Close" onClick={onClose}>×</button></header>
      <div className="gb-modal-body">{children}</div>
      {actions && <footer>{actions}</footer>}
    </section>
  </div>;
}

export default function Gradebook() {
  const [activeTab, setActiveTab] = useState('Home');
  const [students, setStudents] = useState(initialStudents);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [categories, setCategories] = useState(initialCategories);
  const [modal, setModal] = useState(null);
  const [scoreMode, setScoreMode] = useState('Points');
  const [groupBy, setGroupBy] = useState('Chapter or unit');
  const [groupState, setGroupState] = useState('Collapse all');
  const [overallMode, setOverallMode] = useState('Points');
  const [showDropped, setShowDropped] = useState(false);
  const [weighting, setWeighting] = useState(false);
  const [dropLowest, setDropLowest] = useState(false);
  const [editingScores, setEditingScores] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All assignments');
  const [dateFilter, setDateFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [performance, setPerformance] = useState('View all');
  const [performanceRanges, setPerformanceRanges] = useState({ high: 90, medium: 70 });
  const [rangeDraft, setRangeDraft] = useState(null);
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [message, setMessage] = useState('');
  const [reportType, setReportType] = useState('Activity performance');
  const [studentIdDraft, setStudentIdDraft] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [draftCategory, setDraftCategory] = useState(null);
  const [scoreDraft, setScoreDraft] = useState([]);
  const [showStudentIds, setShowStudentIds] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [homeView, setHomeView] = useState('Rolling view');
  const [selectedSettingsCategory, setSelectedSettingsCategory] = useState('Practice');
  const [settingsFilter, setSettingsFilter] = useState('');
  const [showPracticeAssignments, setShowPracticeAssignments] = useState(true);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savedSettings, setSavedSettings] = useState({ weighting: false, dropLowest: false, categories: initialCategories });

  const notify = (text) => { setMessage(text); window.clearTimeout(window.__gbToast); window.__gbToast = window.setTimeout(() => setMessage(''), 2200); };
  const overallForStudent = (student) => {
    const assignmentScores = assignments.map((assignment, index) => ({ assignment, score: student.scores[index] ?? 0 }));
    if (weighting) {
      const weighted = categories.map((category) => {
        let scores = assignmentScores.filter(({ assignment }) => assignment.category === category.name).map(({ score }) => score);
        if (dropLowest && category.drop > 0) scores = scores.slice().sort((a, b) => a - b).slice(Math.min(Number(category.drop), Math.max(0, scores.length - 1)));
        return { weight: Number(category.weight) || 0, score: average(scores) };
      }).filter(({ weight }) => weight > 0);
      const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight) return Math.round(weighted.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight);
    }
    let includedAssignments = assignmentScores;
    if (dropLowest && assignmentScores.length > 1) {
      const lowest = assignmentScores.reduce((lowestIndex, item, index) => item.score < assignmentScores[lowestIndex].score ? index : lowestIndex, 0);
      includedAssignments = assignmentScores.filter((_, index) => index !== lowest);
    }
    const scores = includedAssignments.map(({ score }) => score);
    if (overallMode === 'Points') {
      const possible = includedAssignments.reduce((sum, { assignment }) => sum + assignment.points, 0);
      const earned = includedAssignments.reduce((sum, { assignment, score }) => sum + assignment.points * score / 100, 0);
      return possible ? Math.round((earned / possible) * 100) : 0;
    }
    return average(scores);
  };
  const classAverage = useMemo(() => average(students.map(overallForStudent)), [students, assignments, categories, weighting, dropLowest, overallMode]);
  const visibleStudents = students.filter((student) => {
    const matchesText = `${student.name} ${student.id}`.toLowerCase().includes(studentSearch.toLowerCase());
    const score = overallForStudent(student);
    const matchesPerformance = performance === 'View all' || (performance === `High (≥${performanceRanges.high}%)` && score >= performanceRanges.high) || (performance === `Medium (${performanceRanges.medium}–${performanceRanges.high - 1}%)` && score >= performanceRanges.medium && score < performanceRanges.high) || (performance === `Low (<${performanceRanges.medium}%)` && score < performanceRanges.medium);
    return matchesText && matchesPerformance && (showDropped || student.status !== 'Dropped');
  });
  const visibleAssignments = assignments.filter((assignment) => {
    const matchesText = `${assignment.title} ${assignment.group}`.toLowerCase().includes(assignmentSearch.toLowerCase());
    const matchesType = typeFilter === 'All assignments' || assignment.category === typeFilter || (typeFilter === 'Non-practice' && assignment.category !== 'Practice') || (typeFilter === 'Practice' && assignment.category === 'Practice');
    const matchesCategory = categoryFilter === 'All categories' || assignment.category === categoryFilter;
    const due = new Date(`${assignment.due}T12:00:00`);
    const today = new Date('2026-10-27T12:00:00');
    const matchesDate = dateFilter === 'All' || (dateFilter === 'Due this week' && due <= new Date('2026-11-02T23:59:59') && due >= today) || (dateFilter === 'Due within range' && due >= new Date('2026-10-28T00:00:00') && due <= new Date('2026-11-05T23:59:59'));
    return matchesText && matchesType && matchesCategory && matchesDate;
  });
  const settingsAssignments = assignments.filter((assignment) => (selectedSettingsCategory === 'All assignments' || assignment.category === selectedSettingsCategory) && (showPracticeAssignments || assignment.category !== 'Practice') && assignment.title.toLowerCase().includes(settingsFilter.toLowerCase()));

  const openStudentId = (student) => { setStudentIdDraft(student.id); setModal({ type: 'studentId', student }); };
  const saveStudentId = () => {
    setStudents((current) => current.map((student) => student.id === modal.student.id ? { ...student, id: studentIdDraft } : student));
    setModal(null); notify('Student ID updated');
  };
  const dropStudent = () => {
    setStudents((current) => current.map((student) => student.id === modal.student.id ? { ...student, status: 'Dropped' } : student));
    setModal(null); notify('Student dropped from this prototype roster');
  };
  const createCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategories((current) => [...current, { name, weight: 0, drop: 0 }]); setSettingsDirty(true);
    setCategoryFilter(name); setSelectedSettingsCategory(name); setNewCategoryName(''); notify(`${name} category added`);
  };
  const saveCategory = () => {
    if (!draftCategory?.name.trim()) return;
    const nextName = draftCategory.name.trim();
    setCategories((current) => current.map((category) => category.name === draftCategory.original ? { name: nextName, weight: Number(draftCategory.weight) || 0, drop: Number(draftCategory.drop) || 0 } : category));
    setAssignments((current) => current.map((assignment) => assignment.category === draftCategory.original ? { ...assignment, category: nextName } : assignment));
    setSelectedSettingsCategory(nextName);
    setDraftCategory(null); setSettingsDirty(true); notify('Category settings saved');
  };
  const saveSettings = () => { setSavedSettings({ weighting, dropLowest, categories }); setSettingsDirty(false); notify('Gradebook settings saved'); };
  const discardSettings = () => { setWeighting(savedSettings.weighting); setDropLowest(savedSettings.dropLowest); setCategories(savedSettings.categories); setSettingsDirty(false); };
  const submitScore = (student, assignmentIndex, value) => {
    setStudents((current) => current.map((item) => item.id === student.id ? { ...item, scores: item.scores.map((score, index) => index === assignmentIndex ? Math.max(0, Math.min(100, Number(value) || 0)) : score) } : item));
  };
  const launchReport = (type) => { setReportType(type); setModal({ type: 'report', report: type }); };

  const tabsHeader = <nav className="gb-tabs" aria-label="Gradebook sections" role="tablist">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}<button className="gb-tabs-settings" type="button" onClick={() => setModal({ type: 'gradebookSettings' })} aria-label="Gradebook settings">⚙</button></nav>;

  const renderHome = () => <div className="gb-home">
    <section className="gb-home-summary">
      <article className="gb-home-score-summary"><div className="gb-summary-chart"><span className="gb-eyebrow">Recent Scores</span><div aria-label="Recent assignment score trend" className="gb-chart-dots">{assignments.slice(0, 4).map((assignment, index) => <i key={assignment.id} className={`gb-chart-dot dot-${index}`} title={`${assignment.title}: ${assignment.average}%`} />)}</div></div><div className="gb-summary-average"><span>Recent AVG:</span><strong>{assignments[0]?.average ?? 0}.0%</strong><span>Range:</span><small>{Math.min(...assignments.slice(0, 4).map((item) => item.average)).toFixed(1)}% to {Math.max(...assignments.slice(0, 4).map((item) => item.average)).toFixed(1)}%</small></div></article>
      <article className="gb-home-status-summary"><div><span>Last Assignment Due</span><strong>{assignments.at(-1)?.due ?? '--'}</strong></div><div><span>Assignment status</span><strong>Not Started</strong></div><div><strong>No Assignments Past Due</strong></div></article>
    </section>
    <div className="gb-home-toolbar"><div><span>VIEWING:</span><button type="button" className="gb-link" onClick={() => setHomeView(homeView === 'Rolling view' ? 'Due date view' : 'Rolling view')}>{homeView}</button></div><label className="gb-search"><input value={assignmentSearch} onChange={(event) => setAssignmentSearch(event.target.value)} placeholder="Search for assignments..." aria-label="Search for assignments" /><button type="button" aria-label="Search assignments">⌕</button></label></div>
    <div className="gb-home-assignments"><section className="gb-home-assignment-section"><h2>UPCOMING ASSIGNMENTS</h2><p>No assignments are upcoming</p></section><section className="gb-home-assignment-section"><h2>SUBMITTED ASSIGNMENTS</h2>{assignments.filter((assignment) => `${assignment.title} ${assignment.group}`.toLowerCase().includes(assignmentSearch.toLowerCase())).map((assignment) => <div className="gb-submission-row" key={assignment.id}><div className="gb-submission-main"><button className="gb-link" type="button" onClick={() => setModal({ type: 'assignment', assignment })}>{assignment.title}</button><span>Last Submission date: 10/27/26, 12:15pm</span></div><div className="gb-submission-stat"><span>{Math.round((assignment.submitted / students.length) * 100)}% submitted</span><span>{assignment.average}.0% average score</span></div><button className="gb-button" type="button" onClick={() => { const index = assignments.findIndex((item) => item.id === assignment.id); setScoreDraft(students.map((student) => ({ id: student.id, score: student.scores[index] ?? 0 }))); setModal({ type: 'adjustScore', assignment }); }}>Adjust Score</button></div>)}</section></div>
  </div>;

  const renderGradebook = () => <section className="gb-table-view">
    <div className="gb-grade-toolbar"><div><strong>Class average</strong><span>{classAverage}%</span></div><label className="gb-switch"><input type="checkbox" checked={editingScores} onChange={(event) => setEditingScores(event.target.checked)} /><span className="gb-switch-track" />Edit scores</label><details className="gb-menu"><summary>Gradebook actions</summary><div><button type="button" onClick={() => { setGroupState(groupState === 'Collapse all' ? 'Expand all' : 'Collapse all'); notify(`${groupState === 'Collapse all' ? 'Groups expanded' : 'Groups collapsed'}`); }}>{groupState}</button><button type="button" onClick={() => setModal({ type: 'import' })}>Import scores</button><button type="button" onClick={() => setModal({ type: 'export' })}>Export gradebook</button></div></details><details className="gb-menu"><summary>Display settings</summary><div className="gb-menu-panel"><label>Display score as<select value={scoreMode} onChange={(event) => setScoreMode(event.target.value)}><option>Points</option><option>Percentages</option></select></label><label>Group assignments by<select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}><option>Date due</option><option>Grading category</option><option>Chapter or unit</option><option>Sub-chapter or sub-unit</option></select></label><label>Group default<select value={groupState} onChange={(event) => setGroupState(event.target.value)}><option>Retain manual grouping</option><option>Expand all</option><option>Collapse all</option></select></label></div></details>
      <details className="gb-menu"><summary>Filter by</summary><div className="gb-menu-panel"><label>Due date<select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option>All</option><option>Due this week</option><option>Due within range</option></select></label><label>Assignment type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All assignments</option><option>Non-practice</option><option>Practice</option></select></label><label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All categories</option>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></label></div></details>
    </div>
    <div className="gb-table-tools"><label className="gb-jump-filter">Jump to:<select onChange={(event) => event.target.value && document.getElementById(`group-${event.target.value}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><option value="">Enter Category or Assignment</option>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}</select></label></div>
      <div className="gb-table-scroll"><table className="gb-table"><colgroup><col style={{ width: 42 }} /><col style={{ width: 185 }} /><col style={{ width: 205 }} />{visibleAssignments.map((assignment) => <col key={assignment.id} style={{ width: 82 }} />)}</colgroup><thead><tr className="gb-table-head-row"><th className="gb-select-cell"><input aria-label="Select all students" type="checkbox" checked={selectedStudentIds.length === visibleStudents.length && visibleStudents.length > 0} onChange={(event) => setSelectedStudentIds(event.target.checked ? visibleStudents.map((student) => student.id) : [])} /></th><th className="gb-name-head"><div>Name <button type="button" className="gb-link" onClick={() => setShowStudentIds(!showStudentIds)}>({showStudentIds ? 'Hide' : 'Show'} Student ID)</button><span>↑</span></div><input className="gb-name-filter" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Filter by Student Name" aria-label="Filter by student name" /></th><th className="gb-overall-head"><span>Calculation by {overallMode}</span><label>Overall Performance<select value={performance} onChange={(event) => setPerformance(event.target.value)}><option>View all</option><option>{`High (≥${performanceRanges.high}%)`}</option><option>{`Medium (${performanceRanges.medium}–${performanceRanges.high - 1}%)`}</option><option>{`Low (<${performanceRanges.medium}%)`}</option></select></label><button className="gb-link" type="button" onClick={() => { setRangeDraft({ ...performanceRanges }); setModal({ type: 'performanceRanges' }); }}>Configure ranges</button></th>{visibleAssignments.map((assignment) => <th key={assignment.id} id={`group-${assignment.id}`} className="gb-activity-header"><span>{groupBy === 'Grading category' ? assignment.category : assignment.group}</span><small>{assignment.title}</small><small>{assignment.points} points</small></th>)}</tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.id}><td className="gb-select-cell"><input aria-label={`Select ${student.name}`} type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={(event) => setSelectedStudentIds((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))} /></td><th scope="row"><button className="gb-link" type="button" onClick={() => setModal({ type: 'student', student })}>{student.name}</button>{showStudentIds && <small>ID {student.id}</small>}</th><td><strong>{overallForStudent(student)}%</strong><small>{overallMode === 'Points' ? `${Math.round(student.scores.reduce((sum, score, index) => sum + score * (assignments[index]?.points ?? 0) / 100, 0))} / ${assignments.reduce((sum, assignment) => sum + assignment.points, 0)} pts` : `${overallForStudent(student)}% average`}</small></td>{visibleAssignments.map((assignment) => { const index = assignments.findIndex((item) => item.id === assignment.id); const score = student.scores[index] ?? 0; return <td key={assignment.id}>{editingScores ? <input className="gb-score-input" type="number" min="0" max="100" aria-label={`${student.name} score for ${assignment.title}`} value={score} onChange={(event) => submitScore(student, index, event.target.value)} /> : <span className={score < 70 ? 'gb-low-score' : ''}>{scoreMode === 'Points' ? `${Math.round((score / 100) * assignment.points)} / ${assignment.points}` : `${score}%`}</span>}</td>; })}</tr>)}</tbody></table>{!visibleStudents.length && <p className="gb-empty">No students match these filters.</p>}</div>
  </section>;

  const renderSettings = () => <section className="gb-settings-view">
    <div className="gb-settings-toolbar"><label className="gb-inline-toggle"><span>Category Weighting</span><input type="checkbox" checked={weighting} onChange={(event) => { setWeighting(event.target.checked); setSettingsDirty(true); }} /><button type="button" aria-label="Category weighting help" title="Use category weights to calculate overall scores.">?</button></label><label className="gb-inline-toggle"><span>Drop Lowest Score</span><input type="checkbox" checked={dropLowest} onChange={(event) => { setDropLowest(event.target.checked); setSettingsDirty(true); }} /><button type="button" aria-label="Drop lowest score help" title="Exclude the lowest score from the overall calculation.">?</button></label><label className="gb-settings-search">Filter Assignments:<input value={settingsFilter} onChange={(event) => setSettingsFilter(event.target.value)} placeholder="Enter Assignment Name" /></label><button className="gb-link" type="button" onClick={() => setShowPracticeAssignments(!showPracticeAssignments)}>{showPracticeAssignments ? 'Hide' : 'Show'} Practice Assignments</button></div>
    <div className="gb-settings-layout"><div className="gb-category-panel"><div className="gb-category-table-head"><span>Category Name</span><span>Weight</span><span>Drop Lowest Score</span></div>{categories.map((category) => <div className="gb-category-entry" key={category.name}><button className={`gb-category-item ${selectedSettingsCategory === category.name ? 'selected' : ''}`} type="button" onClick={() => setSelectedSettingsCategory(category.name)}><span>{category.name.toLowerCase()}</span><span>{weighting ? `${category.weight}%` : `(${assignments.filter((assignment) => assignment.category === category.name).length})`}</span><span>{dropLowest ? category.drop : ''}</span></button><button className="gb-category-edit" type="button" aria-label={`Edit ${category.name}`} onClick={() => setDraftCategory({ ...category, original: category.name })}>✎</button></div>)}<div className="gb-add-category-row"><label><span className="visually-hidden">Category name</span><input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && createCategory()} placeholder="New category name" /></label><button className="gb-button gb-add-purple" type="button" onClick={createCategory} disabled={!newCategoryName.trim()}>＋ Add Category</button></div></div>
      <div className="gb-assignment-settings-panel"><div className="gb-assignment-settings-head"><span>Assignment Name</span><span>Scoring</span><span>Points</span></div><div className="gb-assignment-settings-list">{settingsAssignments.map((assignment) => <div className="gb-assignment-settings-row" key={assignment.id}><span><i aria-hidden="true">⠿</i>{assignment.title}</span><span>{assignment.category}</span><span>{assignment.points}</span></div>)}{!settingsAssignments.length && <p className="gb-empty">No assignments in this category.</p>}</div><div className="gb-total-points">Total Possible Points: {assignments.reduce((sum, item) => sum + item.points, 0)}</div></div></div>
    <div className="gb-settings-footer"><span>{settingsDirty ? 'You have unsaved changes.' : 'Settings are up to date.'}</span><div><button className="gb-button" type="button" disabled={!settingsDirty} onClick={discardSettings}>Discard Changes</button><button className="gb-button gb-primary" type="button" disabled={!settingsDirty} onClick={saveSettings}>Save</button></div></div>
  </section>;

  const renderReports = () => <section className="gb-reports-view"><span className="gb-eyebrow">Course insights</span><h2>Reports Dashboard</h2><p>Review performance for individual activities and chapter concepts.</p><div className="gb-report-cards">{[['Activity Performance Report', 'At-a-glance course performance information on a single activity.'], ['Chapter/Subchapter Performance Report', 'Course performance information on chapter-specific questions within a single activity or over time.']].map(([title, copy]) => <article className="gb-card gb-report-card" key={title}><div className="gb-report-icon">▥</div><h3>{title}</h3><p>{copy}</p><button className="gb-button gb-primary" type="button" onClick={() => launchReport(title)}>View Report <span aria-hidden="true">→</span></button></article>)}</div></section>;

  const renderRoster = () => <section className="gb-roster-view"><div className="gb-roster-controls"><label className="gb-student-filter"><input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Filter by name or student ID..." aria-label="Filter by name or student ID" /><button type="button" aria-label="Search roster">⌕</button></label><strong>Students Enrolled: {students.filter((student) => student.status !== 'Dropped').length}</strong></div><div className="gb-roster-table"><div className="gb-roster-header"><span><input aria-label="Select all students" type="checkbox" checked={selectedStudentIds.length === visibleStudents.length && visibleStudents.length > 0} onChange={(event) => setSelectedStudentIds(event.target.checked ? visibleStudents.map((student) => student.id) : [])} /></span><span>Name ↑</span><span>Student ID</span><span>Enrollment Status</span><span>License Status</span><span>Actions</span></div>{visibleStudents.map((student) => <article className="gb-roster-row" key={student.id}><label className="gb-roster-select"><input type="checkbox" aria-label={`Select ${student.name}`} checked={selectedStudentIds.includes(student.id)} onChange={(event) => setSelectedStudentIds((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))} /></label><div><button className="gb-link" type="button" onClick={() => setModal({ type: 'student', student })}>{student.name}</button><small>Average: {overallForStudent(student)}%</small></div><span>{student.id}</span><span><i className={`gb-status ${student.status.toLowerCase()}`} />{student.status}</span><span>{student.license}</span><details className="gb-menu gb-row-menu"><summary aria-label={`Actions for ${student.name}`}>•••</summary><div><button type="button" onClick={() => openStudentId(student)}>Edit Student ID</button><button type="button" onClick={() => setModal({ type: 'dropStudent', student })}>Drop Student</button></div></details></article>)}</div></section>;

  const body = activeTab === 'Home' ? renderHome() : activeTab === 'Gradebook' ? renderGradebook() : activeTab === 'Settings' ? renderSettings() : activeTab === 'Reports' ? renderReports() : renderRoster();

  return <div className="gradebook-page"><header className="gb-page-heading"><div><span className="gb-eyebrow">MindTap course tools</span><h1>Gradebook</h1></div><button className="gb-gear" type="button" onClick={() => setModal({ type: 'gradebookSettings' })} aria-label="Gradebook settings">⚙</button></header>{tabsHeader}<div className="gb-content">{body}</div>{message && <div className="gb-toast" role="status">{message}</div>}
    {draftCategory && <Modal title={`Edit ${draftCategory.original}`} onClose={() => setDraftCategory(null)} actions={<><button className="gb-button" type="button" onClick={() => setDraftCategory(null)}>Cancel</button><button className="gb-button gb-primary" type="button" onClick={saveCategory}>Save category</button></>}><label>Category name<input value={draftCategory.name} onChange={(event) => setDraftCategory({ ...draftCategory, name: event.target.value })} /></label><label>Weight (%)<input type="number" min="0" max="100" value={draftCategory.weight} onChange={(event) => setDraftCategory({ ...draftCategory, weight: event.target.value })} /></label><label>Drop lowest scores<input type="number" min="0" value={draftCategory.drop} onChange={(event) => setDraftCategory({ ...draftCategory, drop: event.target.value })} /></label></Modal>}
    {modal?.type === 'gradebookSettings' && <Modal title="Gradebook settings" onClose={() => setModal(null)} actions={<><button className="gb-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="gb-button gb-primary" type="button" onClick={() => { setModal(null); notify('Gradebook settings saved'); }}>Save settings</button></>}><fieldset className="gb-fieldset"><legend>Calculate overall score by</legend>{['Percentage', 'Points'].map((mode) => <label key={mode} className="gb-radio"><input type="radio" name="overallMode" checked={overallMode === mode} onChange={() => setOverallMode(mode)} /><span><strong>{mode}</strong><small>{mode === 'Percentage' ? 'Average the percentage score across graded assignments.' : 'Divide total points earned by total points possible.'}</small></span></label>)}</fieldset><fieldset className="gb-fieldset"><legend>Dropped students</legend><label className="gb-radio"><input type="radio" checked={!showDropped} onChange={() => setShowDropped(false)} /><span>Hide dropped students</span></label><label className="gb-radio"><input type="radio" checked={showDropped} onChange={() => setShowDropped(true)} /><span>Show dropped students</span></label></fieldset></Modal>}
    {modal?.type === 'performanceRanges' && <Modal title="Student performance ranges" onClose={() => setModal(null)} actions={<><button className="gb-button" type="button" onClick={() => { setRangeDraft(null); setModal(null); }}>Cancel</button><button className="gb-button gb-primary" type="button" onClick={() => { const high = Math.max(1, Math.min(100, Number(rangeDraft.high) || 90)); const medium = Math.max(0, Math.min(high - 1, Number(rangeDraft.medium) || 70)); setPerformanceRanges({ high, medium }); setRangeDraft(null); setPerformance('View all'); setModal(null); notify('Performance ranges saved'); }}>Save ranges</button></>}><p>Set the score thresholds used to group students by overall performance.</p><label>High performers ≥ (%)<input type="number" min="1" max="100" value={rangeDraft.high} onChange={(event) => setRangeDraft({ ...rangeDraft, high: event.target.value })} /></label><label>Medium performers ≥ (%)<input type="number" min="0" max="99" value={rangeDraft.medium} onChange={(event) => setRangeDraft({ ...rangeDraft, medium: event.target.value })} /></label><p className="gb-muted">Low performers are below the medium threshold.</p></Modal>}
    {modal?.type === 'studentId' && <Modal title="Edit student ID" onClose={() => setModal(null)} actions={<><button className="gb-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="gb-button gb-primary" type="button" onClick={saveStudentId}>Save ID</button></>}><p>Update the ID for {modal.student.name}.</p><label>Student ID<input value={studentIdDraft} onChange={(event) => setStudentIdDraft(event.target.value)} /></label></Modal>}
    {modal?.type === 'student' && <Modal title={modal.student.name} onClose={() => setModal(null)}><p>Student ID: {modal.student.id}</p><p>Enrollment: {modal.student.status} · License: {modal.student.license}</p><p>Overall performance: {overallForStudent(modal.student)}%</p></Modal>}
    {modal?.type === 'dropStudent' && <Modal title="Drop student?" onClose={() => setModal(null)} actions={<><button className="gb-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="gb-button gb-danger" type="button" onClick={dropStudent}>Drop student</button></>}><p>{modal.student.name} will be marked as dropped in this prototype roster. Their scores remain visible when dropped students are shown.</p></Modal>}
    {modal?.type === 'report' && <Modal title={modal.report} onClose={() => setModal(null)} actions={<><button className="gb-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="gb-button gb-primary" type="button" onClick={() => { setModal(null); notify(`${reportType} opened`); }}>View report</button></>}><label>Activity<select><option>Select an activity</option>{assignments.map((assignment) => <option key={assignment.id}>{assignment.title}</option>)}</select></label><label>Reporting period<select><option>All course activity</option><option>This week</option><option>This month</option></select></label></Modal>}
    {modal?.type === 'assignment' && <Modal title={modal.assignment.title} onClose={() => setModal(null)}><p>{modal.assignment.group} · {modal.assignment.points} points</p><p>{modal.assignment.submitted} of {students.length} submissions · {modal.assignment.average}% class average</p></Modal>}
    {modal?.type === 'adjustScore' && <Modal title={`Adjust scores · ${modal.assignment.title}`} onClose={() => setModal(null)} actions={<><button className="gb-button" type="button" onClick={() => { setScoreDraft([]); setModal(null); }}>Cancel</button><button className="gb-button gb-primary" type="button" onClick={() => { const index = assignments.findIndex((assignment) => assignment.id === modal.assignment.id); setStudents((current) => current.map((student) => { const draft = scoreDraft.find((item) => item.id === student.id); return draft ? { ...student, scores: student.scores.map((score, scoreIndex) => scoreIndex === index ? Math.max(0, Math.min(100, Number(draft.score) || 0)) : score) } : student; })); setScoreDraft([]); setModal(null); notify('Score changes saved in this prototype'); }}>Save scores</button></>}><p>Enter a score percentage for each student. These changes stay in this prototype.</p><div className="gb-score-editor">{students.map((student) => { const draft = scoreDraft.find((item) => item.id === student.id); return <label key={student.id}>{student.name}<span><input aria-label={`${student.name} score`} type="number" min="0" max="100" value={draft?.score ?? 0} onChange={(event) => setScoreDraft((current) => current.map((item) => item.id === student.id ? { ...item, score: event.target.value } : item))} /> %</span></label>; })}</div></Modal>}
    {modal?.type === 'import' && <Modal title="Import scores" onClose={() => setModal(null)}><p>Choose a gradebook file to map scores into this course.</p><input type="file" accept=".csv,.xlsx" /><p className="gb-muted">File import is a prototype interaction; no file is uploaded or processed.</p></Modal>}
    {modal?.type === 'export' && <Modal title="Export gradebook" onClose={() => setModal(null)} actions={<button className="gb-button gb-primary" type="button" onClick={() => { setModal(null); notify('Gradebook export prepared in this prototype'); }}>Prepare export</button>}><p>Export scores as a spreadsheet for offline review.</p><label>Format<select><option>CSV</option><option>Excel workbook</option></select></label></Modal>}
  </div>;
}
