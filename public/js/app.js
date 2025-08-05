    function savePagesState() {
        // Collect page state from DOM
        const pages = [];
        document.querySelectorAll('#pages > .page').forEach(pageDiv => {
            const layout = pageDiv.querySelector('select').value;
            const gutterColorInput = pageDiv.querySelector('input[type="color"]');
            const gutterColor = gutterColorInput ? gutterColorInput.value : '#cccccc';
            const slots = {};
            const transforms = {};
            pageDiv.querySelectorAll('.panel').forEach(panel => {
                const slot = panel.getAttribute('data-slot');
                const img = panel.querySelector('img');
                if (img) {
                    slots[slot] = img.dataset.name;
                    transforms[slot] = {
                        scale: img.dataset.scale || 1,
                        translateX: img.dataset.translateX || 0,
                        translateY: img.dataset.translateY || 0
                    };
                }
            });
            pages.push({ layout, gutterColor, slots, transforms });
        });
        fetch('/save-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages, pageCount: pages.length })
        });
    }
window.addEventListener('DOMContentLoaded', () => {
    const imageList = document.getElementById('imageList');
    let pageCounter = 0;

    function enableImageControls(img, hiddenInput, initial = {}) {
        let scale = parseFloat(initial.scale || 1);
        let translateX = parseFloat(initial.translateX || 0);
        let translateY = parseFloat(initial.translateY || 0);

        function updateTransform() {
            img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            img.dataset.scale = scale;
            img.dataset.translateX = translateX;
            img.dataset.translateY = translateY;
            if (hiddenInput) {
                hiddenInput.value = JSON.stringify({ scale, translateX, translateY });
            }
        }

        img.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            scale = Math.min(3, Math.max(0.5, scale + delta));
            updateTransform();
            savePagesState();
        });

        let dragging = false;
        let startX, startY;
        img.addEventListener('mousedown', e => {
            e.preventDefault();
            dragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        });

        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        });

        document.addEventListener('mouseup', () => {
            if (dragging) {
                dragging = false;
                savePagesState();
            }
        });

        updateTransform();
    }

    function returnImagesFromPage(container) {
        container.querySelectorAll('.panel img').forEach(img => {
            img.className = 'thumb';
            img.draggable = true;
            imageList.appendChild(img);
        });
        container.querySelectorAll('input[type="hidden"]').forEach(i => i.remove());
    }

    imageList.addEventListener('dragstart', e => {
        if (e.target.classList.contains('thumb')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.name);
        }
    });

    function ensureLayoutStyle(name) {
        if (document.getElementById('style-' + name)) return;
        const style = document.createElement('style');
        style.id = 'style-' + name;
        style.textContent = layoutStyles[name] || '';
        document.head.appendChild(style);
    }

    function renderLayout(container, layoutName, pageIndex, slots = {}, transforms = {}) {
        // Debug: log template and name
        console.log('Rendering layout:', layoutName, layoutTemplates[layoutName]);
        // If template is undefined, show error
        if (!layoutTemplates[layoutName]) {
            container.innerHTML = `<div style='color:red'>Layout template not found: ${layoutName}</div>`;
            return;
        }
        // Inject HTML, handling possible escaping
        container.innerHTML = layoutTemplates[layoutName];
        ensureLayoutStyle(layoutName);
        // Set gutter color on .layout div
        const layoutDiv = container.querySelector('.layout');
        if (layoutDiv) {
            // Find gutter color from parent page
            let gutterColor = '#cccccc';
            const pageDiv = container.closest('.page');
            if (pageDiv) {
                const colorInput = pageDiv.querySelector('input[type="color"]');
                if (colorInput) gutterColor = colorInput.value;
            }
            layoutDiv.style.background = gutterColor;
        }
        container.querySelectorAll('.panel').forEach(panel => {
            const slot = panel.getAttribute('data-slot');
            panel.addEventListener('dragover', e => e.preventDefault());
            panel.addEventListener('drop', e => {
                e.preventDefault();
                const name = e.dataTransfer.getData('text/plain');
                const img = imageList.querySelector(`img[data-name="${name}"]`);
                if (!img) return;
                panel.innerHTML = '';
                const clone = img.cloneNode();
                clone.draggable = false;
                const transformInput = document.createElement('input');
                transformInput.type = 'hidden';
                transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
                container.appendChild(transformInput);
                enableImageControls(clone, transformInput);
                panel.appendChild(clone);
                img.remove();
                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = `pages[${pageIndex}][slots][${slot}]`;
                hidden.value = name;
                container.appendChild(hidden);
                savePagesState();
            });
            if (slots[slot]) {
                const img = imageList.querySelector(`img[data-name="${slots[slot]}"]`);
                if (img) {
                    panel.innerHTML = '';
                    const clone = img.cloneNode();
                    clone.draggable = false;
                    const transformInput = document.createElement('input');
                    transformInput.type = 'hidden';
                    transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
                    const initial = transforms[slot] || {};
                    transformInput.value = JSON.stringify(initial);
                    container.appendChild(transformInput);
                    enableImageControls(clone, transformInput, initial);
                    panel.appendChild(clone);
                    img.remove();
                    const hidden = document.createElement('input');
                    hidden.type = 'hidden';
                    hidden.name = `pages[${pageIndex}][slots][${slot}]`;
                    hidden.value = slots[slot];
                    container.appendChild(hidden);
                }
            }
        });
    }

    function createPage(data) {
        const page = document.createElement('div');
        page.className = 'page';
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-page-btn';
        deleteBtn.textContent = '🗑 Delete Page';
        deleteBtn.style.float = 'right';
        deleteBtn.style.marginLeft = '8px';
        page.appendChild(deleteBtn);

        // Layout selector
        const select = document.createElement('select');
        layouts.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l;
            opt.textContent = l;
            select.appendChild(opt);
        });
        select.style.marginRight = '8px';

        // Gutter color picker
        const gutterColor = document.createElement('input');
    gutterColor.type = 'color';
    gutterColor.value = (data && data.gutterColor) ? data.gutterColor : '#cccccc';
    gutterColor.title = 'Gutter Color';
    gutterColor.name = `pages[${pageCounter}][gutterColor]`;
    gutterColor.className = 'gutter-color-picker';

        // Label for color picker
        const gutterLabel = document.createElement('label');
        gutterLabel.textContent = 'Gutter Color: ';
        gutterLabel.appendChild(gutterColor);
        gutterLabel.style.marginRight = '8px';

        const controlsDiv = document.createElement('div');
        controlsDiv.style.display = 'flex';
        controlsDiv.style.alignItems = 'center';
        controlsDiv.appendChild(select);
        controlsDiv.appendChild(gutterLabel);
        page.appendChild(controlsDiv);

        const container = document.createElement('div');
        container.className = 'layout-container';
        page.appendChild(container);
        document.getElementById('pages').appendChild(page);
        const index = pageCounter++;
        select.name = `pages[${index}][layout]`;
        gutterColor.name = `pages[${index}][gutterColor]`;
        if (data && data.layout) {
            select.value = data.layout;
        }
        select.addEventListener('change', () => {
            returnImagesFromPage(container);
            renderLayout(container, select.value, index);
            savePagesState();
        });
        gutterColor.addEventListener('input', () => {
            // Live update gutter color in layout container
            container.style.background = gutterColor.value;
            savePagesState();
        });
        // Set initial gutter color on render
        container.style.background = gutterColor.value;
        renderLayout(container, select.value, index, data ? data.slots : {}, data ? data.transforms : {});
        if (!data) {
            savePagesState();
        }

        // Delete page logic
        deleteBtn.addEventListener('click', () => {
            returnImagesFromPage(container);
            page.remove();
            savePagesState();
        });
    }

    document.getElementById('addPage').addEventListener('click', () => createPage());

    if (Array.isArray(savedPages) && savedPages.length) {
        savedPages.forEach(p => createPage(p));
    } else {
        createPage();
    }

    document.getElementById('uploadForm').addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        fetch('/upload', {method: 'POST', body: formData})
            .then(r => r.json())
            .then(updateImages);
    });

    function updateImages(list) {
        imageList.innerHTML = '';
        let row;
        list.forEach((name, i) => {
            if (i % 3 === 0) {
                row = document.createElement('div');
                row.className = 'image-row';
                imageList.appendChild(row);
            }
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            const img = document.createElement('img');
            img.src = `/uploads/${name}`;
            img.className = 'thumb';
            img.draggable = true;
            img.dataset.name = name;
            wrapper.appendChild(img);

            // Add delete button
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'delete-image-btn';
            delBtn.textContent = '🗑';
            delBtn.title = 'Delete Image';
            delBtn.style.marginTop = '4px';
            delBtn.style.display = 'block';
            delBtn.addEventListener('click', () => {
                fetch('/delete-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `name=${encodeURIComponent(name)}`
                })
                .then(r => r.json())
                .then(() => {
                    wrapper.remove();
                });
            });
            wrapper.appendChild(delBtn);

            row.appendChild(wrapper);
        });
    }


    // Removed comicForm submit handler since the form no longer exists

    // Export PDF (Client-side)
    const exportBtn = document.getElementById('exportPdf');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const { jsPDF } = window.jspdf;
            // Use .layout divs for export
            const layouts = Array.from(document.querySelectorAll('.layout'));
            if (layouts.length === 0) return alert('No pages to export!');

            // PDF page size: 11x8.5in landscape = 792x612pt
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [792, 612] });

            for (let i = 0; i < layouts.length; i += 2) {
                // Render first page
                const canvas1 = await html2canvas(layouts[i], { scale: 2 });
                const img1 = canvas1.toDataURL('image/png');
                // Render second page if exists
                let img2 = null;
                if (layouts[i + 1]) {
                    const canvas2 = await html2canvas(layouts[i + 1], { scale: 2 });
                    img2 = canvas2.toDataURL('image/png');
                }
                // Each image fills exactly half: 396x612pt
                pdf.addImage(img1, 'PNG', 0, 0, 396, 612);
                if (img2) {
                    pdf.addImage(img2, 'PNG', 396, 0, 396, 612);
                }
                if (i + 2 < layouts.length) pdf.addPage([792, 612], 'landscape');
            }
            pdf.save('comic-layout.pdf');
        });
    }
});
