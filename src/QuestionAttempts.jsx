import React, { useContext, useId, useState } from 'react';
import { ButtonColor, ButtonIconPosition, ButtonSize, ButtonTextTransform, ButtonVariant, IconButton, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, ThemeContext, Tooltip } from 'react-magma-dom';
import { ExpandLessIcon, ExpandMoreIcon } from 'react-magma-icons';
import './question-attempts.css';
import { earnedPoints, MAX_ATTEMPTS } from './questionGrading';

function AttemptIndicators({ history = [] }) {
  return <div className="question-attempt-indicators" role="group" aria-label={`${history.length} of ${MAX_ATTEMPTS} attempts used`}>
    {Array.from({ length: MAX_ATTEMPTS }, (_, index) => {
      const state = index >= history.length ? 'unused' : history[index] ? 'correct' : 'incorrect';
      return <Tooltip key={index} content={`Attempt ${index + 1}`}><img src={`/rebrand/attempt-${state}.svg`} width="24.0001" height="24" tabIndex={0} alt={`Attempt ${index + 1}: ${state === 'unused' ? 'not used' : state}`} /></Tooltip>;
    })}
  </div>;
}

export default function QuestionAttempts({ question, variant, history = {} }) {
  const theme = useContext(ThemeContext);
  const headingId = useId();
  const tableId = useId();
  const [expanded, setExpanded] = useState(false);
  const fields = question.inputs || [];
  const multiField = fields.length > 1;
  // Equal prototype weighting; assign rounding remainder to the last field.
  const totalHundredths = Math.round(question.points * 100);
  const fieldHundredths = multiField ? Math.floor(totalHundredths / fields.length) : totalHundredths;
  return <section className={`question-attempts${multiField ? ' question-attempts-multi' : ''}`} aria-labelledby={headingId}>
    <div className="question-attempts-summary">
    <div className="question-attempts-heading">
      <h3 id={headingId}>Attempts</h3>
      <p>Your grade is based on your <strong>best attempt</strong>.</p>
    </div>
    {!multiField && <>{variant === 'sidebar' && <p className="question-attempt-availability">{MAX_ATTEMPTS - (history[fields[0]?.id || 'answer']?.length || 0)} attempts available</p>}<AttemptIndicators history={history[fields[0]?.id || 'answer']} /></>}
    {multiField && variant === 'sidebar' && <p className="question-attempt-availability">5 attempts per field</p>}
    {multiField && <IconButton className="question-attempt-toggle" size={ButtonSize.small} color={ButtonColor.primary} variant={ButtonVariant.link} textTransform={ButtonTextTransform.none} style={{ fontFamily: theme.bodyFont }} icon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />} iconPosition={ButtonIconPosition.right} aria-expanded={expanded} aria-controls={tableId} onClick={() => setExpanded(!expanded)}>Attempts</IconButton>}
    <p className="question-attempt-score"><span>Earned Score:</span><strong>{earnedPoints(question, history)} / {question.points} {question.points === 1 ? 'pt' : 'pts'}</strong></p>
    </div>
    {multiField && <div id={tableId} hidden={!expanded} className="question-attempt-table-wrapper">
      {variant === 'sidebar' ? <ul className="question-attempt-field-list" aria-label="Attempts by answer field">{fields.map((field, index) => {
        const points = (index === fields.length - 1 ? totalHundredths - fieldHundredths * index : fieldHundredths) / 100;
        const attempts = history[field.id] || [];
        return <li key={field.id}><div className="question-attempt-field-title"><strong>Field {index + 1}</strong><span>{attempts.includes(true) ? points : 0} / {points} pt</span></div><AttemptIndicators history={attempts} /><p>{attempts.length} of 5 attempts used</p></li>;
      })}</ul> : <Table className="question-attempt-table" minWidth={476} aria-label="Attempts by answer field">
        <TableHead><TableRow>{['Attempts by field', 'Score per attempt', 'Attempts used', 'Points'].map(label => <TableHeaderCell key={label}>{label}</TableHeaderCell>)}</TableRow></TableHead>
        <TableBody>{fields.map((field, index) => {
          const points = (index === fields.length - 1 ? totalHundredths - fieldHundredths * index : fieldHundredths) / 100;
          const attempts = history[field.id] || [];
          return <TableRow key={field.id}>
            <TableHeaderCell isRowHeader scope="row">Field {index + 1}</TableHeaderCell>
            <TableCell><AttemptIndicators history={attempts} /></TableCell>
            <TableCell><span className={`question-attempt-used${attempts.length === MAX_ATTEMPTS ? ' is-exhausted' : ''}`}>{attempts.length} of 5</span></TableCell>
            <TableCell>{attempts.includes(true) ? points : 0} / {points}</TableCell>
          </TableRow>;
        })}</TableBody>
      </Table>}
    </div>}
  </section>;
}
