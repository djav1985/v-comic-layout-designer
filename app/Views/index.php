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
            <input type="file" name="image" id="imageInput" />
            <button type="submit">Upload</button>
        </form>
        <div id="imageList">
            <?php foreach ($images as $img): ?>
                <img src="/uploads/<?= htmlspecialchars($img) ?>" class="thumb" draggable="true" data-name="<?= htmlspecialchars($img) ?>" />
            <?php endforeach; ?>
        </div>
    </div>
    <div id="builder">
        <button id="addPage" type="button">Add Page</button>
        <form id="comicForm" method="post" action="/submit">
            <div id="pages"></div>
            <button id="generate" type="submit">Generate PDF</button>
        </form>
    </div>
</div>
<script>
const layouts = <?= json_encode(array_keys($layouts)) ?>;
const layoutTemplates = <?= json_encode($templates) ?>;
const savedPages = <?= json_encode($pages) ?>;
</script>
<script src="/js/app.js"></script>
</body>
</html>
