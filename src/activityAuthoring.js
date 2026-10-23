export function totalQuestionPoints(questions) {
  return Math.round(questions.reduce((sum, question) => sum + Number(question.points), 0) * 100) / 100;
}

// Round cumulative shares so even very small totals never produce a negative
// final question, while retaining the questions' relative point weights.
export function scaleQuestionPoints(questions, total) {
  const weight = totalQuestionPoints(questions);
  const cents = Math.round(Number(total) * 100);
  let cumulative = 0;
  let allocated = 0;
  return questions.map((question, index) => {
    cumulative += weight ? Number(question.points) / weight : 1 / questions.length;
    const next = index === questions.length - 1 ? cents : Math.round(cumulative * cents);
    const points = (next - allocated) / 100;
    allocated = next;
    return { ...question, points };
  });
}
