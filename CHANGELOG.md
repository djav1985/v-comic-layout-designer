# Changelog

## [Unreleased]
### Added
- Stream live page updates over Server-Sent Events so any open workspace reacts immediately when `state.json` is modified.
- Support drag-and-drop uploads with visual feedback in the asset library.
- Provide reset, save state, and load state controls that archive the SQLite database with uploaded images in a downloadable ZIP.
- Introduce a workspace help toggle that reveals the keyboard shortcut reference with a smooth animated transition.
- Add a lock toggle next to each page so spreads can be frozen (yellow “L”) or unlocked (green “U”) to prevent accidental image edits.

### Changed
- Split the monolithic `app.js` client script into focused ES modules for the image library, page management, exports, and shared state to simplify maintenance.
- Rebuilt the entire interface with a modern glassmorphism aesthetic, refreshed typography, and responsive layout cards to separate the asset library from the page builder.
- Widened the app shell and workspace grid to give the builder canvas more horizontal breathing room on large screens while keeping the layout responsive.
- Centered the shell at 90% width and standardized the page cards to two per row for a more intentional workspace rhythm on desktop screens.
- Updated the workspace page grid to use one column below 1024px, two columns up to 1980px, and three columns on ultra-wide displays while preserving panel alignment and aspect ratios.
- Locked the layout preview container to a 1:1.545 aspect ratio that matches a single page column and removed its rounded border so spreads sit flush without white bands.
- Streamlined the page toolbar so the layout selector, gutter picker, and removal action share a single aligned row with matching control dimensions.
- Removed the remaining angled panel styling and export helpers so every layout now uses straightforward rectangular frames.

### Fixed
- Execute layout PHP templates on the server before sending them to the browser so panels render correctly in both the editor and exports.
- Release the PHP session lock before streaming live updates so refreshing the workspace no longer hangs behind an open EventSource connection.
- Strip library thumbnail styling from dropped artwork so newly placed panels render at full size without waiting for a page refresh.
- Eliminate the double-exposed panels that appeared in PDF and PNG exports by drawing each layout column with the exact on-screen transforms.
- Keep exported PDF spreads true to their original proportions so two-up pages are no longer subtly squeezed horizontally on each sheet.
- Scale each exported layout using its captured aspect ratio so generated PDFs no longer include white bands above or below the artwork.
- Restore the classic 5.5" × 8.5" workspace aspect ratio so on-screen previews and exported files fill vertically without trimming the bottom or right-hand panels.
- Eliminate duplicate PDF export constants that triggered a `pageWidth` redeclaration error in the browser console.
- Reload saved spreads directly from the persisted state file so previously authored pages render immediately after refresh.
- Treat `public/storage/state.json` as the single source of truth when rehydrating pages, removing the fallback to embedded data bundled in the HTML.

### Documentation
- Replace the README with an in-depth, highly visual guide covering architecture, workflows, testing commands, and troubleshooting tips.
