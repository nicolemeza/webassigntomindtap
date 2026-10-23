import React, { useId, useMemo, useState } from 'react';
import { Button, ButtonVariant, Checkbox, IconButton } from 'react-magma-dom';
import { CloseIcon, ExpandMoreIcon, FilterListIcon, VisibilityIcon } from 'react-magma-icons';
import { emptyBankFilters, filterQuestions, getSubchapters, itemProperties, questionBank, questionSources, questionSummary, questionTypes } from './questionBankData';
import QuestionBankPreview from './QuestionBankPreview';

function FilterGroup({ title, children, open = false }) {
  return <details className="bank-filter-group" open={open}><summary>{title}<ExpandMoreIcon aria-hidden="true" /></summary><div>{children}</div></details>;
}

export default function QuestionBank({ chapters, addedQuestions, onAdd, onBack }) {
  const id = useId();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [allTypes, setAllTypes] = useState(false);
  const [draftFilters, setDraftFilters] = useState(emptyBankFilters);
  const [filters, setFilters] = useState(emptyBankFilters);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [tags, setTags] = useState([]);
  const addedIds = addedQuestions.map((question) => question.id);
  const results = useMemo(() => {
    const filtered = filterQuestions(questionBank, filters, search);
    return sort === 'default' ? filtered : filtered.sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, undefined, { numeric: true }) : a.points - b.points);
  }, [filters, search, sort]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(results.length / 25) - 1));
  const visible = results.slice(currentPage * 25, (currentPage + 1) * 25);
  const selectable = visible.filter((question) => !addedIds.includes(question.id));
  const allSelected = selectable.length > 0 && selectable.every((question) => selected.includes(question.id));
  const filterCount = Object.values(filters).flat().length;
  const toggleFilter = (field, value) => setDraftFilters((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  const options = (field, items) => items.map((label) => <Checkbox key={label} labelText={label} checked={draftFilters[field].includes(label)} color="var(--brand-navy)" onChange={() => toggleFilter(field, label)} />);
  const subchapters = (draftFilters.chapters.length ? draftFilters.chapters : chapters).flatMap(getSubchapters);
  const toggleSelected = (questionId) => setSelected((current) => current.includes(questionId) ? current.filter((item) => item !== questionId) : [...current, questionId]);
  return <div className={`question-bank${filtersOpen ? '' : ' filters-collapsed'}`}>
    {filtersOpen && <aside className="bank-filters" aria-label="Question bank filters">
      <div className="bank-filter-heading"><h2>Question Bank</h2><IconButton variant={ButtonVariant.link} icon={<CloseIcon />} aria-label="Close filters" onClick={() => setFiltersOpen(false)} /></div>
      <div className="bank-filter-label"><FilterListIcon aria-hidden="true" />Filters{filterCount > 0 && <span className="author-count">{filterCount}</span>}</div>
      <div className="bank-filter-scroll">
        <FilterGroup title="Chapter" open>{options('chapters', chapters)}</FilterGroup>
        <FilterGroup title="Subchapter">{options('subchapters', subchapters)}</FilterGroup>
        <FilterGroup title="Question Type" open>{options('types', allTypes ? questionTypes : questionTypes.slice(0, 5))}<button className="author-text-button" type="button" onClick={() => setAllTypes(!allTypes)}>{allTypes ? 'Show fewer types' : 'Show all types'}</button></FilterGroup>
        <FilterGroup title="Question Source" open>{options('sources', questionSources)}</FilterGroup>
        <FilterGroup title="Item Properties">{options('properties', itemProperties)}</FilterGroup>
      </div>
      <div className="bank-filter-actions"><Button className="rebrand-button rebrand-button-primary" onClick={() => { setFilters(draftFilters); setPage(0); }}>Apply Filters</Button><button className="author-text-button" onClick={() => { setDraftFilters(emptyBankFilters); setFilters(emptyBankFilters); setPage(0); }}>Clear filters</button></div>
    </aside>}
    <div className="bank-results">
      <div className="bank-back-row"><Button className="rebrand-button compact" variant={ButtonVariant.link} onClick={onBack}>‹ Back to activity</Button>{!filtersOpen && <Button className="rebrand-button compact" variant={ButtonVariant.link} onClick={() => setFiltersOpen(true)}><FilterListIcon />Filters{filterCount ? ` (${filterCount})` : ''}</Button>}<span>{addedQuestions.length} {addedQuestions.length === 1 ? 'question' : 'questions'} in activity</span></div>
      <div className="bank-search"><label className="visually-hidden" htmlFor={`${id}-search`}>Find by content</label><input id={`${id}-search`} type="search" placeholder="Find by content" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><img src="/rebrand/search.svg" width="20" height="20" alt="" /></div>
      <div className="bank-results-pagination"><Button className="rebrand-button compact" variant={ButtonVariant.link} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹ Previous</Button><span role="status">{results.length ? `${currentPage * 25 + 1}–${Math.min((currentPage + 1) * 25, results.length)}` : '0'} of {results.length} questions</span><label className="bank-sort">Sort<select aria-label="Sort questions" value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }}><option value="default">Default</option><option value="title">Title</option><option value="points">Points</option></select></label><Button className="rebrand-button compact" variant={ButtonVariant.link} disabled={(currentPage + 1) * 25 >= results.length} onClick={() => setPage(currentPage + 1)}>Next ›</Button></div>
      <div className="bank-add-row"><Checkbox labelText="Select all questions on this page" isTextVisuallyHidden checked={allSelected} disabled={!selectable.length} color="var(--brand-navy)" onChange={() => setSelected((current) => allSelected ? current.filter((item) => !selectable.some((question) => question.id === item)) : [...new Set([...current, ...selectable.map((question) => question.id)])])} /><Button className="rebrand-button rebrand-button-primary compact" disabled={!selected.length} onClick={() => { onAdd(questionBank.filter((question) => selected.includes(question.id))); setSelected([]); }}>Add {selected.length || ''} Question{selected.length === 1 ? '' : 's'}</Button>{selected.length > 0 && <span>{selected.length} selected</span>}</div>
      <div className="bank-question-list">
        {visible.map((question) => { const isAdded = addedIds.includes(question.id); const isPreview = preview === question.id; const previewId = `${id}-${question.id}`; return <article className="bank-question" key={question.id}>
          <div className="bank-question-row"><Checkbox labelText={`Select ${question.title}`} isTextVisuallyHidden checked={isAdded || selected.includes(question.id)} disabled={isAdded} color="var(--brand-navy)" onChange={() => toggleSelected(question.id)} /><IconButton className="bank-preview-button" variant={ButtonVariant.link} icon={isPreview ? <CloseIcon /> : <VisibilityIcon />} aria-label={`${isPreview ? 'Close preview of' : 'Preview'} ${question.title}`} aria-expanded={isPreview} aria-controls={previewId} onClick={() => setPreview(isPreview ? null : question.id)} /><div className="bank-question-info"><button className="bank-question-title" onClick={() => setPreview(isPreview ? null : question.id)} aria-expanded={isPreview} aria-controls={previewId}>{question.title}</button><p>{questionSummary(question)}</p><span>{question.questionType} · {question.points} {question.points === 1 ? 'point' : 'points'}</span></div>{isAdded && <span className="author-added">✓ Added</span>}<button className="author-text-button bank-tags-toggle" aria-expanded={tags.includes(question.id)} onClick={() => setTags((current) => current.includes(question.id) ? current.filter((item) => item !== question.id) : [...current, question.id])}>All tags</button></div>
          {tags.includes(question.id) && <div className="bank-tags">{[question.chapter, question.assignment, question.source, ...question.properties].map((tag) => <span key={tag}>{tag}</span>)}</div>}
          {isPreview && <div id={previewId}><QuestionBankPreview question={question} /></div>}
        </article>; })}
        {!results.length && <div className="author-empty"><FilterListIcon aria-hidden="true" /><h3>No matching questions</h3><p>Try different filters or search terms. The available question content is from R.5 HW Factoring.</p><Button className="rebrand-button" onClick={() => { setFilters(emptyBankFilters); setDraftFilters(emptyBankFilters); setSearch(''); }}>Clear search and filters</Button></div>}
      </div>
    </div>
  </div>;
}
