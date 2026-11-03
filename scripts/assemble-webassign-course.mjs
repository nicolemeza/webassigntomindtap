import fs from 'node:fs/promises';
import path from 'node:path';
const directory = path.resolve('tmp/webassign-import');
const assignments = await Promise.all((await fs.readdir(directory)).filter(name => name.endsWith('.json')).map(async name => JSON.parse(await fs.readFile(path.join(directory, name), 'utf8'))));
assignments.sort((a, b) => Number(a.assignmentId) - Number(b.assignmentId));
if (assignments.length !== 66) throw Error(`Expected all 66 assignments; found ${assignments.length}.`);
for (const assignment of assignments) {
  if (!/^(?:[1-8]\.\d+ HW|Chapter [1-8] (?:Review|Test))/.test(assignment.title)) throw Error(`Unexpected assignment: ${assignment.title}`);
  for (const question of assignment.questions) {
    if (!question.questionCode || JSON.stringify(question).includes('[MaxDepth]')) throw Error(`Incomplete question in ${assignment.title}`);
    const removedFields = new Set();
    const diagramFields = [];
    const removeFields = node => { if (node && typeof node === 'object') { if (node.tag === 'field') removedFields.add(node.id); (node.children || []).forEach(removeFields); } };
    const textOf = (node, includeKeys = false) => {
      if (typeof node === 'string') return node;
      if (!node || (!includeKeys && node.answerKey) || ['field', 'svg'].includes(node.tag)) return '';
      const text = (node.children || []).map(child => textOf(child, includeKeys)).join('');
      return node.tag === 'sup' ? `^${text}` : node.tag === 'sub' ? `_${text}` : /watexnumerator/.test(node.attrs?.class || '') ? `${text}/` : ['div', 'p', 'li'].includes(node.tag) ? `${text} ` : text;
    };
    const normalize = node => {
      if (typeof node === 'string') return /Press Space or Enter to edit this math answer\./.test(node) ? null : node;
      if (!node) return null;
      const classes = (node.attrs?.class || '').split(/\s+/);
      if (classes.some(name => ['mathtype-sr-only', 'sr-only', 'dcg-container', 'MathJax_SVG_Display'].includes(name))) { removeFields(node); return null; }
      if (classes.some(name => /^(solutionContainer|keyToPrint|ansToPrint)$/.test(name)) || (classes.includes('numberline') && classes.includes('key'))) node.answerKey = true;
      if (classes.includes('graphpad-root') || (classes.includes('numberline') && !classes.includes('key'))) {
        removeFields(node);
        const field = { id: `diagram-${diagramFields.length}`, type: classes.includes('numberline') ? 'number-line' : 'graph', label: classes.includes('numberline') ? 'Graph the solution on the number line.' : 'Graph your answer.' };
        diagramFields.push(field);
        const key = classes.includes('graphpad-root') ? textOf(node, true).trim() : '';
        return { tag: 'div', children: [{ tag: 'field', id: field.id }, ...(key ? [{ tag: 'div', answerKey: true, children: [key] }] : [])] };
      }
      return { ...node, ...(node.children ? { children: node.children.map(normalize).filter(child => child !== null) } : {}) };
    };
    question.content = question.content.map(normalize).filter(node => node !== null);
    question.fields = [...question.fields.filter(field => !removedFields.has(field.id)), ...diagramFields];
    question.fields.forEach(field => { if (/^correct$/i.test(field.label || '')) field.label = ''; });
    question.prompt = question.content.map(node => textOf(node)).join(' ').replace(/\s+/g, ' ').trim();
    delete question.summary;
  }
}
await fs.writeFile('src/webassignCourseData.json', JSON.stringify({ source: 'GUSTAFSON13-REVIEW', assignments }));
await fs.mkdir('output', { recursive: true });
await fs.writeFile('output/webassign-import-report.json', JSON.stringify({ source: 'GUSTAFSON13-REVIEW', preservedChapter: 'Chapter R', assignmentCount: assignments.length, questionCount: assignments.reduce((sum, assignment) => sum + assignment.questions.length, 0), assignments: assignments.map(assignment => ({ title: assignment.title, assignmentId: assignment.assignmentId, sourceUrl: assignment.sourceUrl, questionCount: assignment.questions.length, points: assignment.questions.reduce((sum, question) => sum + question.points, 0), questions: assignment.questions.map(question => ({ questionCode: question.questionCode, questionId: question.sourceId, points: question.points })) })) }, null, 2));
console.log(`Assembled ${assignments.length} assignments and ${assignments.reduce((sum, assignment) => sum + assignment.questions.length, 0)} questions.`);
