// Transcribed from the production WebAssign question browser, QID 4260657.
// This supplemental module is grouped with transformations by topic; it is not
// part of the imported GHColAlg13 homework assignments.
export const exploreItQuestions = [{
  id: 'webassign-4260657',
  sourceId: '4260657',
  questionCode: 'ExploreIt PreCalculus',
  title: 'Explore It · Stretching and Shrinking of Graphs',
  kind: 'webassign',
  points: 1,
  chapter: 'Chapter 3. Functions',
  assignment: 'Explore It modules',
  source: 'Test Bank',
  questionType: 'Math',
  properties: ['Gradable', 'Multiple parts'],
  prompt: 'Explore It: Stretching and Shrinking of Graphs. Use the interactive module to explore horizontal and vertical transformations, then complete parts (a) and (b).',
  exploration: {
    title: 'Stretching and Shrinking of Graphs',
    url: 'https://college.cengage.com/mathematics/precalculus/explore_it/topic7/stretching.html',
  },
  content: [
    { tag: 'p', children: ['In the LEARN tab, play the video for a short while. Click the EXPLORE tab, then drag the horizontal and vertical sliders to manipulate the figure. You can also open Practice Questions at the bottom right.'] },
    { tag: 'p', children: ['Select Parent Function 1, y = x² − 3, in the Explore tab of the Explore It.'] },
    { tag: 'p', children: ['(a) Find the modified function if the horizontal shrink is set to 3 and the vertical stretch is set to 2.'] },
    { tag: 'div', children: ['y = ', { tag: 'field', id: 'function' }] },
    { tag: 'p', children: ['(b) Find the horizontal factor and vertical factor for the modified function y = x² − 12.'] },
    { tag: 'div', children: ['Horizontal factor = ', { tag: 'field', id: 'horizontal' }] },
    { tag: 'div', children: ['Vertical factor = ', { tag: 'field', id: 'vertical' }] },
  ],
  fields: [
    { id: 'function', type: 'text', label: 'Part (a), modified function y', expected: '18x^2-6' },
    { id: 'horizontal', type: 'text', label: 'Part (b), horizontal factor', expected: '0.5' },
    { id: 'vertical', type: 'text', label: 'Part (b), vertical factor', expected: '4' },
  ],
}];
