<?php
namespace App\Controllers;

use App\Models\ComicModel;

class UploadController
{
    private ComicModel $model;

    public function __construct()
    {
        $this->model = new ComicModel();
    }

    public function upload(): void
    {
        header('Content-Type: application/json');
        try {
            if (!empty($_FILES['images']['tmp_name'])) {
                foreach ($_FILES['images']['tmp_name'] as $i => $tmp) {
                    if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                        $file = [
                            'name' => $_FILES['images']['name'][$i],
                            'type' => $_FILES['images']['type'][$i],
                            'tmp_name' => $tmp,
                            'error' => $_FILES['images']['error'][$i],
                            'size' => $_FILES['images']['size'][$i],
                        ];
                        $this->model->saveUpload($file);
                    }
                }
            } elseif (!empty($_FILES['image']['tmp_name'])) {
                $this->model->saveUpload($_FILES['image']);
            }
            echo json_encode($this->model->getImages());
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
