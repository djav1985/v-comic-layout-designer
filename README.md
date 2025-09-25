# Comic Layout Designer

A modern MVC PHP application for crafting comic spreads. Upload artwork, drag it into responsive layout templates, and export the finished pages as high-resolution PDFs or images.

## Features

- **Curated asset library** – Upload multiple images at once and manage them with quick delete actions.
- **Storyboard workspace** – Drag panels into dynamic templates, adjust gutter colors, and fine-tune each panel's zoom and position.
- **Speech bubbles** – Drop resizable dialogue bubbles onto any page, choose between classic, thought, or burst outlines, drag the tail to point at a character, and edit the copy in-place with smart padding.
- **Live autosave** – Progress is preserved automatically, with inline feedback to confirm every change.
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

## Speech bubble overlays

Each page now includes a bubble toolbar directly above the live canvas. Pick one of three styles—Classic, Thought, or Burst—and click **Add bubble** to drop it onto the layout. Every bubble now ships with:

- a drag handle to reposition the bubble anywhere on the page without disturbing your panels
- a corner resize grip so you can scale the callout while the text automatically reflows inside padded margins
- a movable tail handle to aim the pointer toward a character or point of interest
- inline text editing with live autosave so your dialogue stays in sync with the rest of the project

Every style uses bold comic outlines, hand-lettering friendly fonts, and tails that keep their silhouette even while you resize or rotate them, so the overlays feel native to the artwork instead of floating UI widgets.

You can swap styles at any time from the select menu in the bubble header or remove a bubble entirely with the close button. All bubble settings—including tail location, text, and size—are stored with the page and restored on reload or export.

## Modernized interface

The refreshed UI introduces a glassmorphism-inspired surface layered over a deep gradient backdrop. Responsive cards separate the asset library from the workspace, while updated typography and spacing improve readability across screen sizes. Buttons and controls now share a consistent accent color palette, and empty states provide clear guidance for first-time users.

The latest pass sets the application shell to a centered 90% width and now adapts the workspace grid to one page per row under 1024px, two pages through 1980px, and three pages on ultra-wide displays so the live canvas stays balanced without disrupting panel alignment at any size. The asset library column also gained a little extra width so upload controls and thumbnails have more breathing room alongside the builder.

## Notes

* Exported PDFs and PNGs now reliably keep the diagonal panel edges found in the angled layouts. The exporter reads the layout-specific CSS rules to cache each panel's clip-path (including vendor-prefixed values) and reapplies the geometry after html2canvas renders the page so the gutters stay crisp in the output files.
* PDF exports respect the natural aspect ratio of each canvas when placing two pages per sheet, preventing the subtle horizontal squeeze that previously appeared in the generated documents.
* Workspace page previews once again adhere to the original 5.5" × 8.5" canvas ratio so panels fill the vertical space and no longer clip along the outer edges in live view or exported assets.
