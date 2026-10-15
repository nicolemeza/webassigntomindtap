import React from 'react';

const small = new Set(['calendar', 'filter', 'list', 'more', 'unfold', 'visibility']);
const medium = new Set(['dashboard', 'course-settings', 'gradebook', 'learning-path', 'search', 'sidebar-collapse', 'support', 'tools']);

export default function BrandIcon({ name, ...props }) {
  const size = small.has(name) ? 16 : medium.has(name) ? 20 : name === 'graded' ? 12 : 24;
  return <img src={`/rebrand/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" {...props} />;
}
