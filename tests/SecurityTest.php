<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Models\ComicModel;

// ---------------------------------------------------------------------------
// Test: CSRF token generation
// ---------------------------------------------------------------------------

// Simulate a session so getCsrfToken() can store the token
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$token1 = Router::getCsrfToken();
if (strlen($token1) !== 64) {
    fwrite(STDERR, "Expected CSRF token to be 64 hex chars, got: " . strlen($token1) . PHP_EOL);
    exit(1);
}

// Calling getCsrfToken() again should return the same token (session-stable)
$token2 = Router::getCsrfToken();
if ($token1 !== $token2) {
    fwrite(STDERR, "Expected getCsrfToken() to return a stable token within the same session." . PHP_EOL);
    exit(1);
}

// ---------------------------------------------------------------------------
// Test: CSRF validation – correct token via header
// ---------------------------------------------------------------------------

$_SERVER['HTTP_X_CSRF_TOKEN'] = $token1;
unset($_POST['_csrf_token']);

if (!Router::validateCsrfToken()) {
    fwrite(STDERR, "Expected validateCsrfToken() to pass when X-CSRF-Token header matches session token." . PHP_EOL);
    exit(1);
}

// ---------------------------------------------------------------------------
// Test: CSRF validation – correct token via POST field
// ---------------------------------------------------------------------------

unset($_SERVER['HTTP_X_CSRF_TOKEN']);
$_POST['_csrf_token'] = $token1;

if (!Router::validateCsrfToken()) {
    fwrite(STDERR, "Expected validateCsrfToken() to pass when _csrf_token POST field matches session token." . PHP_EOL);
    exit(1);
}

// ---------------------------------------------------------------------------
// Test: CSRF validation – wrong token is rejected
// ---------------------------------------------------------------------------

$_POST['_csrf_token'] = 'wrong_token_value';

if (Router::validateCsrfToken()) {
    fwrite(STDERR, "Expected validateCsrfToken() to FAIL when token does not match." . PHP_EOL);
    exit(1);
}

// ---------------------------------------------------------------------------
// Test: CSRF validation – empty token is rejected
// ---------------------------------------------------------------------------

unset($_SERVER['HTTP_X_CSRF_TOKEN']);
$_POST['_csrf_token'] = '';

if (Router::validateCsrfToken()) {
    fwrite(STDERR, "Expected validateCsrfToken() to FAIL when token is empty." . PHP_EOL);
    exit(1);
}

// Clean up superglobals
unset($_SERVER['HTTP_X_CSRF_TOKEN'], $_POST['_csrf_token']);

// ---------------------------------------------------------------------------
// Test: Upload validation – content inspection rejects wrong MIME
// ---------------------------------------------------------------------------

$model = new ComicModel();

// Create a temp file with PNG content but mis-labelled as jpeg in 'name'
$tempPng = tempnam(sys_get_temp_dir(), 'upload_test_');
// Write a valid 1×1 transparent PNG
$pngData = base64_decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
);
file_put_contents($tempPng, $pngData);
$tempPngSize = filesize($tempPng);

// Use the real ComicModel::saveUpload() to verify upload/MIME validation.
$comicModel = new ComicModel();

// Test: extension mismatch – .jpg extension but real PNG content
$fakeName = 'photo.jpg';
$fakeFile = [
    'name'     => $fakeName,
    'type'     => 'image/jpeg', // client-supplied type (wrong)
    'tmp_name' => $tempPng,
    'error'    => UPLOAD_ERR_OK,
    'size'     => $tempPngSize,
];

$caught = false;
try {
    // Expect ComicModel::saveUpload() to reject mismatched extension/content.
    $comicModel->saveUpload($fakeFile);
} catch (\Throwable $e) {
    $caught = true;
}

if (!$caught) {
    fwrite(STDERR, "Expected ComicModel::saveUpload() to reject PNG content with .jpg extension." . PHP_EOL);
    @unlink($tempPng);
    exit(1);
}

// Test: disallowed MIME type (text file) is rejected by ComicModel::saveUpload()
$tempTxt = tempnam(sys_get_temp_dir(), 'upload_test_txt_');
file_put_contents($tempTxt, 'this is plain text, not an image');
$tempTxtSize = filesize($tempTxt);

$fakeTextFile = [
    'name'     => 'notes.txt',
    'type'     => 'text/plain',
    'tmp_name' => $tempTxt,
    'error'    => UPLOAD_ERR_OK,
    'size'     => $tempTxtSize,
];

$caughtText = false;
try {
    $comicModel->saveUpload($fakeTextFile);
} catch (\Throwable $e) {
    $caughtText = true;
}

if (!$caughtText) {
    fwrite(STDERR, "Expected ComicModel::saveUpload() to reject disallowed MIME type (text/plain)." . PHP_EOL);
    @unlink($tempPng);
    @unlink($tempTxt);
    exit(1);
}

@unlink($tempPng);
@unlink($tempTxt);

echo "Security validation tests passed." . PHP_EOL;
