<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

// ---------------------------------------------------------------------------
// Test: Schema round-trip integrity and edge cases
// Covers large page counts, missing/invalid fields, and complex nested data.
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
// Test 1: Large page count (50 pages) round-trips without data loss
// ---------------------------------------------------------------------------

$numPages = 50;
$pages    = [];
for ($i = 0; $i < $numPages; $i++) {
    $pages[] = [
        'layout'      => $firstLayout,
        'gutterColor' => '#' . str_pad(dechex($i * 5), 6, '0', STR_PAD_LEFT),
        'slots'       => ['1' => "image_{$i}.jpg"],
        'transforms'  => ['1' => ['scale' => 1.0, 'translateXPct' => 0.0, 'translateYPct' => 0.0]],
        'locked'      => ($i % 2 === 0),
        'bubbles'     => [],
    ];
}

$model->setPages($pages);
$stored = $model->getPages();

if (count($stored) !== $numPages) {
    fwrite(STDERR, "Test 1 FAILED: expected {$numPages} pages, got " . count($stored) . PHP_EOL);
    exit(1);
}
for ($i = 0; $i < $numPages; $i++) {
    if ($stored[$i]['slots']['1'] !== "image_{$i}.jpg") {
        fwrite(STDERR, "Test 1 FAILED: slot data mismatch at page {$i}." . PHP_EOL);
        exit(1);
    }
    if ($stored[$i]['locked'] !== ($i % 2 === 0)) {
        fwrite(STDERR, "Test 1 FAILED: lock state mismatch at page {$i}." . PHP_EOL);
        exit(1);
    }
}
echo "Test 1 passed: large page count (50 pages) round-trips without data loss.\n";

// ---------------------------------------------------------------------------
// Test 2: Page with all fields fully populated survives round-trip
// ---------------------------------------------------------------------------

$bubble = [
    'id'        => 'bubble-1',
    'text'      => 'Hello!',
    'xPct'      => 10.0,
    'yPct'      => 20.0,
    'widthPct'  => 30.0,
    'heightPct' => 15.0,
    'tail'      => 'bottom-left',
    'style'     => 'speech',
    'zIndex'    => 5,
];

$bubblesObj       = new stdClass();
$bubblesObj->{'1'} = [$bubble];

$fullPage = [
    'layout'      => $firstLayout,
    'gutterColor' => '#3a7bd5',
    'slots'       => ['1' => 'art.jpg', '2' => 'cover.png'],
    'transforms'  => [
        '1' => ['scale' => 2.5, 'translateXPct' => -10.0, 'translateYPct' => 5.0],
        '2' => ['scale' => 1.1, 'translateXPct' => 3.5,  'translateYPct' => -2.5],
    ],
    'locked'      => false,
    'bubbles'     => $bubblesObj,
];

$model->setPages([$fullPage]);
$stored = $model->getPages();

if (count($stored) !== 1) {
    fwrite(STDERR, "Test 2 FAILED: expected 1 page, got " . count($stored) . PHP_EOL);
    exit(1);
}
$p = $stored[0];
if ($p['gutterColor'] !== '#3a7bd5') {
    fwrite(STDERR, "Test 2 FAILED: gutterColor mismatch." . PHP_EOL);
    exit(1);
}
if (!isset($p['slots']['1']) || $p['slots']['1'] !== 'art.jpg') {
    fwrite(STDERR, "Test 2 FAILED: slot 1 mismatch." . PHP_EOL);
    exit(1);
}
if (!isset($p['transforms']['2']['scale']) || abs($p['transforms']['2']['scale'] - 1.1) > 0.001) {
    fwrite(STDERR, "Test 2 FAILED: transform scale mismatch for slot 2." . PHP_EOL);
    exit(1);
}
echo "Test 2 passed: fully-populated page survives round-trip.\n";

// ---------------------------------------------------------------------------
// Test 3: Empty slots/transforms/bubbles are handled as empty collections
// ---------------------------------------------------------------------------

$emptyPage = [
    'layout'      => $firstLayout,
    'gutterColor' => '#cccccc',
    'slots'       => [],
    'transforms'  => [],
    'locked'      => false,
    'bubbles'     => [],
];

$model->setPages([$emptyPage]);
$stored = $model->getPages();
$p = $stored[0] ?? null;

if (!$p) {
    fwrite(STDERR, "Test 3 FAILED: no page stored." . PHP_EOL);
    exit(1);
}
if (!empty($p['slots']) || !empty($p['transforms'])) {
    fwrite(STDERR, "Test 3 FAILED: empty slots/transforms should remain empty." . PHP_EOL);
    exit(1);
}
echo "Test 3 passed: empty collections are preserved as empty.\n";

// ---------------------------------------------------------------------------
// Test 4: Non-finite transform values are replaced with safe defaults
// ---------------------------------------------------------------------------

$model->setPages([
    [
        'layout'      => $firstLayout,
        'gutterColor' => '#cccccc',
        'slots'       => ['1' => 'img.jpg'],
        'transforms'  => ['1' => ['scale' => INF, 'translateXPct' => NAN, 'translateYPct' => 5.0]],
        'locked'      => false,
        'bubbles'     => [],
    ],
]);
$p = $model->getPages()[0] ?? null;
if (!$p) {
    fwrite(STDERR, "Test 4 FAILED: no page stored." . PHP_EOL);
    exit(1);
}
$t = $p['transforms']['1'] ?? null;
if (!$t) {
    fwrite(STDERR, "Test 4 FAILED: transform entry missing." . PHP_EOL);
    exit(1);
}
if ($t['scale'] !== 1.0) {
    fwrite(STDERR, "Test 4 FAILED: INF scale should be replaced with 1.0, got " . var_export($t['scale'], true) . PHP_EOL);
    exit(1);
}
if ($t['translateXPct'] !== 0.0) {
    fwrite(STDERR, "Test 4 FAILED: NAN translateXPct should be replaced with 0.0." . PHP_EOL);
    exit(1);
}
if (abs($t['translateYPct'] - 5.0) > 0.001) {
    fwrite(STDERR, "Test 4 FAILED: valid translateYPct should be preserved." . PHP_EOL);
    exit(1);
}
echo "Test 4 passed: non-finite transform values replaced with safe defaults.\n";

// ---------------------------------------------------------------------------
// Test 5: Malformed page objects among valid pages are repaired gracefully
// ---------------------------------------------------------------------------

$model->setPages([
    ['layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => false, 'bubbles' => []],
    ['layout' => 'NONEXISTENT_LAYOUT_XYZ', 'gutterColor' => 'not-a-color', 'slots' => [], 'transforms' => [], 'locked' => false, 'bubbles' => []],
    ['layout' => $firstLayout, 'gutterColor' => '#aabbcc', 'slots' => [], 'transforms' => [], 'locked' => true, 'bubbles' => []],
]);
$pages = $model->getPages();
if (count($pages) !== 3) {
    fwrite(STDERR, "Test 5 FAILED: expected 3 pages, got " . count($pages) . PHP_EOL);
    exit(1);
}
// Malformed page at index 1 should have been repaired
if (!in_array($pages[1]['layout'], $knownLayouts, true)) {
    fwrite(STDERR, "Test 5 FAILED: repaired layout is not a known layout." . PHP_EOL);
    exit(1);
}
if (!preg_match('/^#[0-9a-fA-F]{6}$/', $pages[1]['gutterColor'])) {
    fwrite(STDERR, "Test 5 FAILED: repaired gutterColor is not a valid hex color." . PHP_EOL);
    exit(1);
}
// Surrounding pages should be unaffected
if ($pages[0]['layout'] !== $firstLayout) {
    fwrite(STDERR, "Test 5 FAILED: page 0 layout changed unexpectedly." . PHP_EOL);
    exit(1);
}
if ($pages[2]['locked'] !== true) {
    fwrite(STDERR, "Test 5 FAILED: page 2 lock state changed unexpectedly." . PHP_EOL);
    exit(1);
}
echo "Test 5 passed: malformed pages are repaired without affecting valid neighbours.\n";

// ---------------------------------------------------------------------------
// Test 6: Empty pages array is stored as an empty array
// ---------------------------------------------------------------------------

$model->setPages([]);
$stored = $model->getPages();
if (!is_array($stored) || !empty($stored)) {
    fwrite(STDERR, "Test 6 FAILED: empty pages should be stored as empty array." . PHP_EOL);
    exit(1);
}
echo "Test 6 passed: empty pages array is stored correctly.\n";

// ---------------------------------------------------------------------------
// Test 7: pageCount state field is kept in sync with actual page count
// ---------------------------------------------------------------------------

$model->setPages(array_fill(0, 7, [
    'layout' => $firstLayout, 'gutterColor' => '#cccccc', 'slots' => [], 'transforms' => [], 'locked' => false, 'bubbles' => [],
]));
$snapshot = $model->getStateSnapshot();
if (($snapshot['pageCount'] ?? null) !== 7) {
    fwrite(STDERR, "Test 7 FAILED: pageCount should be 7, got " . var_export($snapshot['pageCount'] ?? null, true) . PHP_EOL);
    exit(1);
}
echo "Test 7 passed: pageCount field stays in sync after setPages.\n";

echo "All export/schema integrity tests passed.\n";
