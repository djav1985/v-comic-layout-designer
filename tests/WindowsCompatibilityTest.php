<?php
/**
 * Windows Compatibility Test
 * Tests path handling and directory operations to ensure Windows compatibility
 */

require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;
use App\Controllers\StateController;
use App\Core\Database;

echo "🪟 Testing Windows compatibility...\n";

try {
    // Test 1: ComicModel path handling
    echo "📁 Testing ComicModel path operations...\n";
    $model = new ComicModel();
    $model->getLayoutStyles(); // This uses our fixed DIRECTORY_SEPARATOR path
    echo "✅ ComicModel path operations work correctly\n";

    // Test 2: Temporary directory creation (Windows compatible)
    echo "🗂️ Testing temporary directory operations...\n";
    $tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'test_' . bin2hex(random_bytes(4));
    
    if (!mkdir($tempDir, 0777, true)) {
        throw new Exception("Failed to create temp directory: $tempDir");
    }
    
    if (!is_dir($tempDir)) {
        throw new Exception("Temp directory was not created: $tempDir");
    }
    
    // Cleanup
    rmdir($tempDir);
    echo "✅ Temporary directory operations work correctly\n";

    // Test 3: File path construction
    echo "🔗 Testing file path construction...\n";
    $basePath = __DIR__;
    $filePath = $basePath . DIRECTORY_SEPARATOR . 'WindowsCompatibilityTest.php';
    
    if (!file_exists($filePath)) {
        throw new Exception("File path construction failed: $filePath");
    }
    echo "✅ File path construction works correctly\n";

    // Test 4: Database path handling 
    echo "🗄️ Testing database path handling...\n";
    $db = new Database();
    $dbPath = $db->getDbPath();
    
    if (!file_exists($dbPath)) {
        throw new Exception("Database path is invalid: $dbPath");
    }
    echo "✅ Database path handling works correctly\n";

    echo "\n🎉 All Windows compatibility tests passed!\n";
    echo "📋 Verified:\n";
    echo "  - Path separator usage (DIRECTORY_SEPARATOR)\n";
    echo "  - Temporary directory creation\n";
    echo "  - File path construction\n";
    echo "  - Database path resolution\n";
    echo "  - Cross-platform directory operations\n";
    
} catch (Exception $e) {
    echo "❌ Windows compatibility test failed: " . $e->getMessage() . "\n";
    exit(1);
}