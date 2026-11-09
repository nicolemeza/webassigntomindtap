import fs from 'node:fs/promises';

const filename = 'src/demoQuestionResources.json';
const data = JSON.parse(await fs.readFile(filename, 'utf8'));
const text = node => typeof node === 'string' ? node : (node.children || []).map(text).join('');
const clean = node => {
  if (typeof node === 'string') return node;
  if (node.attrs?.class?.split(' ').includes('cluimedia_viewer_video')) {
    const media = node.children?.find(child => child.attrs?.class === 'nb_media video');
    return { tag: 'source-video', title: text(media?.children?.find(child => child.attrs?.class === 'mediaTitle') || '') || 'Video in the textbook' };
  }
  if (node.children) node.children = node.children.map(clean);
  return node;
};
for (const page of data.readIt.pages) {
  if (page.expectedMath !== page.capturedMath) throw Error(`Incomplete textbook math on ${page.title}`);
  page.content = page.content.map(clean);
}
// The published introduction has 800 + 45x once, although the stated fee and
// the rest of its worked example use $42 per person.
const correctIntro = node => {
  if (typeof node === 'string') return;
  if (node.tag === 'math' && node.mml.includes('<m:mn>800</m:mn>')) node.mml = node.mml.replace('<m:mn>45</m:mn>', '<m:mn>42</m:mn>');
  (node.children || []).forEach(correctIntro);
};
data.readIt.pages[0].content.forEach(correctIntro);
data.readIt.sourceCorrections = ['Corrected 800 + 45x to 800 + 42x in the introductory cost expression to match the stated $42 fee and the worked example.'];
if (/UserPass|token=|\[MaxDepth\]/i.test(JSON.stringify(data))) throw Error('Session-specific or truncated reading data');
await fs.writeFile(filename, JSON.stringify(data, null, 2));
await fs.writeFile('output/demo-resource-audit.json', JSON.stringify({ verifiedAt: data.verifiedAt, sourceQuestionId: data.sourceQuestionId, sourceQuestionCode: data.sourceQuestionCode, readIt: { ...data.readIt, pages: data.readIt.pages.map(({ id, title, expectedMath, capturedMath }) => ({ id, title, expectedMath, capturedMath })) }, watchIt: data.watchIt }, null, 2));
