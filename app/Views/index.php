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
            <?php
            // Collect all images assigned to panels in saved pages
            $assigned = [];
            if (!empty($pages)) {
                foreach ($pages as $page) {
                    if (!empty($page['slots'])) {
                        foreach ($page['slots'] as $imgName) {
                            $assigned[] = $imgName;
                        }
                    }
                }
            }
            foreach ($images as $img):
                if (!in_array($img, $assigned)):
            ?>
                <img src="/uploads/<?= htmlspecialchars($img) ?>" class="thumb" draggable="true" data-name="<?= htmlspecialchars($img) ?>" />
            <?php endif; endforeach; ?>
        </div>
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
    // On page load, restore images to their assigned panels
    window.addEventListener('DOMContentLoaded', () => {
        if (savedPages && Array.isArray(savedPages)) {
            savedPages.forEach((page, pageIdx) => {
                if (page.slots && Array.isArray(page.slots)) {
                    page.slots.forEach((imgName, slotIdx) => {
                        if (imgName) {
                            // Find the panel element for this page and slot
                            const panel = document.querySelector(`[data-page="${pageIdx}"][data-slot="${slotIdx}"]`);
                            if (panel) {
                                // Create image element and add to panel
                                const img = document.createElement('img');
                                img.src = `/uploads/${imgName}`;
                                img.className = 'thumb';
                                img.draggable = true;
                                img.dataset.name = imgName;
                                panel.innerHTML = '';
                                panel.appendChild(img);
                            }
                        }
                    });
                }
            });
        }
    });
</script>
<!-- html2canvas and jsPDF CDN -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="/js/app.js"></script>
</body>
</html>
