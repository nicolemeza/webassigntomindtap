import React, { createContext, useContext, useId, useState } from 'react';
import { IconButton, ButtonVariant, Radio, RadioGroup, Toggle, ToggleTextPosition, Tooltip } from 'react-magma-dom';

export const defaultActivitySettings = {
  template: 'Apply It', attempts: '2', gradingPolicy: 'Best Activity Attempt',
  shuffleQuestions: false, studentAssistant: true, creditType: 'graded', creditThreshold: '',
  checkAnswer: false, feedback: 'After Each Activity Attempt', correctnessMarks: 'After Each Activity Attempt',
  ebookLink: 'After Each Activity Attempt', correctAnswer: 'After Last Activity Attempt',
  pointsPossible: 'Always', studentReview: 'After Each Activity Attempt',
};

const timingOptions = ['After Each Activity Attempt', 'After Last Activity Attempt', 'After Due Date', 'Always', 'Never'];

function Help({ label, children, icon = 'help' }) {
  return <Tooltip content={children}><IconButton type="button" className="settings-help" variant={ButtonVariant.link} icon={<img src={`/rebrand/settings-${icon}.svg`} width="20" height="20" alt="" aria-hidden="true" />} aria-label={`Help: ${label}`} /></Tooltip>;
}

const BehaviorContext = createContext(null);

function SelectField({ field, label, options, help }) {
    const id = useId();
    const { value, set } = useContext(BehaviorContext);
    return <div className="behavior-field"><div className="behavior-label"><label htmlFor={`${id}-${field}`}>{label}</label><Help label={label}>{help}</Help></div><select id={`${id}-${field}`} value={value[field]} onChange={(event) => set(field, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></div>;
  }
function SwitchField({ field, label, help, assistant }) {
    const { value, set } = useContext(BehaviorContext);
    return <div className="behavior-switch"><Toggle checked={value[field]} onChange={(event) => set(field, event.target.checked)} labelText={<span className="behavior-switch-label">{assistant && <img src="/rebrand/settings-assist.svg" width="24" height="24" alt="" aria-hidden="true" />}{label}</span>} textPosition={ToggleTextPosition.right} />{help && <Help label={label} icon={assistant ? 'assist-help' : 'help'}>{help}</Help>}</div>;
  }
export default function ActivityBehaviorSettings({ value, onChange, hidden, panelId, tabId }) {
  const id = useId();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const set = (field, next) => onChange({ ...value, [field]: next, ...(field === 'creditType' && next === 'practice' ? { attempts: 'Unlimited' } : {}) });
  return <BehaviorContext.Provider value={{ value, set }}><div className="activity-behavior-settings" id={panelId} role="tabpanel" aria-labelledby={tabId} hidden={hidden}>
    <div className="behavior-template"><label htmlFor={`${id}-template`}>Activity Settings Template *</label><select id={`${id}-template`} required value={value.template} onChange={(event) => set('template', event.target.value)}>{['Learn It', 'Study It', 'Apply It', 'Quiz', 'Custom'].map((name) => <option key={name}>{name}</option>)}</select><div className="behavior-helper">Apply a settings template and customize as needed</div></div>
    <div className="settings-columns behavior-main">
      <div className="behavior-stack">
        <SelectField field="attempts" label="Activity Attempts" options={['1', '2', '3', '4', '5', 'Unlimited']} help="Maximum number of times a student can attempt this activity." />
        <SelectField field="gradingPolicy" label="Grading Policy" options={['Best Activity Attempt', 'Last Activity Attempt', 'Average Activity Attempt']} help="Choose which activity attempt determines the student's score." />
      </div>
      <fieldset className="behavior-credit"><legend id={`${id}-credit-label`}>Credit Type</legend><Help label="Credit Type" icon="credit-help">Choose whether this activity is graded, practice, or earns credit based on a score threshold.</Help>
        <RadioGroup className="behavior-radio-group" name={`${id}-credit`} labelledById={`${id}-credit-label`} value={value.creditType} onChange={(event) => set('creditType', event.target.value)}>
        <Radio color="var(--brand-teal)" labelText="Counts Toward Grade" value="graded" />
        <Radio color="var(--brand-teal)" labelText="Practice (Doesn’t Count Toward Grade)" value="practice" />
        <Radio color="var(--brand-teal)" labelText="Counts Toward Grade as Credit/No Credit:" value="credit" />
        </RadioGroup>
        <div className="behavior-threshold"><label htmlFor={`${id}-threshold`}>At</label><input id={`${id}-threshold`} aria-label="Full credit score percentage" type="number" min="0" max="100" step="any" required={value.creditType === 'credit'} disabled={value.creditType !== 'credit'} value={value.creditThreshold} onChange={(event) => set('creditThreshold', event.target.value)} /><span>% earned score moves from 0 to full credit</span></div>
      </fieldset>
    </div>
    <SwitchField field="shuffleQuestions" label="Shuffle Question Order" />
    <SwitchField field="studentAssistant" label="Enable Student Assist" assistant help="Make the Student Assistant available for this activity." />
    <button type="button" className="behavior-advanced-toggle" aria-expanded={advancedOpen} aria-controls={`${id}-advanced`} onClick={() => setAdvancedOpen(!advancedOpen)}>Advanced Settings<img src="/rebrand/advanced-settings-chevron.svg" width="24" height="24" alt="" aria-hidden="true" /></button>
    <div id={`${id}-advanced`} className="behavior-advanced" hidden={!advancedOpen}>
      <section aria-labelledby={`${id}-feedback-heading`}><h3 id={`${id}-feedback-heading`}>Feedback Settings</h3>
        <SwitchField field="checkAnswer" label="Allow Students to Check Answer" help="Allow students to check their answers while working on the activity." />
        <div className="settings-columns behavior-feedback">
          <SelectField field="feedback" label="Show Feedback" options={timingOptions} help="Choose when students can see feedback." />
          <SelectField field="correctnessMarks" label="Show Correctness Marks (✓ / ✗)" options={timingOptions} help="Choose when correct and incorrect answer marks appear." />
          <SelectField field="ebookLink" label="Show eBook Link" options={timingOptions} help="Choose when the eBook link is available." />
          <SelectField field="correctAnswer" label="Show Correct Answer" options={timingOptions} help="Choose when students can see correct answers." />
        </div>
      </section>
      <section aria-labelledby={`${id}-scoring-heading`}><h3 id={`${id}-scoring-heading`}>Scoring Settings</h3><div className="settings-columns">
        <SelectField field="pointsPossible" label="Show Points Possible" options={['Always', 'After Each Activity Attempt', 'After Last Activity Attempt', 'After Due Date', 'Never']} help="Choose when students can see the points available." />
        <SelectField field="studentReview" label="Allow Students to Review" options={timingOptions} help="Choose when students can review their activity attempts." />
      </div></section>
    </div>
  </div></BehaviorContext.Provider>;
}
