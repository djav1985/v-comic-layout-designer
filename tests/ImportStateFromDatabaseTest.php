<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

// Test importing from an invalid SQLite database (missing state table)
$model = new ComicModel();

// Create a temp directory for test files
$tempDir = sys_get_temp_dir() . '/import_test_' . bin2hex(random_bytes(5));
mkdir($tempDir, 0777, true);

// Test 1: Create an invalid SQLite file without a state table
$invalidDbPath = $tempDir . '/invalid_state.db';
$pdo = new PDO('sqlite:' . $invalidDbPath);
$pdo->exec('CREATE TABLE other_table (id INTEGER PRIMARY KEY)');
$pdo = null;

try {
    $model->importStateFromDatabase($invalidDbPath);
    fwrite(STDERR, "Expected RuntimeException when importing from invalid database." . PHP_EOL);
    exit(1);
} catch (RuntimeException $e) {
    if (!str_contains($e->getMessage(), 'missing required "state" table')) {
        fwrite(STDERR, "Expected specific error message about missing state table, got: " . $e->getMessage() . PHP_EOL);
        exit(1);
    }
}

// Test 2: Create a valid SQLite file with state table
$validDbPath = $tempDir . '/valid_state.db';
$pdo = new PDO('sqlite:' . $validDbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE state (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)');
$pdo->exec("INSERT INTO state (key, value, updated_at) VALUES ('test_key', '\"test_value\"', " . time() . ")");
$pdo = null;

try {
    $model->importStateFromDatabase($validDbPath);
    // If we get here, the import succeeded
} catch (Throwable $e) {
    fwrite(STDERR, "Valid database import failed: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

// Test 3: Test with non-existent file
try {
    $model->importStateFromDatabase('/non/existent/file.db');
    fwrite(STDERR, "Expected RuntimeException when importing from non-existent file." . PHP_EOL);
    exit(1);
} catch (RuntimeException $e) {
    if (!str_contains($e->getMessage(), 'not found')) {
        fwrite(STDERR, "Expected error message about file not found, got: " . $e->getMessage() . PHP_EOL);
        exit(1);
    }
}

// Clean up
@unlink($invalidDbPath);
@unlink($validDbPath);
@rmdir($tempDir);

echo "Import state from database validation tests passed." . PHP_EOL;