import React, { useEffect, useRef } from 'react';
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Button, ButtonVariant } from 'react-magma-dom';
import { activityHref } from './activityNavigation';
import { useActivitySettings } from './ActivitySettingsModal';
import { defaultActivitySettings } from './ActivityBehaviorSettings';
import { activityDueDateTime, formatActivityDue, formatDueTime } from './activityDates';
import './activity-overview.css';

const factoringObjectives = [
  'Factor out the greatest common factor.',
  'Factor by grouping.',
  'Factor the difference of two squares.',
  'Factor trinomials.',
  'Factor trinomials by grouping.',
  'Factor the sum and difference of two cubes.',
  'Factor miscellaneous polynomials.',
  'Factor expressions containing negative and fractional exponents.',
];

function OverviewIcon({ name, size = 32 }) {
  return <img src={`/rebrand/overview-${name}.svg`} width={name === 'attempts' ? 33.2203 : size} height={size} alt="" aria-hidden="true" />;
}

export default function ActivityOverview({ chapter, section, activity: originalActivity, onBack }) {
  const [activity] = useActivitySettings(`${chapter}/${section}/${originalActivity.id || originalActivity.title}`, originalActivity);
  const settings = { ...defaultActivitySettings, ...activity.settings };
  const titleRef = useRef(null);
  useEffect(() => {
    titleRef.current?.focus();
    const previousTitle = document.title;
    document.title = `${activity.title} · MindTap`;
    return () => { document.title = previousTitle; };
  }, [activity.title]);

  const dueDate = activity.dueDate
    ? `${new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${activity.dueDate}T00:00:00Z`))}${activity.dueTime ? ` @ ${formatDueTime({ ...activity, dueTimeZone: '' })}` : ''}`
    : 'Not set';
  const stats = [
    ['due', `Due date${activity.dueTimeZone ? ` (${activity.dueTimeZone})` : ''}`, activity.dueDate ? <time dateTime={activityDueDateTime(activity)} title={formatActivityDue(activity)}>{dueDate}</time> : dueDate],
    ['time', 'Time limit', settings.timeLimit || 'No time limit'],
    ['score', `Final score (${settings.gradingPolicy?.includes('Last') ? 'Last' : settings.gradingPolicy?.includes('Average') ? 'Average' : 'Best'})`, '--'],
    ['attempts', 'Attempts', settings.attempts],
    ['points', 'Points Possible', activity.points ?? '--'],
    ['grading', 'Grading policy', activity.countsTowardsGrade === false ? 'Practice' : 'Counts toward grade'],
  ];

  return <section className="activity-overview-page" aria-labelledby="activity-overview-title">
    <div className="overview-secondary-nav">
      <Button className="rebrand-button compact overview-back" variant={ButtonVariant.link} onClick={onBack}><OverviewIcon name="back" size={16} />Back</Button>
      <h1 ref={titleRef} tabIndex={-1} id="activity-overview-title">{activity.title}</h1>
    </div>
    <div className="overview-content">
      <div className="overview-review-header">
        <h2>Activity Overview</h2>
        <dl className="overview-stats">
          {stats.map(([icon, label, value], index) => <React.Fragment key={icon}>
            {index > 0 && <span className={`overview-stat-divider${index === 3 ? ' reversed' : ''}`} aria-hidden="true"><img src={`/rebrand/overview-divider${[1, 2, 3, 4, 2][index - 1]}.svg`} width="32" height="1" alt="" /></span>}
            <div className="overview-stat"><OverviewIcon name={icon} /><div><dt>{label}</dt><dd>{value}</dd></div></div>
          </React.Fragment>)}
        </dl>
      </div>
      {originalActivity.title === 'R.5 HW Factoring' && <section className="overview-instructions" aria-labelledby="overview-instructions-title">
        <div className="overview-instructions-summary">
          <div><h3 id="overview-instructions-title">Instructions</h3><p>Review the assignment details before you begin.</p></div>
        </div>
        <Accordion className="overview-instruction-accordions" isMulti>
          <AccordionItem>
            <AccordionButton className="overview-instruction-accordion-button">Learning objectives · {factoringObjectives.length}</AccordionButton>
            <AccordionPanel><p>This assignment is intended to help you gain proficiency with:</p><ul>{factoringObjectives.map(objective => <li key={objective}>{objective}</li>)}</ul></AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton className="overview-instruction-accordion-button">Assignment submission</AccordionButton>
            <AccordionPanel><p>Submit answers by question part. The remaining submissions for a question part only change when you submit or change that answer.</p></AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton className="overview-instruction-accordion-button">Assignment scoring</AccordionButton>
            <AccordionPanel><p>Your last submission is used for your score.</p></AccordionPanel>
          </AccordionItem>
        </Accordion>
      </section>}
      <div className="overview-attempts">
        <table aria-label={`Attempts for ${activity.title}`}>
          <thead><tr>{['Attempt (of #)', 'Submitted on', 'Status', 'Score', 'Actions'].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody><tr><td>1</td><td>--</td><td>--</td><td>--</td><td><Button className="rebrand-button rebrand-button-primary compact overview-start" onClick={() => { window.location.hash = `${activityHref(chapter, section, originalActivity.id || originalActivity.title)}/play`; }}>Start</Button></td></tr></tbody>
        </table>
      </div>
    </div>
  </section>;
}
