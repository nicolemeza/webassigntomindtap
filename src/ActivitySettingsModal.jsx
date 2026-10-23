import React, { useId, useRef, useState } from 'react';
import { Button, ButtonVariant, IconButton, Input, Modal, ModalSize, Textarea } from 'react-magma-dom';
import './activity-settings.css';
import ActivityBehaviorSettings, { defaultActivitySettings } from './ActivityBehaviorSettings';
import StudentAccommodations from './StudentAccommodations';
import { saveCreatedActivity } from './createdActivities';
import { scaleQuestionPoints } from './activityAuthoring';

const sessionSettings = new Map();

export function useActivitySettings(key, originalActivity) {
  const [edits, setEdits] = useState(() => sessionSettings.get(key));
  const persisted = originalActivity.id && !key.startsWith('builder-preview/');
  return [persisted ? originalActivity : { ...originalActivity, ...edits }, (updated) => {
    const next = updated.questions ? { ...updated, questions: scaleQuestionPoints(updated.questions, updated.points) } : updated;
    if (persisted) saveCreatedActivity({ ...originalActivity, ...next });
    sessionSettings.set(key, next);
    setEdits(next);
  }];
}

function SettingsIcon({ name, size = 20 }) {
  return <img src={`/rebrand/settings-${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}

const tabIcons = {
  details: ['settings-assignment', 'settings-tab', 'settings-student'],
  settings: ['accommodation-assignment', 'settings-tab-active', 'settings-student'],
  accommodations: ['accommodation-assignment', 'accommodation-settings', 'accommodation-student'],
};

export default function ActivitySettingsModal({ activity, onClose, onSave, saveLabel = 'Confirm' }) {
  const id = useId();
  const [draft, setDraft] = useState({ description: '', availableDate: '', dueDate: '', password: '', academicIntegrity: 'none', accommodations: {}, ...activity, settings: { ...defaultActivitySettings, creditType: activity.countsTowardsGrade === false ? 'practice' : 'graded', ...activity.settings } });
  const accommodationRef = useRef(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showAvailableDate, setShowAvailableDate] = useState(Boolean(activity.availableDate));
  const [showDueDate, setShowDueDate] = useState(Boolean(activity.dueDate));
  const [error, setError] = useState('');
  const update = (field) => (event) => { const next = event.target.value; setError(''); setDraft((value) => ({ ...value, [field]: next })); };
  const adjustPoints = (amount) => setDraft((value) => ({ ...value, points: Math.max(0, Number(value.points || 0) + amount) }));
  const dateInput = (field, inputId) => <input id={inputId} type="date" value={draft[field]} onInput={update(field)} onChange={update(field)} />;
  function submit(event) {
    event.preventDefault();
    if (!draft.title.trim()) { setActiveTab('details'); setError('Enter an activity title.'); return; }
    if (draft.points !== undefined && (draft.points === '' || !Number.isFinite(Number(draft.points)) || Number(draft.points) < 0)) { setActiveTab('details'); setError('Enter a valid number of points, zero or greater.'); return; }
    if (draft.password && !/^[a-zA-Z0-9]{6,16}$/.test(draft.password)) { setActiveTab('details'); setError('Password must be 6 to 16 letters or numbers.'); return; }
    if (draft.availableDate && draft.dueDate && draft.availableDate > draft.dueDate) { setActiveTab('details'); setError('Date Due must be on or after Date Available.'); return; }
    const threshold = Number(draft.settings.creditThreshold);
    if (draft.settings.creditType === 'credit' && (draft.settings.creditThreshold === '' || !Number.isFinite(threshold) || threshold < 0 || threshold > 100)) { setActiveTab('settings'); setError('Enter a full credit score percentage between 0 and 100.'); return; }
    const accommodationResult = accommodationRef.current?.commit();
    if (accommodationResult?.error) { setActiveTab('accommodations'); setError(accommodationResult.error); return; }
    onSave({ ...draft, accommodations: accommodationResult?.value || draft.accommodations, countsTowardsGrade: draft.settings.creditType !== 'practice', title: draft.title.trim(), ...(draft.points !== undefined ? { points: Number(draft.points) } : {}) });
  }
  return <Modal className="activity-settings-modal" header={`Assign: ${activity.title}`} headerLevel={2} size={ModalSize.large} isOpen isCloseButtonHidden onClose={onClose} containerStyle={{ width: '100%', maxWidth: 'none', height: '100dvh', maxHeight: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', boxSizing: 'border-box', padding: '48px 0' }}>
    <IconButton className="settings-close" aria-label="Close activity settings" variant={ButtonVariant.link} icon={<SettingsIcon name="close" />} onClick={onClose} />
    <form className="activity-settings-form" onSubmit={submit} noValidate>
      <div className="settings-tabs" role="tablist" aria-label="Activity settings">
        {['details', 'settings', 'accommodations'].map((tab, index, tabs) => <button key={tab} type="button" role="tab" id={`${id}-${tab}-tab`} tabIndex={activeTab === tab ? 0 : -1} aria-selected={activeTab === tab} aria-controls={`${id}-${tab}`} onClick={() => setActiveTab(tab)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; setActiveTab(next); event.currentTarget.parentElement.querySelector(`[id="${id}-${next}-tab"]`)?.focus(); } }}><img src={`/rebrand/${tabIcons[activeTab][index]}.svg`} width="20" height="20" alt="" aria-hidden="true" />{tab === 'details' ? 'Assignment Details' : tab === 'settings' ? 'Settings' : 'Student Accommodation'}</button>)}
      </div>
      <div className="settings-tab-panels"><div className="settings-fields" id={`${id}-details`} role="tabpanel" aria-labelledby={`${id}-details-tab`} hidden={activeTab !== 'details'}>
        <div className="settings-title-field"><Input labelText="Title *" value={draft.title} onChange={update('title')} required /></div>
        <Textarea labelText="Description" placeholder="Text" value={draft.description} onChange={update('description')} rows={3} />
        <div className="settings-columns settings-dates">
          <div><label htmlFor={`${id}-available`}>Date Available</label>{showAvailableDate ? <div className="settings-date-control">{dateInput('availableDate', `${id}-available`)}<button type="button" onClick={() => { setDraft({ ...draft, availableDate: '' }); setShowAvailableDate(false); }}>Remove<span className="visually-hidden"> date available</span></button></div> : <Button type="button" className="rebrand-button compact" variant={ButtonVariant.link} onClick={() => setShowAvailableDate(true)}>Add Date Available</Button>}</div>
          <div><label htmlFor={`${id}-due`}>Date Due</label>{showDueDate ? <div className="settings-date-control">{dateInput('dueDate', `${id}-due`)}<button type="button" onClick={() => { setDraft({ ...draft, dueDate: '' }); setShowDueDate(false); }}>Remove<span className="visually-hidden"> date due</span></button></div> : <Button type="button" className="rebrand-button compact" variant={ButtonVariant.link} onClick={() => setShowDueDate(true)}>Add Date Due</Button>}</div>
        </div>
        <div className="settings-columns">
          <div className="settings-points-field"><Input labelText="Total Points Possible" type="number" min={0} step="any" value={draft.points ?? ''} onChange={update('points')} helperMessage="If points are modified here, individual question points will scale according to their current point ratios." /><div className="settings-stepper"><button type="button" aria-label="Increase total points" onClick={() => adjustPoints(1)}><SettingsIcon name="step-up" size={16} /></button><button type="button" aria-label="Decrease total points" onClick={() => adjustPoints(-1)}><SettingsIcon name="step-down" size={16} /></button></div></div>
          <div className="settings-password-field"><Input labelText="Password" type={showPassword ? 'text' : 'password'} value={draft.password} pattern="[A-Za-z0-9]{6,16}" title="Use 6 to 16 letters or numbers, without special characters." autoComplete="new-password" onChange={update('password')} helperMessage="Password must be between 6 and 16 characters without any special characters." /><button className="settings-show-password" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
        </div>
        <div className="settings-columns"><div className="settings-integrity"><label htmlFor={`${id}-integrity`}>Academic Integrity</label><select id={`${id}-integrity`} value={draft.academicIntegrity} onChange={update('academicIntegrity')}><option value="none">No cheating deterrence</option><option value="lockdown">LockDown Browser</option></select><p>Have students <a href="https://download.respondus.com/lockdown/download.php" target="_blank" rel="noreferrer">install the latest</a> LockDown Browser version before opening the assignment.</p></div></div>
      </div>
      <ActivityBehaviorSettings value={draft.settings} onChange={(settings) => { setError(''); setDraft((previous) => ({ ...previous, settings })); }} hidden={activeTab !== 'settings'} panelId={`${id}-settings`} tabId={`${id}-settings-tab`} />
      <StudentAccommodations ref={accommodationRef} activity={draft} value={draft.accommodations} onChange={(accommodations) => { setError(''); setDraft((previous) => ({ ...previous, accommodations })); }} hidden={activeTab !== 'accommodations'} panelId={`${id}-accommodations`} tabId={`${id}-accommodations-tab`} />
      {error && <p className="settings-error" role="alert">{error}</p>}
      </div>
      <div className="settings-actions"><Button type="button" className="rebrand-button" variant={ButtonVariant.link} onClick={onClose}>Cancel</Button><Button className="rebrand-button rebrand-button-primary" type="submit">{saveLabel}</Button></div>
    </form>
  </Modal>;
}
