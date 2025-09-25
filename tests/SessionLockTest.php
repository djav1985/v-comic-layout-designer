<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Controllers\PageController;

session_start();
$_SESSION['dummy'] = 'value';

$controller = new PageController();

$reflection = new ReflectionClass(PageController::class);
$method = $reflection->getMethod('releaseSessionLock');
$method->setAccessible(true);

$statusBefore = session_status();

$method->invoke($controller);

$statusAfter = session_status();

if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

if ($statusBefore !== PHP_SESSION_ACTIVE) {
    fwrite(STDERR, "Expected session to be active before releasing the lock.\n");
    exit(1);
}

if ($statusAfter !== PHP_SESSION_NONE) {
    fwrite(STDERR, "Expected session lock to be released after invoking releaseSessionLock().\n");
    exit(1);
}

echo "Session lock released successfully.\n";
