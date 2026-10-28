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
  'Chapter 5': [
    '5.1 HW Exponential Functions & Their Graphs',
    '5.2 HW Applications of Exponential Functions',
    '5.3 HW Logarithmic Functions & Their Graphs',
    '5.4 HW Applications of Logarithmic Functions',
    '5.5 HW Properties of Logarithms',
    '5.6 HW Exponential & Logarithmic Equations',
    'Chapter 5 Review',
    'Chapter 5 Test',
  ],
  'Chapter 6': [
    '6.1 HW Systems of Linear Eqns, Two & Three Var',
    '6.2 HW Using Matrices with Systems of Linear Eqns',
    '6.3 HW Matrix Operations',
    '6.4 HW Mult Inverses of Matrices & Matrix Eqns',
    '6.5 HW Determinants & Cramers Rule',
    '6.6 HW Partial Fractions',
    '6.7 HW Inequalities & Systems of Ineq in Two Var',
    '6.8 HW Linear Programming',
    'Chapter 6 Review',
    'Chapter 6 Test',
  ],
  'Chapter 7': [
    '7.1 HW The Circle & The Parabola',
    '7.2 HW The Ellipse',
    '7.3 HW The Hyperbola',
    '7.4 HW Nonlinear Systems of Equations in Two Var',
    'Chapter 7 Review',
    'Chapter 7 Test',
  ],
  'Chapter 8': [
    '8.1 HW The Binomial Theorem',
    '8.2 HW Sequences, Series, & Summation Notation',
    '8.3 HW Arithmetic Sequences & Series',
    '8.4 HW Geometric Sequences & Series',
    '8.5 HW Mathematical Induction',
    '8.6 HW Counting, Permutations, & Combinations',
    '8.7 HW Introduction to Probability',
    'Chapter 8 Review',
    'Chapter 8 Test',
  ],
};

const assignmentPoints = {
  '2.5 HW Graphs of Equations & Circles': 30,
  'R.1 HW Sets of Real Numbers': 24,
  'R.2 HW Integer Exponents & Scientific Notation': 34,
  'R.3 HW Rational Exponents & Radicals': 27,
  'R.4 HW Polynomials & Operations on Radicals': 33,
  'R.5 HW Factoring': 29,
  'R.6 HW Rational Expressions': 30,
  'Chapter R Review': 40,
  'Chapter R Test': 22,
};

export function getChapterAssignments(chapter) {
  const chapterNumber = chapter.slice(0, chapter.indexOf('. '));
  const titles = chapterAssignments[chapterNumber];
  if (!titles) return null;
  const dueSchedule = ['Chapter 5', 'Chapter 6', 'Chapter 7', 'Chapter 8'].includes(chapterNumber)
    ? { dueDate: '2027-01-30', dueTime: '23:58', dueTimeZone: 'CST', dueUtcOffset: '-06:00' }
    : {};
  // Prototype defaults from the Figma row; these are not live course results.
  const activity = (title) => ({ title, icon: 'assessment', type: title.endsWith(' Test') ? 'TEST' : 'HOMEWORK', submitted: '0%', averageScore: '--', points: assignmentPoints[title] ?? 3, ...dueSchedule, ...(title === 'R.5 HW Factoring' ? { settings: { attempts: '1' } } : {}) });
  return {
    'Learn It': titles.filter((title) => title.includes(' HW ')).map(activity),
    'Study It': titles.filter((title) => title.endsWith(' Review')).map(activity),
    'Apply It': titles.filter((title) => title.endsWith(' Test')).map(activity),
  };
}
