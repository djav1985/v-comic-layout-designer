<?php
namespace App\Core;

use FastRoute\RouteCollector;
use function FastRoute\simpleDispatcher;

class Router
{
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
        });
    }

    public static function run(): void
    {
        // Handle session configuration for Electron environment
        if (session_status() === PHP_SESSION_NONE) {
            // Configure session for Electron environment
            if (isset($_ENV['ELECTRON_APP']) || getenv('ELECTRON_APP')) {
                // Use file-based sessions with a secure path
                $sessionPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'v-comic-sessions';
                if (!is_dir($sessionPath)) {
                    mkdir($sessionPath, 0700, true);
                }
                session_save_path($sessionPath);
                session_name('v_comic_session');
            }
            
            session_start();
        }
        
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
                
                try {
                    if (!class_exists($fqcn)) {
                        throw new \Exception("Controller class {$fqcn} not found");
                    }
                    
                    $controller = new $fqcn();
                    
                    if (!method_exists($controller, $method)) {
                        throw new \Exception("Method {$method} not found in {$fqcn}");
                    }
                    
                    call_user_func_array([$controller, $method], $vars);
                } catch (\Throwable $e) {
                    error_log('Router error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
                    http_response_code(500);
                    
                    // More detailed error in development
                    if (getenv('APP_ENV') === 'development') {
                        echo 'Error: ' . $e->getMessage();
                    } else {
                        echo 'Something broke.';
                    }
                }
                break;
        }
    }
}
