<?php
namespace App\Core;

class Database
{
    private \PDO $pdo;
    private string $dbPath;

    public function __construct()
    {
        // Better path resolution for Electron environment
        $this->dbPath = $this->resolveStoragePath();
        
        // Ensure storage directory exists
        $storageDir = dirname($this->dbPath);
        if (!is_dir($storageDir)) {
            if (!mkdir($storageDir, 0777, true) && !is_dir($storageDir)) {
                throw new \RuntimeException("Failed to create storage directory: {$storageDir}");
            }
        }
        
        // Verify directory is writable
        if (!is_writable($storageDir)) {
            throw new \RuntimeException("Storage directory is not writable: {$storageDir}");
        }
        
        try {
            $this->pdo = new \PDO('sqlite:' . $this->dbPath);
            $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $this->initSchema();
        } catch (\Exception $e) {
            throw new \RuntimeException("Failed to initialize database at {$this->dbPath}: " . $e->getMessage());
        }
    }

    private function resolveStoragePath(): string
    {
        // Check if running in Electron environment
        if (isset($_ENV['ELECTRON_APP']) || getenv('ELECTRON_APP')) {
            // In Electron, use a user data directory for persistence
            $userDataDir = $this->getElectronUserDataPath();
            return $userDataDir . DIRECTORY_SEPARATOR . 'state.db';
        }
        
        // Default path for regular web server
        return __DIR__ . '/../../public/storage/state.db';
    }

    private function getElectronUserDataPath(): string
    {
        // Try to get user data path from environment or use fallback
        if ($userDataPath = getenv('ELECTRON_USER_DATA')) {
            return $userDataPath;
        }
        
        // Fallback to public/storage for now
        $storageDir = __DIR__ . '/../../public/storage';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0777, true);
        }
        return $storageDir;
    }

    private function initSchema(): void
    {
        $this->pdo->exec('
            CREATE TABLE IF NOT EXISTS state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )
        ');
        
        // Initialize default state if empty
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM state');
        $stmt->execute();
        if ($stmt->fetchColumn() == 0) {
            $defaultState = [
                'images' => [],
                'pages' => [],
                'pageCount' => 0
            ];
            $this->setState($defaultState);
        }
    }

    public function getState(): array
    {
        $stmt = $this->pdo->prepare('SELECT key, value FROM state');
        $stmt->execute();
        
        $state = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $state[$row['key']] = json_decode($row['value'], true);
        }
        
        // Ensure default structure
        return array_merge([
            'images' => [],
            'pages' => [],
            'pageCount' => 0
        ], $state);
    }

    public function setState(array $state): void
    {
        $this->pdo->beginTransaction();
        try {
            $timestamp = time();
            foreach ($state as $key => $value) {
                $stmt = $this->pdo->prepare('
                    INSERT OR REPLACE INTO state (key, value, updated_at) 
                    VALUES (?, ?, ?)
                ');
                $stmt->execute([$key, json_encode($value), $timestamp]);
            }
            $this->pdo->commit();
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function updateStateKey(string $key, $value): void
    {
        $stmt = $this->pdo->prepare('
            INSERT OR REPLACE INTO state (key, value, updated_at) 
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$key, json_encode($value), time()]);
    }

    public function getStateKey(string $key, $default = null)
    {
        $stmt = $this->pdo->prepare('SELECT value FROM state WHERE key = ?');
        $stmt->execute([$key]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($result) {
            return json_decode($result['value'], true);
        }
        
        return $default;
    }

    public function getDbPath(): string
    {
        return $this->dbPath;
    }

    public function getLastModified(): int
    {
        $stmt = $this->pdo->prepare('SELECT MAX(updated_at) FROM state');
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }
}