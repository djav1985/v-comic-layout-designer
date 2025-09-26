<?php
$publicDir = realpath(__DIR__);
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$requestedPath = rawurldecode($uri);

if ($requestedPath !== '/') {
    $fullPath = realpath($publicDir . DIRECTORY_SEPARATOR . ltrim($requestedPath, '/'));

    if (
        $fullPath !== false &&
        str_starts_with($fullPath, $publicDir . DIRECTORY_SEPARATOR) &&
        is_file($fullPath)
    ) {
        return false;
    }
}

require $publicDir . DIRECTORY_SEPARATOR . 'index.php';
