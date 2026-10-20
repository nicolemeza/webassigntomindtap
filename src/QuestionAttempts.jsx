import React, { useId, useState } from 'react';
import { Button, ButtonVariant, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from 'react-magma-dom';
import './question-attempts.css';

function AttemptIndicators() {
  return <div className="question-attempt-indicators" role="img" aria-label="0 of 5 attempts used">
    {Array.from({ length: 5 }, (_, index) => <img key={index} src="/rebrand/attempt-unused.svg" alt="" />)}
  </div>;
}

export default function QuestionAttempts({ question, variant }) {
  const headingId = useId();
  const tableId = useId();
  const [expanded, setExpanded] = useState(false);
  const fields = question.inputs || [];
  const multiField = fields.length > 1;
  // Preview-only equal weighting; assign rounding remainder to the last field.
  const totalHundredths = Math.round(question.points * 100);
  const fieldHundredths = multiField ? Math.floor(totalHundredths / fields.length) : totalHundredths;
  return <section className={`question-attempts${multiField ? ' question-attempts-multi' : ''}`} aria-labelledby={headingId}>
    <div className="question-attempts-summary">
    <div className="question-attempts-heading">
      <h3 id={headingId}>Attempts</h3>
      <p>Your grade is based on your <strong>best attempt</strong>.</p>
    </div>
    {!multiField && <>{variant === 'sidebar' && <p className="question-attempt-availability">5 attempts available</p>}<AttemptIndicators /></>}
    {multiField && variant === 'sidebar' && <p className="question-attempt-availability">5 attempts per field</p>}
    <p className="question-attempt-score"><span>Earned Score:</span><strong>0/ {question.points} {question.points === 1 ? 'pt' : 'pts'}</strong></p>
    {multiField && <Button className="question-attempt-toggle" variant={ButtonVariant.link} aria-label={expanded ? 'Collapse attempts details' : 'Expand attempts details'} aria-expanded={expanded} aria-controls={tableId} onClick={() => setExpanded(!expanded)}><img src="/rebrand/attempt-collapse.svg" alt="" /></Button>}
    </div>
    {multiField && <div id={tableId} hidden={!expanded} className="question-attempt-table-wrapper">
      {variant === 'sidebar' ? <ul className="question-attempt-field-list" aria-label="Attempts by answer field">{fields.map((field, index) => {
        const points = (index === fields.length - 1 ? totalHundredths - fieldHundredths * index : fieldHundredths) / 100;
        return <li key={field.id}><div className="question-attempt-field-title"><strong>Field {index + 1}</strong><span>0 / {points} pt</span></div><AttemptIndicators /><p>0 of 5 attempts used</p></li>;
      })}</ul> : <Table className="question-attempt-table" minWidth={476} aria-label="Attempts by answer field">
        <TableHead><TableRow>{['Field', 'Score per attempt', 'Attempts used', 'Points'].map(label => <TableHeaderCell key={label}>{label}</TableHeaderCell>)}</TableRow></TableHead>
        <TableBody>{fields.map((field, index) => {
          const points = (index === fields.length - 1 ? totalHundredths - fieldHundredths * index : fieldHundredths) / 100;
          return <TableRow key={field.id}>
            <TableHeaderCell isRowHeader scope="row">Field {index + 1}</TableHeaderCell>
            <TableCell><AttemptIndicators /></TableCell>
            <TableCell><span className="question-attempt-used">0 of 5</span></TableCell>
            <TableCell>0 / {points}</TableCell>
          </TableRow>;
        })}</TableBody>
      </Table>}
    </div>}
  </section>;
}
