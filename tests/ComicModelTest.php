<?php

namespace Tests;

use App\Models\ComicModel;
use PHPUnit\Framework\TestCase;

class ComicModelTest extends TestCase
{
    private string $workspace;
    private ComicModel $model;

    protected function setUp(): void
    {
        $this->workspace = sys_get_temp_dir() . '/comic-model-test-' . uniqid('', true);
        $paths = [
            'uploadDir' => $this->workspace . '/uploads',
            'overlayDir' => $this->workspace . '/overlays',
            'stateFile' => $this->workspace . '/storage/state.json',
            'layoutDir' => __DIR__ . '/../layouts',
        ];
        $this->model = new ComicModel($paths);
    }

    protected function tearDown(): void
    {
        if (is_dir($this->workspace)) {
            $this->deleteDirectory($this->workspace);
        }
    }

    private function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $items = scandir($dir);
        if ($items === false) {
            return;
        }
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }

    public function testSaveUploadFromCliEnvironment(): void
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'upload');
        $this->assertNotFalse($tmpFile);
        file_put_contents($tmpFile, random_bytes(16));

        $this->model->saveUpload([
            'name' => 'example.png',
            'type' => 'image/png',
            'tmp_name' => $tmpFile,
            'error' => UPLOAD_ERR_OK,
            'size' => filesize($tmpFile),
        ]);

        $uploadedPath = $this->workspace . '/uploads/example.png';
        $this->assertFileExists($uploadedPath);
        $this->assertSame(['example.png'], $this->model->getImages());
    }

    public function testSaveUploadRejectsInvalidMimeType(): void
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'upload');
        $this->assertNotFalse($tmpFile);
        file_put_contents($tmpFile, 'not an image');

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid file type.');

        $this->model->saveUpload([
            'name' => 'example.txt',
            'type' => 'text/plain',
            'tmp_name' => $tmpFile,
            'error' => UPLOAD_ERR_OK,
            'size' => filesize($tmpFile),
        ]);
    }

    public function testSaveUploadRejectsOversizedFiles(): void
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'upload');
        $this->assertNotFalse($tmpFile);
        $size = 6 * 1024 * 1024; // 6MB
        $handle = fopen($tmpFile, 'wb');
        $this->assertNotFalse($handle);
        fseek($handle, $size - 1);
        fwrite($handle, '\0');
        fclose($handle);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('File too large.');

        $this->model->saveUpload([
            'name' => 'large.png',
            'type' => 'image/png',
            'tmp_name' => $tmpFile,
            'error' => UPLOAD_ERR_OK,
            'size' => $size,
        ]);
    }
}
