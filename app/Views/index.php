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
        <div id="imageList"></div>
    </div>
    <div id="builder">
        <button id="addPage" type="button">Add Page</button>
        <div id="pages"></div>
        <button id="exportPdf" type="button" style="margin-top:16px;">Export PDF</button>
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
