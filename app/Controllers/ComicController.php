<?php
namespace App\Controllers;

use App\Models\ComicModel;
use Dompdf\Dompdf;

class ComicController
{
    private ComicModel $model;

    public function __construct()
    {
        $this->model = new ComicModel();
    }

    public function handleRequest(): void
    {
        $images = $this->model->getImages();
        $layouts = $this->model->getLayouts();
        $templates = $this->model->getLayoutTemplates();
        $pages = $this->model->getPages();
        include __DIR__ . '/../Views/index.php';
    }

    public function handleUpload(): void
    {
        if (!empty($_FILES['image']['tmp_name'])) {
            $this->model->saveUpload($_FILES['image']);
        }
        header('Content-Type: application/json');
        echo json_encode($this->model->getImages());
    }

    public function deleteImage(): void
    {
        $name = $_POST['name'] ?? '';
        if ($name) {
            $this->model->deleteImage($name);
        }
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok']);
    }

    public function handleSubmission(): void
    {
        $pages = $_POST['pages'] ?? [];
        $html = '';
        foreach ($pages as $page) {
            $layout = $page['layout'] ?? '';
            $slots = $page['slots'] ?? [];
            $html .= $this->model->renderLayout($layout, $slots);
        }
        $dompdf = new Dompdf(['isRemoteEnabled' => true]);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();
        $filename = 'comic-' . time() . '.pdf';
        $path = __DIR__ . '/../../storage/generated/' . $filename;
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }
        file_put_contents($path, $dompdf->output());
        header('Content-Type: application/json');
        echo json_encode(['file' => $filename]);
    }
}
