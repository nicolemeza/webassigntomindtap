import React from 'react';
import BrandIcon from './BrandIcon';

export default function ChapterIcon({ name }) {
  const rebranded = { 'more-vert': 'more', 'more-vert-active': 'more', 'expand-more': 'chevron-down', 'chevron-up': 'chevron-up', 'chevron-down': 'chevron-down', 'book': 'book', 'assessment': 'assessment', 'powerpoints': 'powerpoints', 'flashcards': 'flashcards', 'graded': 'graded', 'expand-details': 'expand-details' };
  if (rebranded[name]) return <BrandIcon name={rebranded[name]} />;
  const size = name === 'graded' ? 12 : 24;
  return <img src={`/chapter-icons/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}
