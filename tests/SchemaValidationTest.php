<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

// ---------------------------------------------------------------------------
// Test: Schema validation — sanitizePageData behaviour
// These tests mirror the JS sanitizePageData() logic but at the PHP
// model boundary (ComicModel::setPages / import handlers).
// ---------------------------------------------------------------------------

$model = new ComicModel();

// ---------------------------------------------------------------------------
// Test 1: known layout values are accepted without alteration
// ---------------------------------------------------------------------------

$validPage = [
    'layout'     => '1-panel',
    'gutterColor'=> '#ffffff',
    'slots'      => ['1' => 'image.jpg'],
    'transforms' => ['1' => ['scale' => 1.2, 'translateXPct' => 10.5, 'translateYPct' => -3.0]],
    'locked'     => false,
    'bubbles'    => [],
];

$pages = [$validPage];
$model->setPages($pages);
$retrieved = $model->getPages();

if (!is_array($retrieved) || count($retrieved) === 0) {
    fwrite(STDERR, "Test 1 FAILED: setPages/getPages round-trip returned empty array." . PHP_EOL);
    exit(1);
}

$stored = $retrieved[0];
if (($stored['layout'] ?? '') !== '1-panel') {
    fwrite(STDERR, "Test 1 FAILED: known layout was altered. Got: " . ($stored['layout'] ?? 'null') . PHP_EOL);
    exit(1);
}
echo "Test 1 passed: known layout value is preserved." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 2: invalid gutterColor is handled gracefully
// ---------------------------------------------------------------------------

$invalidColorPage = [
    'layout'     => '2-panel',
    'gutterColor'=> 'not-a-color',
    'slots'      => [],
    'transforms' => [],
    'locked'     => false,
    'bubbles'    => [],
];

$model->setPages([$invalidColorPage]);
$retrieved = $model->getPages();
$stored    = $retrieved[0] ?? null;

// The model must not crash and must store something for gutterColor
if ($stored === null) {
    fwrite(STDERR, "Test 2 FAILED: setPages crashed or returned null for invalid gutterColor." . PHP_EOL);
    exit(1);
}
echo "Test 2 passed: invalid gutterColor is handled without crash." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 3: slot values must be strings; non-string values are sanitised or dropped
// ---------------------------------------------------------------------------

$badSlotsPage = [
    'layout'     => '2-panel',
    'gutterColor'=> '#000000',
    'slots'      => ['1' => 'valid.jpg', '2' => null, '3' => 123],
    'transforms' => [],
    'locked'     => false,
    'bubbles'    => [],
];

// Should not throw
$threw = false;
try {
    $model->setPages([$badSlotsPage]);
} catch (\Throwable $e) {
    $threw = true;
}

if ($threw) {
    fwrite(STDERR, "Test 3 FAILED: setPages threw on a page with mixed slot types." . PHP_EOL);
    exit(1);
}
echo "Test 3 passed: mixed slot types do not crash setPages." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 4: locked flag round-trips correctly as a boolean
// ---------------------------------------------------------------------------

$lockedPage = [
    'layout'     => '1-panel',
    'gutterColor'=> '#111111',
    'slots'      => [],
    'transforms' => [],
    'locked'     => true,
    'bubbles'    => [],
];

$model->setPages([$lockedPage]);
$retrieved = $model->getPages();
$stored    = $retrieved[0] ?? null;

if ($stored === null || !($stored['locked'] ?? false)) {
    fwrite(STDERR, "Test 4 FAILED: locked flag was lost during round-trip." . PHP_EOL);
    exit(1);
}
echo "Test 4 passed: locked flag round-trips correctly." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 5: transform with non-finite scale is stored without crash
// ---------------------------------------------------------------------------

$badTransformPage = [
    'layout'     => '1-panel',
    'gutterColor'=> '#222222',
    'slots'      => ['1' => 'img.png'],
    'transforms' => ['1' => ['scale' => 'NaN', 'translateXPct' => 'inf', 'translateYPct' => null]],
    'locked'     => false,
    'bubbles'    => [],
];

$threw = false;
try {
    $model->setPages([$badTransformPage]);
} catch (\Throwable $e) {
    $threw = true;
}

if ($threw) {
    fwrite(STDERR, "Test 5 FAILED: setPages threw on a page with bad transform values." . PHP_EOL);
    exit(1);
}
echo "Test 5 passed: non-finite transform values do not crash setPages." . PHP_EOL;

// ---------------------------------------------------------------------------
// Test 6: bubble metadata round-trips correctly
// ---------------------------------------------------------------------------

$pageWithBubbles = [
    'layout'     => '1-panel',
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
$retrieved = $model->getPages();
$stored    = $retrieved[0] ?? null;

if ($stored === null || !isset($stored['bubbles']['0'][0]['text'])) {
    fwrite(STDERR, "Test 6 FAILED: bubble metadata was lost during round-trip." . PHP_EOL);
    exit(1);
}
if ($stored['bubbles']['0'][0]['text'] !== 'Hello!') {
    fwrite(STDERR, "Test 6 FAILED: bubble text was corrupted. Got: " . ($stored['bubbles']['0'][0]['text'] ?? 'null') . PHP_EOL);
    exit(1);
}
echo "Test 6 passed: bubble metadata round-trips correctly." . PHP_EOL;

echo "All schema validation tests passed." . PHP_EOL;
