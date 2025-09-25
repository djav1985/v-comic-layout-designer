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

    public function stream(): void
    {
        ignore_user_abort(true);
        set_time_limit(0);

        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        $lastModified = null;

        echo "retry: 5000\n\n";
        @ob_flush();
        flush();

        $this->emitState($this->model->refreshStateFromDisk());
        $lastModified = $this->model->getLastModified();

        while (!connection_aborted()) {
            $currentModified = $this->model->getLastModified();
            if ($currentModified !== $lastModified) {
                $lastModified = $currentModified;
                $this->emitState($this->model->refreshStateFromDisk());
            }
            if (connection_aborted()) {
                break;
            }
            sleep(1);
        }
    }

    private function emitState(array $state): void
    {
        $payload = [
            'pages' => $state['pages'] ?? [],
            'pageCount' => $state['pageCount'] ?? 0,
            'timestamp' => time(),
        ];

        echo "event: pages\n";
        echo 'data: ' . json_encode($payload, JSON_UNESCAPED_UNICODE) . "\n\n";
        @ob_flush();
        flush();
    }
}
