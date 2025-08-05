<?php
namespace App\Controllers;

use App\Models\ComicModel;

class PageController
{
    private ComicModel $model;

    public function __construct()
    {
        $this->model = new ComicModel();
    }

    public function save(): void
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        $pages = $data['pages'] ?? [];
        
        // Preserve associative slot keys by converting to objects
        foreach ($pages as &$page) {
            if (isset($page['slots']) && is_array($page['slots'])) {
                $slots = new \stdClass();
                foreach ($page['slots'] as $k => $v) {
                    $slots->{(string)$k} = $v;
                }
                $page['slots'] = $slots;
            }
            if (isset($page['transforms']) && is_array($page['transforms'])) {
                $transforms = new \stdClass();
                foreach ($page['transforms'] as $k => $v) {
                    $transforms->{(string)$k} = $v;
                }
                $page['transforms'] = $transforms;
            }
        }
        unset($page);
        
        $this->model->setPages($pages);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok']);
    }

    public function get(): void
    {
        header('Content-Type: application/json');
        echo json_encode(['pages' => $this->model->getPages()]);
    }
}
