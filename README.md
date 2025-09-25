# Comic Layout Designer

A modern MVC PHP application for crafting comic spreads. Upload artwork, drag it into responsive layout templates, and export the finished pages as high-resolution PDFs or images.

## Features

- **Curated asset library** – Upload multiple images at once and manage them with quick delete actions.
- **Storyboard workspace** – Drag panels into dynamic templates, adjust gutter colors, and fine-tune each panel's zoom and position.
- **Live autosave** – Progress is preserved automatically, with inline feedback to confirm every change.
- **Real-time sync** – The browser listens to server-sent events so every open tab mirrors updates written to `state.json` instantly.
- **One-click exports** – Generate PDFs or high-quality image sets directly from the browser.
- **Keyboard shortcuts** – Stay in flow with quick commands for saving, creating pages, and exporting.

## Setup

1. Install dependencies:
   ```bash
   composer install
   ```
2. Start a PHP server from the `public` directory:
   ```bash
   php -S localhost:8000 -t public
   ```
3. Open `http://localhost:8000` in your browser.

Uploaded images are stored in `public/uploads/`. Generated exports live in `public/storage/generated/`.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl` + `S` | Save the current project |
| `Ctrl` + `N` | Add a new page |
| `Ctrl` + `E` | Export as PDF |
| `Ctrl` + `I` | Export as PNG images |
| Mouse scroll | Zoom in/out on a placed image |

## Modernized interface

The refreshed UI introduces a glassmorphism-inspired surface layered over a deep gradient backdrop. Responsive cards separate the asset library from the workspace, while updated typography and spacing improve readability across screen sizes. Buttons and controls now share a consistent accent color palette, and empty states provide clear guidance for first-time users.

The latest pass sets the application shell to a centered 90% width and now adapts the workspace grid to one page per row under 1024px, two pages through 1980px, and three pages on ultra-wide displays so the live canvas stays balanced without disrupting panel alignment at any size.

## Notes

* Exported PDFs and PNGs now reliably keep the diagonal panel edges found in the angled layouts. The exporter reads the layout-specific CSS rules to cache each panel's clip-path (including vendor-prefixed values) and reapplies the geometry after html2canvas renders the page so the gutters stay crisp in the output files.
* PDF exports respect the natural aspect ratio of each captured canvas when placing two pages per sheet, preventing the subtle horizontal squeeze and the top-and-bottom letterboxing that previously appeared in the generated documents.
* Workspace page previews are locked to a 1:1.545 aspect ratio that mirrors a single page column while rendering flush to the canvas frame, eliminating the rounded border padding and keeping the live view aligned with exported spreads.
* Saved layouts are loaded exclusively from `public/storage/state.json` at start-up, ensuring the browser always reflects the latest persisted state.
* Server-Sent Events keep the UI and `state.json` in lockstep, propagating saves from any client to every other open session without additional polling.
* Shared PDF page constants prevent duplicate variable declarations, silencing the `pageWidth` console error during exports.
* Layout, gutter, and removal controls now share a single, aligned row with matched sizing so page actions remain balanced and easy to target.
* Drag-and-dropped artwork now immediately sheds the square thumbnail styling, letting panels render at full size without a manual refresh.
