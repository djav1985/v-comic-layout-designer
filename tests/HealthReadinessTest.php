<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Core\Database;

// ---------------------------------------------------------------------------
// Test: Database constructor and path accessibility
// ---------------------------------------------------------------------------
try {
    $db = new Database();
    $dbPath = $db->getDbPath();
    if (!is_file($dbPath)) {
        fwrite(STDERR, "Database file was not created at: {$dbPath}" . PHP_EOL);
        exit(1);
    }
    if (!is_readable($dbPath)) {
        fwrite(STDERR, "Database file is not readable: {$dbPath}" . PHP_EOL);
        exit(1);
    }
} catch (\Throwable $e) {
    fwrite(STDERR, "Database initialisation failed: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

// ---------------------------------------------------------------------------
// Test: Uploads directory exists and is writable
// ---------------------------------------------------------------------------
$uploadsDir = __DIR__ . '/../public/uploads';
if (!is_dir($uploadsDir)) {
    if (!mkdir($uploadsDir, 0775, true) && !is_dir($uploadsDir)) {
        fwrite(STDERR, "Unable to create uploads directory: {$uploadsDir}" . PHP_EOL);
        exit(1);
    }
}
if (!is_dir($uploadsDir)) {
    fwrite(STDERR, "Uploads directory does not exist: {$uploadsDir}" . PHP_EOL);
    exit(1);
}
if (!is_writable($uploadsDir)) {
    fwrite(STDERR, "Uploads directory is not writable: {$uploadsDir}" . PHP_EOL);
    exit(1);
}

// ---------------------------------------------------------------------------
// Test: getLastModified returns a non-negative integer
// ---------------------------------------------------------------------------
$lastModified = $db->getLastModified();
if (!is_int($lastModified) || $lastModified < 0) {
    fwrite(STDERR, "getLastModified() should return a non-negative integer, got: " . var_export($lastModified, true) . PHP_EOL);
    exit(1);
}

echo "Health and readiness checks passed." . PHP_EOL;
