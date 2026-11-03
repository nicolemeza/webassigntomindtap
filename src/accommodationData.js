// Fictional sample roster, not a connected class roster. Keep IDs stable across name changes.
const studentNames = [
  'Patel, Anika',
  'Rivera, Mateo',
  'Okafor, Chiamaka',
  'Chen, Daniel',
  'Hassan, Layla',
  'Nguyen, Minh',
  'Johnson, Avery',
  'García, Lucía',
  'Kim, Jiwoo',
  'Mensah, Kwame',
  'Williams, Jordan',
  'Singh, Harpreet',
  'Nakamura, Emi',
  'Ibrahim, Omar',
  'Kowalski, Zofia',
  'Santos, Rafael',
  'Abebe, Selam',
  'O’Brien, Quinn',
  'Yılmaz, Deniz',
  'Dubois, Camille',
  'Ali, Yasmin',
  'Petrov, Nikolai',
  'Park, Hana',
  'Bennett, Morgan',
  'Fernandes, Priya',
];

export const accommodationStudents = studentNames.map((name, index) => ({
  id: `sample-student-${index + 1}`,
  name,
}));

export const emptyAccommodationEditor = {
  earlyDays: '', earlyHours: '', dueDays: '', dueHours: '', attempts: '', timeLimit: '',
  removeEarly: false, removeDue: false, removeAttempts: false, removeTime: false,
};

export function hasAccommodationEdits(editor) {
  return Object.values(editor).some((value) => value !== '' && value !== false);
}

export function applyAccommodations(current, selectedIds, editor) {
  if (!hasAccommodationEdits(editor)) return { value: current };
  if (!selectedIds.length) return { error: 'Select at least one student to set accommodations.' };
  for (const [fields, removed] of [[['earlyDays', 'earlyHours'], editor.removeEarly], [['dueDays', 'dueHours'], editor.removeDue]]) {
    if (!removed && fields.some((field) => editor[field] !== '' && (!Number.isInteger(Number(editor[field])) || Number(editor[field]) < 0))) {
      return { error: 'Enter whole numbers, zero or greater, for accommodation days and hours.' };
    }
  }
  const value = { ...current };
  selectedIds.forEach((id) => {
    const row = { ...current[id] };
    if (editor.removeEarly) delete row.releaseEarly;
    else if (editor.earlyDays !== '' || editor.earlyHours !== '') row.releaseEarly = { days: Number(editor.earlyDays || 0), hours: Number(editor.earlyHours || 0) };
    if (editor.removeDue) delete row.extendDue;
    else if (editor.dueDays !== '' || editor.dueHours !== '') row.extendDue = { days: Number(editor.dueDays || 0), hours: Number(editor.dueHours || 0) };
    if (editor.removeAttempts) delete row.attempts;
    else if (editor.attempts) row.attempts = editor.attempts;
    if (editor.removeTime) delete row.timeLimit;
    else if (editor.timeLimit) row.timeLimit = editor.timeLimit;
    if (Object.keys(row).length) value[id] = row;
    else delete value[id];
  });
  return { value };
}

export function applyAccommodationOperations(current = {}, operations = []) {
  let value = current;
  for (const operation of operations) {
    const result = applyAccommodations(value, operation.selectedIds, operation.editor);
    if (result.error) return result;
    value = result.value;
  }
  return { value };
}
