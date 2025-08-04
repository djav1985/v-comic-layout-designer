<?php
namespace App\Models;

class ComicModel
{
    private string $uploadDir;
    private string $layoutDir;

    public function __construct()
    {
        $this->uploadDir = __DIR__ . '/../../uploads';
        $this->layoutDir = __DIR__ . '/../../layouts';
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
    }

    public function getImages(): array
    {
        $files = [];
        foreach (glob($this->uploadDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE) as $file) {
            $files[] = basename($file);
        }
        return $files;
    }

    public function saveUpload(array $file): void
    {
        $name = basename($file['name']);
        move_uploaded_file($file['tmp_name'], $this->uploadDir . '/' . $name);
    }

    public function deleteImage(string $name): void
    {
        $path = $this->uploadDir . '/' . $name;
        if (is_file($path)) {
            unlink($path);
        }
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

    public function getPages(): array
    {
        if (!isset($_SESSION['pages'])) {
            $_SESSION['pages'] = [];
        }
        return $_SESSION['pages'];
    }

    public function renderLayout(string $layout, array $slots): string
    {
        $file = $this->layoutDir . '/' . $layout . '.php';
        if (!is_file($file)) {
            return '';
        }
        $html = file_get_contents($file);
        foreach ($slots as $index => $image) {
            $src = __DIR__ . '/../../uploads/' . $image;
            $imgTag = '<img src="' . $src . '" />';
            $html = str_replace('{{slot' . $index . '}}', $imgTag, $html);
        }
        // remove remaining placeholders
        $html = preg_replace('/{{slot\d+}}/', '', $html);
        return '<div class="page">' . $html . '</div>';
    }
}
