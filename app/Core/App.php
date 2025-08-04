<?php
namespace App\Core;

class App
{
    public static function run(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $dispatcher = Router::getDispatcher();
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
                $controller = new $fqcn();
                call_user_func_array([$controller, $method], $vars);
                break;
        }
    }
}
