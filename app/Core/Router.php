<?php
namespace App\Core;

use FastRoute\RouteCollector;
use function FastRoute\simpleDispatcher;

class Router
{
    public static function getDispatcher()
    {
        return simpleDispatcher(function(RouteCollector $r) {
            $r->addRoute('GET', '/', ['ComicController', 'handleRequest']);
            $r->addRoute('POST', '/submit', ['ComicController', 'handleSubmission']);
            $r->addRoute('POST', '/upload', ['ComicController', 'handleUpload']);
            $r->addRoute('POST', '/delete-image', ['ComicController', 'deleteImage']);
        });
    }
}
