import fs from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve('tmp/learn-it-audit');
const files = await fs.readdir(directory);
const mappings = JSON.parse(await fs.readFile(path.join(directory, 'module-mappings.json'), 'utf8'));
const enabled = JSON.parse(await fs.readFile(path.join(directory, 'enabled-catalog.json'), 'utf8'));
const prototype = JSON.parse(await fs.readFile(path.join(directory, 'prototype-question-identities.json'), 'utf8'));
const modules = Object.fromEntries(await Promise.all(files.filter(name => /^lesson-[A-Za-z]+\d+_.*\.json$/.test(name)).map(async name => {
  const lesson = JSON.parse(await fs.readFile(path.join(directory, name), 'utf8'));
  if (JSON.stringify(lesson).includes('[MaxDepth]')) throw Error(`Truncated lesson content: ${name}`);
  if (!lesson.code || !lesson.sections.some(section => section.id === 'reading' && section.content.length)) throw Error(`Incomplete lesson: ${name}`);
  if (/UserPass|userPass|javascript:|<script/i.test(JSON.stringify(lesson))) throw Error(`Unsafe or session-specific content in ${name}`);
  const showWorkedExamples = node => { if (typeof node !== 'object') return; delete node.answerKey; (node.children || []).forEach(showWorkedExamples); };
  lesson.sections.filter(section => section.id === 'reading').forEach(section => section.content.forEach(showWorkedExamples));
  // The published first linear-equation example drops a minus sign in one
  // intermediate row and its division instruction; keep the worked math valid.
  if (lesson.code === 'ColAlg1 2.1.LI.001.') {
    const text = node => typeof node === 'string' ? node : (node.children || []).map(text).join('');
    const correctSigns = node => {
      if (typeof node !== 'object') return;
      if (node.tag === 'tr') {
        const cells = (node.children || []).filter(child => child?.tag === 'td');
        if (text(cells[0] || '').replace(/\s/g, '') === '−2x' && text(cells[2] || '').trim() === '6' && text(cells[4] || '').trim() === 'Combine like terms.') cells[2].children = ['−6'];
      }
      if (node.children) node.children = node.children.map(child => typeof child === 'string' ? child.replace('Divide both sides by 2.', 'Divide both sides by −2.') : child);
      (node.children || []).forEach(correctSigns);
    };
    lesson.sections.filter(section => section.id === 'reading').forEach(section => section.content.forEach(correctSigns));
    lesson.sourceCorrections = ['Corrected −2x = 6 to −2x = −6 and the corresponding division instruction to divide by −2 in Example 1.'];
  }
  return [lesson.code, lesson];
})));
const questions = {};
for (const mapping of mappings) {
  for (const question of mapping.questions) {
    for (const key of [question.sourceId, question.questionCode]) {
      questions[key] ||= [];
      if (!questions[key].includes(mapping.qid)) questions[key].push(mapping.qid);
    }
  }
}
const ready = enabled.filter(question => questions[question.sourceId]?.some(code => modules[code]));
const pending = enabled.filter(question => !ready.includes(question));
const enabledIds = new Set(enabled.map(question => question.sourceId));
const enabledCodes = new Set(enabled.map(question => question.questionCode));
const prototypeEnabled = prototype.filter(question => enabledIds.has(question.sourceId) || enabledCodes.has(question.questionCode));
const moduleCodesFor = question => questions[question.sourceId] || questions[question.questionCode] || [];
const pendingPrototype = prototypeEnabled.filter(question => !moduleCodesFor(question).length || moduleCodesFor(question).some(code => !modules[code]));
const missingModules = mappings.filter(mapping => !modules[mapping.qid]).map(mapping => ({ code: mapping.qid, title: mapping.link, sourceId: mapping.evidenceSourceId }));
if (process.argv.includes('--require-complete') && pendingPrototype.length) throw Error(`${pendingPrototype.length} prototype questions still need learning content.`);
if (process.argv.includes('--require-all-textbook') && (pending.length || missingModules.length)) throw Error(`${pending.length} textbook questions and ${missingModules.length} linked modules still need learning content.`);
await fs.mkdir('src/learnItLessons', { recursive: true });
const moduleIndex = {};
for (const module of Object.values(modules)) {
  const file = `${module.code.replace(/[^a-z0-9]/gi, '_')}.json`;
  await fs.writeFile(path.join('src/learnItLessons', file), JSON.stringify(module));
  moduleIndex[module.code] = { code: module.code, title: module.title, sourceQuestionId: module.sourceQuestionId, sourceUrl: module.sourceUrl, file, sections: module.sections.map(section => ({ id: section.id, title: section.title })) };
}
await fs.writeFile('src/learnItData.json', JSON.stringify({ verifiedAt: '2026-11-04', textbook: 'Gustafson and Hughes, College Algebra, 13th edition', questions, modules: moduleIndex }));
await fs.mkdir('output', { recursive: true });
await fs.writeFile('output/learn-it-audit-report.json', JSON.stringify({ verifiedAt: '2026-11-04', source: 'WebAssign question source and learning-module previews', textbook: 'Gustafson and Hughes, College Algebra, 13th edition', excludedQuestion: 'demo-street-repair-probability', enabledTextbookQuestions: enabled.length, mappedQuestions: new Set(mappings.flatMap(mapping => mapping.questions.map(question => question.sourceId))).size, importedModules: Object.keys(modules).length, readyQuestions: ready.length, prototypeQuestions: prototype.length, enabledPrototypeQuestions: prototypeEnabled.length, readyPrototypeQuestions: prototypeEnabled.length - pendingPrototype.length, pendingPrototypeQuestions: pendingPrototype, pendingModules: missingModules, questionsWithoutSourceIdentity: prototype.filter(question => !question.sourceId && !question.questionCode), supplementalQuestions: [{ sourceId: '4260657', questionCode: 'ExploreIt PreCalculus', learnItEnabled: false }], pendingAdditionalTextbookQuestions: pending, modules: Object.values(modules).map(module => ({ code: module.code, title: module.title, sourceUrl: module.sourceUrl, sections: module.sections.map(section => section.title), ...(module.sourceCorrections ? { sourceCorrections: module.sourceCorrections } : {}) })) }, null, 2));
console.log(`Imported ${Object.keys(modules).length} modules; ${ready.length} of ${enabled.length} enabled questions have learning content.`);
