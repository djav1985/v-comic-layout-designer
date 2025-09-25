<?php

require __DIR__ . '/../vendor/autoload.php';

libxml_use_internal_errors(true);

$layoutFiles = glob(__DIR__ . '/../layouts/*.php');
$failures = [];

foreach ($layoutFiles as $layoutFile) {
    ob_start();
    include $layoutFile;
    $markup = trim(ob_get_clean());

    if ($markup === '') {
        $failures[] = sprintf('Layout %s rendered no markup.', basename($layoutFile));
        continue;
    }

    $document = new DOMDocument();
    $wrapped = '<!DOCTYPE html><html><body>' . $markup . '</body></html>';
    if (!$document->loadHTML($wrapped, LIBXML_NOERROR | LIBXML_NOWARNING)) {
        $failures[] = sprintf('Layout %s markup could not be parsed as HTML.', basename($layoutFile));
        continue;
    }

    $xpath = new DOMXPath($document);
    $panels = $xpath->query('//*[contains(concat(" ", normalize-space(@class), " "), " panel ")]');

    if (!$panels || !$panels->length) {
        $failures[] = sprintf('Layout %s did not render any .panel elements.', basename($layoutFile));
        continue;
    }

    foreach ($panels as $panel) {
        $inner = $xpath->query('.//*[contains(concat(" ", normalize-space(@class), " "), " panel-inner ")]', $panel);
        if (!$inner || !$inner->length) {
            $failures[] = sprintf(
                'Panel with slot "%s" in %s is missing a .panel-inner container.',
                $panel->getAttribute('data-slot') ?: '(unknown)',
                basename($layoutFile)
            );
        }

        $clipPolygon = trim($panel->getAttribute('data-clip-polygon'));
        if ($clipPolygon !== '') {
            if (stripos($clipPolygon, 'polygon(') !== 0) {
                $failures[] = sprintf(
                    'Panel with slot "%s" in %s has an invalid data-clip-polygon value: %s',
                    $panel->getAttribute('data-slot') ?: '(unknown)',
                    basename($layoutFile),
                    $clipPolygon
                );
            }

            $maskSvg = $xpath->query('.//svg[contains(concat(" ", normalize-space(@class), " "), " panel-mask ")]', $panel);
            if (!$maskSvg || !$maskSvg->length) {
                $failures[] = sprintf(
                    'Panel with slot "%s" in %s declares a clip polygon but has no inline SVG mask.',
                    $panel->getAttribute('data-slot') ?: '(unknown)',
                    basename($layoutFile)
                );
            }
        }
    }
}

if ($failures) {
    foreach ($failures as $failure) {
        fwrite(STDERR, $failure . PHP_EOL);
    }
    exit(1);
}

echo "All layout templates include panel-inner containers and SVG masks where required." . PHP_EOL;
