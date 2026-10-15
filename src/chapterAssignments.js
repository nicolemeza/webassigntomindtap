// Assignment titles transcribed from the supplied course screenshot.
export const chapterAssignments = {
  'Chapter R': [
    'R.1 HW Sets of Real Numbers',
    'R.2 HW Integer Exponents & Scientific Notation',
    'R.3 HW Rational Exponents & Radicals',
    'R.4 HW Polynomials & Operations on Radicals',
    'R.5 HW Factoring',
    'R.6 HW Rational Expressions',
    'Chapter R Review',
    'Chapter R Test',
  ],
  'Chapter 1': [
    '1.1 HW Linear Equations & Rational Equations',
    '1.2 HW Applications of Linear Equations',
    '1.3 HW Complex Numbers',
    '1.4 HW Quadratic Equations',
    '1.5 HW Applications of Quadratic Equations',
    '1.6 HW Other Types of Equations',
    '1.7 HW Inequalities',
    '1.8 HW Absolute Value',
    'Chapter 1 Review',
    'Chapter 1 Test',
  ],
  'Chapter 2': [
    '2.1 HW Functions & Function Notation',
    '2.2 HW Rect Coordinate System & Graphing Lines',
    '2.3 HW Linear Functions & Slope',
    '2.4 HW Writing & Graphing Equations of Lines',
    '2.5 HW Graphs of Equations & Circles',
    '2.6 HW Proportions & Variation',
    'Chapter 2 Review',
    'Chapter 2 Test',
  ],
  'Chapter 3': [
    '3.1 HW Graphs of Functions',
    '3.2 HW Transformations of the Graphs of Functions',
    '3.3 HW More on Functions; Piecewise-Defined',
    '3.4 HW Operations on Functions',
    '3.5 HW Inverse Functions',
    'Chapter 3 Review',
    'Chapter 3 Test',
  ],
  'Chapter 4': [
    '4.1 HW Quadratic Functions',
    '4.2 HW Polynomial Functions',
    '4.3 HW Remainder & Factor Theorem; Synthetic Div',
    '4.4 HW Fundamental Thm of Algebra; Descartes Rule',
    '4.5 HW Zeros of Polynomial Functions',
    '4.6 HW Rational Functions',
    'Chapter 4 Review',
    'Chapter 4 Test',
  ],
};

export function getChapterAssignments(chapter) {
  const chapterNumber = chapter.slice(0, chapter.indexOf('. '));
  const titles = chapterAssignments[chapterNumber];
  if (!titles) return null;
  const activity = (title) => ({ title, icon: 'assessment', type: title.endsWith(' Test') ? 'TEST' : 'HOMEWORK' });
  return {
    'Learn It': titles.filter((title) => title.includes(' HW ')).map(activity),
    'Study It': titles.filter((title) => title.endsWith(' Review')).map(activity),
    'Apply It': titles.filter((title) => title.endsWith(' Test')).map(activity),
  };
}
