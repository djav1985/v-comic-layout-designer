# Changelog

## [Unreleased]
### Changed
- Rebuilt the entire interface with a modern glassmorphism aesthetic, refreshed typography, and responsive layout cards to separate the asset library from the page builder.
- Widened the app shell and workspace grid to give the builder canvas more horizontal breathing room on large screens while keeping the layout responsive.
- Centered the shell at 90% width and standardized the page cards to two per row for a more intentional workspace rhythm on desktop screens.

### Fixed
- Preserve diagonal panel shapes in exported images and PDFs by post-processing html2canvas output with the layout's clip-path data.
