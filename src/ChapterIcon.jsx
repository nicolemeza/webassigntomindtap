import React from 'react';

export default function ChapterIcon({ name }) {
  const size = name === 'graded' ? 12 : 24;
  return <img src={`/chapter-icons/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}
