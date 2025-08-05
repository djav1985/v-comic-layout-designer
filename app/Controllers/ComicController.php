<?php
namespace App\Controllers;

use App\Models\ComicModel;
use Mpdf\Mpdf;

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
        $styles = $this->model->getLayoutStyles();
        $pages = $this->model->getPages();
        include __DIR__ . '/../Views/index.php';
    }

    public function savePages(): void
    {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $pages = $data['pages'] ?? [];
    $this->model->setPages($pages);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok']);
    }

    public function handleUpload(): void
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
            $transforms = [];
            $gutterColor = $page['gutterColor'] ?? '#fffbe6';
            if (!empty($page['transforms']) && is_array($page['transforms'])) {
                foreach ($page['transforms'] as $slot => $json) {
                    if (is_string($json)) {
                        $transforms[$slot] = json_decode($json, true) ?? [];
                    }
                }
            }
            // Render the entire layout as a single page, with gutter color and page break
            $html .= '<div style="background:' . htmlspecialchars($gutterColor) . '; width:100%; height:100%; page-break-after:always; overflow:hidden; position:relative;">';
            $html .= $this->model->renderLayout($layout, $slots, $transforms);
            $html .= '</div>';
        }
        $mpdf = new Mpdf(['format' => 'A4']);
        $mpdf->WriteHTML($html);
        $filename = 'comic-' . time() . '.pdf';
        $path = __DIR__ . '/../../public/generated/' . $filename;
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }
        $mpdf->Output($path, 'F');
        // Save last generatedDir to state
        $this->model->generatedDir = dirname($path);
        $this->model->saveState();
        header('Content-Type: application/json');
        echo json_encode(['file' => $filename]);
    }
}
