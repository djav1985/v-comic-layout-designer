# Comic Layout Designer - Go Version

A complete port of the PHP Comic Layout Designer to a standalone Go executable for Windows.

## Features

✅ **Identical Functionality** - Complete port with all original features:
- Asset Library with drag-and-drop image uploads
- Storyboard Workspace with multiple layout templates  
- Real-time state synchronization via Server-Sent Events
- SQLite-based state persistence
- State import/export with ZIP archives
- Page management (add, remove, lock, unlock)
- Gutter color customization
- Keyboard shortcuts (Ctrl+S save, Ctrl+N new page, etc.)

✅ **Embedded Assets** - All static files (CSS, JS, layouts) are embedded in the executable
- No external dependencies
- Single-file deployment
- Portable between Windows systems

✅ **Modern Architecture**:
- Go 1.21+ with Gorilla Mux routing
- SQLite database with modernc.org/sqlite (pure Go)
- MVC pattern with clean separation of concerns
- Embedded filesystem using go:embed

## Quick Start

1. Download `comic-layout-designer-windows.exe`
2. Double-click to run
3. Open browser to `http://localhost:8080`
4. Start creating comic layouts!

## Data Storage

The application stores data in `%USERPROFILE%\.comic-layout-designer\`:
- `state.db` - SQLite database with pages and image metadata
- `uploads\` - Uploaded image files

## API Endpoints

The Go version maintains full compatibility with the original PHP API:

- `GET /` - Main application interface
- `POST /upload` - Upload images to library
- `POST /delete-image` - Remove image from library  
- `GET /get-pages` - Retrieve current pages
- `POST /save-pages` - Save page state
- `GET /pages/stream` - Real-time state updates (Server-Sent Events)
- `POST /state/reset` - Reset all data
- `GET /state/export` - Download state as ZIP
- `POST /state/import` - Import state from ZIP

## Building from Source

```bash
go mod tidy
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o comic-layout-designer-windows.exe .
```

## Layout Templates

All original layout templates are supported:
- cover, four-grid, three-horizontal, three-vertical
- two-horizontal, two-vertical-top-one-horizontal-bottom  
- two-horizontal-left-one-vertical-right
- one-horizontal-top-two-vertical-bottom
- one-horizontal-top-three-vertical-bottom
- one-vertical-left-two-horizontal-right

## Differences from PHP Version

- **Server**: Embedded Go HTTP server instead of PHP-FPM/Apache
- **Port**: Runs on localhost:8080 instead of :8000  
- **Storage**: Uses user home directory instead of public/storage
- **Performance**: Faster startup and response times
- **Deployment**: Single executable instead of web server setup

## Technical Details

- **Language**: Go 1.21+
- **Database**: SQLite via modernc.org/sqlite (pure Go, no CGO)
- **Router**: Gorilla Mux
- **Assets**: Embedded with go:embed directive
- **Templates**: Go html/template with JSON data injection
- **Size**: ~12MB executable with all assets included
- **Dependencies**: Zero external dependencies at runtime