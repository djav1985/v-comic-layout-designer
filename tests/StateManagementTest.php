<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

$model = new ComicModel();
$uploadDir = $model->getUploadDirectory();

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$dummyUpload = $uploadDir . '/__state-test__.png';
file_put_contents($dummyUpload, 'fake');

$model->resetState();
$state = $model->getStateSnapshot();
$remainingFiles = array_filter(glob($uploadDir . '/*') ?: [], 'is_file');

if (!empty($state['images'])) {
    fwrite(STDERR, "Expected resetState() to clear the tracked images list." . PHP_EOL);
    exit(1);
}

if (!empty($remainingFiles)) {
    fwrite(STDERR, "Expected resetState() to remove uploaded files from disk." . PHP_EOL);
    exit(1);
}

$tempDir = sys_get_temp_dir() . '/state_import_' . bin2hex(random_bytes(5));
mkdir($tempDir, 0777, true);
$sourceImage = $tempDir . '/imported.png';
file_put_contents($sourceImage, 'fake');

$model->replaceUploadsFromDirectory($tempDir);
$imagesAfterImport = $model->getImages();

if (!in_array('imported.png', $imagesAfterImport, true)) {
    fwrite(STDERR, "Expected replaceUploadsFromDirectory() to copy images into the upload directory." . PHP_EOL);
    exit(1);
}

$model->resetState();
@unlink($sourceImage);
@rmdir($tempDir);

echo "State management helpers behaved as expected." . PHP_EOL;
