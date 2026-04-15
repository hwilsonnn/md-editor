# TODO:

- File watching (detect external changes via fs.watch / chokidar)
- Multiple file tabs (currently single-document)
- Auto-save on timer or file switch
- Window state persistence (size/position across restarts)
- Light mode + dark mode toggle
- Add tests
- Support more code languages in backticks
- How to paste images
- Migrate from react-prism-editor to the JS library
- Upgrade to React 19

# Done

- Add file title, this can get pulled into the browser tab name
- Convert to Electron desktop app
- Directory mode: open, browse, edit, save markdown files in-place
- Scratch-pad mode: memory-only editing with Save As
- File picker modal with recursive directory tree
- New file creation within opened directory
- Recent directories via electron-store
- Path traversal security protection
- Native application menu (File, Edit, View)
- Dynamic window title with unsaved indicator
- CSP & security hardening (contextIsolation, no nodeIntegration)
