    function savePagesState() {
        // Collect page state from DOM
        const pages = [];
        document.querySelectorAll('#pages > .page').forEach(pageDiv => {
            const layout = pageDiv.querySelector('select').value;
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
            pages.push({ layout, slots, transforms });
        });
        fetch('/save-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages, pageCount: pages.length })
        });
    }
document.addEventListener('DOMContentLoaded', () => {
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

        const select = document.createElement('select');
        layouts.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l;
            opt.textContent = l;
            select.appendChild(opt);
        });
        const container = document.createElement('div');
        container.className = 'layout-container';
        page.appendChild(select);
        page.appendChild(container);
        document.getElementById('pages').appendChild(page);
        const index = pageCounter++;
        select.name = `pages[${index}][layout]`;
        if (data && data.layout) {
            select.value = data.layout;
        }
        select.addEventListener('change', () => {
            returnImagesFromPage(container);
            renderLayout(container, select.value, index);
            savePagesState();
        });
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

    document.getElementById('comicForm').addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        fetch('/submit', {method:'POST', body: formData})
            .then(r => r.json())
            .then(res => {
                if (res.file) {
                    window.open(`/storage/generated/${res.file}`, '_blank');
                }
            });
    });
});
