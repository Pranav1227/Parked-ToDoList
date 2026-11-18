export const CATEGORIES = [
  'Idea',
  'Pending Work',
  'Bug',
  'Integration',
  'Personal',
];

export const CATEGORY_COLORS = {
  Idea: {
    light: '#FFF1A8',
    dark: '#F5E795', // slightly reduced saturation paper on dark desk
    border: '#E8D988',
    label: 'Idea',
  },
  'Pending Work': {
    light: '#FFD9B8',
    dark: '#F3CCA8',
    border: '#E8C09B',
    label: 'Pending Work',
  },
  Bug: {
    light: '#F7C5C5',
    dark: '#EDB8B8',
    border: '#E2A9A9',
    label: 'Bug',
  },
  Integration: {
    light: '#CDE7F0',
    dark: '#BDDCE6',
    border: '#AECDD7',
    label: 'Integration',
  },
  Personal: {
    light: '#D6EBCB',
    dark: '#C8DEBE',
    border: '#B6D1AA',
    label: 'Personal',
  },
};

export const PRIORITIES = ['High', 'Medium', 'Low'];

export const PRIORITY_CONFIG = {
  High: {
    label: 'High',
    color: '#C2410C',
    bgColor: 'rgba(194, 65, 12, 0.12)',
    borderColor: 'rgba(194, 65, 12, 0.28)',
  },
  Medium: {
    label: 'Medium',
    color: '#C58A1B',
    bgColor: 'rgba(197, 138, 27, 0.12)',
    borderColor: 'rgba(197, 138, 27, 0.28)',
  },
  Low: {
    label: 'Low',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.12)',
    borderColor: 'rgba(107, 114, 128, 0.28)',
  },
};

export const STATUSES = ['Pending', 'In Progress', 'Done'];

// 8 fixed muted neutral project dot colors working across light and dark themes
export const PROJECT_COLORS = [
  { id: 'stone', label: 'Stone', dot: '#78716C' },
  { id: 'slate', label: 'Slate', dot: '#64748B' },
  { id: 'steel', label: 'Steel', dot: '#5E81AC' },
  { id: 'pine', label: 'Pine', dot: '#4D7C5F' },
  { id: 'ochre', label: 'Ochre', dot: '#B8860B' },
  { id: 'rust', label: 'Rust', dot: '#B25E46' },
  { id: 'plum', label: 'Plum', dot: '#8D6A8E' },
  { id: 'teal', label: 'Teal', dot: '#40807A' },
];

export const DEFAULT_PROJECTS = [
  { id: 'proj-core', name: 'Core Engine', colorIndex: 2 },
  { id: 'proj-web', name: 'Web Client', colorIndex: 7 },
  { id: 'proj-infra', name: 'DevOps & Tooling', colorIndex: 1 },
];

// Deterministic rotation between -1.4deg and +1.4deg fixed per note id
export function getNoteRotation(id) {
  let hash = 0;
  const str = String(id || 'default');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const rem = (Math.abs(hash) % 270) / 100 - 1.35;
  return Number(rem.toFixed(2));
}

// Initial seed notes for new users (with project and context on 3 of the notes)
const _now = new Date();
const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

export const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'Explore optimistic UI for sticky note drag-and-drop',
    details: 'Test HTML5 dataTransfer and drop indicator line for smooth reordering without stutter.',
    category: 'Idea',
    priority: 'High',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    order: 0,
    project: 'proj-core',
    context: {
      text: 'Spike while testing touch events in mobile preview',
      link: 'https://github.com/facebook/react/issues',
    },
    doToday: true,
    doTodayDate: todayStr,
    remindAt: null,
    reminderFired: false,
  },
  {
    id: 'note-2',
    title: 'Wire up Document Picture-in-Picture mini mode',
    details: 'Keep High priority pending items visible over VS Code while coding.',
    category: 'Integration',
    priority: 'High',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    dueDate: '',
    order: 1,
    project: 'proj-web',
    context: {
      text: 'Pairing session on desktop sticky notes layout',
      link: 'feat/pip-sticky',
    },
    doToday: true,
    doTodayDate: todayStr,
    remindAt: null,
    reminderFired: false,
  },
  {
    id: 'note-3',
    title: 'Review auth callback token refresh edge case',
    details: 'When user leaves tab idle for > 1hr, silent refresh should not trigger full page redirect.',
    category: 'Pending Work',
    priority: 'Medium',
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    order: 2,
    project: 'proj-infra',
    context: {
      text: 'Reported during staging soak test',
      link: 'https://linear.app',
    },
    doToday: false,
    doTodayDate: null,
    remindAt: null,
    reminderFired: false,
  },
  {
    id: 'note-4',
    title: 'Fix Safari border-radius clipping during lift animation',
    details: 'Add will-change: transform and -webkit-backface-visibility: hidden.',
    category: 'Bug',
    priority: 'Medium',
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: '',
    order: 3,
    project: null,
    context: null,
    doToday: false,
    doTodayDate: null,
    remindAt: null,
    reminderFired: false,
  },
  {
    id: 'note-5',
    title: 'Pick up specialty pour-over coffee beans',
    details: 'Ethiopian Yirgacheffe medium roast from the local roastery.',
    category: 'Personal',
    priority: 'Low',
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    dueDate: '',
    order: 4,
    project: null,
    context: null,
    doToday: false,
    doTodayDate: null,
    remindAt: null,
    reminderFired: false,
  },
  {
    id: 'note-6',
    title: 'Clean desk wire management',
    details: 'Bundled monitor cords and mounted power strip underneath desk.',
    category: 'Personal',
    priority: 'Low',
    status: 'Done',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    dueDate: '',
    order: 5,
    project: null,
    context: null,
    doToday: false,
    doTodayDate: null,
    remindAt: null,
    reminderFired: false,
  },
];
