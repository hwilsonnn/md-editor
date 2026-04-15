## Plan: Convert md-editor to Electron Desktop App

Convert the Vite + React markdown editor into an Electron desktop app with local filesystem integration. Users can open a directory to browse, edit, and save markdown files in-place — or continue using scratch-pad mode. **Web deployment is dropped** (Electron-only). Files are presented via a modal/dialog picker with a recursive directory tree.

---

### Decisions

- **Electron-only** — GitHub Pages deployment removed. No dual-target build.
- **Dual mode**: Scratch-pad (current behavior, no directory) and Directory mode (open a folder, browse/edit/save files in-place).
- **Scratch-pad is memory-only** — no persistence across restarts. IndexedDB `Notes` store is removed.
- **Modal file picker** with recursive tree view (not a persistent sidebar).
- **New file creation** supported within the opened directory.
- **Preferences via `electron-store`** — recent directories stored in main process using `electron-store`. IndexedDB removed entirely (`db.ts` deleted).
- **Tooling**: `electron-vite` (purpose-built for Vite + Electron, minimal config, good HMR).
- **File type filter**: Directory tree shows `.md`/`.txt`/`.markdown` only. Drag-and-drop retains the current broader filter (JSON, XML, CSV, HTML) for scratch-pad mode convenience, but in directory mode drag-and-drop is limited to the same markdown types.
- **External file drag-and-drop**: If a file is dragged from outside the opened directory, it opens in scratch-pad mode (no `currentFilePath` set). The opened directory remains unchanged.
- **Window state persistence**: Deferred. `electron-store` will only store recent directories for now. Window size/position persistence can be added later.

---

### Phase 1: Electron Scaffold & Build Setup

1. **Install dependencies** — Add `electron`, `electron-vite`, `electron-builder`, `electron-store`. Remove `gh-pages`.
2. **Create `electron/main.ts`** — Main process: `BrowserWindow` creation, loads Vite dev server or built `index.html`, registers IPC handlers, handles `app.on('before-quit')` for unsaved changes, reads `process.argv` for CLI directory argument, creates native menus.
3. **Create `electron/preload.ts`** — `contextBridge.exposeInMainWorld('electronAPI', {...})` exposing: `openDirectory`, `listFiles`, `readFile`, `saveFile`, `saveFileAs`, `createFile`, `deleteFile`, `getRecentDirectories`, `addRecentDirectory`, `removeRecentDirectory`, `onMenuAction`.
4. **Create `src/electron.d.ts`** — TypeScript declarations for `window.electronAPI`.
5. **Create `electron.vite.config.ts`** — New `electron-vite` config file with main/preload/renderer build targets. Set renderer `base` to `"./"`. **Delete old `vite.config.ts`**.
6. **Update `package.json`** — Add `"main": "out/main/index.js"`. Scripts: `dev` → `electron-vite dev`, `build` → `electron-vite build`, add `package` → `electron-builder`. Remove `predeploy`, `deploy`, `preview`, `homepage`.
7. **Update `index.html`** — Adjust script paths if needed for `electron-vite` conventions.
8. **Update `.gitignore`** — Add `out/`, `dist/`, `release/` for Electron build artifacts.
9. **Update `tsconfig.node.json`** — Include `electron/` directory.
10. **Update ESLint config** — Add Node.js environment for the `electron/` directory.

### Phase 2: Filesystem & Preferences IPC Handlers (Main Process)

11. **Implement filesystem IPC handlers** in `electron/main.ts` (or extracted `electron/ipc.ts`):
    - `open-directory` → `dialog.showOpenDialog({ properties: ['openDirectory'] })`
    - `list-files` → Recursive `fs.readdir`, returns tree structure `{ name, path, isDirectory, children }`, filtered to `.md`/`.txt`/`.markdown`
    - `read-file` → `fs.readFile` with path validation
    - `save-file` → `fs.writeFile` with path validation
    - `save-file-as` → `dialog.showSaveDialog` + `fs.writeFile`
    - `create-file` → Validate name, check conflicts, write empty file
    - `delete-file` → Confirmation dialog + `fs.unlink`
12. **Implement preferences IPC handlers** using `electron-store`:
    - `get-recent-dirs` → Read recent directories array from store
    - `add-recent-dir` → Prepend directory to recent list (cap at ~10), persist
    - `remove-recent-dir` → Remove entry and persist
13. **Create `electron/security.ts`** — Path traversal protection: `isPathWithin(filePath, allowedDir)` used by all file-access handlers. Scratch-pad's `save-file-as` bypasses this (user picks via native dialog).

### Phase 3: Renderer UI Changes

14. **Extend `context.ts`** — Add `openedDirectory`, `currentFilePath`, `isDirectoryMode` (derived), `isDirty` to `AppContext`.
15. **Create `src/components/FilePicker/FilePicker.tsx`** — Modal overlay with: "Open Directory" button, recent directories list (fetched via `electronAPI.getRecentDirectories()`), recursive file tree (when a directory is open), "New File" creation input. After `createFile` or `deleteFile` calls, re-fetch the file tree via `listFiles` to refresh the modal.
16. **Create `src/components/FilePicker/FileTree.tsx`** — Recursive tree component: collapsible directory nodes, clickable file nodes, visual indentation, current-file highlight.
17. **Add file picker trigger and replace Download button in `App.tsx`** — Add a folder/open button to the title bar (or footer) that opens the FilePicker modal. Replace the existing "⬇ Download" button with a "💾 Save" button that triggers the same Ctrl+S logic. In directory mode, save is instant; in scratch-pad mode, it opens a native Save As dialog.
18. **Update `App.tsx` save behavior** — Directory mode: `Ctrl+S` → `electronAPI.saveFile(currentFilePath, content)` (instant, no dialog). Scratch-pad mode: `Ctrl+S` → `electronAPI.saveFileAs(content, noteName)` (native Save dialog, replaces blob download).
19. **Update `App.tsx` file loading** — Opening a file sets `currentFilePath` and `noteName`, resets `isDirty`. Keep drag-and-drop but use Electron's `File.path` property + IPC to get real file paths. If dragged file is outside the opened directory, open it in scratch-pad mode (no `currentFilePath`).
20. **Update `App.tsx` unsaved changes** — Replace `beforeunload` with main process `before-quit` IPC. Check `isDirty` before opening a different file or quitting. Show save/discard/cancel dialog.
21. **Remove web-only code** — Remove `history.pushState()`, `homepage` field, `gh-pages` scripts.
22. **Implement "Close Directory" behavior** — Triggered from File menu. Resets `openedDirectory` and `currentFilePath` to null, prompts to save if `isDirty`, clears editor content, returns to scratch-pad mode.
23. **Update `TitleInput.tsx`** — In directory mode, derive title from `currentFilePath` (display-only). Remain editable in scratch-pad mode.
24. **Update `utils.ts`** — Remove `downloadTxtFile()`. Update `handleFileDrop()` to use Electron `File.path` + IPC. Replace `window.confirm()` with native Electron `dialog.showMessageBox()` via IPC.
25. **Delete `db.ts`** — IndexedDB no longer used. Not currently imported anywhere, so deletion is clean.
26. **Add IPC error handling** — Wrap IPC calls in the renderer with try/catch. On failure (e.g., permission denied, file deleted externally, directory inaccessible), show a non-blocking error notification or alert to the user with the error message. No complex retry logic — just surface the error.

### Phase 4: Polish & Packaging

27. **Application menu** — File → Open Directory (Ctrl+O), New File (Ctrl+N), Save (Ctrl+S), Save As (Ctrl+Shift+S), Close Directory. Edit → standard role-based items. View → Toggle Edit/Preview, DevTools (dev only).
28. **Dynamic window title** — Scratch-pad: `"Markdown Editor"`. Directory: `"{filename} - {directory} - Markdown Editor"`. Prefix `●` when `isDirty`.
29. **App icon & metadata** — Convert `markdown.svg` to `.ico`/`.png`. Configure `electron-builder` with app name, icons, build targets (Windows NSIS, macOS dmg, Linux AppImage).
30. **CSP & security hardening** — `nodeIntegration: false`, `contextIsolation: true`, Content Security Policy header/meta tag.
31. **Update `todo.md`** — Remove obsolete items (PWA integration, IndexedDB integration). Add new items for deferred features (file watching, multi-tab, auto-save, window state persistence).
32. **Update `README.md`** — Rewrite to reflect Electron app: installation instructions, new features (directory mode, scratch-pad mode), updated keyboard shortcuts, build/package instructions. Remove web-specific references.

---

### Relevant Files

**Create:**
- `electron/main.ts` — Main process, IPC handlers, menu, window management
- `electron/preload.ts` — `contextBridge` API exposure
- `electron/security.ts` — `isPathWithin()` path validation
- `electron.vite.config.ts` — electron-vite build configuration
- `src/electron.d.ts` — `window.electronAPI` type declarations
- `src/components/FilePicker/FilePicker.tsx` — Modal file picker
- `src/components/FilePicker/FilePicker.css` — File picker styles
- `src/components/FilePicker/FileTree.tsx` — Recursive tree component
- `src/components/FilePicker/index.ts` — Barrel export

**Modify:**
- `package.json` — Dependencies, scripts, `"main"` entry, builder config
- `src/context.ts` — Add directory/file/dirty state to `AppContext`
- `src/App.tsx` — Directory mode state, IPC-based save/load, file picker integration, remove `history.pushState()` / `beforeunload`, add file picker trigger button, replace Download button with Save
- `src/utils.ts` — Remove `downloadTxtFile()`, update `handleFileDrop()` for Electron `File.path`
- `src/components/TitleInput/TitleInput.tsx` — Display filepath-derived name in directory mode
- `src/main.tsx` — Verify compatibility with `electron-vite` renderer entry expectations (likely no changes needed but must be checked)
- `tsconfig.node.json` — Include `electron/` directory
- `eslint.config.js` — Node.js environment for `electron/` directory
- `.gitignore` — Add `out/`, `dist/`, `release/`
- `index.html` — Adjust script paths for `electron-vite`
- `todo.md` — Remove obsolete web items, add deferred Electron features
- `README.md` — Rewrite for Electron app (install, features, build instructions)

**Delete:**
- `vite.config.ts` — Replaced by `electron.vite.config.ts`
- `src/db.ts` — IndexedDB no longer used

---

### Verification

1. `npm run dev` → Electron window opens with HMR, editor loads in scratch-pad mode
2. Scratch-pad: type content → Ctrl+S → native Save dialog → file written
3. Click Open Directory → native folder picker → file picker modal shows recursive tree
4. Click a file → content loads → title shows filename → `isDirty` is false
5. Edit content → title shows `●` unsaved indicator → Ctrl+S → saved in-place → indicator clears
6. Create new file in picker → file created on disk → opens in editor → file tree refreshes to show new file
7. Drag `.md` file onto editor → loads content with real file path
8. Drag a file from outside the opened directory → opens in scratch-pad mode, opened directory unchanged
9. Unsaved changes + quit/switch file → confirmation dialog (save/discard/cancel)
10. Recent directories persist across app restarts (via `electron-store`)
11. IPC handlers reject path traversal attempts outside opened directory
12. `npm run build && npm run package` → installable executable, app launches correctly
13. Preview mode TOC generation still works
14. Application menu items trigger correct actions
15. Ctrl+O opens directory picker, Ctrl+N creates new file, Ctrl+Shift+S triggers Save As
16. File → Close Directory returns to scratch-pad mode, prompts save if dirty
17. IPC failure (e.g., save to read-only path) → user sees error message
18. Delete file in picker → file removed from disk → tree refreshes → editor clears if the deleted file was open

---

### Further Considerations

1. **File watching** — Watch the directory for external changes (`fs.watch` / `chokidar`). Recommendation: defer to a future iteration.
2. **Multiple file tabs** — Currently single-document. Recommendation: keep single-document for now, consider tabs later.
3. **Auto-save** — Save on timer or file switch. Recommendation: defer, keep explicit Ctrl+S.
