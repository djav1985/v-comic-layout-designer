<?php
namespace App\Controllers;

use App\Models\ComicModel;

class HomeController
{
    private ComicModel $model;

    public function __construct()
    {
        $this->model = new ComicModel();
    }

    public function index(): void
    {
        $images = $this->model->getImages();
        $layouts = $this->model->getLayouts();
        $templates = $this->model->getLayoutTemplates();
        $styles = $this->model->getLayoutStyles();
        $pages = $this->model->getPages();
        include __DIR__ . '/../Views/index.php';
    }
}
