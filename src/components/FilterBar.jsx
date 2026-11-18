import React, { useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { CATEGORIES, CATEGORY_COLORS, PRIORITIES, PRIORITY_CONFIG, STATUSES, PROJECT_COLORS } from '../constants';
import { useNotes } from '../context/NotesContext';
import { useProjects } from '../context/ProjectsContext';
import { SegmentedControl } from './common/SegmentedControl';
import { FilterDropdown } from './common/FilterDropdown';
import { ActiveFilters } from './common/ActiveFilters';
import { Popover } from './common/Popover';

export function FilterBar() {
  const {
    notes,
    filteredNotes,
    statusFilter,
    setStatusFilter,
    selectedCategories,
    toggleCategoryFilter,
    clearCategoryFilters,
    selectedPriorities,
    togglePriorityFilter,
    clearPriorityFilters,
    selectedProjects,
    toggleProjectFilter,
    clearProjectFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    resetFilters,
  } = useNotes();

  const { projects, getProject } = useProjects();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortTriggerRef = useRef(null);

  // Status counts
  const statusOptions = [
    { value: 'All', label: 'All', count: notes.length },
    ...STATUSES.map((st) => ({
      value: st,
      label: st,
      count: notes.filter((n) => n.status === st).length,
    })),
  ];

  // Category options with counts
  const categoryOptions = CATEGORIES.map((cat) => ({
    id: cat,
    label: cat,
    dotColor: CATEGORY_COLORS[cat]?.light || '#FFF1A8',
    count: notes.filter((n) => n.category === cat).length,
  }));

  // Priority options with counts
  const priorityOptions = PRIORITIES.map((p) => ({
    id: p,
    label: p,
    dotColor: PRIORITY_CONFIG[p]?.color,
    count: notes.filter((n) => n.priority === p).length,
  }));

  // Project options with counts
  const projectOptions = [
    {
      id: 'none',
      label: 'No project',
      dotColor: null,
      count: notes.filter((n) => !n.project).length,
    },
    ...projects.map((proj) => ({
      id: proj.id,
      label: proj.name,
      dotColor: PROJECT_COLORS[proj.colorIndex % 8]?.dot || '#64748B',
      count: notes.filter((n) => n.project === proj.id).length,
    })),
  ];

  // Sort options
  const sortOptions = [
    { id: 'order', label: 'Manual order' },
    { id: 'newest', label: 'Newest first' },
    { id: 'oldest', label: 'Oldest first' },
    { id: 'priority', label: 'Priority (High to Low)' },
    { id: 'dueDate', label: 'Due date' },
  ];

  const currentSortLabel = sortOptions.find((s) => s.id === sortBy)?.label || 'Manual order';

  // Build active filter chips for second row
  const activeChips = [];

  if (statusFilter !== 'All') {
    activeChips.push({
      id: `status-${statusFilter}`,
      label: `Status: ${statusFilter}`,
      onRemove: () => setStatusFilter('All'),
    });
  }

  selectedCategories.forEach((cat) => {
    activeChips.push({
      id: `cat-${cat}`,
      label: cat,
      dotColor: CATEGORY_COLORS[cat]?.light,
      onRemove: () => toggleCategoryFilter(cat),
    });
  });

  selectedPriorities.forEach((p) => {
    activeChips.push({
      id: `priority-${p}`,
      label: `${p} Priority`,
      dotColor: PRIORITY_CONFIG[p]?.color,
      onRemove: () => togglePriorityFilter(p),
    });
  });

  selectedProjects.forEach((projId) => {
    if (projId === 'none') {
      activeChips.push({
        id: 'proj-none',
        label: 'No project',
        onRemove: () => toggleProjectFilter('none'),
      });
    } else {
      const proj = getProject(projId);
      if (proj) {
        activeChips.push({
          id: `proj-${proj.id}`,
          label: proj.name,
          dotColor: PROJECT_COLORS[proj.colorIndex % 8]?.dot || '#64748B',
          onRemove: () => toggleProjectFilter(proj.id),
        });
      }
    }
  });

  if (sortBy !== 'order') {
    activeChips.push({
      id: `sort-${sortBy}`,
      label: `Sort: ${currentSortLabel}`,
      onRemove: () => setSortBy('order'),
    });
  }

  if (searchQuery.trim()) {
    activeChips.push({
      id: 'search-query',
      label: `Search: "${searchQuery}"`,
      onRemove: () => setSearchQuery(''),
    });
  }

  return (
    <div className="filter-toolbar-container">
      {/* Primary single toolbar row */}
      <div className="filter-toolbar-row">
        {/* Left Section: Status Segmented Control */}
        <div className="toolbar-left-cluster">
          <SegmentedControl
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Status filter"
          />

          {/* Three Filter Dropdowns: Category, Priority, Project */}
          <div className="toolbar-dropdowns-group">
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              selectedValues={selectedCategories}
              onToggle={toggleCategoryFilter}
              onClear={clearCategoryFilters}
            />

            <FilterDropdown
              label="Priority"
              options={priorityOptions}
              selectedValues={selectedPriorities}
              onToggle={togglePriorityFilter}
              onClear={clearPriorityFilters}
            />

            {projects.length > 0 && (
              <FilterDropdown
                label="Project"
                options={projectOptions}
                selectedValues={selectedProjects}
                onToggle={toggleProjectFilter}
                onClear={clearProjectFilters}
              />
            )}
          </div>
        </div>

        {/* Right Section: Notes Count & Sort Dropdown */}
        <div className="toolbar-right-cluster">
          <span className="toolbar-count-text">
            Showing {filteredNotes.length} of {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>

          {/* Sort Dropdown */}
          <div className="sort-dropdown-anchor">
            <button
              ref={sortTriggerRef}
              type="button"
              className={`toolbar-sort-btn ${sortBy !== 'order' ? 'is-sorted' : ''}`}
              onClick={() => setIsSortOpen((prev) => !prev)}
              aria-haspopup="dialog"
              aria-expanded={isSortOpen}
              title={`Sort: ${currentSortLabel}`}
            >
              <ArrowUpDown size={13} className="sort-icon" />
              <span className="sort-btn-label">{currentSortLabel}</span>
              <ChevronDown size={11} className="sort-chevron" />
            </button>

            <Popover
              isOpen={isSortOpen}
              onClose={() => setIsSortOpen(false)}
              triggerRef={sortTriggerRef}
              className="menu-popover sort-popover"
              align="right"
            >
              <div className="popover-header-title">Sort notes by</div>
              <div className="popover-options-list" role="listbox">
                {sortOptions.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`popover-option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                    >
                      <span className="option-label-text">{opt.label}</span>
                      {isSelected && <Check size={13} className="option-check-icon" />}
                    </button>
                  );
                })}
              </div>
            </Popover>
          </div>
        </div>
      </div>

      {/* Second Line: Active Filter Removable Chips (only if filters are active) */}
      <ActiveFilters
        chips={activeChips}
        onClearAll={resetFilters}
      />
    </div>
  );
}
