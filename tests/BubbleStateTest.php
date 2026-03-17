<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

$model = new ComicModel();
$model->resetState();

// ---- Test 1: Bubble metadata round-trips through setPages / getPages ----

$bubble = [
    'id'        => 'test-bubble-1',
    'text'      => 'Hello, world!',
    'xPct'      => 10.5,
    'yPct'      => 20.0,
    'widthPct'  => 30.0,
    'heightPct' => 15.0,
    'tail'      => 'bottom-left',
    'style'     => 'speech',
    'zIndex'    => 10,
];

$bubblesObj = new \stdClass();
$bubblesObj->{'1'} = [$bubble];

$testPages = [
    [
        'layout'      => 'two-horizontal',
        'gutterColor' => '#cccccc',
        'slots'       => new \stdClass(),
        'transforms'  => new \stdClass(),
        'locked'      => false,
        'bubbles'     => $bubblesObj,
    ],
];

$model->setPages($testPages);
// Create a fresh model to read from DB (simulates a real HTTP request cycle)
$freshModel = new ComicModel();
$retrieved = $freshModel->getPages();

if (empty($retrieved[0]['bubbles'])) {
    fwrite(STDERR, "Test 1 failed: bubbles field was not persisted." . PHP_EOL);
    exit(1);
}

$retrievedBubbles = $retrieved[0]['bubbles'];
// After DB round-trip, json_decode returns associative arrays
$slotBubbles = is_array($retrievedBubbles)
    ? ($retrievedBubbles['1'] ?? null)
    : null;

if (!is_array($slotBubbles) || count($slotBubbles) !== 1) {
    fwrite(STDERR, "Test 1 failed: expected 1 bubble in slot '1', got: " . json_encode($retrievedBubbles) . PHP_EOL);
    exit(1);
}

$rb = $slotBubbles[0];
if ($rb['id'] !== 'test-bubble-1' || $rb['text'] !== 'Hello, world!') {
    fwrite(STDERR, "Test 1 failed: bubble fields not preserved. Got: " . json_encode($rb) . PHP_EOL);
    exit(1);
}
if ((float)$rb['xPct'] !== 10.5 || (float)$rb['yPct'] !== 20.0 || (float)$rb['widthPct'] !== 30.0 || (float)$rb['heightPct'] !== 15.0) {
    fwrite(STDERR, "Test 1 failed: bubble percentage fields not preserved. Got: " . json_encode($rb) . PHP_EOL);
    exit(1);
}
if ($rb['style'] !== 'speech' || $rb['tail'] !== 'bottom-left' || $rb['zIndex'] !== 10) {
    fwrite(STDERR, "Test 1 failed: bubble style/tail/zIndex not preserved. Got: " . json_encode($rb) . PHP_EOL);
    exit(1);
}

echo "Test 1 passed: bubble metadata round-trips correctly." . PHP_EOL;

// ---- Test 2: Multiple bubbles per panel retain stable order ----

$model->resetState();
$bubble1 = ['id' => 'b1', 'text' => 'First',  'xPct' => 5.0,  'yPct' => 5.0,  'widthPct' => 40.0, 'heightPct' => 20.0, 'tail' => 'none', 'style' => 'speech',    'zIndex' => 10];
$bubble2 = ['id' => 'b2', 'text' => 'Second', 'xPct' => 50.0, 'yPct' => 5.0,  'widthPct' => 40.0, 'heightPct' => 20.0, 'tail' => 'none', 'style' => 'thought',   'zIndex' => 11];
$bubble3 = ['id' => 'b3', 'text' => 'Third',  'xPct' => 5.0,  'yPct' => 60.0, 'widthPct' => 90.0, 'heightPct' => 15.0, 'tail' => 'none', 'style' => 'narration', 'zIndex' => 12];

$multiObj = new \stdClass();
$multiObj->{'1'} = [$bubble1, $bubble2, $bubble3];

$model->setPages([[
    'layout'      => 'cover',
    'gutterColor' => '#cccccc',
    'slots'       => new \stdClass(),
    'transforms'  => new \stdClass(),
    'locked'      => false,
    'bubbles'     => $multiObj,
]]);

$retrieved2 = (new ComicModel())->getPages();
$slot1 = $retrieved2[0]['bubbles']['1'] ?? null;

if (!is_array($slot1) || count($slot1) !== 3) {
    fwrite(STDERR, "Test 2 failed: expected 3 bubbles, got: " . json_encode($slot1) . PHP_EOL);
    exit(1);
}

foreach (['b1', 'b2', 'b3'] as $i => $expectedId) {
    if (($slot1[$i]['id'] ?? null) !== $expectedId) {
        fwrite(STDERR, "Test 2 failed: bubble ordering broken at index $i. Got: " . json_encode($slot1) . PHP_EOL);
        exit(1);
    }
}

echo "Test 2 passed: multiple bubbles per panel retain stable order." . PHP_EOL;

// ---- Test 3: Locked page flag is preserved alongside bubble data ----

$model->resetState();

$lockObj = new \stdClass();
$lockObj->{'1'} = [['id' => 'b-locked', 'text' => 'Locked', 'xPct' => 5.0, 'yPct' => 5.0, 'widthPct' => 40.0, 'heightPct' => 20.0, 'tail' => 'none', 'style' => 'speech', 'zIndex' => 10]];

$model->setPages([[
    'layout'      => 'cover',
    'gutterColor' => '#cccccc',
    'slots'       => new \stdClass(),
    'transforms'  => new \stdClass(),
    'locked'      => true,
    'bubbles'     => $lockObj,
]]);

$retrieved3 = (new ComicModel())->getPages();
if (!($retrieved3[0]['locked'] ?? false)) {
    fwrite(STDERR, "Test 3 failed: locked flag not preserved." . PHP_EOL);
    exit(1);
}
if (empty($retrieved3[0]['bubbles']['1'])) {
    fwrite(STDERR, "Test 3 failed: bubbles not preserved on locked page." . PHP_EOL);
    exit(1);
}

echo "Test 3 passed: locked flag and bubbles coexist correctly." . PHP_EOL;

// ---- Test 4: Empty bubbles object is preserved ----

$model->resetState();

$emptyBubbles = new \stdClass();

$model->setPages([[
    'layout'      => 'cover',
    'gutterColor' => '#cccccc',
    'slots'       => new \stdClass(),
    'transforms'  => new \stdClass(),
    'locked'      => false,
    'bubbles'     => $emptyBubbles,
]]);

$retrieved4 = (new ComicModel())->getPages();
if (!array_key_exists('bubbles', $retrieved4[0])) {
    fwrite(STDERR, "Test 4 failed: bubbles key missing when stored empty." . PHP_EOL);
    exit(1);
}

echo "Test 4 passed: empty bubbles object is preserved." . PHP_EOL;

// Clean up
$model->resetState();

echo "All bubble state tests passed." . PHP_EOL;
