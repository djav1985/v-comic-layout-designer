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

    public function getUploadDirectory(): string
    {
        return $this->uploadDir;
    }

    public function getStateSnapshot(): array
    {
        return $this->state;
    }

    public function listImageFiles(): array
    {
        $files = [];
        if (is_dir($this->uploadDir)) {
            foreach (glob($this->uploadDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE) as $file) {
                if (is_file($file)) {
                    $files[] = $file;
                }
            }
        }

        return $files;
    }

    public function getImages(): array
    {
        $files = [];
        foreach (glob($this->uploadDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE) as $file) {
            $files[] = basename($file);
        }
        return $files;
    }

    /**
     * Sync the images list in state to match the actual files on disk and persist it.
     * Use this after operations that modify the upload directory.
     */
    public function syncImagesFromDisk(): array
    {
        $files = $this->getImages();
        $this->state['images'] = $files;
        $this->saveState();
        return $files;
    }

    private function removeAllUploads(): void
    {
        if (!is_dir($this->uploadDir)) {
            return;
        }

        foreach (glob($this->uploadDir . '/*') as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
    }

    public function saveUpload(array $file): void
    {
        $maxSize = 5 * 1024 * 1024; // 5 MB

        if ($file['size'] > $maxSize) {
            throw new \Exception('File too large.');
        }

        if (!is_uploaded_file($file['tmp_name'])) {
            throw new \Exception('Upload failed.');
        }

        // Inspect actual file content – never trust the client-supplied MIME type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($file['tmp_name']);

        $mimeToExtension = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/gif'  => 'gif',
        ];

        if (!array_key_exists($detectedMime, $mimeToExtension)) {
            throw new \Exception('Invalid file type.');
        }

        // Derive expected extension from the original filename and cross-check
        $originalExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $canonicalExt = $mimeToExtension[$detectedMime];
        // Accept 'jpeg' as an alias for 'jpg'
        if ($originalExt === 'jpeg') {
            $originalExt = 'jpg';
        }
        if ($originalExt !== $canonicalExt) {
            throw new \Exception('File extension does not match detected content type.');
        }

        // Generate a unique server-side filename to prevent collisions and path traversal
        $uniqueName = bin2hex(random_bytes(16)) . '.' . $canonicalExt;
        $target = $this->uploadDir . '/' . $uniqueName;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            throw new \Exception('Failed to save file.');
        }

        $this->state['images'][] = $uniqueName;
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

    public function resetState(): array
    {
        $this->removeAllUploads();

        $this->state = [
            'images' => [],
            'pages' => [],
            'pageCount' => 0,
        ];

        $this->saveState();

        return $this->state;
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
        $sanitized = [];
        foreach ($pages as $page) {
            if (is_array($page)) {
                $sanitized[] = $this->sanitizePage($page);
            }
        }
        $this->state['pages'] = $sanitized;
        $this->state['pageCount'] = count($sanitized);
        $this->saveState();
    }

    /**
     * Validate and repair a single page array at the schema boundary.
     * Mirrors the JS sanitizePageData() logic so the PHP and JS layers
     * apply the same rules when reading state from untrusted sources.
     *
     * Both array and stdClass values are accepted for 'slots', 'transforms',
     * and 'bubbles' to accommodate data before a JSON DB round-trip (which
     * would otherwise normalise everything to associative arrays).
     */
    public function sanitizePage(array $raw): array
    {
        // Validate layout name against the layouts available on disk.
        $knownLayouts = array_keys($this->getLayouts());
        $layout = $raw['layout'] ?? '';
        if (!is_string($layout) || !in_array($layout, $knownLayouts, true)) {
            if (empty($knownLayouts)) {
                trigger_error(
                    'ComicModel::sanitizePage(): no layouts found in layout directory; ' .
                    'pages cannot be given a valid layout.',
                    E_USER_WARNING
                );
                $layout = '';
            } else {
                $layout = $knownLayouts[0];
            }
        }

        // Validate gutterColor as a 6-digit hex colour string.
        $gutterColor = $raw['gutterColor'] ?? '';
        if (!is_string($gutterColor) || !preg_match('/^#[0-9a-fA-F]{6}$/', $gutterColor)) {
            $gutterColor = '#cccccc';
        }

        // Normalise slots to an associative array, keeping only non-empty strings.
        $slotsRaw = isset($raw['slots']) ? (array)$raw['slots'] : [];
        $slots = [];
        foreach ($slotsRaw as $slot => $name) {
            if (is_string($name) && $name !== '') {
                $slots[(string)$slot] = $name;
            }
        }

        // Normalise transforms; each entry must have finite numeric values.
        $transformsRaw = isset($raw['transforms']) ? (array)$raw['transforms'] : [];
        $transforms = [];
        foreach ($transformsRaw as $slot => $t) {
            $t = is_object($t) ? (array)$t : $t;
            if (is_array($t)) {
                $scale = isset($t['scale']) && is_numeric($t['scale']) && is_finite((float)$t['scale'])
                    ? (float)$t['scale'] : 1.0;
                $tx = isset($t['translateXPct']) && is_numeric($t['translateXPct']) && is_finite((float)$t['translateXPct'])
                    ? (float)$t['translateXPct'] : 0.0;
                $ty = isset($t['translateYPct']) && is_numeric($t['translateYPct']) && is_finite((float)$t['translateYPct'])
                    ? (float)$t['translateYPct'] : 0.0;
                $transforms[(string)$slot] = [
                    'scale'         => $scale,
                    'translateXPct' => $tx,
                    'translateYPct' => $ty,
                ];
            }
        }

        // locked must be a boolean.
        $locked = isset($raw['locked']) ? (bool)$raw['locked'] : false;

        // bubbles: normalise stdClass → array so it serialises and round-trips correctly.
        $bubblesRaw = $raw['bubbles'] ?? [];
        if (is_object($bubblesRaw)) {
            $bubblesRaw = json_decode(json_encode($bubblesRaw), true) ?? [];
        }
        $bubbles = is_array($bubblesRaw) ? $bubblesRaw : [];

        return [
            'layout'      => $layout,
            'gutterColor' => $gutterColor,
            'slots'       => $slots,
            'transforms'  => $transforms,
            'locked'      => $locked,
            'bubbles'     => $bubbles,
        ];
    }

    public function getLastModified(): int
    {
        return $this->db->getLastModified();
    }

    public function importStateFromDatabase(string $databasePath): void
    {
        if (!is_file($databasePath)) {
            throw new \RuntimeException('State database file not found.');
        }

        $pdo = new \PDO('sqlite:' . $databasePath);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        // Check if the state table exists
        $tableCheckStmt = $pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='state'");
        $tableCheckStmt->execute();
        if (!$tableCheckStmt->fetch()) {
            throw new \RuntimeException('Invalid state database: missing required "state" table.');
        }

        $stmt = $pdo->prepare('SELECT key, value FROM state');
        $stmt->execute();
        $state = [];

        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $state[$row['key']] = json_decode($row['value'], true);
        }

        $pdo = null;

        $this->state = array_merge([
            'images' => [],
            'pages' => [],
            'pageCount' => 0,
        ], $state);

        $this->saveState();
    }

    public function replaceUploadsFromDirectory(string $sourceDir): void
    {
        $this->removeAllUploads();

        if (!is_dir($sourceDir)) {
            $this->state['images'] = [];
            $this->saveState();
            return;
        }

        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }

        $directoryIterator = new \DirectoryIterator($sourceDir);
        foreach ($directoryIterator as $fileInfo) {
            if ($fileInfo->isDot() || !$fileInfo->isFile()) {
                continue;
            }

            $extension = strtolower($fileInfo->getExtension());
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif'], true)) {
                continue;
            }

            $target = $this->uploadDir . DIRECTORY_SEPARATOR . $fileInfo->getFilename();
            copy($fileInfo->getPathname(), $target);
        }

        $this->syncImagesFromDisk();
    }
}
