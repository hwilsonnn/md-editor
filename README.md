# Markdown Editor (Electron Desktop App)

A desktop markdown editor built with Electron, React, and Vite. Supports two modes of operation:

- **Directory mode**: Open a folder to browse, edit, and save markdown files in-place
- **Scratch-pad mode**: Quick editing with no directory — save via native Save As dialog

## Features

- Open a directory to browse `.md`, `.txt`, `.markdown` files via a modal file picker
- Create and delete files within the opened directory
- Save files in-place (`Ctrl+S`) in directory mode, or via Save As in scratch-pad mode
- Recent directories remembered across restarts
- Drag-and-drop files to load them into the editor
- Toggle between edit and preview modes (`Esc` to preview, click to edit)
- Generate table of contents in preview mode
- Word count display
- Dynamic window title with unsaved changes indicator (●)
- Native application menu with keyboard shortcuts

## Keyboard Shortcuts

| Shortcut       | Action                                               |
| -------------- | ---------------------------------------------------- |
| `Ctrl+S`       | Save (in-place if directory mode, Save As otherwise) |
| `Ctrl+Shift+S` | Save As                                              |
| `Ctrl+O`       | Open Directory                                       |
| `Ctrl+N`       | New File (in directory mode)                         |
| `Esc`          | Switch to preview mode                               |

## Development

```bash
npm install
npm run dev
```

## Build & Package

```bash
npm run build
npm run package
```

This produces platform-specific installers via `electron-builder` (Windows NSIS, macOS dmg, Linux AppImage).
