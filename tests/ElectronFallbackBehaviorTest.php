<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Core\Database;
use App\Models\ComicModel;

/**
 * Test that demonstrates the issue when ELECTRON_USER_DATA is not set
 * This test simulates the old broken behavior and should show why the fix is needed
 */

// Set up environment variables to simulate Electron WITHOUT user data path
$_ENV['ELECTRON_APP'] = '1';
putenv('ELECTRON_APP=1');

// Ensure ELECTRON_USER_DATA is not set
unset($_ENV['ELECTRON_USER_DATA']);
putenv('ELECTRON_USER_DATA');

echo "Testing behavior when ELECTRON_USER_DATA is NOT set (the broken scenario)...\n";

try {
    // This should work because it falls back to public directories 
    // but demonstrates the issue the fix addresses
    $database = new Database();
    $dbPath = $database->getDbPath();
    
    echo "Database path without ELECTRON_USER_DATA: $dbPath\n";
    
    // The path should now point to public/storage (fallback behavior)
    if (strpos($dbPath, 'public/storage') === false) {
        fwrite(STDERR, "Expected path to contain 'public/storage' but got: $dbPath\n");
        exit(1);
    }
    
    echo "✓ Fallback behavior works, but this would fail in packaged Electron app due to read-only ASAR\n";
    
    // Test ComicModel
    $comicModel = new ComicModel();
    $uploadDir = $comicModel->uploadDir;
    
    echo "Upload directory without ELECTRON_USER_DATA: $uploadDir\n";
    
    // The path should point to public (fallback behavior)
    if (strpos($uploadDir, 'public') === false) {
        fwrite(STDERR, "Expected upload path to contain 'public' but got: $uploadDir\n");
        exit(1);
    }
    
    echo "✓ Fallback behavior works in dev, but would fail in packaged app (read-only ASAR bundle)\n";
    echo "✓ This test demonstrates why the ELECTRON_USER_DATA fix is essential for packaged builds!\n";
    
} catch (Exception $e) {
    echo "Exception occurred (expected in packaged builds): " . $e->getMessage() . "\n";
    echo "This is exactly why we need to pass ELECTRON_USER_DATA to avoid read-only ASAR issues!\n";
} finally {
    // Clean up environment
    unset($_ENV['ELECTRON_APP']);
    putenv('ELECTRON_APP');
}