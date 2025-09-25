<?php

namespace App\Models;

class ComicModel
{
    public string $uploadDir;
    public string $layoutDir;
    private string $stateFile;
    private string $overlayDir;
    private array $state = [
        'images' => [],
        'pages' => [],
        'pageCount' => 0,
    ];

    /**
     * @param array{
     *     uploadDir?: string,
     *     layoutDir?: string,
     *     stateFile?: string,
     *     overlayDir?: string
     * }|null $paths
     */
    public function __construct(?array $paths = null)
    {
        $paths = $paths ?? [];
        $this->uploadDir = $paths['uploadDir'] ?? (__DIR__ . '/../../public/uploads');
        $this->layoutDir = $paths['layoutDir'] ?? (__DIR__ . '/../../layouts');
        $this->stateFile = $paths['stateFile'] ?? (__DIR__ . '/../../public/storage/state.json');
        $this->overlayDir = $paths['overlayDir'] ?? (__DIR__ . '/../../public/overlays');
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
        if (!is_dir(dirname($this->stateFile))) {
            mkdir(dirname($this->stateFile), 0777, true);
        }
        if (!is_dir($this->overlayDir)) {
            mkdir($this->overlayDir, 0777, true);
        }
        $this->loadState();
    }

    private function loadState(): void
    {
        if (is_file($this->stateFile)) {
            $json = file_get_contents($this->stateFile);
            $state = json_decode($json, true);
            if (is_array($state)) {
                $this->state = $state;
            }
        }
    }

    public function saveState(): void
    {
        file_put_contents($this->stateFile, json_encode($this->state, JSON_PRETTY_PRINT));
    }

    public function getImages(): array
    {
        // Sync state with actual files
        $files = [];
        foreach (glob($this->uploadDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE) as $file) {
            $files[] = basename($file);
        }
        $this->state['images'] = $files;
        $this->saveState();
        return $files;
    }

    public function saveUpload(array $file): void
    {
        $name = isset($file['name']) ? basename((string) $file['name']) : '';
        $tmpName = $file['tmp_name'] ?? '';
        $type = $file['type'] ?? '';
        $size = $file['size'] ?? 0;
        $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($error !== UPLOAD_ERR_OK) {
            throw new \Exception('Upload failed.');
        }
        if ($name === '') {
            throw new \Exception('Invalid file name.');
        }
        if (!is_string($tmpName) || $tmpName === '' || !is_file($tmpName)) {
            throw new \Exception('Upload failed.');
        }

        $target = $this->uploadDir . '/' . $name;
        $allowed = ['image/jpeg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB
        if (!in_array($type, $allowed, true)) {
            throw new \Exception('Invalid file type.');
        }
        if (!is_numeric($size) || $size > $maxSize) {
            throw new \Exception('File too large.');
        }
        $isCli = in_array(PHP_SAPI, ['cli', 'phpdbg'], true);
        $isUploadedFile = !$isCli && is_uploaded_file($tmpName);
        if (!$isCli && !$isUploadedFile) {
            throw new \Exception('Upload failed.');
        }

        $moved = false;
        if ($isUploadedFile) {
            $moved = move_uploaded_file($tmpName, $target);
        } else {
            $moved = @rename($tmpName, $target);
            if (!$moved) {
                $moved = copy($tmpName, $target);
                if ($moved) {
                    unlink($tmpName);
                }
            }
        }

        if (!$moved) {
            throw new \Exception('Failed to save file.');
        }

        $this->state['images'][] = $name;
        $this->saveState();
    }

    public function deleteImage(string $name): void
    {
        $path = $this->uploadDir . '/' . $name;
        if (is_file($path)) {
            unlink($path);
        }
        // Remove from state and persist
        $this->state['images'] = array_values(array_filter(
            $this->state['images'],
            fn($img) => $img !== $name
        ));
        $this->saveState();
    }

    public function getLayouts(): array
    {
        $layouts = [];
        foreach (glob($this->layoutDir . '/*.php') as $file) {
            $layouts[basename($file, '.php')] = $file;
        }
        return $layouts;
    }

    public function getLayoutTemplates(): array
    {
        $templates = [];
        foreach ($this->getLayouts() as $name => $file) {
            $templates[$name] = file_get_contents($file);
        }
        return $templates;
    }

    public function getLayoutStyles(): array
    {
        $styles = [];
        foreach ($this->getLayouts() as $name => $file) {
            $css = $this->layoutDir . '/' . $name . '.css';
            $styles[$name] = is_file($css) ? file_get_contents($css) : '';
        }
        return $styles;
    }

    public function getPages(): array
    {
        return $this->state['pages'] ?? [];
    }

    public function setPages(array $pages): void
    {
        $this->state['pages'] = $pages;
        $this->state['pageCount'] = count($pages);
        $this->saveState();
    }

    public function saveOverlay(string $name, string $binary): ?string
    {
        $safe = preg_replace('/[^a-z0-9\-]+/i', '-', strtolower($name));
        $safe = trim($safe, '-');
        if ($safe === '') {
            return null;
        }

        $path = $this->overlayDir . '/' . $safe . '.png';
        if (file_put_contents($path, $binary) === false) {
            return null;
        }

        return basename($path);
    }
}
