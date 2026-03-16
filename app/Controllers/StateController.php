<?php
namespace App\Controllers;

use App\Models\ComicModel;

class StateController
{
    private ComicModel $model;

    public function __construct()
    {
        $this->model = new ComicModel();
    }

    public function reset(): void
    {
        header('Content-Type: application/json');

        try {
            $state = $this->model->resetState();
            $images = $this->model->getImages();

            echo json_encode([
                'status' => 'ok',
                'pages' => $state['pages'] ?? [],
                'images' => $images,
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function export(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'state_');
        if ($tempFile === false) {
            http_response_code(500);
            echo 'Failed to create temporary file.';
            return;
        }

        $archivePath = $tempFile . '.zip';
        if (!@rename($tempFile, $archivePath)) {
            @unlink($tempFile);
            http_response_code(500);
            echo 'Failed to prepare temporary archive.';
            return;
        }

        $zip = new \ZipArchive();
        if ($zip->open($archivePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            http_response_code(500);
            echo 'Unable to open archive for writing.';
            @unlink($archivePath);
            return;
        }

        $statePath = $this->model->getStateFilePath();
        if (is_file($statePath)) {
            $zip->addFile($statePath, 'state.db');
        }

        foreach ($this->model->listImageFiles() as $file) {
            $zip->addFile($file, 'uploads/' . basename($file));
        }

        $zip->close();

        header('Content-Type: application/zip');
        header('Content-Length: ' . filesize($archivePath));
        header(
            'Content-Disposition: attachment; filename="comic-state-' .
            date('Ymd-His') .
            '.zip"'
        );

        readfile($archivePath);
        unlink($archivePath);
    }

    public function import(): void
    {
        header('Content-Type: application/json');

        if (empty($_FILES['state']['tmp_name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No archive uploaded.']);
            return;
        }

        if (!is_uploaded_file($_FILES['state']['tmp_name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid upload.']);
            return;
        }

        $tmpPath = $_FILES['state']['tmp_name'];
        $zip = new \ZipArchive();
        if ($zip->open($tmpPath) !== true) {
            http_response_code(400);
            echo json_encode(['error' => 'Unable to open uploaded archive.']);
            return;
        }

        // Validate every entry for path traversal (zip-slip) before extraction
        $allowedEntryPattern = '/^[A-Za-z0-9_\-. \/]+$/';
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            if ($entryName === false) {
                continue;
            }
            // Reject absolute paths, dot-dot segments, or entries with shell-special characters
            if (
                str_starts_with($entryName, '/') ||
                str_contains($entryName, '..') ||
                !preg_match($allowedEntryPattern, $entryName)
            ) {
                $zip->close();
                http_response_code(400);
                echo json_encode(['error' => 'Archive contains unsafe file paths.']);
                return;
            }
        }

        $extractDir = sys_get_temp_dir() . '/state_' . bin2hex(random_bytes(8));
        if (!mkdir($extractDir, 0755, true) && !is_dir($extractDir)) {
            $zip->close();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create extraction directory.']);
            return;
        }

        try {
            if (!$zip->extractTo($extractDir)) {
                throw new \RuntimeException('Failed to extract archive contents.');
            }
        } catch (\Throwable $e) {
            $zip->close();
            $this->cleanupDirectory($extractDir);
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
            return;
        }

        $zip->close();

        // After extraction verify no file escaped the temp directory (defense-in-depth)
        $realExtractDir = realpath($extractDir);
        if ($realExtractDir === false) {
            $this->cleanupDirectory($extractDir);
            http_response_code(500);
            echo json_encode(['error' => 'Extraction directory could not be resolved.']);
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($realExtractDir, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $extractedFile) {
            // Reject any symlinks – they can bypass path containment checks
            if (is_link($extractedFile->getPathname())) {
                $this->cleanupDirectory($extractDir);
                http_response_code(400);
                echo json_encode(['error' => 'Archive contains unsafe file paths.']);
                return;
            }
            $realPath = realpath($extractedFile->getPathname());
            if ($realPath === false || !str_starts_with($realPath, $realExtractDir . DIRECTORY_SEPARATOR)) {
                $this->cleanupDirectory($extractDir);
                http_response_code(400);
                echo json_encode(['error' => 'Archive contains unsafe file paths.']);
                return;
            }
        }

        try {
            $dbPath = $this->findFileByName($realExtractDir, 'state.db');
            if (!$dbPath) {
                throw new \RuntimeException('Uploaded archive does not contain state.db.');
            }

            $uploadsDir = $this->findDirectoryByName($realExtractDir, 'uploads');

            $this->model->importStateFromDatabase($dbPath);
            $this->model->replaceUploadsFromDirectory($uploadsDir ?: '');

            $pages = $this->model->getPages();
            $images = $this->model->getImages();

            echo json_encode([
                'status' => 'ok',
                'pages' => $pages,
                'images' => $images,
            ]);
        } catch (\Throwable $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } finally {
            $this->cleanupDirectory($extractDir);
        }
    }

    private function cleanupDirectory(string $path): void
    {
        if (!is_dir($path)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isDir()) {
                @rmdir($item->getPathname());
            } else {
                @unlink($item->getPathname());
            }
        }

        @rmdir($path);
    }

    private function findFileByName(string $baseDir, string $fileName): ?string
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($baseDir, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && strtolower($file->getFilename()) === strtolower($fileName)) {
                return $file->getPathname();
            }
        }

        return null;
    }

    private function findDirectoryByName(string $baseDir, string $directoryName): ?string
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($baseDir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isDir() && strtolower($file->getFilename()) === strtolower($directoryName)) {
                return $file->getPathname();
            }
        }

        return null;
    }
}
