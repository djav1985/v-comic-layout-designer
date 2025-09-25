<?php /** @var array $images */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Comic Layout Designer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
<div class="app-shell">
    <header class="app-header">
        <div class="brand">
            <span class="brand-mark">V</span>
            <div class="brand-copy">
                <h1>Comic Layout Designer</h1>
                <p>Craft beautifully balanced comic pages with a responsive, distraction-free workspace.</p>
            </div>
        </div>
        <div class="header-actions">
            <button id="exportPdf" type="button" class="ghost">Export PDF</button>
            <button id="exportImages" type="button" class="ghost">Export Images</button>
            <button id="resetWorkspace" type="button" class="ghost danger">Reset Workspace</button>
            <button id="saveState" type="button" class="ghost">Save State</button>
            <button id="loadState" type="button" class="ghost">Load State</button>
            <input type="file" id="loadStateInput" accept="application/zip" hidden />
        </div>
    </header>
    <main class="app-main">
        <section id="images" aria-label="Image library">
            <div class="card-header">
                <div>
                    <h2>Asset Library</h2>
                    <p class="subtitle">Upload, curate, and reuse artwork across your spreads.</p>
                </div>
            </div>
            <form id="uploadForm" enctype="multipart/form-data">
                <label for="imageInput" class="field-label">Upload artwork</label>
                <input type="file" name="images[]" id="imageInput" multiple />
                <button type="submit" class="primary">Add to library</button>
            </form>
            <div id="imageList" aria-live="polite">
                <div class="empty-state" data-placeholder>
                    <span class="icon">🖼️</span>
                    <p>Drop panels into your story by uploading artwork.</p>
                </div>
            </div>
        </section>
        <section id="builder" aria-label="Page builder">
            <div class="workspace-toolbar">
                <div>
                    <h2>Storyboard Workspace</h2>
                    <p class="subtitle">Arrange layouts, fine-tune gutters, and drag assets into each panel.</p>
                </div>
                <div class="toolbar-actions">
                    <button id="addPage" type="button" class="primary">Add Page</button>
                    <button id="toggleShortcuts" type="button" class="ghost" aria-expanded="false" aria-controls="shortcutList">Show Shortcuts</button>
                </div>
            </div>
            <ul id="shortcutList" class="shortcuts" aria-hidden="true">
                <li><span>Ctrl + S</span>Quick save</li>
                <li><span>Ctrl + N</span>New page</li>
                <li><span>Ctrl + E</span>Export PDF</li>
                <li><span>Ctrl + I</span>Export images</li>
                <li><span>Scroll</span>Zoom artwork</li>
            </ul>
            <div id="pages"></div>
        </section>
    </main>
</div>
<script>
const layouts = <?= json_encode(array_keys($layouts)) ?>;
const layoutTemplates = <?= json_encode($templates) ?>;
const layoutStyles = <?= json_encode($styles) ?>;
const savedPages = <?= json_encode($pages) ?>;
const initialImages = <?= json_encode($images) ?>;
</script>
<!-- jsPDF CDN -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="/js/app.js"></script>
</body>
</html>
