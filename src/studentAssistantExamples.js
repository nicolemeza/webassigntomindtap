const demoActivityId = 'created-77fc5961-3d94-4a97-9383-ac56b24248f8';

// Authored demonstrations of the guided tutoring pattern observed in Student
// Assistant. These are examples, not transcripts or responses from a live AI.
const linearEquationExamples = [
  {
    id: 'getting-started',
    title: 'Help me get started',
    description: 'Find a first step when the fractions feel overwhelming.',
    messages: [
      { role: 'user', text: 'I’m stuck on question 2. Can you help me figure out how to start solving this equation with fractions?' },
      { role: 'assistant', text: 'Let’s take it one step at a time. In (3 + x)/3 + (x + 7)/2 = 3x + 1, look at the denominators first. What is the smallest positive number that both 3 and 2 divide into evenly?' },
      { role: 'user', text: 'Would it be 6?' },
      { role: 'assistant', text: 'Yes. That’s the least common denominator. Multiplying every term on both sides by 6 will clear the fractions. Start with the first fraction: what is 6 ÷ 3, and what does it multiply?' },
      { role: 'user', text: 'It’s 2, so I get 2(3 + x). The other fraction becomes 3(x + 7).' },
      { role: 'assistant', text: 'Exactly—you kept each whole numerator together. On the right, multiply both 3x and 1 by 6 as well. Now you have:\n\n2(3 + x) + 3(x + 7) = 18x + 6\n\nTry distributing and combining like terms on the left. What do you get?' },
      { role: 'user', text: '6 + 2x + 3x + 21, so 5x + 27.' },
      { role: 'assistant', text: 'That’s right. You’ve turned an equation with fractions into:\n\n5x + 27 = 18x + 6\n\nNow use the same operation on both sides to collect the x terms on one side and constants on the other. Try the next step in your work, then check your solution in the original equation.' },
    ],
  },
  {
    id: 'distribution-mistake',
    title: 'Help me find my mistake',
    description: 'Work through a common error when clearing fractions.',
    messages: [
      { role: 'user', text: 'I’m working on question 2. I multiplied both sides by 6 and got 6 + x + 3x + 7 = 18x + 6. Can you help me find what I did wrong?' },
      { role: 'assistant', text: 'You’ve chosen the right multiplier. Let’s look closely at what happens to each numerator. After 6 cancels with the denominator 3, the first term is 2(3 + x). Does that 2 multiply just the 3, or both terms inside the parentheses?' },
      { role: 'user', text: 'Both terms. So it should be 6 + 2x.' },
      { role: 'assistant', text: 'Yes. The same idea applies to the second fraction: 6(x + 7)/2 becomes 3(x + 7). What happens when you distribute that 3?' },
      { role: 'user', text: 'I get 3x + 21. I forgot to multiply the 7 too.' },
      { role: 'assistant', text: 'You found it. Keep parentheses around each numerator until you distribute:\n\n2(3 + x) + 3(x + 7) = 18x + 6\n6 + 2x + 3x + 21 = 18x + 6\n\nWhat does the left side become when you combine like terms?' },
      { role: 'user', text: '5x + 27. Now I can collect the x terms on one side.' },
      { role: 'assistant', text: 'Exactly. Continue from 5x + 27 = 18x + 6, keeping both sides balanced at every step. Once you solve for x, substitute your value into the original equation. That check can help you catch a missed sign or multiplication.' },
    ],
  },
  {
    id: 'similar-example',
    title: 'Show me a similar example',
    description: 'Practice the method, then return to your question.',
    messages: [
      { role: 'user', text: 'I’m still not comfortable solving equations with fractions. Could you walk me through a similar problem so I can try this one myself?' },
      { role: 'assistant', text: 'Sure. Try this practice equation:\n\n(y + 1)/2 + (y + 2)/3 = y\n\nThe numbers are different, but the method is the same. What least common denominator would clear both fractions?' },
      { role: 'user', text: '6. So I multiply every term by 6.' },
      { role: 'assistant', text: 'Right. That gives:\n\n3(y + 1) + 2(y + 2) = 6y\n\nDistribute, then combine like terms. What equation do you get?' },
      { role: 'user', text: '3y + 3 + 2y + 4 = 6y, which becomes 5y + 7 = 6y.' },
      { role: 'assistant', text: 'Good. What happens if you subtract 5y from both sides?' },
      { role: 'user', text: '7 = y. Checking gives 8/2 + 9/3 = 4 + 3 = 7.' },
      { role: 'assistant', text: 'Your check works. For your original question, use the same sequence: find the least common denominator, multiply every term, distribute to the whole numerator, combine like terms, and solve. Then check your own result in the original equation.' },
    ],
  },
];

export function getAssistantExamples(activity, question) {
  return activity.id === demoActivityId && (question.sourceId === '5352779' || question.id === 'webassign-5352779')
    ? linearEquationExamples
    : [];
}
