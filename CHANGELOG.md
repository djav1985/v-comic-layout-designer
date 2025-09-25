# Changelog

## [Unreleased]
### Changed
- Rebuilt the entire interface with a modern glassmorphism aesthetic, refreshed typography, and responsive layout cards to separate the asset library from the page builder.
- Widened the app shell and workspace grid to give the builder canvas more horizontal breathing room on large screens while keeping the layout responsive.
- Centered the shell at 90% width and standardized the page cards to two per row for a more intentional workspace rhythm on desktop screens.

### Fixed
- Preserve diagonal panel shapes in exported images and PDFs by parsing each layout's CSS rules, caching vendor-prefixed clip-paths, and reapplying them after html2canvas renders the page.
- Keep exported PDF spreads true to their original proportions so two-up pages are no longer subtly squeezed horizontally on each sheet.
