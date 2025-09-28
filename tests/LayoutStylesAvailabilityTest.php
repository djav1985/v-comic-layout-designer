<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Models\ComicModel;

$model = new ComicModel();
$layouts = $model->getLayouts();
$styles = $model->getLayoutStyles();

$missingCss = [];

foreach ($layouts as $name => $_file) {
    $css = $styles[$name] ?? '';
    if (trim($css) === '') {
        $missingCss[] = $name;
    }
}

if ($missingCss) {
    fwrite(
        STDERR,
        sprintf(
            "Layouts missing CSS definitions: %s%s",
            implode(', ', $missingCss),
            PHP_EOL
        )
    );
    exit(1);
}

echo "All layouts expose non-empty CSS definitions." . PHP_EOL;
