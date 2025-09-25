<h1 align="center">🎨 Comic Layout Designer</h1>
<p align="center">
  A glassmorphism-inspired PHP MVC application for arranging comic spreads, streaming live state updates, and exporting pristine PDFs or image sets.
</p>

<p align="center">
  <sub>Crafted with PHP 8 · FastRoute · Vanilla JavaScript · HTML Canvas · SQLite snapshots</sub>
</p>

---

## 🧭 Table of Contents
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
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Why you'll love it
> [!TIP]
> Whether you're storyboarding a zine or shipping episodic comics, the workspace keeps your flow state front-and-center. Upload assets, drag them into responsive layouts, lock pages between revisions, and export in a single sitting.

- **Clarity-first UI** – A responsive two-column layout separates the asset library from the canvas, adapting from mobile to ultra-wide without ever clipping panels.
- **Live collaboration vibe** – Server-Sent Events keep every open tab in sync with the canonical `state.json`, so collaborators instantly see page updates.
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
        StateJson[public/storage/state.json]
        Snapshots[ZIP Snapshots]
        Layouts[layouts/*.php]
    end

    UI -->|Fetch layouts & state| Router --> Controllers --> Model
    SSE -->|Listen| Controllers
    Uploads -->|POST /upload| Router
    Controllers -->|Render| Views --> UI
    Model --> UploadDir
    Model --> StateJson
    Model <--> Snapshots
    Model --> Layouts
    Exports -->|Canvas capture| UI
```

---

## 🗺️ Feature tour
| Domain | Highlights |
| --- | --- |
| **Asset library** | Multi-file uploads with drag-and-drop, inline deletion, touch-friendly modal on small screens. |
| **Storyboard workspace** | Dynamic layout selector, gutter color picker, page locking (green **U**/**L** toggle), autosave banner, keyboard shortcut helper. |
| **Real-time sync** | Browser EventSource streams push notifications whenever `state.json` changes on disk, so multiple sessions stay mirrored. |
| **State management** | Reset the world in one click, or save/load ZIP archives (`state.db` + uploads) to branch, share, or roll back progress. |
| **Exports** | Generate high-resolution PDFs or per-page PNGs. Export dimensions respect the live panel transforms and preserve the 1:1.545 aspect ratio. |
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
│   └── storage           # state.json and generated exports live here
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

Then visit **http://localhost:8000** and start crafting spreads. Uploaded files land in `public/uploads/`, and generated exports appear in `public/storage/generated/`.

---

## 🔄 Daily workflow
1. **Upload assets** via drag-and-drop or the file picker. The library will show thumbnails instantly.
2. **Compose pages** by selecting a layout, dragging assets into panels, tweaking gutter colors, and zooming imagery with the scroll wheel.
3. **Lock spreads** once they look right using the **U/L** toggle to avoid accidental edits.
4. **Autosave** keeps progress persistent by streaming every change to `public/storage/state.json` and broadcasting updates via SSE.
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

Add your own by creating matching `.php` and `.css` files inside `layouts/`; `App\Models\ComicModel` will auto-discover and expose them to the UI.

---

## 🧠 State, sync, and persistence
- **Single source of truth** – `public/storage/state.json` mirrors the current layout, locked status, gutter settings, and image assignments.
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

All tests exit with status code `0` on success and emit a descriptive message on failure.

> [!NOTE]
> Tests create temporary files inside your system temp directory and will clean them up when finished.

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
