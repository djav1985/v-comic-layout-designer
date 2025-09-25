<?php
namespace App\Controllers;

use App\Models\ComicModel;

class TemplateController
{
    private ComicModel $model;

    public function __construct()
    {
        $this->model = new ComicModel();
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input) || !isset($input['overlays']) || !is_array($input['overlays'])) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Invalid payload']);
            return;
        }

        $saved = [];
        foreach ($input['overlays'] as $overlay) {
            if (!isset($overlay['name'], $overlay['dataUrl'])) {
                continue;
            }
            $name = trim((string) $overlay['name']);
            $dataUrl = (string) $overlay['dataUrl'];
            if ($name === '' || !str_starts_with($dataUrl, 'data:image/png;base64,')) {
                continue;
            }

            $binary = base64_decode(substr($dataUrl, strlen('data:image/png;base64,')));
            if ($binary === false) {
                continue;
            }

            $fileName = $this->model->saveOverlay($name, $binary);
            if ($fileName !== null) {
                $saved[] = $fileName;
            }
        }

        header('Content-Type: application/json');
        echo json_encode([
            'saved' => $saved,
        ]);
    }
}
