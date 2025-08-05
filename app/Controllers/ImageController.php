<?php
namespace App\Controllers;

use App\Models\ComicModel;

class ImageController
{
    private ComicModel $model;

    public function __construct()
    {
        $this->model = new ComicModel();
    }

    public function delete(): void
    {
        $name = $_POST['name'] ?? '';
        if ($name) {
            $this->model->deleteImage($name);
        }
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok']);
    }
}
