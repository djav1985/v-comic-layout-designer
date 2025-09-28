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
| **Storyboard workspace** | Dynamic layout selector, gutter color picker, page locking (green **U**/**L** toggle), autosave banner, keyboard shortcut helper. |
| **Real-time sync** | Browser EventSource streams push notifications whenever the SQLite `state.db` changes on disk, so multiple sessions stay mirrored. |
| **State management** | Reset the world in one click, or save/load ZIP archives (`state.db` + uploads) to branch, share, or roll back progress. |
| **Exports** | Generate high-resolution PDFs or per-page PNGs. Export dimensions respect the live panel transforms, preserve the 1:1.545 aspect ratio, and now work offline thanks to a bundled jsPDF build. |
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
│   ├── server-router.php # PHP built-in server router that preserves static asset handling
│   └── storage           # state.db and snapshot archives live here
├── tests                 # Lightweight smoke tests for models, layouts, and SSE helpers
├── composer.json         # Autoload + dependency metadata (PHP ≥ 8.0, FastRoute)
└── README.md             # You are here ✨
```

---

## 🚀 Getting started

### Prerequisites
- PHP **8.0+** with the `zip`, `pdo_sqlite`, and `sqlite3` extensions enabled
- Composer  
- Modern browser (Chrome, Firefox, Safari, Edge)

### Windows Desktop App
For Windows users, a complete Electron desktop application is available with embedded PHP server - no manual PHP installation required!

**Download from GitHub Releases:**
1. Go to [Releases](../../releases)
2. Download the latest `v-comic-layout-designer-Setup-{version}.exe` 
3. Run the installer (no admin rights required)
4. Launch and start creating!

**Build from source:**
```bash
npm install
npm run dist  # Creates Windows installer in dist/
```

See [WINDOWS_COMPATIBILITY.md](WINDOWS_COMPATIBILITY.md) for detailed Windows-specific information.

### Web Application Setup

### Install dependencies
```bash
composer install
```

### Serve the application
```bash
php -S localhost:8000 -t public public/server-router.php
```

Then visit **http://localhost:8000** and start crafting spreads. Uploaded files land in `public/uploads/`, and exports download straight to your browser.

### Desktop (Electron) experience
To work entirely offline or provide a native-like experience, the project now ships with an Electron shell that boots an embedded PHP development server.

#### Extra prerequisites
- Node.js 20+ and npm
- PHP 8.0+ available on your PATH when running in development mode (with the same `zip`, `pdo_sqlite`, and `sqlite3` extensions enabled)

#### Run the desktop shell locally
```bash
npm install
composer install
npm run electron:dev
```
This starts the PHP development server on a random open port, pointing it at the custom `server-router.php` so bundled assets are still served by PHP's static file handler, and automatically loads it inside an Electron browser window.

> [!IMPORTANT]
> When the Electron shell launches it now performs a preflight check that the embedded (or system) PHP runtime exposes the `zip`, `pdo_sqlite`, and `sqlite3` extensions. If any are missing the app aborts before opening a browser window and displays a dialog listing the absent modules so the issue can be fixed without a mysterious blank screen.

#### Build a Windows installer locally
```bash
npm run dist
```
The build process expects a PHP runtime in `resources/php`. During CI this directory is populated automatically; for manual builds download the [official PHP non-thread-safe build for Windows](https://windows.php.net/download) and extract it into `resources/php` so that `php.exe` and its DLLs sit directly inside that folder. Electron Builder now copies this directory straight into `resources/php` inside the packaged app (dropping the previous redundant `resources/resources/php` nesting), so the runtime lands exactly where the launcher searches for it.

To keep that runtime consistent across platforms the repository now tracks a `resources/php/php.ini` file that explicitly enables the `zip`, `pdo_sqlite`, and `sqlite3` extensions. Bundled builds ship with those modules active so the desktop app can create ZIP archives and persist state in SQLite without additional manual tweaks.

> [!NOTE]
> The installer now targets per-user installs by default, so Windows writes to `%LOCALAPPDATA%\Programs\V Comic Layout Designer` without requesting elevation. Advanced users can still opt into a different path during setup.

> [!IMPORTANT]
> Packaged desktop builds now route all requests through `public/server-router.php`, so URLs like `/upload` and `/pages/stream` resolve just as they do in development while static assets continue to stream from PHP's built-in server handler.

Packaged builds on every platform now resolve the embedded PHP binary from `resources/php/<platform executable>`, matching the layout emitted by `electron-builder`'s `extraResources` copy step. If the file is missing the app will prompt the user to reinstall or restore the bundled runtime.

### Automated desktop releases
A workflow named **Build Electron Release** lives at `.github/workflows/build-electron.yml`. Trigger it manually from GitHub with the desired semantic version (for example `1.2.0` or `v1.2.0`) to:
1. Install PHP and Node dependencies
2. Download the PHP runtime and bundle it with the Electron app
3. Generate a signed Windows installer via `electron-builder`
4. Upload the installer as a workflow artifact and publish it as a GitHub Release


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

All tests exit with status code `0` on success and emit a descriptive message on failure.

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
| **Electron dev console shows missing CommonJS modules** | The main process now pulls `get-port` and `wait-on` via dynamic `import()` calls; upgrade to Electron 28+ or Node 18+ so async imports are supported in the runtime. |
| **PHP server dies with `TypeError: getPort.makeRange is not a function`** | The Electron shell now uses the `portNumbers()` helper exposed by `get-port@7`. Pull the latest code and reinstall dependencies so the range generator resolves correctly. |
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
