<h1 align="center">🎨 Comic Layout Designer</h1>
<p align="center">
  A glassmorphism-inspired PHP MVC application for arranging comic spreads, streaming live state updates, and exporting pristine PDFs or image sets.
</p>

<p align="center">
  <sub>Crafted with PHP 8 · FastRoute · Vanilla JavaScript · HTML Canvas · SQLite snapshots</sub>
</p>

---

## 🧭 Table of Contents
- [Screenshots](#-screenshots)
- [Why you'll love it](#-why-youll-love-it)
- [System architecture at a glance](#-system-architecture-at-a-glance)
- [Feature tour](#-feature-tour)
- [Project structure](#-project-structure)
- [Getting started](#-getting-started)
- [Daily workflow](#-daily-workflow)
- [Layout template catalog](#-layout-template-catalog)
- [State, sync, and persistence](#-state-sync-and-persistence)
- [Keyboard shortcuts](#-keyboard-shortcuts)
- [Testing and quality gates](#-testing-and-quality-gates)
- [Frontend architecture](#-frontend-architecture)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🖼️ Screenshots
<p align="center">
  <img src="./493917672-f7d427ae-2b7f-4567-b76a-79c3b0f23918.png" alt="Screenshot of the Comic Layout Designer workspace with the asset library and canvas" width="45%" style="max-width: 360px; margin: 0 12px;" />
  <img src="./493918302-bf04f69c-b59c-4835-9d19-cf09ff196bd0.png" alt="Screenshot showing the export modal and PDF preview controls" width="45%" style="max-width: 360px; margin: 0 12px;" />
</p>

These captures showcase the glassmorphism workspace, responsive asset library, and export tooling you will see after following the setup steps below.

---

## ✨ Why you'll love it
> [!TIP]
> Whether you're storyboarding a zine or shipping episodic comics, the workspace keeps your flow state front-and-center. Upload assets, drag them into responsive layouts, lock pages between revisions, and export in a single sitting.

- **Clarity-first UI** – A responsive two-column layout separates the asset library from the canvas, adapting from mobile to ultra-wide without ever clipping panels.
- **Live collaboration vibe** – Server-Sent Events keep every open tab in sync with the canonical `state.db` SQLite store, so collaborators instantly see page updates.
- **Export confidence** – One-click PDF and PNG exports mirror the in-browser transform math to avoid misaligned gutters or ghosted panels.
- **Snapshot safety** – Download or restore ZIP archives that bundle the SQLite state database alongside uploaded artwork for frictionless versioning.

---

## 🧱 System architecture at a glance
```mermaid
flowchart LR
    subgraph Browser
        UI[Workspace UI]
        SSE[EventSource]
        Uploads[Drag & Drop Uploads]
        Exports[PDF / PNG Export]
    end

    subgraph PHP MVC
        Router(FastRoute Router)
        Controllers
        Model[ComicModel]
        Views[Blade-free View]
    end

    subgraph Storage
        UploadDir[public/uploads]
        StateDb[public/storage/state.db]
        Snapshots[ZIP Snapshots]
        Layouts[layouts/*.php]
    end

    UI -->|Fetch layouts & state| Router --> Controllers --> Model
    SSE -->|Listen| Controllers
    Uploads -->|POST /upload| Router
    Controllers -->|Render| Views --> UI
    Model --> UploadDir
    Model --> StateDb
    Model <--> Snapshots
    Model --> Layouts
    Exports -->|Canvas capture| UI
```

---

## 🗺️ Feature tour
| Domain | Highlights |
| --- | --- |
| **Asset library** | Multi-file uploads with drag-and-drop, inline deletion, touch-friendly modal on small screens. |
| **Storyboard workspace** | Dynamic layout selector, gutter color picker, page locking (green **U**/**L** toggle), autosave banner, keyboard shortcut helper. Stored transforms are normalized to panel percentages so resizing the canvas never drifts artwork placements. |
| **Real-time sync** | Browser EventSource streams push notifications whenever the SQLite `state.db` changes on disk, so multiple sessions stay mirrored. |
| **State management** | Reset the world in one click, or save/load ZIP archives (`state.db` + uploads) to branch, share, or roll back progress. |
| **Exports** | Generate high-resolution PDFs or per-page PNGs. Exports are rendered at a canonical 900×1391 layout resolution so panel math stays consistent across viewports while preserving the 1:1.545 aspect ratio. |
| **Mobile experience** | A docked **Images** pill reveals the full-screen library, double-tap panels to place art without precision dragging. |

---

## 🗂️ Project structure
```
├── app
│   ├── Controllers       # HTTP endpoints (upload, state, streaming, pages)
│   ├── Core              # FastRoute bootstrap & lightweight database helper
│   ├── Models            # ComicModel orchestrates layouts, state, and storage
│   └── Views             # Server-rendered entry point (no templating engine)
├── layouts               # PHP + CSS pairs for every panel grid combination
├── public
│   ├── css / js          # Styled workspace shell and vanilla JS interactions
│   ├── index.php         # Front controller that boots the router
│   └── storage           # state.db and snapshot archives live here
├── tests                 # Lightweight smoke tests for models, layouts, and SSE helpers
├── composer.json         # Autoload + dependency metadata (PHP ≥ 8.0, FastRoute)
└── README.md             # You are here ✨
```

---

## 🚀 Getting started
### Prerequisites
- PHP **8.0+** with SQLite extension enabled
- Composer
- Modern browser (Chrome, Firefox, Safari, Edge)

### Install dependencies
```bash
composer install
```

### Serve the application
```bash
php -S localhost:8000 -t public
```

Then visit **http://localhost:8000** and start crafting spreads. Uploaded files land in `public/uploads/`, and exports download straight to your browser.

---

## 🔄 Daily workflow
1. **Upload assets** via drag-and-drop or the file picker. The library will show thumbnails instantly.
2. **Compose pages** by selecting a layout, dragging assets into panels, tweaking gutter colors, and zooming imagery with the scroll wheel.
3. **Lock spreads** once they look right using the **U/L** toggle to avoid accidental edits.
4. **Autosave** keeps progress persistent by streaming every change into `public/storage/state.db` and broadcasting updates via SSE.
5. **Snapshot** progress with **Save State** (download ZIP) or roll back with **Load State** (upload ZIP). Each archive bundles the SQLite database plus any referenced uploads.
6. **Export** to PDF or PNG when you're ready to share; the high-resolution canvas ensures print-ready fidelity without aspect ratio drift.

> [!IMPORTANT]
> Resetting the workspace clears both the SQLite state and any uploaded files. Use Save State before resetting if you want a restore point.

---

## 🧩 Layout template catalog
Every layout pairs a PHP template with a dedicated CSS grid definition. Templates pre-render server-side so the browser receives ready-to-style HTML without needing client-side templating.

Available templates include:
- `cover`
- `one-horizontal-top-two-vertical-bottom`
- `one-horizontal-top-three-vertical-bottom`
- `one-vertical-left-two-horizontal-right`
- `two-horizontal`
- `two-horizontal-left-one-vertical-right`
- `two-vertical-top-one-horizontal-bottom`
- `three-horizontal`
- `three-vertical`
- `four-grid`
- `wide-top-portrait-left-two-square-right` – Cinematic banner clamped around 16:9, a guttered portrait column, and stacked beats that size themselves to the remaining space.

Add your own by creating matching `.php` and `.css` files inside `layouts/`; `App\Models\ComicModel` will auto-discover and expose them to the UI.

---

## 🧠 State, sync, and persistence
- **Single source of truth** – `public/storage/state.db` mirrors the current layout, locked status, gutter settings, and image assignments.
- **Server-Sent Events** – `PageController::stream()` releases the PHP session lock before long-polling to ensure refreshes never stall behind an open stream.
- **Database imports** – Uploading a ZIP snapshot restores `state.db` and all referenced artwork, guaranteeing a perfect recreation of past sessions.
- **Filesystem hygiene** – Reset operations purge orphaned uploads to keep disk usage predictable.

---

## ⌨️ Keyboard shortcuts
| Shortcut | Action |
| --- | --- |
| `Ctrl` + `S` | Save the current project |
| `Ctrl` + `N` | Add a new page |
| `Ctrl` + `E` | Export as PDF |
| `Ctrl` + `I` | Export as PNG images |
| Mouse scroll | Zoom in/out on a placed image |

Need a refresher mid-session? Toggle **Show Shortcuts** in the workspace toolbar to reveal an animated cheatsheet.

---

## ✅ Testing and quality gates
The repository includes lightweight guardrail scripts that can be executed directly with PHP:

```bash
# Validate rendered layout templates
php tests/LayoutTemplateTest.php

# Confirm ComicModel generates HTML for every layout
php tests/ComicModelTemplateRenderingTest.php

# Exercise state reset + archive import helpers
php tests/StateManagementTest.php
php tests/ImportStateFromDatabaseTest.php

# Ensure session locks release before SSE streaming
php tests/SessionLockTest.php
```

### Node.js Development Tools
For development convenience, a Node.js test runner is available:

```bash
# Install Node.js dependencies
npm install

# Run all PHP tests through Node.js test runner
npm test
# or
node run-tests.js
```

The Node.js test runner properly handles PHP process stdout and stderr streams, converting buffer data to strings before trimming whitespace.

All tests exit with status code `0` on success and emit a descriptive message on failure.

### Release automation
Manual Windows builds of the Electron shell can be produced directly from GitHub using the **Build Electron Release** workflow:

1. Navigate to **Actions → Build Electron Release**.
2. Trigger **Run workflow** on the `dev` branch and supply the semantic version (for example, `1.2.0`).
3. Wait for the workflow to finish building the installer, uploading the artifact, and publishing a draft release tagged with the provided version.

The workflow installs PHP and Node.js dependencies, runs the Electron packager via `npm run dist`, bundles a PHP runtime into `resources/php`, and attaches the generated installer to the GitHub release so QA can validate it before promotion.

---

## 🧱 Frontend architecture

The browser code is organized as ES modules so individual concerns can evolve without navigating a 1,700-line script:

- `public/js/image-library.js` handles the asset gallery, uploads, and selection state.
- `public/js/pages.js` owns layout rendering, persistence, state streaming, and shared constants.
- `public/js/exporters.js` focuses on PDF/PNG export routines and keyboard shortcuts.
- `public/js/save-indicator.js` and `public/js/state.js` keep UI feedback and shared flags centralized.
- `public/js/app.js` wires the modules together on `DOMContentLoaded`.

When contributing frontend features, choose the module that matches the responsibility above or create a new one for any major concern rather than expanding `app.js` again.

---

## 🛠️ Troubleshooting
| Symptom | Fix |
| --- | --- |
| **Uploads fail silently** | Confirm `public/uploads/` is writable by your PHP process. |
| **Event stream never resolves** | Ensure your PHP installation supports `stream_select` and that `PageController::stream()` is reachable over HTTP/1.1. |
| **Exports look misaligned** | Clear the workspace state, then verify each layout CSS file still includes matching `.panel` and `.panel-inner` wrappers. |
| **Importing a snapshot throws an error** | The ZIP must include both `state.db` and the `uploads/` directory. Run `php tests/ImportStateFromDatabaseTest.php` locally to sanity-check the importer. |

---

## 🤝 Contributing
1. Fork the repository and create a feature branch.
2. Run the PHP smoke tests before opening a pull request.
3. Attach screenshots or GIFs for UI changes to highlight the updated experience.
4. Keep documentation (including this README) in sync with new features or workflows.

---

## 📄 License
Licensed under the [MIT License](LICENSE). Create, remix, and publish your stories with confidence.

---

<p align="center"><sub>“Great layouts are invisible—your story is the star.”</sub></p>
