<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

// ---------------------------------------------------------------------------
// Test: Server-side schema sanitization via ComicModel::sanitizePage()
// and ComicModel::setPages(), which applies sanitizePage() to every page
// before persisting. Tests verify that invalid values are repaired, not
// merely stored as-is.
// ---------------------------------------------------------------------------

$model = new ComicModel();

// Discover known layouts in the exact order the model uses them, so Test 1
// and Test 7 can assert exact values rather than just set membership.
$layoutsMap   = $model->getLayouts();
$knownLayouts = array_keys($layoutsMap);
if (empty($knownLayouts)) {
    fwrite(STDERR, "Setup FAILED: no layouts found in the layouts directory." . PHP_EOL);
    exit(1);
}
$firstLayout  = $knownLayouts[0];   // model's fallback for unknown layouts
$secondLayout = $knownLayouts[1] ?? $firstLayout;

// ---------------------------------------------------------------------------
// Test 1: valid data is preserved without alteration
// ---------------------------------------------------------------------------

$validPage = [
    'layout'     => $firstLayout,
    'gutterColor'=> '#ffffff',
    'slots'      => ['1' => 'image.jpg'],
    'transforms' => ['1' => ['scale' => 1.2, 'translateXPct' => 10.5, 'translateYPct' => -3.0]],
    'locked'     => false,
    'bubbles'    => [],
];

$model->setPages([$validPage]);
$stored = $model->getPages()[0] ?? null;

if ($stored === null) {
    fwrite(STDERR, "Test 1 FAILED: setPages/getPages round-trip returned empty array." . PHP_EOL);
    exit(1);
}
if ($stored['layout'] !== $firstLayout) {
    fwrite(STDERR, "Test 1 FAILED: valid layout was altered. Got: " . ($stored['layout'] ?? 'null') . PHP_EOL);
    exit(1);
}
if ($stored['gutterColor'] !== '#ffffff') {
    fwrite(STDERR, "Test 1 FAILED: valid gutterColor was altered. Got: " . ($stored['gutterColor'] ?? 'null') . PHP_EOL);
    exit(1);
}
if (($stored['slots']['1'] ?? '') !== 'image.jpg') {
    fwrite(STDERR, "Test 1 FAILED: valid slot was altered." . PHP_EOL);
    exit(1);
}
if (abs(($stored['transforms']['1']['scale'] ?? 0) - 1.2) > 0.0001) {
    fwrite(STDERR, "Test 1 FAILED: valid transform scale was altered." . PHP_EOL);
    exit(1);
}
echo "Test 1 passed: valid page data is preserved without alteration." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 2: invalid gutterColor is replaced with the default (#cccccc)
// ---------------------------------------------------------------------------

$invalidColorPage = [
    'layout'     => $secondLayout,
    'gutterColor'=> 'not-a-color',
    'slots'      => [],
    'transforms' => [],
    'locked'     => false,
    'bubbles'    => [],
];

$model->setPages([$invalidColorPage]);
$stored = $model->getPages()[0] ?? null;

if ($stored === null) {
    fwrite(STDERR, "Test 2 FAILED: setPages returned null for invalid gutterColor." . PHP_EOL);
    exit(1);
}
if ($stored['gutterColor'] !== '#cccccc') {
    fwrite(STDERR, "Test 2 FAILED: invalid gutterColor was not replaced with #cccccc. Got: " . ($stored['gutterColor'] ?? 'null') . PHP_EOL);
    exit(1);
}
echo "Test 2 passed: invalid gutterColor is replaced with #cccccc." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 3: non-string slot values are dropped; valid string slots are kept
// ---------------------------------------------------------------------------

$badSlotsPage = [
    'layout'     => $firstLayout,
    'gutterColor'=> '#000000',
    'slots'      => ['1' => 'valid.jpg', '2' => null, '3' => 123],
    'transforms' => [],
    'locked'     => false,
    'bubbles'    => [],
];

$model->setPages([$badSlotsPage]);
$stored = $model->getPages()[0] ?? null;

if ($stored === null) {
    fwrite(STDERR, "Test 3 FAILED: setPages returned null for mixed slot types." . PHP_EOL);
    exit(1);
}
if (($stored['slots']['1'] ?? '') !== 'valid.jpg') {
    fwrite(STDERR, "Test 3 FAILED: valid string slot '1' was discarded." . PHP_EOL);
    exit(1);
}
if (array_key_exists('2', $stored['slots'])) {
    fwrite(STDERR, "Test 3 FAILED: null slot '2' was kept — should have been dropped." . PHP_EOL);
    exit(1);
}
if (array_key_exists('3', $stored['slots'])) {
    fwrite(STDERR, "Test 3 FAILED: integer slot '3' was kept — should have been dropped." . PHP_EOL);
    exit(1);
}
echo "Test 3 passed: non-string slot values are dropped; valid slots are preserved." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 4: locked flag round-trips correctly as a boolean
// ---------------------------------------------------------------------------

$lockedPage = [
    'layout'     => $firstLayout,
    'gutterColor'=> '#111111',
    'slots'      => [],
    'transforms' => [],
    'locked'     => true,
    'bubbles'    => [],
];

$model->setPages([$lockedPage]);
$stored = $model->getPages()[0] ?? null;

if ($stored === null || $stored['locked'] !== true) {
    fwrite(STDERR, "Test 4 FAILED: locked=true was lost during round-trip. Got: " . var_export($stored['locked'] ?? null, true) . PHP_EOL);
    exit(1);
}

// Also verify false is preserved
$unlockedPage = $lockedPage;
$unlockedPage['locked'] = false;
$model->setPages([$unlockedPage]);
$stored = $model->getPages()[0] ?? null;
if ($stored === null || $stored['locked'] !== false) {
    fwrite(STDERR, "Test 4 FAILED: locked=false was lost during round-trip." . PHP_EOL);
    exit(1);
}
echo "Test 4 passed: locked flag round-trips correctly as a boolean." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 5: non-finite transform values are replaced with safe defaults
// ---------------------------------------------------------------------------

$badTransformPage = [
    'layout'     => $firstLayout,
    'gutterColor'=> '#222222',
    'slots'      => ['1' => 'img.png'],
    'transforms' => ['1' => ['scale' => 'NaN', 'translateXPct' => 'inf', 'translateYPct' => null]],
    'locked'     => false,
    'bubbles'    => [],
];

$model->setPages([$badTransformPage]);
$stored = $model->getPages()[0] ?? null;

if ($stored === null) {
    fwrite(STDERR, "Test 5 FAILED: setPages returned null for bad transform values." . PHP_EOL);
    exit(1);
}
$t = $stored['transforms']['1'] ?? null;
if ($t === null) {
    fwrite(STDERR, "Test 5 FAILED: transform entry for slot '1' was dropped entirely." . PHP_EOL);
    exit(1);
}
if (abs($t['scale'] - 1.0) > 0.0001) {
    fwrite(STDERR, "Test 5 FAILED: non-finite scale was not replaced with 1.0. Got: " . var_export($t['scale'], true) . PHP_EOL);
    exit(1);
}
if (abs($t['translateXPct'] - 0.0) > 0.0001) {
    fwrite(STDERR, "Test 5 FAILED: non-finite translateXPct was not replaced with 0.0. Got: " . var_export($t['translateXPct'], true) . PHP_EOL);
    exit(1);
}
if (abs($t['translateYPct'] - 0.0) > 0.0001) {
    fwrite(STDERR, "Test 5 FAILED: null translateYPct was not replaced with 0.0. Got: " . var_export($t['translateYPct'], true) . PHP_EOL);
    exit(1);
}
echo "Test 5 passed: non-finite transform values are replaced with safe defaults." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 6: bubble metadata round-trips correctly
// ---------------------------------------------------------------------------

$pageWithBubbles = [
    'layout'     => $firstLayout,
    'gutterColor'=> '#333333',
    'slots'      => [],
    'transforms' => [],
    'locked'     => false,
    'bubbles'    => [
        '0' => [
            ['id' => 'b1', 'text' => 'Hello!', 'style' => 'speech', 'left' => '10%', 'top' => '20%', 'width' => '30%', 'height' => '15%'],
        ],
    ],
];

$model->setPages([$pageWithBubbles]);
$stored = $model->getPages()[0] ?? null;

if ($stored === null || !isset($stored['bubbles']['0'][0]['text'])) {
    fwrite(STDERR, "Test 6 FAILED: bubble metadata was lost during round-trip." . PHP_EOL);
    exit(1);
}
if ($stored['bubbles']['0'][0]['text'] !== 'Hello!') {
    fwrite(STDERR, "Test 6 FAILED: bubble text was corrupted. Got: " . ($stored['bubbles']['0'][0]['text'] ?? 'null') . PHP_EOL);
    exit(1);
}
echo "Test 6 passed: bubble metadata round-trips correctly." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 7: unknown layout name is replaced with the first known layout
// ---------------------------------------------------------------------------

$unknownLayoutPage = [
    'layout'     => 'does-not-exist',
    'gutterColor'=> '#444444',
    'slots'      => [],
    'transforms' => [],
    'locked'     => false,
    'bubbles'    => [],
];

$model->setPages([$unknownLayoutPage]);
$stored = $model->getPages()[0] ?? null;

if ($stored === null) {
    fwrite(STDERR, "Test 7 FAILED: setPages returned null for unknown layout." . PHP_EOL);
    exit(1);
}
if ($stored['layout'] !== $firstLayout) {
    fwrite(STDERR, "Test 7 FAILED: unknown layout was not replaced with the first known layout ('$firstLayout'). Got: " . ($stored['layout'] ?? 'null') . PHP_EOL);
    exit(1);
}
echo "Test 7 passed: unknown layout is replaced with the first known layout." . PHP_EOL;

echo "All schema validation tests passed." . PHP_EOL;
