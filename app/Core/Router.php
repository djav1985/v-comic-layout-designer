<?php
namespace App\Core;

use FastRoute\RouteCollector;
use function FastRoute\simpleDispatcher;

class Router
{
    /** Routes that require CSRF token validation */
    private const CSRF_PROTECTED_ROUTES = [
        '/upload',
        '/delete-image',
        '/save-pages',
        '/state/reset',
        '/state/import',
    ];

    public static function getDispatcher()
    {
        return simpleDispatcher(function(RouteCollector $r) {
            $r->addRoute('GET', '/', ['HomeController', 'index']);
            $r->addRoute('POST', '/upload', ['UploadController', 'upload']);
            $r->addRoute('POST', '/delete-image', ['ImageController', 'delete']);
            $r->addRoute('POST', '/save-pages', ['PageController', 'save']);
            $r->addRoute('GET', '/get-pages', ['PageController', 'get']);
            $r->addRoute('GET', '/pages/stream', ['PageController', 'stream']);
            $r->addRoute('POST', '/state/reset', ['StateController', 'reset']);
            $r->addRoute('GET', '/state/export', ['StateController', 'export']);
            $r->addRoute('POST', '/state/import', ['StateController', 'import']);
            $r->addRoute('GET', '/health', ['HealthController', 'health']);
            $r->addRoute('GET', '/ready', ['HealthController', 'ready']);
        });
    }

    /**
     * Generate or retrieve the CSRF token for the current session.
     */
    public static function getCsrfToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    /**
     * Validate the CSRF token supplied by the client against the session token.
     * Accepts the token from the X-CSRF-Token header or a _csrf_token POST/body field.
     */
    public static function validateCsrfToken(): bool
    {
        $sessionToken = $_SESSION['csrf_token'] ?? '';
        if ($sessionToken === '') {
            return false;
        }

        // Prefer the custom header (JSON/fetch requests)
        $clientToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        // Fall back to a POST field (multipart and URL-encoded forms)
        if ($clientToken === '') {
            $clientToken = $_POST['_csrf_token'] ?? '';
        }

        if ($clientToken === '') {
            return false;
        }

        return hash_equals($sessionToken, $clientToken);
    }

    /**
     * Emit a structured log entry to the PHP error log.
     */
    public static function log(string $level, string $message, array $context = []): void
    {
        $requestId = $_SERVER['HTTP_X_REQUEST_ID'] ?? (defined('APP_REQUEST_ID') ? APP_REQUEST_ID : '');
        $route     = $_SERVER['REQUEST_URI'] ?? '';
        $method    = $_SERVER['REQUEST_METHOD'] ?? '';
        $entry     = json_encode(array_filter([
            'level'      => $level,
            'message'    => $message,
            'route'      => $method . ' ' . $route,
            'request_id' => $requestId,
        ] + $context), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        error_log($entry);
    }

    public static function run(): void
    {
        // Assign a per-request ID for log correlation
        if (!defined('APP_REQUEST_ID')) {
            define('APP_REQUEST_ID', bin2hex(random_bytes(8)));
        }

        // Security headers – emitted before any other output
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Ensure a CSRF token exists in the session for every request
        self::getCsrfToken();

        $dispatcher = self::getDispatcher();
        $httpMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        if (false !== $pos = strpos($uri, '?')) {
            $uri = substr($uri, 0, $pos);
        }
        $uri = rawurldecode($uri);
        $routeInfo = $dispatcher->dispatch($httpMethod, $uri);
        switch ($routeInfo[0]) {
            case \FastRoute\Dispatcher::NOT_FOUND:
                http_response_code(404);
                echo '404 Not Found';
                break;
            case \FastRoute\Dispatcher::METHOD_NOT_ALLOWED:
                http_response_code(405);
                echo '405 Method Not Allowed';
                break;
            case \FastRoute\Dispatcher::FOUND:
                [$class, $method] = $routeInfo[1];
                $vars = $routeInfo[2];
                $fqcn = 'App\\Controllers\\' . $class;

                // CSRF validation for mutating routes
                if ($httpMethod === 'POST' && in_array($uri, self::CSRF_PROTECTED_ROUTES, true)) {
                    if (!self::validateCsrfToken()) {
                        self::log('warning', 'CSRF token validation failed', ['uri' => $uri]);
                        http_response_code(403);
                        header('Content-Type: application/json');
                        echo json_encode(['error' => 'Invalid or missing CSRF token.']);
                        return;
                    }
                }
                
                try {
                    $controller = new $fqcn();
                    call_user_func_array([$controller, $method], $vars);
                } catch (\Throwable $e) {
                    self::log('error', $e->getMessage(), [
                        'file'  => $e->getFile(),
                        'line'  => $e->getLine(),
                        'class' => get_class($e),
                    ]);
                    http_response_code(500);
                    echo 'Something broke.';
                }
                break;
        }
    }
}
