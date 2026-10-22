export function assistantGreeting(activity, question) {
  const number = question.id.match(/-(\d+)$/)?.[1];
  return `I see you’re on ${activity.title}${number ? `, question ${number}` : ''}. How can I help you?`;
}

export function assistantReply(question, message) {
  const text = message.toLowerCase();
  if (/grade|score|submit|attempt/.test(text)) return 'I can help you think through the problem, but I can’t grade or submit answers. Use Grade Answer in the activity. This prototype assistant uses scripted guidance, not a connected AI service.';
  const content = (question.blocks || []).map(block => `${block.text || ''} ${block.expression || ''} ${block.label || ''}`).join(' ').toLowerCase();
  if (/circle|radius|center/.test(content)) {
    if (/example/.test(text)) return 'Here’s a similar example: (x − 2)² + (y + 1)² = 9 has center (2, −1) and radius 3. Notice that the signs inside the parentheses are opposite the center coordinates. Try applying that pattern to your equation.';
    return 'Compare your equation with (x − h)² + (y − k)² = r². The center is (h, k), and the radius is the positive square root of the right-hand side. If needed, complete the square first. To draw it, choose Circle, click the center, then click a point one radius away. Which step would you like to work through?';
  }
  if (/intercept|solve for/.test(content)) {
    if (/example/.test(text)) return 'For a similar example, take y = x² − 9. Setting x = 0 gives the y-intercept (0, −9). Setting y = 0 gives (x − 3)(x + 3) = 0, so the x-intercepts are (−3, 0) and (3, 0). Use the same two substitutions in your equation.';
    return 'Start with one variable at a time. For a y-intercept, set x = 0 and evaluate y. For x-intercepts, set y = 0, factor if possible, and solve each factor equal to zero. If the question asks for values rather than ordered pairs, enter a comma-separated list. Which substitution have you tried?';
  }
  if (/symmetr/.test(content)) return 'Test symmetry by substitution: replace y with −y for x-axis symmetry, x with −x for y-axis symmetry, and both x and y with their negatives for origin symmetry. Simplify each result and compare it with the original equation. Choose every substitution that leaves the equation unchanged.';
  if (/graph/.test(content)) return 'Identify the equation’s parent graph, then look for shifts, reflections, and stretching. Check a few easy points, including x = 0 when it is in the domain. Compare those points and the direction of the curve with each graph choice. Tell me which feature you’re unsure about, or ask for an example.';
  if (/factor/.test(content)) return /example/.test(text)
    ? 'For a similar example, 6x² + 9x = 3x(2x + 3). The numerical greatest common factor is 3, and both terms contain x. Multiply back out to check your factorization.'
    : 'First look for a greatest common factor shared by every term. Then check for a difference of squares, a trinomial pattern, or grouping. Multiply your factors back out to check that you recover the original expression. Which step are you working on?';
  return 'Let’s break the question into smaller steps. Identify what you’re asked to find, write down the given information, and try one step at a time. This demo has a limited set of sample replies; it can’t evaluate a custom solution. You can use Read it for the course resource or ask your instructor for more specific help.';
}
