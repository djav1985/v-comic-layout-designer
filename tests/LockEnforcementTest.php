<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

// ---------------------------------------------------------------------------
// Test: Lock enforcement — locked state is preserved through schema
// sanitization and survives a full setPages/getPages round-trip. Also verifies
// bulk-lock scenarios and that locked=false is the default for new pages.
// ---------------------------------------------------------------------------

$model = new ComicModel();

$layoutsMap   = $model->getLayouts();
$knownLayouts = array_keys($layoutsMap);
if (empty($knownLayouts)) {
    fwrite(STDERR, "Setup FAILED: no layouts found in the layouts directory." . PHP_EOL);
    exit(1);
}
$firstLayout = $knownLayouts[0];

// ---------------------------------------------------------------------------
// Test 1: locked=true round-trips as boolean true
// ---------------------------------------------------------------------------

$model->setPages([
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => true, 'bubbles' => []],
]);
$page = $model->getPages()[0] ?? null;
if (!$page) {
    fwrite(STDERR, "Test 1 FAILED: no page was stored." . PHP_EOL);
    exit(1);
}
if ($page['locked'] !== true) {
    fwrite(STDERR, "Test 1 FAILED: locked flag should be true, got " . var_export($page['locked'], true) . PHP_EOL);
    exit(1);
}
echo "Test 1 passed: locked=true round-trips correctly.\n";

// ---------------------------------------------------------------------------
// Test 2: locked=false round-trips as boolean false
// ---------------------------------------------------------------------------

$model->setPages([
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => false, 'bubbles' => []],
]);
$page = $model->getPages()[0] ?? null;
if ($page['locked'] !== false) {
    fwrite(STDERR, "Test 2 FAILED: locked flag should be false, got " . var_export($page['locked'], true) . PHP_EOL);
    exit(1);
}
echo "Test 2 passed: locked=false round-trips correctly.\n";

// ---------------------------------------------------------------------------
// Test 3: missing locked key defaults to false
// ---------------------------------------------------------------------------

$model->setPages([
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => []],
]);
$page = $model->getPages()[0] ?? null;
if ($page['locked'] !== false) {
    fwrite(STDERR, "Test 3 FAILED: missing locked key should default to false, got " . var_export($page['locked'], true) . PHP_EOL);
    exit(1);
}
echo "Test 3 passed: missing locked key defaults to false.\n";

// ---------------------------------------------------------------------------
// Test 4: truthy non-boolean value is cast to true
// ---------------------------------------------------------------------------

$model->setPages([
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => 1],
]);
$page = $model->getPages()[0] ?? null;
if ($page['locked'] !== true) {
    fwrite(STDERR, "Test 4 FAILED: locked=1 should be cast to true, got " . var_export($page['locked'], true) . PHP_EOL);
    exit(1);
}
echo "Test 4 passed: truthy locked value cast to boolean true.\n";

// ---------------------------------------------------------------------------
// Test 5: bulk lock — saving multiple pages preserves mixed lock states
// ---------------------------------------------------------------------------

$model->setPages([
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => true],
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => false],
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => true],
]);
$pages = $model->getPages();
if (count($pages) !== 3) {
    fwrite(STDERR, "Test 5 FAILED: expected 3 pages, got " . count($pages) . PHP_EOL);
    exit(1);
}
if ($pages[0]['locked'] !== true || $pages[1]['locked'] !== false || $pages[2]['locked'] !== true) {
    fwrite(STDERR, "Test 5 FAILED: mixed lock states not preserved correctly." . PHP_EOL);
    exit(1);
}
echo "Test 5 passed: mixed lock states preserved in bulk save.\n";

// ---------------------------------------------------------------------------
// Test 6: locked pages retain their slot data on round-trip
// ---------------------------------------------------------------------------

$slots = ['1' => 'panel-art.jpg', '2' => 'cover.png'];
$model->setPages([
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => $slots, 'transforms' => [], 'locked' => true, 'bubbles' => []],
]);
$page = $model->getPages()[0] ?? null;
if ($page['locked'] !== true) {
    fwrite(STDERR, "Test 6 FAILED: locked flag not preserved." . PHP_EOL);
    exit(1);
}
if ($page['slots'] !== $slots) {
    fwrite(STDERR, "Test 6 FAILED: slots data not preserved on locked page." . PHP_EOL);
    exit(1);
}
echo "Test 6 passed: locked page slots are preserved on round-trip.\n";

// ---------------------------------------------------------------------------
// Test 7: all-locked scenario — every page in a document is locked
// ---------------------------------------------------------------------------

$numPages = 5;
$allLocked = array_fill(0, $numPages, [
    'layout' => $firstLayout,
    'gutterColor' => '#cccccc',
    'slots' => [],
    'transforms' => [],
    'locked' => true,
    'bubbles' => [],
]);
$model->setPages($allLocked);
$pages = $model->getPages();
if (count($pages) !== $numPages) {
    fwrite(STDERR, "Test 7 FAILED: expected {$numPages} pages, got " . count($pages) . PHP_EOL);
    exit(1);
}
foreach ($pages as $i => $p) {
    if ($p['locked'] !== true) {
        fwrite(STDERR, "Test 7 FAILED: page {$i} should be locked." . PHP_EOL);
        exit(1);
    }
}
echo "Test 7 passed: all-locked scenario preserves lock state for every page.\n";

echo "All lock enforcement tests passed.\n";
