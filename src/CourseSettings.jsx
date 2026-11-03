import React, { useState } from 'react';
import { ActionButton, Check, CourseDialog, Field, Tile } from './CourseUI';
import ActivityBehaviorSettings, { defaultActivitySettings } from './ActivityBehaviorSettings';
import { getCourseState, saveCourseSettings, saveCourseState, useCourseState } from './courseModel';

const tiles = [
  ['templates', 'Activity Settings Templates', 'Manage settings profile and activity defaults', '▣'],
  ['gradebook', 'Gradebook Settings', 'Manage gradebook settings', '▥'],
  ['permissions', 'Instructor and TA Permissions', 'Manage access permissions for the system', '♙'],
  ['ids', 'Student ID Collection', 'Requiring students to enter their Student ID when logging in', '♙'],
  ['integrity', 'Academic Integrity', 'Manage the secure testing and screen proctoring settings', '▣'],
  ['learning', 'Learning Path Settings', 'Manage how you view your learning path', '▤'],
  ['resources', 'Student Resources', 'Manage AI and student resources in your course', '▣'],
];
export function builtInTemplates() {
  return Object.fromEntries(['Learn It', 'Study It', 'Apply It', 'Quiz'].map((name) => [name, { ...defaultActivitySettings, template: name, ...(name === 'Study It' ? { creditType: 'practice', attempts: 'Unlimited' } : {}), ...(name === 'Quiz' ? { attempts: '1', studentAssistant: false } : {}) }]));
}
export function getSettingsTemplate(name) { return { ...builtInTemplates()[name], ...getCourseState().templates[name] }; }

export default function CourseSettings({ notify }) {
  const state = useCourseState();
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState(state.settings);
  const [error, setError] = useState('');
  const [template, setTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDraft, setTemplateDraft] = useState(defaultActivitySettings);
  const open = (name) => { setDraft(structuredClone(state.settings)); setError(''); setTemplate(null); setDialog(name); };
  const set = (field, value) => { setDraft((current) => ({ ...current, [field]: value })); setError(''); };
  const close = () => setDialog(null);
  const save = () => {
    if (dialog === 'ids' && draft.collectIds && draft.idLength !== '' && (!Number.isInteger(Number(draft.idLength)) || Number(draft.idLength) < 1 || Number(draft.idLength) > 30)) { setError('Enter a student ID length from 1 to 30, or leave it blank.'); return; }
    try { saveCourseSettings(draft); close(); notify('Course settings saved'); } catch { setError('Settings could not be saved. Please try again.'); }
  };
  const allTemplates = { ...builtInTemplates(), ...state.templates };
  const editTemplate = (name, copy = false) => { setTemplate(name); setTemplateName(copy ? `${name} Copy` : name); setTemplateDraft({ ...defaultActivitySettings, ...allTemplates[name] }); setError(''); };
  const saveTemplate = () => {
    if (!templateName.trim()) { setError('Enter a template name.'); return; }
    if (templateName !== template && allTemplates[templateName.trim()]) { setError('A template with this name already exists.'); return; }
    if (templateDraft.creditType === 'credit' && (templateDraft.creditThreshold === '' || Number(templateDraft.creditThreshold) < 0 || Number(templateDraft.creditThreshold) > 100)) { setError('Enter a credit threshold between 0 and 100.'); return; }
    const next = { ...state.templates };
    if (template && template !== templateName && !builtInTemplates()[template]) delete next[template];
    next[templateName.trim()] = { ...templateDraft, template: templateName.trim() };
    saveCourseState({ templates: next });
    if (draft.defaultTemplate !== state.settings.defaultTemplate) saveCourseSettings({ defaultTemplate: draft.defaultTemplate });
    setTemplate(null); notify('Activity settings template saved');
  };
  const title = tiles.find(([id]) => id === dialog)?.[1];
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.settings);
  return <section className="course-page" aria-labelledby="settings-heading"><h1 id="settings-heading">Course Settings</h1><div className="course-grid">{tiles.map(([id, name, description, icon]) => <Tile key={id} title={name} description={description} icon={icon} onClick={() => open(id)} />)}</div>
    {dialog && <CourseDialog title={template !== null ? `${template ? 'Edit' : 'Create'} Activity Settings Template` : title} wide={dialog === 'templates'} onClose={close} onSave={dialog === 'integrity' ? undefined : dialog === 'templates' ? template !== null ? saveTemplate : undefined : save} saveLabel={dialog === 'ids' || dialog === 'permissions' ? 'Save Permissions' : dialog === 'learning' ? 'Save Settings' : dialog === 'templates' ? 'Save Template' : 'Save settings'} disabled={dialog !== 'templates' && !dirty}>
      {dialog === 'learning' && <><Check checked={draft.rollingWeek} onChange={(value) => set('rollingWeek', value)}>Enable Rolling Week View</Check><p>The Rolling Week View is an additional learning path view that shows student activities organized by week. This view is only recommended for courses that utilize due dates for all activities.</p><Field label="Select a default dashboard view:"><select value={draft.defaultView} onChange={(e) => set('defaultView', e.target.value)}><option value="list">Outline View</option>{draft.rollingWeek && <option value="week">Rolling Week View</option>}</select></Field></>}
      {dialog === 'resources' && <><h3>Student Assistant</h3><p>The AI assistant will be automatically enabled for all activities except exams, quizzes, and tests. It provides students with guidance, but will not reveal the answer.</p><Check checked={draft.studentAssistant} onChange={(value) => set('studentAssistant', value)}>Enable Student Assistant</Check></>}
      {dialog === 'gradebook' && <><h3>LMS Score Sync</h3><Check checked disabled>Send zero score(s) to the LMS for unattempted assignments post due date.</Check><p className="course-muted">The setting is disabled because the course does not sync grades to the LMS.</p><h3>Scoring</h3><Check checked={draft.zeroAtEnd} onChange={(value) => set('zeroAtEnd', value)}>Score all unattempted assignments without a due date as zero when course end date is reached.</Check><p>NOTE: If this option is checked, all unattempted assignments without a due date will be given a score of zero when the course end date is reached and the student's final score for the course will be recomputed accordingly.</p></>}
      {dialog === 'ids' && <><p>Require students to enter their institution or university student identification number? Students will be prompted to enter their student ID numbers when they log in to MindTap.</p><Check checked={draft.collectIds} onChange={(value) => set('collectIds', value)}>Enable Student ID Collection</Check><h3>Optional Settings</h3><Field label="Select number of characters associated with student ID or leave blank to allow students to enter one or more characters (30 max)" type="number" min="1" max="30" disabled={!draft.collectIds} value={draft.idLength} onChange={(e) => set('idLength', e.target.value)} /><Field label="Custom instructions to students (256 characters max)"><textarea maxLength={256} disabled={!draft.collectIds} value={draft.idInstructions} onChange={(e) => set('idInstructions', e.target.value)} /></Field></>}
      {dialog === 'permissions' && <><p>To add new instructors or TAs go to your instructor dashboard at <a href="https://login.cengage.com/" target="_blank" rel="noreferrer">login.cengage.com</a>.</p>{[['instructor', 'Casey Anderson (Instructor)'], ['ta', 'Jamie Brooks (Teaching Assistant)']].map(([id, label]) => <details key={id}><summary>{label}</summary>{[['activities', 'Manage Activities (Edit/Add)'], ['gradebook', 'View and Manage gradebook']].map(([field, copy]) => <Check key={field} checked={draft.permissions[id][field]} onChange={(checked) => set('permissions', { ...draft.permissions, [id]: { ...draft.permissions[id], [field]: checked } })}>{copy}</Check>)}</details>)}</>}
      {dialog === 'integrity' && <><h3>LockDown Browser Access</h3><p>LockDown Browser is now included with MindTap</p><h3>Respondus Monitor Access</h3><p>Link your Respondus Monitor account using your Respondus Institution ID to enable Respondus Monitor in MindTap.</p><p><strong>Respondus account status:</strong> Access Linked</p><p className="course-muted">Note: A valid Respondus Monitor subscription is required to use Respondus Monitor tools in MindTap. If you do not already have a subscription, you can purchase one directly from Respondus.</p></>}
      {dialog === 'templates' && (template !== null ? <><button type="button" className="course-link" onClick={() => setTemplate(null)}>‹ Back to templates</button><Field label="Template name *" value={templateName} onChange={(e) => setTemplateName(e.target.value)} /><ActivityBehaviorSettings value={templateDraft} onChange={setTemplateDraft} /><Check checked={draft.defaultTemplate === templateName} onChange={(checked) => { set('defaultTemplate', checked ? templateName : 'Apply It'); }}>Use as default for new activities</Check><ActionButton type="button" onClick={() => { saveCourseSettings({ defaultTemplate: templateName }); saveTemplate(); }}>Save as default</ActionButton></> : <><p>Create and manage reusable settings for your course activities.</p><div className="template-list">{Object.keys(allTemplates).map((name) => <div className="template-row" key={name}><strong>{name}{state.settings.defaultTemplate === name ? ' · Default' : ''}</strong><button type="button" onClick={() => editTemplate(name)}>Edit<span className="visually-hidden"> {name}</span></button><button type="button" onClick={() => editTemplate(name, true)}>Copy<span className="visually-hidden"> {name}</span></button>{!builtInTemplates()[name] && <button type="button" onClick={() => { const next = { ...state.templates }; delete next[name]; saveCourseState({ templates: next }); if (state.settings.defaultTemplate === name) saveCourseSettings({ defaultTemplate: 'Apply It' }); notify('Template removed'); }}>Delete<span className="visually-hidden"> {name}</span></button>}</div>)}</div><div className="course-dialog-actions"><ActionButton type="button" primary onClick={() => { setTemplate(''); setTemplateName(''); setTemplateDraft(defaultActivitySettings); }}>Create Template</ActionButton></div></>)}
      {error && <p className="course-error" role="alert">{error}</p>}
    </CourseDialog>}
  </section>;
}
