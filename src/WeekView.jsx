import React from 'react';
import { ButtonColor, ButtonVariant, IconButton } from 'react-magma-dom';
import BrandIcon from './BrandIcon';

const day = 24 * 60 * 60 * 1000;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fromUtc = (year, month, date) => new Date(Date.UTC(year, month, date));
const formatRange = (start, end) => start.getUTCMonth() === end.getUTCMonth()
  ? `${months[start.getUTCMonth()]} ${start.getUTCDate()}–${end.getUTCDate()}`
  : `${months[start.getUTCMonth()]} ${start.getUTCDate()}–${months[end.getUTCMonth()]} ${end.getUTCDate()}`;

export const learningWeeks = Array.from({ length: 56 }, (_, index) => {
  const start = index === 0 ? fromUtc(2026, 6, 10) : new Date(fromUtc(2026, 6, 12).getTime() + (index - 1) * 7 * day);
  const end = new Date(start.getTime() + (index === 0 ? day : 6 * day));
  return { id: index + 1, label: `Week ${index + 1}`, dateRange: formatRange(start, end) };
});

export default function WeekView({ openWeeks, onToggleWeek }) {
  return <div className="week-view" aria-label="Learning path weeks">
    {learningWeeks.map((week) => {
      const isOpen = openWeeks.has(week.id);
      const isCurrent = week.id === 17;
      return <section className={`week-folder${isOpen ? ' is-open' : ''}`} key={week.id}>
        <div className="week-header">
          <IconButton className={`folder-chevron ${isOpen ? 'is-open' : ''}`} color={ButtonColor.primary} variant={ButtonVariant.link} icon={<BrandIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />} aria-expanded={isOpen} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${week.label}`} onClick={() => onToggleWeek(week.id)} />
          <div className="week-title"><strong>{week.label}</strong><span>{week.dateRange}</span></div>
          {isCurrent && <span className="week-current"><svg aria-hidden="true" viewBox="0 0 24 24" className="week-current-icon" xmlns="http://www.w3.org/2000/svg" fill="#FD9A04" height="32" width="32" role="none"><path d="M16.3 18.75c.38-.24.89-.16 1.21.16l.083.094c.3543.4555.2517 1.1387-.243 1.456-.94.6-2 1.04-3.12 1.3-.62.14-1.21-.35-1.21-.99l.0062-.1138c.0448-.4124.3313-.7645.7438-.8562.91-.2 1.76-.56 2.53-1.05zM9.76 2.27c.62-.15 1.22.34 1.22.98l-.0064.1115c-.0462.4047-.3403.7568-.7436.8485-3.55.82-6.2 4-6.2 7.79s2.65 6.97 6.2 7.8c.44.1.75.5.75.96l-.0069.1181c-.0682.5807-.6318 1.0025-1.2131.8619-4.43-1.03-7.73-5-7.73-9.74s3.3-8.71 7.73-9.73zM20.79 13l.1164.0068c.5724.067.9948.622.8636 1.2032-.26 1.12-.7 2.18-1.3 3.12-.34.54-1.1.61-1.55.16l-.0812-.0918c-.2505-.32-.2952-.7737-.0588-1.1282.48-.76.85-1.62 1.05-2.53.09-.44.51-.74.96-.74zM12 7c2.1 0 4 1.61 4 4.1 0 1.51-1.1 3.27-3.31 5.3-.4.36-.99.36-1.38 0C9.1 14.38 8 12.61 8 11.1 8 8.61 9.9 7 12 7zm0 2.86c-.59 0-1.07.48-1.07 1.07S11.41 12 12 12s1.07-.48 1.07-1.07-.48-1.07-1.07-1.07zm7.024-3.433c.4555-.3556 1.1387-.261 1.456.243.6.95 1.04 2 1.3 3.12.14.62-.35 1.21-.99 1.21l-.1138-.0062c-.4123-.0448-.7637-.3313-.8462-.7438-.2-.92-.56-1.77-1.05-2.53-.25-.38-.17-.89.15-1.21zm-5.9972-3.3134c.067-.5724.622-.9949 1.2032-.8636 1.12.26 2.17.7 3.12 1.3.54.34.61 1.09.15 1.53l-.0915.0835c-.3185.2567-.764.2947-1.1185.0765-.76-.48-1.62-.85-2.53-1.05-.44-.09-.74-.51-.74-.96z" /></svg>Current week</span>}
          <span className="activity-count">0 activities</span>
        </div>
        {isOpen && <p className="week-empty">No Activities Added Yet.</p>}
      </section>;
    })}
  </div>;
}
