import { describe, it, expect } from 'vitest';

describe('Filtering and Sorting Logic', () => {
  const sampleProjects = [
    { id: 'proj-1', name: 'Alpha', colorIndex: 0 },
    { id: 'proj-2', name: 'Beta', colorIndex: 1 },
  ];

  const sampleNotes = [
    {
      id: '1',
      title: 'Fix auth bug',
      details: 'JWT token expiration error',
      category: 'Bug',
      priority: 'High',
      status: 'Pending',
      project: 'proj-1',
      context: { text: 'Discovered in staging', link: 'https://github.com/org/repo/issues/42' },
      createdAt: '2026-11-10T10:00:00.000Z',
      dueDate: '2026-11-20',
      order: 0,
    },
    {
      id: '2',
      title: 'Design system tokens',
      details: 'Sync Figma colors with CSS variables',
      category: 'Idea',
      priority: 'Medium',
      status: 'Done',
      project: 'proj-2',
      context: { text: 'During design critique', link: 'https://figma.com/file/123' },
      createdAt: '2026-11-12T10:00:00.000Z',
      dueDate: '2026-11-15',
      order: 1,
    },
    {
      id: '3',
      title: 'Payment gateway integration',
      details: 'Stripe webhook receiver',
      category: 'Integration',
      priority: 'Low',
      status: 'In Progress',
      project: null,
      context: null,
      createdAt: '2026-11-14T10:00:00.000Z',
      dueDate: '2026-11-25',
      order: 2,
    },
    {
      id: '4',
      title: 'Team 1:1 prep',
      details: '',
      category: 'Personal',
      priority: 'High',
      status: 'Pending',
      project: 'proj-1',
      context: null,
      createdAt: '2026-11-15T10:00:00.000Z',
      dueDate: '',
      order: 3,
    },
  ];

  function filterAndSortNotes(notes, {
    searchQuery = '',
    statusFilter = 'All',
    selectedCategories = [],
    selectedPriorities = [],
    selectedProjects = [],
    sortBy = 'order',
  } = {}) {
    const projectMap = new Map(sampleProjects.map((p) => [p.id, p.name.toLowerCase()]));

    let result = notes.filter((n) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = n.title?.toLowerCase().includes(query);
        const inDetails = n.details?.toLowerCase().includes(query);
        const inCategory = n.category?.toLowerCase().includes(query);
        const projectName = n.project ? projectMap.get(n.project) : '';
        const inProject = projectName ? projectName.includes(query) : false;
        const inContextText = n.context?.text ? n.context.text.toLowerCase().includes(query) : false;
        const inContextLink = n.context?.link ? n.context.link.toLowerCase().includes(query) : false;

        if (!inTitle && !inDetails && !inCategory && !inProject && !inContextText && !inContextLink) {
          return false;
        }
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(n.category)) {
        return false;
      }

      if (selectedPriorities.length > 0 && !selectedPriorities.includes(n.priority)) {
        return false;
      }

      if (statusFilter !== 'All' && n.status !== statusFilter) {
        return false;
      }

      if (selectedProjects.length > 0) {
        const noteProj = n.project || 'none';
        if (!selectedProjects.includes(noteProj)) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      // Done notes always sink to the bottom
      const aDone = a.status === 'Done';
      const bDone = b.status === 'Done';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'priority') {
        const priorityWeights = { High: 3, Medium: 2, Low: 1 };
        const weightA = priorityWeights[a.priority] || 0;
        const weightB = priorityWeights[b.priority] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return (a.order ?? 0) - (b.order ?? 0);
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return (a.order ?? 0) - (b.order ?? 0);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      return (a.order ?? 0) - (b.order ?? 0);
    });

    return result;
  }

  it('filters by status correctly', () => {
    const pending = filterAndSortNotes(sampleNotes, { statusFilter: 'Pending' });
    expect(pending.length).toBe(2);
    expect(pending.every((n) => n.status === 'Pending')).toBe(true);
  });

  it('filters by multi-select category', () => {
    const filtered = filterAndSortNotes(sampleNotes, { selectedCategories: ['Bug', 'Personal'] });
    expect(filtered.length).toBe(2);
    expect(filtered.map((n) => n.id)).toEqual(['1', '4']);
  });

  it('filters by multi-select priority', () => {
    const high = filterAndSortNotes(sampleNotes, { selectedPriorities: ['High'] });
    expect(high.length).toBe(2);
    expect(high.every((n) => n.priority === 'High')).toBe(true);
  });

  it('filters by project ID', () => {
    const alphaNotes = filterAndSortNotes(sampleNotes, { selectedProjects: ['proj-1'] });
    expect(alphaNotes.length).toBe(2);
    expect(alphaNotes.every((n) => n.project === 'proj-1')).toBe(true);
  });

  it('searches across context text, link, and project names', () => {
    const stagingSearch = filterAndSortNotes(sampleNotes, { searchQuery: 'staging' });
    expect(stagingSearch.length).toBe(1);
    expect(stagingSearch[0].id).toBe('1');

    const figmaSearch = filterAndSortNotes(sampleNotes, { searchQuery: 'figma.com' });
    expect(figmaSearch.length).toBe(1);
    expect(figmaSearch[0].id).toBe('2');

    const projectSearch = filterAndSortNotes(sampleNotes, { searchQuery: 'beta' });
    expect(projectSearch.length).toBe(1);
    expect(projectSearch[0].id).toBe('2');
  });

  it('ensures Done notes always sink to the bottom regardless of sort order', () => {
    const sortedNewest = filterAndSortNotes(sampleNotes, { sortBy: 'newest' });
    expect(sortedNewest[sortedNewest.length - 1].status).toBe('Done');

    const sortedPriority = filterAndSortNotes(sampleNotes, { sortBy: 'priority' });
    expect(sortedPriority[sortedPriority.length - 1].status).toBe('Done');
  });

  it('sorts by priority with High first, then Medium, then Low', () => {
    const sorted = filterAndSortNotes(sampleNotes, { sortBy: 'priority' });
    const nonDone = sorted.filter((n) => n.status !== 'Done');
    expect(nonDone[0].priority).toBe('High');
    expect(nonDone[1].priority).toBe('High');
    expect(nonDone[2].priority).toBe('Low');
  });

  it('sorts Today notes so that completed tasks sink to the bottom', () => {
    const todayTasks = [
      { id: 't1', title: 'Task 1', status: 'Done', doToday: true, order: 0 },
      { id: 't2', title: 'Task 2', status: 'Pending', doToday: true, order: 1 },
      { id: 't3', title: 'Task 3', status: 'Done', doToday: true, order: 2 },
      { id: 't4', title: 'Task 4', status: 'In Progress', doToday: true, order: 3 },
    ];

    const sortedToday = [...todayTasks].sort((a, b) => {
      const aDone = a.status === 'Done';
      const bDone = b.status === 'Done';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

    expect(sortedToday.map((n) => n.id)).toEqual(['t2', 't4', 't1', 't3']);
  });

  it('cleans up deleted project references from notes', () => {
    const notesWithProjects = [
      { id: 'n1', title: 'Note 1', project: 'proj-1' },
      { id: 'n2', title: 'Note 2', project: 'proj-2' },
      { id: 'n3', title: 'Note 3', project: null },
    ];

    const deletedId = 'proj-1';
    const cleaned = notesWithProjects.map((n) =>
      n.project === deletedId ? { ...n, project: null } : n
    );

    expect(cleaned[0].project).toBeNull();
    expect(cleaned[1].project).toBe('proj-2');
    expect(cleaned[2].project).toBeNull();
  });
});
