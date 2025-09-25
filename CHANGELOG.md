# Changelog

## [Unreleased]

### Added
- Added a **Build Templates** control beside the export actions that renders each layout's gutter mask into a transparent PNG overlay and stores it server-side for reuse.

### Changed
- Rebuilt the entire interface with a modern glassmorphism aesthetic, refreshed typography, and responsive layout cards to separate the asset library from the page builder.
- Widened the app shell and workspace grid to give the builder canvas more horizontal breathing room on large screens while keeping the layout responsive.
- Centered the shell at 90% width and standardized the page cards to two per row for a more intentional workspace rhythm on desktop screens.
- Updated the workspace page grid to use one column below 1024px, two columns up to 1980px, and three columns on ultra-wide displays while preserving panel alignment and aspect ratios.

### Fixed

- Preserve diagonal panel shapes in exported images and PDFs by parsing each layout's CSS rules, caching vendor-prefixed clip-paths, reapplying them after html2canvas renders the page, and tinting reusable overlay masks to the live gutter color before compositing.
- Keep exported PDF spreads true to their original proportions so two-up pages are no longer subtly squeezed horizontally on each sheet.
- Restore the classic 5.5" × 8.5" workspace aspect ratio so on-screen previews and exported files fill vertically without trimming the bottom or right-hand panels.
- Allow uploads triggered in CLI test environments to persist correctly by falling back to safe filesystem moves when `is_uploaded_file()` is unavailable and by providing configuration hooks for temporary directories.
