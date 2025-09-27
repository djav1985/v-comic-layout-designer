# Windows Compatibility Guide

## Overview
This guide documents the Windows-specific compatibility enhancements made to the V Comic Layout Designer Electron application.

## Windows-Specific Changes Made

### 1. PHP File Path Handling
All hardcoded Unix path separators (`/`) have been replaced with `DIRECTORY_SEPARATOR` constant to ensure Windows compatibility:

**Files Updated:**
- `app/Controllers/StateController.php` - Temporary directory creation for ZIP extraction
- `app/Models/ComicModel.php` - File paths, upload directories, and glob patterns

**Example Fix:**
```php
// Before (Unix-only)
$target = $this->uploadDir . '/' . $name;

// After (Windows-compatible)  
$target = $this->uploadDir . DIRECTORY_SEPARATOR . $name;
```

### 2. Electron Process Management
Enhanced the Electron main process to properly handle Windows PHP runtime:

**Features Added:**
- Windows PHP executable detection (`php.exe`)
- PHP configuration file support for packaged builds
- Proper command-line argument handling for Windows
- Cross-platform file path resolution using `path.join()`

### 3. Test Runner Compatibility
Created a Windows-compatible test runner (`run-tests.js`) that:
- Uses `shell: true` on Windows for proper PHP executable location
- Provides helpful Windows-specific error messages
- Handles process stdio properly across platforms

### 4. PHP Runtime Configuration
Added optimized PHP configuration (`resources/php/php.ini`) for Windows deployment:
- Windows-compatible extension paths
- Optimized memory settings for desktop usage
- Required extensions for the application (SQLite, ZIP, etc.)
- OPcache configuration for better performance

## Building for Windows

### Prerequisites
- Node.js 18+
- npm or yarn
- PHP 8.0+ (for development)

### Development Setup
```bash
# Install dependencies
npm install
composer install

# Run in development mode
npm run dev

# Run tests
npm test
node run-tests.js
```

### Building Windows Installer
```bash
# Build for Windows x64
npm run dist

# Clean build artifacts
npm run clean
```

### Automated Release (GitHub Actions)
The project includes a GitHub Actions workflow (`build-electron-release.yml`) that:
- Automatically downloads Windows PHP 8.2 runtime
- Builds Windows x64 installer (.exe)
- Creates GitHub releases with proper artifacts
- Uses PowerShell for Windows-specific operations

## Windows-Specific Features

### PHP Runtime Bundling
The Windows build automatically:
- Downloads PHP 8.2 NTS Windows build
- Bundles it in `resources/php/`
- Configures it with the optimized php.ini
- Manages the PHP server process lifecycle

### File System Compatibility
- All file operations use proper Windows path separators
- Temporary directory operations work with Windows temp paths
- File permissions are handled appropriately for Windows

### Process Management
- PHP server spawning works correctly on Windows
- Proper cleanup of PHP processes on app exit
- Windows-compatible command-line argument handling

## Testing Windows Compatibility

The project includes comprehensive tests for Windows compatibility:

```bash
# Run Windows compatibility test
php tests/WindowsCompatibilityTest.php

# Run all tests with Windows-compatible test runner
node run-tests.js
```

## Troubleshooting Windows Issues

### Common Issues
1. **PHP not found**: Ensure PHP is in your PATH or use the bundled runtime
2. **File permission issues**: Windows handles permissions differently; the app handles this automatically
3. **Path separator issues**: All fixed in the current version

### Development vs Production
- **Development**: Uses system PHP if available
- **Production**: Uses bundled PHP runtime with optimized configuration

## Security Considerations
- File path traversal protection works on Windows
- Temporary file operations use secure Windows temp directories
- ZIP extraction is properly sandboxed

## Performance Optimizations for Windows
- OPcache enabled for better PHP performance
- Optimized memory limits for desktop usage
- Efficient file system operations using native Windows APIs through PHP

## Deployment Notes
- Windows Defender may require exclusions for the PHP runtime
- The installer supports user-level installation (no admin required)
- Application data is stored in user-specific directories