<?php
namespace App\Controllers;

use App\Models\ComicModel;

class UploadController
{
    private const MAX_FILES_PER_REQUEST = 20;

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
                $fileCount = count($_FILES['images']['tmp_name']);
                if ($fileCount > self::MAX_FILES_PER_REQUEST) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Too many files in a single request.']);
                    return;
                }
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
