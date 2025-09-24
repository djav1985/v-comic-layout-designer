# Comic Layout Designer

An Electron desktop application for arranging comic page layouts with drag-and-drop image placement, zoom/position controls, and one-click export to PDF or PNG images.

## Features

- Import images directly from your computer and reuse them across pages.
- Choose from predefined layout templates stored in the `layouts/` directory (HTML snippet + CSS pair).
- Drag images into panels, zoom with the scroll wheel, and reposition with click-and-drag.
- Automatic persistence of page layouts, transforms, and gutter colors.
- Export the current project to a landscape PDF (two pages per sheet) or individual PNG images without requiring an internet connection.
- Keyboard shortcuts: `Ctrl+S` save, `Ctrl+N` new page, `Ctrl+E` export PDF, `Ctrl+I` export images, `Ctrl+D` debug layouts.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later (to run the bundled Electron version).
- npm (included with Node.js).

### Installation

```bash
npm install
```

### Run the desktop app

```bash
npm start
```

This launches the Electron shell and automatically loads the designer interface.

### Code quality tools

```bash
npm run lint    # ESLint (also used for `npm test`)
npm run format  # Prettier formatting for source files
```

## Application data

Uploaded images and layout state are stored inside your operating system's Electron user data directory (for example `~/Library/Application Support/comic-layout-designer` on macOS). Removing the application data directory resets the workspace.

## Layout templates

Layout templates live in the `layouts/` folder at the project root. Each layout is defined by a markup file (HTML fragment with a `.php` extension for historical compatibility) and an optional matching `.css` stylesheet. New layouts become available automatically on the next launch.

## Export libraries

The renderer bundles offline copies of [html2canvas](https://html2canvas.hertzen.com/) and [jsPDF](https://github.com/parallax/jsPDF) so PDF/image export works without network access.

## License

Released under the [MIT License](LICENSE).
