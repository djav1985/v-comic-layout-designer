<?php
namespace App\Controllers;

use App\Core\Database;

class HealthController
{
    /**
     * GET /health – liveness probe.
     * Returns 200 as long as the PHP process is alive.
     */
    public function health(): void
    {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok']);
    }

    /**
     * GET /ready – readiness probe.
     * Verifies that the database file is accessible and that the uploads
     * directory is writable before reporting the application as ready.
     */
    public function ready(): void
    {
        header('Content-Type: application/json');

        $checks = [];
        $ok = true;

        // Check database accessibility
        try {
            $db = new Database();
            $dbPath = $db->getDbPath();
            $checks['database'] = is_file($dbPath) && is_readable($dbPath) ? 'ok' : 'unreachable';
        } catch (\Throwable $e) {
            $checks['database'] = 'error: ' . $e->getMessage();
        }

        if ($checks['database'] !== 'ok') {
            $ok = false;
        }

        // Check uploads directory writability
        $uploadsDir = __DIR__ . '/../../public/uploads';
        if (!is_dir($uploadsDir)) {
            if (!mkdir($uploadsDir, 0775, true) && !is_dir($uploadsDir)) {
                $checks['uploads'] = 'creation_failed';
                $ok = false;
                http_response_code(503);
                echo json_encode([
                    'status' => 'not_ready',
                    'checks' => $checks,
                ]);
                return;
            }
        }
        $checks['uploads'] = is_dir($uploadsDir) && is_writable($uploadsDir) ? 'ok' : 'not_writable';
        if ($checks['uploads'] !== 'ok') {
            $ok = false;
        }

        http_response_code($ok ? 200 : 503);
        echo json_encode([
            'status' => $ok ? 'ready' : 'not_ready',
            'checks' => $checks,
        ]);
    }
}
