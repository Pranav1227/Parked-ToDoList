# Parked 📌

A calm, personal quick-capture to-do app with a realistic sticky note desk feel. Built with React 18, Vite, and plain CSS variables. Zero login, zero backend, zero external API calls. Everything persists privately in your browser's `localStorage`.

---

## Highlights & Features

- **⚡ Sub-5-Second Quick Add**: Always-visible top capture bar. Press <kbd>Enter</kbd> to save. Press <kbd>Ctrl+K</kbd> or <kbd>/</kbd> from anywhere to focus it immediately.
- **📌 Realistic Sticky Note Feel**:
  - Soft paper tones mapped to category: **Idea** (`#FFF1A8`), **Pending Work** (`#FFD9B8`), **Bug** (`#F7C5C5`), **Integration** (`#CDE7F0`), and **Personal** (`#D6EBCB`).
  - Dark text (`#2B2B2B`) on paper notes. In dark theme, saturation is softly adjusted (~90%) so notes look like real paper on an executive dark desk.
  - Subtle paper drop shadow, adhesive top tape, and a **deterministic fixed rotation** between `-1.4°` and `+1.4°` per note (so notes never wobble on re-renders).
  - Lifts slightly on hover (`translateY(-4px)`).
  - Hand-written title touch with the **Caveat** font, while all metadata and details remain in legible, crisp **Inter**.
- **📌 Pin Mini Mode (Document Picture-in-Picture)**:
  - Click the **Pin** button in the header to launch an always-on-top floating window using the native browser Document Picture-in-Picture API.
  - Shows only the Quick Add bar and your High-priority pending items.
  - Floats neatly over VS Code, terminal, or any app. Automatically hidden on browsers that don't support Document PiP.
- **🔄 Two Views**:
  - **Sticky Wall**: Responsive CSS Grid (`auto-fill`, min 260px, 24px gap) with native HTML5 drag-and-drop reordering.
  - **List View**: Compact, scannable table rows.
- **🏷️ Categories, Priorities & Status**:
  - Categories: *Idea, Pending Work, Bug, Integration, Personal*.
  - Priorities: *High* (`#C2410C`), *Medium* (`#C58A1B`), *Low* (`#6B7280`) with colored indicator dot and explicit text label.
  - Status: *Pending, In Progress, Done*. Completed notes gently fade and move to the bottom.
- **🔍 Filter & Search**: Instant real-time search across titles and details, plus one-click filter chips with live counts.
- **✏️ Inline / Modal Editor**: Edit note details, priority, category, status, and due date. Esc to dismiss.
- **↩️ Undo Toast**: Deleting a note gives you a 6-second undo window to restore it.
- **🌗 Dark / Light Theme**: Strict calm paper desk palette with instant toggle, saved in `localStorage`.
- **💾 Backup & Restore**: Export all notes as `parked-notes-YYYY-MM-DD.json` or import from backup.
- **📱 PWA Ready**: Web app manifest, custom icon, and service worker configured for desktop installation.

---

## Getting Started

To run the development server:

```bash
npm run dev
```

To build and preview production:

```bash
npm run build
npm run preview
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Focus Quick Add input from anywhere |
| <kbd>/</kbd> | Focus Quick Add input (when not typing in an input) |
| <kbd>Enter</kbd> | Save note immediately |
| <kbd>Esc</kbd> | Close edit dialog |
