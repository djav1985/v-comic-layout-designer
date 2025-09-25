<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

$model = new ComicModel();
$templates = $model->getLayoutTemplates();

if (!$templates) {
    fwrite(STDERR, "ComicModel::getLayoutTemplates returned no templates." . PHP_EOL);
    exit(1);
}

foreach ($templates as $name => $markup) {
    $trimmed = trim($markup);

    if ($trimmed === '') {
        fwrite(STDERR, sprintf('Template "%s" rendered empty markup.%s', $name, PHP_EOL));
        exit(1);
    }

    if (str_contains($trimmed, '<?php')) {
        fwrite(STDERR, sprintf('Template "%s" still contains PHP tags after rendering.%s', $name, PHP_EOL));
        exit(1);
    }

    if (str_ends_with($trimmed, '</div>') === false) {
        fwrite(STDERR, sprintf('Template "%s" markup may be incomplete or malformed.%s', $name, PHP_EOL));
        exit(1);
    }
}

echo "ComicModel rendered layout templates successfully." . PHP_EOL;
