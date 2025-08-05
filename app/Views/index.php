<?php /** @var array $images */ ?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Comic Layout Designer</title>
    <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
<div id="container">
    <div id="images">
        <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" name="images[]" id="imageInput" multiple />
            <button type="submit">Upload</button>
        </form>
        <div id="imageList">
            <!-- Images will be loaded by JavaScript -->
        </div>
    </div>
    <div id="builder">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 10px;">
            <button id="addPage" type="button">Add Page</button>
            <small style="color: #666; font-style: italic;">
                💡 Tips: Ctrl+S to save, Ctrl+N for new page, Ctrl+E to export PDF, Ctrl+I to export images, Ctrl+D to debug layouts, scroll wheel to zoom images
            </small>
        </div>
        <div id="pages"></div>
        <button id="exportPdf" type="button" style="margin-top:16px;">Export PDF</button>
        <button id="exportImages" type="button" style="margin-top:16px; margin-left:10px;">Export Images</button>
    </div>
</div>
<script>
const layouts = <?= json_encode(array_keys($layouts)) ?>;
const layoutTemplates = <?= json_encode($templates) ?>;
const layoutStyles = <?= json_encode($styles) ?>;
const savedPages = <?= json_encode($pages) ?>;
    const initialImages = <?= json_encode($images) ?>;
</script>
<!-- html2canvas and jsPDF CDN -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="/js/app.js"></script>
</body>
</html>
