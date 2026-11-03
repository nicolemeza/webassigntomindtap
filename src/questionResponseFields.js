// Radio buttons and checkboxes in a group form one answer field. Text,
// dropdown, and drawing responses each keep their own field identifier.
export function questionResponseFields(question) {
  if (question.kind !== 'webassign') return question.inputs || [];
  const fields = new Map();
  for (const field of question.fields || []) {
    const id = ['radio', 'checkbox'].includes(field.type) ? field.group : field.id;
    if (!fields.has(id)) fields.set(id, { ...field, id });
  }
  return [...fields.values()];
}
