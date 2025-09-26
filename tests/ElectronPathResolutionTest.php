<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Core\Database;
use App\Models\ComicModel;

/**
 * Test that verifies the fix for passing ELECTRON_USER_DATA to PHP environment
 * This test simulates the Electron environment and verifies paths are resolved outside ASAR bundle
 */

// Create a temporary directory to simulate Electron user data path
$tempUserData = sys_get_temp_dir() . '/electron-user-data-test-' . uniqid();
mkdir($tempUserData, 0777, true);

// Set up environment variables as they would be set by main.js
$_ENV['ELECTRON_APP'] = '1';
$_ENV['ELECTRON_USER_DATA'] = $tempUserData;
putenv('ELECTRON_APP=1');
putenv("ELECTRON_USER_DATA=$tempUserData");

try {
    // Test Database path resolution
    echo "Testing Database path resolution...\n";
    $database = new Database();
    $dbPath = $database->getDbPath();
    
    // Verify the path is outside the bundle (in user data directory)
    if (strpos($dbPath, $tempUserData) !== 0) {
        fwrite(STDERR, "Database path should be in user data directory. Got: $dbPath\n");
        exit(1);
    }
    
    // Verify database file was created
    if (!file_exists($dbPath)) {
        fwrite(STDERR, "Database file was not created at: $dbPath\n");
        exit(1);
    }
    
    echo "✓ Database path correctly resolved to user data directory: $dbPath\n";
    
    // Test ComicModel path resolution
    echo "Testing ComicModel path resolution...\n";
    $comicModel = new ComicModel();
    
    // Use reflection to access private property (uploadDir is public)
    $uploadDir = $comicModel->uploadDir;
    
    // Verify the upload path is outside the bundle (in user data directory)
    if (strpos($uploadDir, $tempUserData) !== 0) {
        fwrite(STDERR, "Upload directory should be in user data directory. Got: $uploadDir\n");
        exit(1);
    }
    
    // Verify upload directory was created
    if (!is_dir($uploadDir)) {
        fwrite(STDERR, "Upload directory was not created at: $uploadDir\n");
        exit(1);
    }
    
    echo "✓ Upload directory correctly resolved to user data directory: $uploadDir\n";
    
    // Test that state operations work correctly
    echo "Testing state operations...\n";
    $testState = [
        'images' => ['test1.jpg', 'test2.png'],
        'pages' => ['page1' => 'layout1'],
        'pageCount' => 2
    ];
    
    $database->setState($testState);
    $retrievedState = $database->getState();
    
    if ($retrievedState['images'] !== $testState['images'] || 
        $retrievedState['pageCount'] !== $testState['pageCount']) {
        fwrite(STDERR, "State persistence test failed\n");
        exit(1);
    }
    
    echo "✓ State operations work correctly in user data directory\n";
    
    echo "✓ All Electron path resolution tests passed!\n";
    
} catch (Exception $e) {
    fwrite(STDERR, "Test failed with exception: " . $e->getMessage() . "\n");
    exit(1);
} finally {
    // Clean up temporary directory
    if (is_dir($tempUserData)) {
        $files = array_diff(scandir($tempUserData), array('.', '..'));
        foreach ($files as $file) {
            $path = $tempUserData . '/' . $file;
            if (is_dir($path)) {
                rmdir($path);
            } else {
                unlink($path);
            }
        }
        rmdir($tempUserData);
    }
    
    // Clean up environment
    unset($_ENV['ELECTRON_APP']);
    unset($_ENV['ELECTRON_USER_DATA']);
    putenv('ELECTRON_APP');
    putenv('ELECTRON_USER_DATA');
}