import React, { useEffect, useRef, useState } from 'react';
import { ActionButton, Check, CourseDialog, Field } from './CourseUI';
import { activityVisibility, courseChapters, folderVisibility, getCourseState, openCourseFlow, readingSectionInfo, saveFolder, updateCourseActivities, useCourseState } from './courseModel';
import { getSectionActivities, sectionActivities } from './ActivityRows';
import { getChapterAssignments } from './chapterAssignments';
import { getActivityQuestions } from './activityQuestions';
import ActivityCreation, { ActivityLocationModal } from './ActivityCreation';
import { saveCreatedActivity } from './createdActivities';
import ActivityBehaviorSettings, { defaultActivitySettings } from './ActivityBehaviorSettings';
import StudentAccommodations from './StudentAccommodations';
import { getSettingsTemplate } from './CourseSettings';
import { algebraCards } from './CourseResources';
import { scaleQuestionPoints } from './activityAuthoring';
import { useSelection } from './Selection';
import ActivityPlayer from './ActivityPlayer';
import ActivitySettingsModal from './ActivitySettingsModal';
import { applyAccommodationOperations } from './accommodationData';
import { duplicateActivity } from './activityManagement';
import DeleteStudentAttempts from './DeleteStudentAttempts';

export function allCourseActivities(chapters = courseChapters) {
  return [...chapters, 'Learning Path'].flatMap((chapter) => Object.entries(getSectionActivities(chapter)).flatMap(([section, rows]) => rows.map((activity) => ({ ...activity, chapter, section, ...activityVisibility(activity) })))).filter((activity) => !activity.removed);
}
export function courseReadings(chapters = courseChapters) {
  const state = getCourseState();
  return chapters.filter((chapter) => courseChapters.includes(chapter)).flatMap((chapter) => {
    const make = (key, title, selectionId) => ({ title, chapter, section: 'reading', icon: 'book', resourceKind: 'reading', stableKey: key, selectionId, ...state.activities[key] });
    return [make(`${chapter}/reading`, 'Chapter Introduction', `chapter:${chapter}/Learn It/reading`), ...(getChapterAssignments(chapter)?.['Learn It'] || sectionActivities['Learn It']).map((a) => { const { number, name, token } = readingSectionInfo(a.title); return make(`${chapter}/Learn It/${token}/reading`, `${number} Read it: ${name}`, `chapter:${chapter}/Learn It/${token}/reading`); })];
  }).map((a) => ({ ...a, ...activityVisibility(a) })).filter((a) => !a.removed && a.section === 'reading');
}
export function getCourseFolderOptions(chapters = courseChapters) {
  const folders = getCourseState().folders;
  const options = [...new Set([...courseChapters, ...chapters, ...Object.keys(folders)])].map((id) => ({ id, title: folders[id]?.title || id, parent: folders[id]?.parent || 'Learning Path', ...folders[id] }));
  for (const chapter of courseChapters) for (const activity of (getChapterAssignments(chapter)?.['Learn It'] || sectionActivities['Learn It'])) {
    const { token, number, name } = readingSectionInfo(activity.title);
    const id = `${chapter}/section/${token}`;
    const definition = { id, title: `${number} ${name}`, parent: chapter, kind: 'section', sourceChapter: chapter, sectionActivity: activity, ...folders[id] };
    const index = options.findIndex((option) => option.id === id);
    if (index < 0) options.push(definition); else options[index] = definition;
  }
  return options.filter((option) => !folderVisibility(option.id).removed);
}
const folderActivityOptions = [['bank', 'Add Activity from Activity Bank'], ['create', 'Create New Activity'], ['flashcards', 'Flashcards'], ['drive', 'Google Drive'], ['video', 'WebVideo Search'], ['link', 'Web Link Activity'], ['external', 'Non MindTap Activity'], ['onedrive', 'Microsoft OneDrive']];
export function FolderActions({ folderId, title, parent, sectionActivity }) {
  const state = useCourseState(); const folder = state.folders[folderId] || {};
  const [position, setPosition] = useState({ right: 24, top: 200 });
  const menu = useRef(null);
  const [adding, setAdding] = useState(false);
  const addToFolder = (type, label) => {
    menu.current?.removeAttribute('open'); setAdding(false);
    if (sectionActivity && !state.folders[folderId]?.kind) saveFolder(folderId, { title, parent, kind: 'section', sourceChapter: parent, sectionActivity });
    openCourseFlow({ type, label, folderId, title, parent, sectionActivity });
  };
  useEffect(() => { const outside = (event) => { if (!menu.current?.contains(event.target)) menu.current?.removeAttribute('open'); }; const escape = (event) => { if (event.key === 'Escape') menu.current?.removeAttribute('open'); }; document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape); return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); }; }, []);
  return <details ref={menu} className="lp-folder-actions"><summary aria-label={`More actions for ${title}`} onClick={(event) => { setAdding(false); const rect = event.currentTarget.getBoundingClientRect(); setPosition({ right: Math.max(12, window.innerWidth - rect.right), top: Math.max(12, Math.min(rect.bottom, window.innerHeight - 260)) }); }}><img src="/rebrand/more.svg" width="16" height="16" alt="" /></summary><div role="menu" style={{ position: 'fixed', ...position, maxHeight: `calc(100vh - ${position.top + 12}px)`, overflowY: 'auto' }}>{[
    [folder.hidden ? 'Show folder to students' : 'Hide folder from students', 'folder-visibility'], ['Edit folder details', 'folder'], ['Add activity to folder', 'folder-add'], ['Add folder to folder', 'folder-new'], ['Remove folder', 'folder-remove'],
  ].map(([label, type]) => type === 'folder-add' ? <React.Fragment key={type}><button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={adding} onClick={() => setAdding(!adding)}>{label} <span aria-hidden="true">›</span></button>{adding && <div className="folder-add-submenu" role="menu" aria-label="Add activity to folder">{folderActivityOptions.map(([action, name]) => <button key={action} type="button" role="menuitem" onClick={() => addToFolder(action, name)}>{name}</button>)}</div>}</React.Fragment> : <button type="button" role="menuitem" key={type} onClick={(event) => { event.currentTarget.closest('details').removeAttribute('open'); openCourseFlow({ type, folderId, title, parent, sectionActivity }); }}>{label}</button>)}</div></details>;
}
export default function LearningPathFlows({ chapters, selectedIds, onClearSelection, notify, onCreate, onAdded }) {
  const selection = useSelection();
  selectedIds = selectedIds || selection.selectedIds;
  onClearSelection = onClearSelection || (() => selection.setSelected(new Set()));
  const course = useCourseState();
  const [flow, setFlow] = useState(null); const [draft, setDraft] = useState({}); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [chosen, setChosen] = useState([]); const [preview, setPreview] = useState(null);
  const [placement, setPlacement] = useState(null); const accommodation = useRef(null);
  const [settingsActivity, setSettingsActivity] = useState(null);
  const folderOptions = getCourseFolderOptions(chapters);
  const destinations = ['Learning Path', ...folderOptions.map((folder) => folder.id)];
  if (flow?.type === 'folder-new' && !destinations.includes(flow.folderId)) destinations.push(flow.folderId);
  const catalog = allCourseActivities(chapters);
  const selected = [...catalog, ...courseReadings(chapters)].filter((activity) => selectedIds.includes(activity.selectionId || `chapter:${activity.chapter}/${activity.section}/${activity.id || activity.title}`));
  const begin = (next) => {
    if (next.type === 'create') { setFlow(null); onCreate?.(next.folderId); return; }
    setError(''); setSearch(''); setChosen([]); setPreview(null);
    const available = getCourseFolderOptions();
    const folder = available.find((item) => item.id === next.folderId) || {};
    const currentPlacement = folder.placement || (next.folderId ? 'keep' : 'end');
    setDraft({ title: next.type === 'folder-new' ? '' : next.type === 'duplicate-activity' ? `${next.activity.title} (Copy)` : next.type === 'folder' ? next.title || '' : '', parent: next.type === 'folder-new' ? next.folderId : folder.parent || next.parent || 'Learning Path', placement: next.type === 'folder-new' ? 'end' : currentPlacement, points: '', dateMode: 'Select Dates', availableDate: '', dueDate: '', availableTime: '00:00', dueTime: '23:59', shiftAvailable: true, shiftDue: true, days: '7', direction: 'later', creditType: '', template: 'Apply It', password: '', hours: '', minutes: '', removeLimit: false, removePassword: false, latePenalty: '0', lateMode: 'percent', accommodations: null, settings: defaultActivitySettings, links: [''], before: '', after: '', step: 1, description: '', ...next.draft });
    setFlow(next);
  };
  useEffect(() => { const receive = (event) => begin(event.detail); window.addEventListener('mindtap-course-flow', receive); return () => window.removeEventListener('mindtap-course-flow', receive); }, []);
  const close = () => { setFlow(null); setError(''); };
  const set = (name, value) => { setDraft((old) => ({ ...old, [name]: value })); setError(''); };
  const complete = (message) => { close(); onClearSelection?.(); notify(message); };
  if (settingsActivity) return <ActivitySettingsModal activity={settingsActivity} saveLabel="Save and Continue" onClose={() => setSettingsActivity(null)} onSave={(activity) => { setSettingsActivity(null); setPlacement(activity); }} />;
  if (placement) return <ActivityLocationModal activity={placement} chapters={chapters} onCancel={() => setPlacement(null)} onSave={(activity) => { saveCreatedActivity(activity); setPlacement(null); close(); onAdded?.(activity); notify(`${activity.title} added to Learning Path`); }} />;
  if (!flow) return null;
  if (flow.type === 'edit-activity') {
    const original = flow.activity;
    const questions = original.questions || getActivityQuestions(original.originalChapter || original.chapter, original.originalTitle || original.title);
    const editable = { ...original, questions: scaleQuestionPoints(questions, original.points).map((question, index) => ({ ...question, title: question.title || `${original.title} · Question ${index + 1}`, questionType: question.questionType || (question.kind === 'choice' ? 'Multiple choice' : 'Math') })) };
    return <div className="activity-edit-overlay"><ActivityCreation initialActivity={editable} chapters={chapters} onCancel={close} onSaveActivity={(activity) => { updateCourseActivities([{ activity: original, patch: activity }]); notify('Activity title and content saved'); }} /></div>;
  }
  if (flow.type === 'delete-attempts') return <DeleteStudentAttempts activity={flow.activity} onClose={close} notify={notify} />;
  if (flow.type === 'remove-activity') return <CourseDialog title="Remove Activity?" onClose={close} saveLabel="Remove" onSave={() => { updateCourseActivities([{ activity: flow.activity, patch: { removed: true } }]); complete('Activity removed from Learning Path'); }}><p>Remove <strong>{flow.activity.title}</strong> from this course?</p></CourseDialog>;
  if (flow.type === 'duplicate-activity') return <CourseDialog title="Duplicate Activity" onClose={close} saveLabel="Continue" onSave={() => { const copy = duplicateActivity(flow.activity, flow.activity.questions || getActivityQuestions(flow.activity.originalChapter || flow.activity.chapter, flow.activity.originalTitle || flow.activity.title), `created-${crypto.randomUUID()}`); setPlacement({ ...copy, title: draft.title.trim() || copy.title }); }}><Field label="Activity title *" required value={draft.title} placeholder={`${flow.activity.title} (Copy)`} onChange={(event) => set('title', event.target.value)} /><p>Copy this activity's math questions and settings, then choose its location.</p></CourseDialog>;
  const isBulk = flow.type.startsWith('bulk-');
  const targets = flow.activity ? [flow.activity] : selected;
  const gradeOnly = ['bulk-points', 'bulk-practice', 'bulk-accommodation', 'bulk-template', 'bulk-password', 'bulk-time', 'bulk-late'].includes(flow.type);
  const qualified = gradeOnly ? targets.filter((a) => a.points !== undefined) : targets;
  const targetCount = targets.length;
  const countLabel = `${targetCount} ${targetCount === 1 ? 'Activity' : 'Activities'}`;
  const changeTargets = (patch) => { if (!targets.length) { setError('Select at least one activity.'); return false; } updateCourseActivities(qualified.map((activity) => ({ activity, patch: typeof patch === 'function' ? patch(activity) : patch }))); return true; };
  const folderName = course.folders[flow.folderId]?.title || flow.title;
  const folderRelations = Object.fromEntries(folderOptions.map((item) => [item.id, item]));
  const siblingFolders = folderOptions.filter((item) => item.id !== flow.folderId && item.parent === draft.parent);
  const siblingActivities = catalog.filter((item) => item.chapter === draft.parent && (draft.parent === 'Learning Path' || item.section !== 'Learn It')).map((item) => ({ id: item.stableKey, title: item.title }));
  const placements = [...siblingFolders, ...siblingActivities];
  const folderFields = <><Field label="Folder Name *" required maxLength={256} value={draft.title} onChange={(e) => set('title', e.target.value)} /><h3>Location</h3><Field label="Folder"><select value={draft.parent} onChange={(e) => { set('parent', e.target.value); set('placement', 'end'); }}>{destinations.filter((name) => flow.type === 'folder-new' || (name !== flow.folderId && !isDescendant(name, flow.folderId, folderRelations))).map((name) => <option key={name} value={name}>{name === 'Learning Path' ? 'College Algebra (Directly on the Learning Path)' : folderRelations[name]?.title || name}</option>)}</select></Field><Field label="Placement"><select value={draft.placement} onChange={(e) => set('placement', e.target.value)}>{draft.placement === 'keep' && <option value="keep">Current position</option>}{placements.map((item) => <option key={item.id} value={`before:${item.id}`}>Before {item.title}</option>)}<option value="end">At end</option><option value="start">At beginning</option></select></Field></>;
  const saveFolderDetails = () => {
    if (!draft.title.trim()) { setError('Enter a folder name.'); return; }
    const id = flow.type === 'folder-new' || !flow.folderId ? `folder-${crypto.randomUUID()}` : flow.folderId;
    const destination = folderRelations[draft.parent];
    if (destination?.kind === 'section' && !course.folders[draft.parent]?.kind) saveFolder(draft.parent, destination);
    if (flow.sectionActivity && flow.type === 'folder-new' && !course.folders[flow.folderId]) saveFolder(flow.folderId, { title: flow.title, parent: flow.parent, kind: 'section', sourceChapter: flow.parent, sectionActivity: flow.sectionActivity });
    saveFolder(id, { title: draft.title.trim(), parent: draft.parent, ...(draft.placement !== 'keep' ? { placement: draft.placement } : {}), custom: id.startsWith('folder-'), ...(flow.sectionActivity && flow.type !== 'folder-new' ? { kind: 'section', sourceChapter: course.folders[flow.folderId]?.sourceChapter || flow.parent, sectionActivity: flow.sectionActivity } : {}) });
    complete('Folder saved');
  };
  const bulkSave = () => {
    let patch = {};
    if (flow.type === 'bulk-dates') {
      if (draft.dateMode === 'Select Dates') {
        if (!draft.availableDate && !draft.dueDate) { setError('Enter at least one date.'); return; }
        if (draft.availableDate && draft.dueDate && `${draft.availableDate}T${draft.availableTime}` > `${draft.dueDate}T${draft.dueTime}`) { setError('Date Due must be on or after Date Available.'); return; }
        patch = (activity) => ({ ...(draft.availableDate ? { availableDate: draft.availableDate, availableTime: draft.availableTime } : {}), ...(draft.dueDate ? { dueDate: draft.dueDate, dueTime: draft.dueTime, dueTimeZone: 'EST', dueUtcOffset: '-05:00' } : {}) });
      } else if (draft.dateMode === 'Remove Dates') {
        if (!draft.shiftAvailable && !draft.shiftDue) { setError('Select the dates to remove.'); return; }
        patch = { ...(draft.shiftAvailable ? { availableDate: '' } : {}), ...(draft.shiftDue ? { dueDate: '' } : {}) };
      } else {
        if (!Number.isInteger(Number(draft.days)) || Number(draft.days) < 1 || (!draft.shiftAvailable && !draft.shiftDue)) { setError('Select dates and enter a whole number of days greater than zero.'); return; }
        patch = (activity) => Object.fromEntries(['availableDate', 'dueDate'].filter((field) => activity[field] && (field === 'dueDate' ? draft.shiftDue : draft.shiftAvailable)).map((field) => { const date = new Date(`${activity[field]}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + Number(draft.days) * (draft.direction === 'later' ? 1 : -1)); return [field, date.toISOString().slice(0, 10)]; }));
      }
    } else if (flow.type === 'bulk-points') {
      if (draft.points === '' || !Number.isFinite(Number(draft.points)) || Number(draft.points) < 0) { setError('Enter total points of zero or greater.'); return; }
      patch = (activity) => ({ points: Number(draft.points), ...(activity.questions ? { questions: scaleQuestionPoints(activity.questions, draft.points) } : {}) });
    } else if (flow.type === 'bulk-practice') {
      if (!draft.creditType) { setError('Select a credit type.'); return; }
      patch = (activity) => ({ countsTowardsGrade: draft.creditType === 'graded', settings: { ...activity.settings, creditType: draft.creditType } });
    } else if (flow.type === 'bulk-password') {
      if (!draft.removePassword && !/^[a-zA-Z0-9]{6,16}$/.test(draft.password)) { setError('Password must be 6 to 16 letters or numbers.'); return; }
      patch = { password: draft.removePassword ? '' : draft.password };
    } else if (flow.type === 'bulk-time') {
      const minutes = Number(draft.hours || 0) * 60 + Number(draft.minutes || 0);
      if (!draft.removeLimit && (!Number.isInteger(minutes) || minutes <= 0 || Number(draft.hours) < 0 || Number(draft.minutes) < 0 || Number(draft.minutes) > 59)) { setError('Enter a positive time limit with minutes from 0 to 59.'); return; }
      patch = (activity) => ({ settings: { ...defaultActivitySettings, ...activity.settings, timeLimit: draft.removeLimit ? '' : `${minutes} minutes` } });
    } else if (flow.type === 'bulk-template') patch = (activity) => ({ settings: { ...getSettingsTemplate(draft.template) }, countsTowardsGrade: getSettingsTemplate(draft.template).creditType !== 'practice' });
    else if (flow.type === 'bulk-late') {
      if (draft.latePenalty === '' || Number(draft.latePenalty) < 0 || Number(draft.latePenalty) > 100) { setError('Enter a late penalty from 0 to 100.'); return; }
      patch = (activity) => ({ settings: { ...activity.settings, latePenalty: Number(draft.latePenalty), lateMode: draft.lateMode } });
    } else if (flow.type === 'bulk-accommodation') {
      const result = accommodation.current?.commit(); if (result?.error) { setError(result.error); return; }
      patch = (activity) => ({ accommodations: applyAccommodationOperations(activity.accommodations || {}, result?.operations || []).value });
    } else if (flow.type === 'bulk-remove') patch = { removed: true };
    else patch = { hidden: flow.type === 'bulk-hide' };
    if (changeTargets(patch)) complete('Learning path updated');
  };
  const titles = { 'bulk-dates': `Edit Dates for ${countLabel}`, 'bulk-points': `Edit Points Possible for ${countLabel}`, 'bulk-practice': `Edit Credit Type for ${countLabel}`, 'bulk-accommodation': `Edit Accommodations for ${countLabel}`, 'bulk-template': `Apply Settings Template to ${countLabel}`, 'bulk-password': `Edit Password for ${countLabel}`, 'bulk-time': `Edit Time Limit for ${countLabel}`, 'bulk-late': `Edit Late Policy for ${countLabel}`, 'bulk-hide': 'Hide Activities with Attempts?', 'bulk-show': `Show ${countLabel}`, 'bulk-remove': `Remove ${countLabel}?` };
  if (isBulk) return <CourseDialog title={titles[flow.type]} wide={flow.type === 'bulk-accommodation'} onClose={close} onSave={bulkSave} saveLabel={flow.type === 'bulk-remove' ? 'Remove' : flow.type === 'bulk-hide' ? 'Hide' : flow.type === 'bulk-show' ? 'Show' : 'Save'}>
    <p>{targetCount} {targetCount === 1 ? 'activity' : 'activities'} selected.</p>{gradeOnly && qualified.length < targets.length && <div className="course-muted"><p>Not all selected activities qualify for these edits. Only qualifying activities will be updated.</p><details><summary>Show Details</summary><ul>{targets.filter((a) => a.points === undefined).map((a) => <li key={a.stableKey}>{a.title}</li>)}</ul></details></div>}
    {flow.type === 'bulk-dates' && <><div className="message-tone">{['Select Dates', 'Shift Dates', 'Remove Dates'].map((x) => <button type="button" key={x} aria-pressed={draft.dateMode === x} onClick={() => set('dateMode', x)}>{x}</button>)}</div><p>Extending the due date automatically removes late penalty deductions from existing submissions.</p>{draft.dateMode === 'Select Dates' ? <div className="course-two-fields"><Field label="Date Available" type="date" value={draft.availableDate} onChange={(e) => set('availableDate', e.target.value)} /><Field label="Time Available (EST)" type="time" value={draft.availableTime} onChange={(e) => set('availableTime', e.target.value)} /><Field label="Date Due" type="date" value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} /><Field label="Time Due (EST)" type="time" value={draft.dueTime} onChange={(e) => set('dueTime', e.target.value)} /></div> : <><Check checked={draft.shiftAvailable} onChange={(v) => set('shiftAvailable', v)}>Date Available</Check><Check checked={draft.shiftDue} onChange={(v) => set('shiftDue', v)}>Date Due</Check>{draft.dateMode === 'Shift Dates' && <div className="course-two-fields"><Field label="Number of days" type="number" min="1" value={draft.days} onChange={(e) => set('days', e.target.value)} /><Field label="Shift direction"><select value={draft.direction} onChange={(e) => set('direction', e.target.value)}><option value="later">Later</option><option value="earlier">Earlier</option></select></Field></div>}</>}</>}
    {flow.type === 'bulk-points' && <><Field label="Total Points Possible (Required)" type="number" min="0" step="any" value={draft.points} onChange={(e) => set('points', e.target.value)} /><p>If points are modified here, individual question points will scale according to their current point ratios.</p></>}
    {flow.type === 'bulk-practice' && ['practice', 'graded'].map((type) => <label className="course-check" key={type}><input type="radio" name="credit" checked={draft.creditType === type} onChange={() => set('creditType', type)} />Convert to {type === 'practice' ? 'Practice' : 'Counts Toward Grade'}</label>)}
    {flow.type === 'bulk-password' && <><Field label="Password" type="text" value={draft.password} disabled={draft.removePassword} onChange={(e) => set('password', e.target.value)} /><p>Password must be between 6 and 16 characters without any special characters.</p><Check checked={draft.removePassword} onChange={(v) => set('removePassword', v)}>Remove Password</Check></>}
    {flow.type === 'bulk-time' && <><p>Changing or removing the Time Limit only impacts future attempts. In-progress and submitted attempts will not be updated.</p><div className="course-two-fields"><Field label="Hours" type="number" min="0" disabled={draft.removeLimit} value={draft.hours} onChange={(e) => set('hours', e.target.value)} /><Field label="Minutes" type="number" min="0" max="59" disabled={draft.removeLimit} value={draft.minutes} onChange={(e) => set('minutes', e.target.value)} /></div><Check checked={draft.removeLimit} onChange={(v) => set('removeLimit', v)}>Remove Time Limit</Check></>}
    {flow.type === 'bulk-template' && <Field label="Activity Settings Template"><select value={draft.template} onChange={(e) => set('template', e.target.value)}>{[...new Set(['Learn It', 'Study It', 'Apply It', 'Quiz', ...Object.keys(course.templates)])].map((name) => <option key={name}>{name}</option>)}</select></Field>}
    {flow.type === 'bulk-late' && <><Field label="Deduct percentage for late submissions" type="number" min="0" max="100" value={draft.latePenalty} onChange={(e) => set('latePenalty', e.target.value)} /><Field label="Apply penalty"><select value={draft.lateMode} onChange={(e) => set('lateMode', e.target.value)}><option value="percent">Once after the due date</option><option value="daily">For each day late</option></select></Field></>}
    {flow.type === 'bulk-accommodation' && <StudentAccommodations ref={accommodation} activity={{ ...qualified[0], settings: { ...defaultActivitySettings, ...qualified[0]?.settings } }} value={draft.accommodations || qualified[0]?.accommodations || {}} onChange={(v) => set('accommodations', v)} />}
    {['bulk-hide', 'bulk-show', 'bulk-remove'].includes(flow.type) && <><p>{flow.type === 'bulk-remove' ? 'Remove the selected activities from the course learning path?' : flow.type === 'bulk-hide' ? 'Some students may have opened or submitted these activities. Do you want to hide them from the student learning path?' : 'Make the selected activities visible to students?'}</p><ul>{targets.slice(0, 8).map((a) => <li key={a.stableKey}>{a.title}</li>)}</ul></>}
    {error && <p className="course-error" role="alert">{error}</p>}
  </CourseDialog>;
  if (['folder', 'folder-new'].includes(flow.type)) return <CourseDialog title="Folder Details" onClose={close} onSave={saveFolderDetails}>{folderFields}{error && <p role="alert" className="course-error">{error}</p>}</CourseDialog>;
  if (['folder-visibility', 'folder-remove'].includes(flow.type)) return <CourseDialog title={flow.type === 'folder-remove' ? 'Remove Folder?' : course.folders[flow.folderId]?.hidden ? 'Show Folder to Students?' : 'Hide Activities with Attempts?'} onClose={close} saveLabel={flow.type === 'folder-remove' ? 'Remove' : course.folders[flow.folderId]?.hidden ? 'Show' : 'Hide'} onSave={() => { saveFolder(flow.folderId, flow.type === 'folder-remove' ? { removed: true } : { hidden: !course.folders[flow.folderId]?.hidden }); complete('Folder updated'); }}><p>{flow.type === 'folder-remove' ? `Remove ${folderName} and its contents from the learning path?` : `Update student visibility for ${folderName} and its activities?`}</p></CourseDialog>;
  if (flow.type === 'folder-add') return <CourseDialog title={`Add activity to ${folderName}`} onClose={close}><div className="template-list">{folderActivityOptions.map(([type, label]) => <ActionButton key={type} onClick={() => begin({ ...flow, type, label })}>{label}</ActionButton>)}</div></CourseDialog>;
  if (flow.type === 'move') return <ActivityLocationModal mode="move" activity={flow.activity} chapters={chapters} onCancel={close} onSave={(next) => { updateCourseActivities([{ activity: flow.activity, patch: { chapter: next.chapter, section: next.section, placement: next.placement } }]); close(); onAdded?.(next); notify('Activity moved'); }} />;
  if (flow.type === 'bank') {
    const source = allCourseActivities(courseChapters).filter((a) => !a.id && a.points !== undefined && a.title.toLowerCase().includes(search.toLowerCase()));
    const previewActivity = preview && catalog.find((activity) => activity.stableKey === preview);
    if (previewActivity) return <CourseDialog title={`Preview · ${previewActivity.title}`} wide onClose={() => setPreview(null)}><div className="bank-activity-preview"><ActivityPlayer activity={previewActivity} chapter={previewActivity.originalChapter || previewActivity.chapter} section={previewActivity.section} sessionKey={`bank-preview/${previewActivity.stableKey}`} onBack={() => setPreview(null)} backLabel="Back to Activity Bank" /></div></CourseDialog>;
    return <CourseDialog title="Activity Bank" wide onClose={close} saveLabel={`Add ${chosen.length || ''} ${chosen.length === 1 ? 'Activity' : 'Activities'}`} disabled={!chosen.length} onSave={() => { if (!chosen.length) return; if (chosen.length === 1) { const item = source.find((a) => a.stableKey === chosen[0]) || catalog.find((a) => a.stableKey === chosen[0]); setPlacement({ ...item, id: `created-${crypto.randomUUID()}`, stableKey: undefined, title: `${item.title} Copy`, questions: getActivityQuestions(item.chapter, item.originalTitle || item.title), chapter: flow.folderId || item.chapter }); } else { chosen.forEach((id) => { const item = catalog.find((a) => a.stableKey === id); if (item) saveCreatedActivity({ ...item, stableKey: undefined, id: `created-${crypto.randomUUID()}`, title: `${item.title} Copy`, chapter: flow.folderId || 'Learning Path', section: 'chapter', placement: 'end', questions: getActivityQuestions(item.chapter, item.originalTitle || item.title) }); }); complete('Activities added to Learning Path'); } }}><Field label="Search Activity Bank"><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} /></Field><p>Select activities to add to your course.</p><div className="flow-list">{source.map((a) => <div className="flow-list-row" key={a.stableKey}><Check checked={chosen.includes(a.stableKey)} onChange={(checked) => setChosen((old) => checked ? [...old, a.stableKey] : old.filter((x) => x !== a.stableKey))}><strong>{a.title}</strong><small>{a.chapter} · {a.points} points</small></Check><button type="button" onClick={() => setPreview(preview === a.stableKey ? null : a.stableKey)}>Preview</button>{preview === a.stableKey && <p>{a.title} · {getActivityQuestions(a.chapter, a.originalTitle || a.title).length} questions</p>}</div>)}{!source.length && <p className="course-empty">No activities match your search.</p>}</div></CourseDialog>;
  }
  const names = { flashcards: 'Flashcards', bongo: 'Bongo', outline: 'Outline Builder', tutor: 'NetTutor', turnitin: 'Turnitin', drive: 'Google Drive', onedrive: 'Microsoft OneDrive', video: 'WebVideo Search', link: 'Web Link Activity', external: 'Non MindTap Activity' };
  const createExternal = () => {
    if (['drive', 'onedrive', 'video'].includes(flow.type) && !chosen.length) { setError(`Select a ${flow.type === 'video' ? 'video' : 'file'} to continue.`); return; }
    if (flow.type === 'link' && draft.step === 1) { if (draft.links.some((link) => { try { return !['https:', 'http:'].includes(new URL(link).protocol); } catch { return true; } })) { setError('Enter a valid http or https URL for every link.'); return; } set('step', 2); return; }
    if (!draft.title.trim() && !['drive', 'onedrive', 'video', 'flashcards'].includes(flow.type)) { setError('Enter an activity title.'); return; }
    const title = draft.title.trim() || (flow.type === 'flashcards' ? 'College Algebra Flashcards' : chosen[0] || 'Graphing Linear Functions');
    const activity = { id: `created-${crypto.randomUUID()}`, title, description: draft.description, points: draft.points === '' ? undefined : Number(draft.points), manual: flow.type === 'external' || flow.type === 'turnitin', countsTowardsGrade: flow.type === 'external', icon: flow.type === 'flashcards' ? 'flashcards' : 'book', resourceKind: flow.type, links: draft.links, textBefore: draft.before, textAfter: draft.after, chapter: flow.folderId || 'Learning Path', section: 'chapter', settings: { ...defaultActivitySettings, creditType: flow.type === 'external' ? 'graded' : 'practice' }, content: draft.description };
    if (activity.points !== undefined && (!Number.isFinite(activity.points) || activity.points < 0)) { setError('Enter points of zero or greater.'); return; }
    setSettingsActivity(activity);
  };
  return <CourseDialog title={names[flow.type] || flow.label || 'Add Activity'} wide onClose={close} onSave={createExternal} saveLabel={flow.type === 'link' && draft.step === 1 ? 'Continue' : 'Save and Continue'}>
    {flow.type === 'link' ? draft.step === 1 ? <><h3>Enter URL</h3>{draft.links.map((link, index) => <Field key={index} label={`Link URL ${index + 1}`} type="url" placeholder="https://www.example.com" value={link} onChange={(e) => set('links', draft.links.map((x, i) => i === index ? e.target.value : x))} />)}<ActionButton type="button" onClick={() => set('links', [...draft.links, ''])}>Add another link</ActionButton></> : <><h3>Link Preview</h3>{draft.links.map((link) => <p key={link}><a href={link} target="_blank" rel="noreferrer">{link}</a></p>)}<ActionButton type="button" onClick={() => set('step', 1)}>Edit links</ActionButton><Field label="Activity title *" value={draft.title} onChange={(e) => set('title', e.target.value)} /><Field label="Text Before (Optional; 256 characters max)"><textarea value={draft.before} maxLength={256} onChange={(e) => set('before', e.target.value)} /></Field><Field label="Text After (Optional; 256 characters max)"><textarea value={draft.after} maxLength={256} onChange={(e) => set('after', e.target.value)} /></Field></> : ['drive', 'onedrive', 'video'].includes(flow.type) ? <><p>{flow.type === 'video' ? 'Search for a video to add to your learning path.' : `Select a file from ${names[flow.type]} to add to your course.`}</p><Field label={flow.type === 'video' ? 'Search videos' : 'Search files'}><input value={search} onChange={(e) => setSearch(e.target.value)} /></Field><div className="flow-list">{(flow.type === 'video' ? ['Graphing Linear Functions', 'Factoring Quadratic Expressions', 'Completing the Square'] : ['Algebra study guide.pdf', 'Factoring practice.docx', 'Functions and graphs.pptx']).filter((name) => name.toLowerCase().includes(search.toLowerCase())).map((name) => <div className="flow-list-row" key={name}><Check checked={chosen[0] === name} onChange={() => { setChosen([name]); set('title', name); }}>{name}</Check></div>)}</div></> : <><Field label="Activity title *" value={draft.title} placeholder={flow.type === 'flashcards' ? 'College Algebra Flashcards' : ''} onChange={(e) => set('title', e.target.value)} /><Field label={flow.type === 'external' ? 'Description / Instructions' : 'Instructions'}><textarea value={draft.description} onChange={(e) => set('description', e.target.value)} /></Field>{flow.type === 'external' || flow.type === 'turnitin' ? <Field label="Points Possible" type="number" min="0" value={draft.points} onChange={(e) => set('points', e.target.value)} /> : flow.type === 'flashcards' ? <><h3>Flashcard set</h3><ul>{algebraCards.map(([term]) => <li key={term}>{term}</li>)}</ul></> : <p>{flow.type === 'outline' ? 'Organize the main ideas and supporting steps for an algebra solution.' : flow.type === 'tutor' ? 'Add a tutoring activity with the topic and instructions your students should review.' : 'Create a course activity with instructions, then choose its location.'}</p>}</>}
    {error && <p className="course-error" role="alert">{error}</p>}
  </CourseDialog>;
}
function isDescendant(candidate, parent, folders) {
  const seen = new Set(); let current = candidate;
  while (folders[current]?.parent && !seen.has(current)) { seen.add(current); current = folders[current].parent; if (current === parent) return true; }
  return false;
}
