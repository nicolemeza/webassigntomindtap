import React from 'react';
import BrandIcon from './BrandIcon';

export default function ChapterIcon({ name }) {
  if (['copy', 'edit', 'delete'].includes(name)) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === 'copy' ? <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H4v13h4" /></> : name === 'edit' ? <><path d="m4 16-1 5 5-1L20 8l-4-4L4 16Z" /><path d="m14 6 4 4" /></> : <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>}</svg>;
  const rebranded = { 'more-vert': 'more', 'more-vert-active': 'more', 'expand-more': 'chevron-down', 'chevron-up': 'chevron-up', 'chevron-down': 'chevron-down', 'book': 'book', 'assessment': 'assessment', 'powerpoints': 'powerpoints', 'flashcards': 'flashcards', 'graded': 'graded', 'expand-details': 'expand-details' };
  if (rebranded[name]) return <BrandIcon name={rebranded[name]} />;
  const size = name === 'graded' ? 12 : 24;
  return <img src={`/chapter-icons/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}
