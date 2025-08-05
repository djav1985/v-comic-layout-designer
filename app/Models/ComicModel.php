<?php
namespace App\Models;

class ComicModel
{
    public string $uploadDir;
    public string $layoutDir;
    public string $generatedDir;
    private string $stateFile;
    private array $state = [
        'images' => [],
        'pages' => [],
        'pageCount' => 0
    ];

    public function __construct()
    {
        $this->uploadDir = __DIR__ . '/../../public/uploads';
        $this->layoutDir = __DIR__ . '/../../layouts';
        $this->generatedDir = __DIR__ . '/../../public/generated';
        $this->stateFile = __DIR__ . '/../../public/storage/state.json';
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
        if (!is_dir(dirname($this->stateFile))) {
            mkdir(dirname($this->stateFile), 0777, true);
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

    public function renderLayout(string $layout, array $slots, array $transforms = []): string
    {
        $file = $this->layoutDir . '/' . $layout . '.php';
        $cssFile = $this->layoutDir . '/' . $layout . '.css';
        if (!is_file($file)) {
            return '';
        }

        $html = file_get_contents($file);
        $css = is_file($cssFile) ? file_get_contents($cssFile) : '';

        $dom = new \DOMDocument();
        // suppress errors due to HTML5 tags
        libxml_use_internal_errors(true);
        $dom->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        foreach ($slots as $index => $image) {
            $xpath = new \DOMXPath($dom);
            $nodes = $xpath->query("//*[@data-slot='" . $index . "']");
            if ($nodes->length) {
                $img = $dom->createElement('img');
                // Use full URL for Dompdf
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost6';
                $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $imgUrl = $protocol . '://' . $host . '/uploads/' . $image;
                $img->setAttribute('src', $imgUrl);
                if (isset($transforms[$index])) {
                    $t = $transforms[$index];
                    $scale = $t['scale'] ?? 1;
                    $tx = $t['translateX'] ?? 0;
                    $ty = $t['translateY'] ?? 0;
                    $img->setAttribute('style', 'transform: translate(' . $tx . 'px, ' . $ty . 'px) scale(' . $scale . ');');
                }
                $nodes->item(0)->appendChild($img);
            }
        }

    $html = $dom->saveHTML();
    // Remove any page-breaks from inner HTML
    $html = str_replace('page-break-after:always;', '', $html);
    // Only outer wrapper gets page-break
    return '<div class="page" style="width:100%;height:100%;background:none;page-break-after:always;overflow:hidden;position:relative;"><style>' . $css . '</style>' . $html . '</div>';
    }
}
