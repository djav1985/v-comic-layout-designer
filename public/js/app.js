    function savePagesState() {
        // Collect page state from DOM
        const pages = [];
        document.querySelectorAll('#pages > .page').forEach(pageDiv => {
            const layout = pageDiv.querySelector('select').value;
            const slots = {};
            pageDiv.querySelectorAll('.panel').forEach(panel => {
                const slot = panel.getAttribute('data-slot');
                const img = panel.querySelector('img');
                if (img) slots[slot] = img.dataset.name;
            });
            pages.push({ layout, slots });
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

    function renderLayout(container, layoutName, pageIndex, slots = {}) {
        container.innerHTML = layoutTemplates[layoutName];
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
        renderLayout(container, select.value, index, data ? data.slots : {});
        if (!data) {
            savePagesState();
        }
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
        list.forEach(name => {
            const img = document.createElement('img');
            img.src = `/uploads/${name}`;
            img.className = 'thumb';
            img.draggable = true;
            img.dataset.name = name;
            imageList.appendChild(img);
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
