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
        // Better path resolution for Electron environment
        $this->uploadDir = $this->resolveUploadDir();
        $this->layoutDir = $this->resolveLayoutDir();
        
        try {
            $this->db = new Database();
        } catch (\Exception $e) {
            error_log("Failed to initialize database: " . $e->getMessage());
            throw $e;
        }
        
        // Ensure upload directory exists and is writable
        if (!is_dir($this->uploadDir)) {
            if (!mkdir($this->uploadDir, 0755, true) && !is_dir($this->uploadDir)) {
                throw new \RuntimeException("Failed to create upload directory: {$this->uploadDir}");
            }
        }
        
        if (!is_writable($this->uploadDir)) {
            throw new \RuntimeException("Upload directory is not writable: {$this->uploadDir}");
        }
        
        $this->loadState();
    }

    private function resolveUploadDir(): string
    {
        // Check if running in Electron environment
        if (isset($_ENV['ELECTRON_APP']) || getenv('ELECTRON_APP')) {
            // In Electron, use a user data directory for uploads
            $userDataDir = $this->getElectronUserDataPath();
            return $userDataDir . DIRECTORY_SEPARATOR . 'uploads';
        }
        
        // Default path for regular web server
        return __DIR__ . '/../../public/uploads';
    }

    private function resolveLayoutDir(): string
    {
        // Layouts directory should always be in the app structure
        return __DIR__ . '/../../layouts';
    }

    private function getElectronUserDataPath(): string
    {
        // Try to get user data path from environment or use fallback
        if ($userDataPath = getenv('ELECTRON_USER_DATA')) {
            return $userDataPath;
        }
        
        // Fallback to public directory
        $baseDir = __DIR__ . '/../../public';
        if (!is_dir($baseDir)) {
            mkdir($baseDir, 0777, true);
        }
        return $baseDir;
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
            foreach (glob($this->uploadDir . DIRECTORY_SEPARATOR . '*.{jpg,jpeg,png,gif}', GLOB_BRACE) as $file) {
                if (is_file($file)) {
                    $files[] = $file;
                }
            }
        }

        return $files;
    }

    public function getImages(): array
    {
        // Sync state with actual files
        $files = [];
        foreach (glob($this->uploadDir . DIRECTORY_SEPARATOR . '*.{jpg,jpeg,png,gif}', GLOB_BRACE) as $file) {
            $files[] = basename($file);
        }
        $this->state['images'] = $files;
        $this->saveState();
        return $files;
    }

    private function removeAllUploads(): void
    {
        if (!is_dir($this->uploadDir)) {
            return;
        }

        foreach (glob($this->uploadDir . DIRECTORY_SEPARATOR . '*') as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
    }

    public function saveUpload(array $file): void
    {
        $name = basename($file['name']);
        $target = $this->uploadDir . DIRECTORY_SEPARATOR . $name;
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
        $path = $this->uploadDir . DIRECTORY_SEPARATOR . $name;
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
        foreach (glob($this->layoutDir . DIRECTORY_SEPARATOR . '*.php') as $file) {
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
            $css = $this->layoutDir . DIRECTORY_SEPARATOR . $name . '.css';
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

        $this->getImages();
    }
}
