<?php
namespace App\Models;

use App\Core\Database;

class ComicModel
{
    public string $uploadDir;
    public string $layoutDir;
    private Database $db;
    private array $state = [
        'images' => [],
        'pages' => [],
        'pageCount' => 0
    ];

    public function __construct()
    {
        $this->uploadDir = __DIR__ . '/../../public/uploads';
        $this->layoutDir = __DIR__ . '/../../layouts';
        $this->db = new Database();
        
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
        
        $this->loadState();
    }

    private function loadState(): void
    {
        $this->state = $this->db->getState();
    }

    public function saveState(): void
    {
        $this->db->setState($this->state);
    }

    public function refreshStateFromDisk(): array
    {
        $this->loadState();
        return $this->state;
    }

    public function getStateFilePath(): string
    {
        return $this->db->getDbPath();
    }

    public function getStateSnapshot(): array
    {
        return $this->state;
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
        $name = basename($file['name']);
        $target = $this->uploadDir . '/' . $name;
        $allowed = ['image/jpeg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB
        if (!in_array($file['type'], $allowed)) {
            throw new \Exception('Invalid file type.');
        }
        if ($file['size'] > $maxSize) {
            throw new \Exception('File too large.');
        }
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new \Exception('Upload failed.');
        }
        if (!move_uploaded_file($file['tmp_name'], $target)) {
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
            $templates[$name] = $this->renderLayoutTemplate($file);
        }
        return $templates;
    }

    private function renderLayoutTemplate(string $file): string
    {
        if (!is_file($file)) {
            return '';
        }

        $renderer = static function (string $__file__) {
            ob_start();
            include $__file__;
            return (string)ob_get_clean();
        };

        return $renderer($file);
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

    public function getLastModified(): int
    {
        return $this->db->getLastModified();
    }
}
