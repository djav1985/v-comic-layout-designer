window.addEventListener('DOMContentLoaded', async () => {
  const imageList = document.getElementById('imageList');
  const addPageButton = document.getElementById('addPage');
  const exportPdfButton = document.getElementById('exportPdf');
  const exportImagesButton = document.getElementById('exportImages');
  let pageCounter = 0;
  let saveTimeout = null;
  let isUpdatingFromServer = false;
  let saveIndicator = null;
  let layoutNames = [];
  let layoutTemplates = {};
  let layoutStyles = {};
  let savedPages = [];
  let allImages = [];
  const imageSrcMap = new Map();

  if (!window.comicAPI || typeof window.comicAPI.getInitialData !== 'function') {
    // Fail fast if the preload script is unavailable.
    alert('Native Electron APIs are unavailable. Please restart the application.');
    return;
  }

  try {
    const initialData = await window.comicAPI.getInitialData();
    if (!initialData) {
      throw new Error('Initial data payload was empty');
    }
    layoutNames = Array.isArray(initialData.layouts) ? [...initialData.layouts] : [];
    layoutTemplates = initialData.layoutTemplates || {};
    layoutStyles = initialData.layoutStyles || {};
    savedPages = Array.isArray(initialData.pages) ? initialData.pages : [];
    allImages = Array.isArray(initialData.images) ? initialData.images : [];
    if (!layoutNames.length && layoutTemplates) {
      layoutNames = Object.keys(layoutTemplates);
    }
    layoutNames.sort((a, b) => a.localeCompare(b));
    updateImageMap(allImages);
  } catch (error) {
    console.error('Failed to load initial data:', error);
    alert('Failed to load the initial application data. Please restart the app.');
    return;
  }

  // Create save indicator
  function createSaveIndicator() {
    if (!saveIndicator) {
      saveIndicator = document.createElement('div');
      saveIndicator.id = 'saveIndicator';
      saveIndicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                font-size: 14px;
                font-weight: bold;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
      document.body.appendChild(saveIndicator);
    }
    return saveIndicator;
  }

  function showSaveIndicator(message, color = '#4CAF50') {
    const indicator = createSaveIndicator();
    indicator.textContent = message;
    indicator.style.background = color;
    indicator.style.opacity = '1';
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }

  function updateImageMap(list) {
    imageSrcMap.clear();
    list.forEach((item) => {
      if (item && item.name && item.src) {
        imageSrcMap.set(item.name, item.src);
      }
    });
  }

  // Debounced save function to prevent excessive disk writes
  function debouncedSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    showSaveIndicator('Saving...', '#FF9800');
    saveTimeout = setTimeout(() => {
      savePagesState(false).catch((err) => {
        console.error('Debounced save failed:', err);
      });
    }, 500); // Wait 500ms after last change before saving
  }

  async function savePagesState(rebuildUI = true) {
    if (isUpdatingFromServer) {
      return; // Prevent recursive updates
    }

    const pages = [];
    document.querySelectorAll('#pages > .page').forEach((pageDiv) => {
      const layout = pageDiv.querySelector('select').value;
      const gutterColorInput = pageDiv.querySelector('input[type="color"]');
      const gutterColor = gutterColorInput ? gutterColorInput.value : '#cccccc';
      const slots = {};
      const transforms = {};
      pageDiv.querySelectorAll('.panel').forEach((panel) => {
        const slot = String(panel.getAttribute('data-slot'));
        const img = panel.querySelector('img');
        if (img) {
          slots[slot] = img.dataset.name;
          transforms[slot] = {
            scale: img.dataset.scale || 1,
            translateX: img.dataset.translateX || 0,
            translateY: img.dataset.translateY || 0,
          };
        }
      });
      pages.push({ layout, gutterColor, slots, transforms });
    });

    try {
      const response = await window.comicAPI.savePages(pages);
      if (response && response.error) {
        throw new Error(response.error);
      }
      showSaveIndicator('Saved ✓', '#4CAF50');
      if (rebuildUI && response && Array.isArray(response.pages)) {
        rebuildPagesUI(response.pages);
      }
    } catch (error) {
      console.error('Failed to save pages:', error);
      showSaveIndicator('Save failed ✗', '#f44336');
      if (rebuildUI) {
        alert('Failed to save pages. See console for details.');
      }
    }
  }

  function rebuildPagesUI(pages) {
    isUpdatingFromServer = true;
    const currentPagesDiv = document.getElementById('pages');
    const newPagesDiv = document.createElement('div');
    newPagesDiv.id = 'pages';
    const prevCounter = pageCounter;
    pageCounter = 0;

    try {
      window.savedPages = pages;
      if (pages.length) {
        pages.forEach((p) => createPage(p, newPagesDiv));
      } else {
        createPage(undefined, newPagesDiv);
      }
      currentPagesDiv.replaceWith(newPagesDiv);

      // Update images after DOM is ready, using current DOM state for accuracy
      setTimeout(() => {
        updateImages(allImages);
      }, 0);
    } catch (err) {
      console.error(err);
      alert('Failed to render pages');
      pageCounter = prevCounter;
    } finally {
      isUpdatingFromServer = false;
    }
  }

  // Don't load images initially - wait until after pages are restored

  function enableImageControls(img, hiddenInput, initial = {}) {
    let scale = parseFloat(initial.scale || 1);
    let translateX = parseFloat(initial.translateX || 0);
    let translateY = parseFloat(initial.translateY || 0);
    let rafId = null;

    function updateTransform() {
      if (rafId) return; // Prevent multiple simultaneous updates

      rafId = requestAnimationFrame(() => {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        img.dataset.scale = scale;
        img.dataset.translateX = translateX;
        img.dataset.translateY = translateY;
        if (hiddenInput) {
          hiddenInput.value = JSON.stringify({ scale, translateX, translateY });
        }
        rafId = null;
      });
    }

    img.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      scale = Math.min(3, Math.max(0.5, scale + delta));
      updateTransform();
      debouncedSave(); // Use debounced save for live scaling
    });

    let dragging = false;
    let startX, startY;
    img.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      img.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform(); // Live update transform with RAF optimization
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        img.style.cursor = 'move';
        debouncedSave(); // Save after drag ends
      }
    });

    updateTransform();
  }

  function returnImagesFromPage(container) {
    // Remove any hidden inputs associated with this container
    container.querySelectorAll('input[type="hidden"]').forEach((i) => i.remove());
    // Clear all panels
    container.querySelectorAll('.panel').forEach((panel) => {
      panel.innerHTML = '';
    });
    // Refresh the image list to show returned images
    setTimeout(() => {
      updateImages(allImages);
    }, 0);
  }

  imageList.addEventListener('dragstart', (e) => {
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
    console.log(`Rendering layout: ${layoutName} for page ${pageIndex}`);
    console.log('Available templates:', Object.keys(layoutTemplates));

    // If template is undefined, show error
    if (!layoutTemplates[layoutName]) {
      container.innerHTML = `<div style='color:red'>Layout template not found: ${layoutName}</div>`;
      console.error(`Layout template not found: ${layoutName}`);
      return;
    }

    // Inject HTML, handling possible escaping
    container.innerHTML = layoutTemplates[layoutName];
    ensureLayoutStyle(layoutName);

    // Set proper class name and gutter color on .layout div
    const layoutDiv = container.querySelector('.layout');
    if (layoutDiv) {
      // Add the specific layout class name for CSS targeting
      layoutDiv.classList.add(layoutName);

      // Find gutter color from parent page
      let gutterColor = '#cccccc';
      const pageDiv = container.closest('.page');
      if (pageDiv) {
        const colorInput = pageDiv.querySelector('input[type="color"]');
        if (colorInput) gutterColor = colorInput.value;
      }
      layoutDiv.style.background = gutterColor;
      console.log(`Set layout background to: ${gutterColor} and added class: ${layoutName}`);
    } else {
      console.warn(`No .layout div found in template: ${layoutName}`);
    }

    container.querySelectorAll('.panel').forEach((panel) => {
      const slot = panel.getAttribute('data-slot');

      panel.addEventListener('dragover', (e) => {
        e.preventDefault();
        panel.classList.add('drag-over');
      });

      panel.addEventListener('dragleave', () => {
        panel.classList.remove('drag-over');
      });

      panel.addEventListener('drop', (e) => {
        e.preventDefault();
        panel.classList.remove('drag-over');

        const name = e.dataTransfer.getData('text/plain');
        const img = imageList.querySelector(`img[data-name="${name}"]`);
        if (!img) return;

        // Remove the entire image-wrapper for the new image
        const wrapper = img.closest('.image-wrapper');
        if (wrapper) wrapper.remove();

        // If panel already has an image, return it to imageList
        const oldImg = panel.querySelector('img');
        if (oldImg) {
          const oldName = oldImg.dataset.name;
          // Remove old image's hidden inputs
          const hiddenInputs = container.querySelectorAll(`input[value="${oldName}"]`);
          hiddenInputs.forEach((input) => input.remove());

          // Return image to list by refreshing the image list
          // This ensures proper state management
          setTimeout(() => {
            updateImages(allImages);
          }, 0);
        }

        panel.innerHTML = '';
        const clone = img.cloneNode();
        clone.draggable = false;
        const transformInput = document.createElement('input');
        transformInput.type = 'hidden';
        transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
        container.appendChild(transformInput);
        enableImageControls(clone, transformInput);
        panel.appendChild(clone);
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = `pages[${pageIndex}][slots][${slot}]`;
        hidden.value = name;
        container.appendChild(hidden);
        debouncedSave(); // Use debounced save for drag & drop
      });

      if (slots[slot]) {
        // For page restoration, don't try to find image in imageList since it was filtered out by PHP
        // Instead, create the image element directly
        const imageName = slots[slot];
        const clone = document.createElement('img');
        clone.draggable = false;
        clone.dataset.name = imageName;
        clone.alt = imageName;

        const knownSrc = imageSrcMap.get(imageName);
        if (knownSrc) {
          clone.src = knownSrc;
        } else {
          window.comicAPI
            .resolveImageSrc(imageName)
            .then((src) => {
              if (src) {
                imageSrcMap.set(imageName, src);
                clone.src = src;
              }
            })
            .catch((err) => {
              console.error('Failed to resolve image source for restored slot:', err);
            });
        }

        const transformInput = document.createElement('input');
        transformInput.type = 'hidden';
        transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
        const initial = transforms[slot] || {};
        transformInput.value = JSON.stringify(initial);
        container.appendChild(transformInput);
        enableImageControls(clone, transformInput, initial);
        panel.appendChild(clone);

        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = `pages[${pageIndex}][slots][${slot}]`;
        hidden.value = imageName;
        container.appendChild(hidden);
      }
    });
  }

  function createPage(data, pagesContainer = document.getElementById('pages')) {
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
    if (layoutNames.length === 0) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'No layouts available';
      select.appendChild(placeholder);
      select.disabled = true;
    } else {
      layoutNames.forEach((l) => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        select.appendChild(opt);
      });
    }
    select.style.marginRight = '8px';

    // Gutter color picker
    const gutterColor = document.createElement('input');
    gutterColor.type = 'color';
    gutterColor.value = data && data.gutterColor ? data.gutterColor : '#cccccc';
    gutterColor.title = 'Gutter Color';
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
    pagesContainer.appendChild(page);
    const index = pageCounter++;
    select.name = `pages[${index}][layout]`;
    gutterColor.name = `pages[${index}][gutterColor]`;
    if (data && data.layout) {
      select.value = data.layout;
    }

    select.addEventListener('change', () => {
      console.log(`Layout changed to: ${select.value} for page index: ${index}`);
      returnImagesFromPage(container);
      renderLayout(container, select.value, index);

      // Force immediate visual update and class application
      setTimeout(() => {
        const layoutDiv = container.querySelector('.layout');
        if (layoutDiv) {
          // Ensure the layout class is properly applied
          layoutDiv.classList.remove(...layoutNames); // Remove all layout classes
          layoutDiv.classList.add(select.value); // Add the selected layout class
          console.log(
            `After layout change - background: ${layoutDiv.style.background}, classes: ${layoutDiv.className}`
          );
        }
      }, 100);

      savePagesState(true).catch((err) => {
        console.error('Failed to persist layout change:', err);
      });
    });

    gutterColor.addEventListener('input', () => {
      // Live update gutter color in layout container
      const layoutDiv = container.querySelector('.layout');
      if (layoutDiv) {
        layoutDiv.style.background = gutterColor.value;
      }
      debouncedSave(); // Use debounced save for color changes
    });

    // Set initial gutter color on render
    container.style.background = gutterColor.value;
    if (layoutNames.length > 0) {
      renderLayout(
        container,
        select.value,
        index,
        data ? data.slots : {},
        data ? data.transforms : {}
      );
    } else {
      container.innerHTML =
        '<div style="color:#c00; padding: 16px;">No layout templates found. Add files to the layouts directory.</div>';
    }
    if (!data) {
      debouncedSave(); // Use debounced save for new pages
    }

    // Delete page logic
    deleteBtn.addEventListener('click', () => {
      returnImagesFromPage(container);
      page.remove();
      savePagesState(true).catch((err) => {
        console.error('Failed to persist page deletion:', err);
      });
    });
  }

  if (addPageButton) {
    addPageButton.addEventListener('click', () => {
      createPage();
      // Adding a page requires UI rebuild to maintain proper indexing
      savePagesState(true).catch((err) => {
        console.error('Failed to persist page addition:', err);
      });
    });
  }

  // Initialize pages and then load images
  if (Array.isArray(savedPages) && savedPages.length) {
    console.log('Loading saved pages:', savedPages);
    savedPages.forEach((p, index) => {
      console.log(`Creating page ${index + 1} with layout: ${p.layout}`);
      createPage(p);
    });
  } else {
    console.log('Creating new default page');
    createPage();
  }

  // Debug: Log available layouts and templates
  console.log('Available layouts:', layoutNames);
  console.log('Available templates:', Object.keys(layoutTemplates || {}));

  // Load images AFTER pages are created so assigned images are properly filtered
  setTimeout(() => {
    updateImages(allImages);
  }, 100);

  const uploadForm = document.getElementById('uploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('imageInput');
      if (!input || !input.files.length) {
        return;
      }

      try {
        const payload = await Promise.all(
          Array.from(input.files).map(async (file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            data: await readFileAsBase64(file),
          }))
        );

        const response = await window.comicAPI.uploadImages(payload);
        if (response && response.error) {
          throw new Error(response.error);
        }
        if (response && Array.isArray(response.images)) {
          allImages = response.images;
          updateImageMap(allImages);
          updateImages(allImages);
          showSaveIndicator('Images uploaded ✓', '#4CAF50');
        }
      } catch (error) {
        console.error('Failed to upload images:', error);
        showSaveIndicator('Upload failed ✗', '#f44336');
        alert(`Failed to upload images: ${error.message}`);
      } finally {
        if (input) {
          input.value = '';
        }
      }
    });
  }

  function getAssignedImages(pages) {
    const assigned = new Set();

    // Get currently assigned images from the DOM (most accurate)
    document.querySelectorAll('#pages .panel img').forEach((img) => {
      if (img.dataset.name) {
        assigned.add(img.dataset.name);
      }
    });

    // Also check the pages data as fallback
    if (Array.isArray(pages)) {
      pages.forEach((page) => {
        if (page.slots) {
          Object.values(page.slots).forEach((imgName) => {
            if (imgName) assigned.add(imgName);
          });
        }
      });
    }

    return assigned;
  }

  function updateImages(list, pages = null) {
    if (!Array.isArray(list)) {
      list = [];
    }
    updateImageMap(list);

    const currentPages = pages || getCurrentPageState();
    const assigned = getAssignedImages(currentPages);

    imageList.innerHTML = '';

    list.forEach((item) => {
      if (!item || !item.name) {
        return;
      }
      const name = item.name;
      if (assigned.has(name)) {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'image-wrapper';

      const img = document.createElement('img');
      img.className = 'thumb';
      img.draggable = true;
      img.dataset.name = name;
      img.alt = name;

      const src = item.src || imageSrcMap.get(name);
      if (src) {
        img.src = src;
      } else {
        window.comicAPI
          .resolveImageSrc(name)
          .then((resolved) => {
            if (resolved) {
              imageSrcMap.set(name, resolved);
              img.src = resolved;
            }
          })
          .catch((err) => {
            console.error('Unable to resolve image source:', err);
          });
      }

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'delete-image-btn';
      delBtn.textContent = '🗑';
      delBtn.title = 'Delete Image';
      delBtn.style.marginTop = '4px';
      delBtn.style.display = 'block';
      delBtn.addEventListener('click', async () => {
        try {
          const response = await window.comicAPI.deleteImage(name);
          if (response && response.error) {
            throw new Error(response.error);
          }
          if (response && Array.isArray(response.images)) {
            allImages = response.images;
            updateImageMap(allImages);
            removeImageFromLayouts(name);
            updateImages(allImages);
            savePagesState(true).catch((err) => {
              console.error('Failed to persist state after deletion:', err);
            });
          }
        } catch (error) {
          console.error('Failed to delete image:', error);
          alert(`Failed to delete image: ${error.message}`);
        }
      });

      wrapper.appendChild(img);
      wrapper.appendChild(delBtn);
      imageList.appendChild(wrapper);
    });
  }

  function removeImageFromLayouts(imageName) {
    if (!imageName) {
      return;
    }
    const escaped =
      window.CSS && window.CSS.escape
        ? window.CSS.escape(imageName)
        : imageName.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
    document.querySelectorAll(`#pages .panel img[data-name="${escaped}"]`).forEach((img) => {
      const panel = img.closest('.panel');
      if (panel) {
        panel.innerHTML = '';
      }
    });
    document
      .querySelectorAll(`#pages input[value="${escaped}"]`)
      .forEach((input) => input.remove());
  }

  // Helper function to get current page state from DOM
  function getCurrentPageState() {
    const pages = [];
    document.querySelectorAll('#pages > .page').forEach((pageDiv) => {
      const slots = {};
      pageDiv.querySelectorAll('.panel').forEach((panel) => {
        const slot = String(panel.getAttribute('data-slot'));
        const img = panel.querySelector('img');
        if (img) {
          slots[slot] = img.dataset.name;
        }
      });
      pages.push({ slots });
    });
    return pages;
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const { result } = reader;
        if (typeof result !== 'string') {
          reject(new Error('Unexpected file reader result'));
          return;
        }
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => {
        reject(reader.error || new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  // Removed comicForm submit handler since the form no longer exists

  // Export PDF (Client-side)
  if (exportPdfButton) {
    exportPdfButton.addEventListener('click', async () => {
      try {
        // Show export progress
        showSaveIndicator('Preparing export...', '#2196F3');
        exportPdfButton.disabled = true;
        exportPdfButton.textContent = 'Generating PDF...';

        // First, ensure current state is saved and DOM is updated
        await new Promise((resolve) => {
          console.log('Starting export preparation...');

          // Save current state and force UI refresh if needed
          if (isUpdatingFromServer) {
            console.log('Waiting for server update to complete...');
            // Wait for any ongoing updates to complete
            setTimeout(() => {
              savePagesState(false).catch((err) => {
                console.error('Failed to save state before export:', err);
              });
              setTimeout(resolve, 1000);
            }, 1000);
          } else {
            console.log('Saving current state...');
            savePagesState(false).catch((err) => {
              console.error('Failed to save state before export:', err);
            });
            setTimeout(resolve, 1000);
          }
        });

        // Get .layout elements (children of layout-container)
        const layouts = Array.from(document.querySelectorAll('.layout'));
        if (layouts.length === 0) {
          alert('No pages to export!');
          return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [792, 612] });

        for (let i = 0; i < layouts.length; i += 2) {
          showSaveIndicator(
            `Rendering page ${Math.floor(i / 2) + 1}/${Math.ceil(layouts.length / 2)}...`,
            '#2196F3'
          );

          const layout1 = layouts[i];
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Capture first layout
          const canvas1 = await html2canvas(layout1, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: layout1.offsetWidth,
            height: layout1.offsetHeight,
          });

          if (canvas1.width === 0 || canvas1.height === 0) {
            throw new Error(`Canvas ${i + 1} has zero dimensions`);
          }

          const img1 = canvas1.toDataURL('image/png', 1.0);

          // Capture second layout if exists
          let img2 = null;
          if (layouts[i + 1]) {
            const layout2 = layouts[i + 1];
            await new Promise((resolve) => setTimeout(resolve, 100));

            const canvas2 = await html2canvas(layout2, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: null,
              logging: false,
              width: layout2.offsetWidth,
              height: layout2.offsetHeight,
            });

            if (canvas2.width === 0 || canvas2.height === 0) {
              throw new Error(`Canvas ${i + 2} has zero dimensions`);
            }

            img2 = canvas2.toDataURL('image/png', 1.0);
          }

          pdf.addImage(img1, 'PNG', 0, 0, 396, 612);
          if (img2) {
            pdf.addImage(img2, 'PNG', 396, 0, 396, 612);
          }

          if (i + 2 < layouts.length) {
            pdf.addPage([792, 612], 'landscape');
          }
        }

        // Create unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `comic-layout-${timestamp}.pdf`;

        showSaveIndicator('Saving PDF...', '#2196F3');
        pdf.save(filename);
        showSaveIndicator('PDF exported successfully! ✓', '#4CAF50');
      } catch (error) {
        console.error('PDF export failed:', error);
        showSaveIndicator('PDF export failed ✗', '#f44336');
        alert(`Failed to export PDF: ${error.message}`);
      } finally {
        // Reset button
        exportPdfButton.disabled = false;
        exportPdfButton.textContent = 'Export PDF';
      }
    });
  }

  // Export Images functionality
  if (exportImagesButton) {
    exportImagesButton.addEventListener('click', async () => {
      try {
        showSaveIndicator('Preparing export...', '#2196F3');
        exportImagesButton.disabled = true;
        exportImagesButton.textContent = 'Generating Images...';

        const layouts = Array.from(document.querySelectorAll('.layout'));
        if (layouts.length === 0) {
          alert('No pages to export!');
          return;
        }

        for (let i = 0; i < layouts.length; i++) {
          showSaveIndicator(`Rendering page ${i + 1}/${layouts.length}...`, '#2196F3');

          const layout = layouts[i];
          await new Promise((resolve) => setTimeout(resolve, 100));

          const canvas = await html2canvas(layout, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: layout.offsetWidth,
            height: layout.offsetHeight,
          });

          if (canvas.width === 0 || canvas.height === 0) {
            throw new Error(`Canvas ${i + 1} has zero dimensions`);
          }

          // Convert to blob and download
          canvas.toBlob(
            (blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `comic-page-${i + 1}.png`;
              link.click();
              URL.revokeObjectURL(url);
            },
            'image/png',
            1.0
          );

          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        showSaveIndicator('Images exported successfully! ✓', '#4CAF50');
      } catch (error) {
        console.error('Image export failed:', error);
        showSaveIndicator('Image export failed ✗', '#f44336');
        alert(`Failed to export images: ${error.message}`);
      } finally {
        exportImagesButton.disabled = false;
        exportImagesButton.textContent = 'Export Images';
      }
    });
  }

  // Keyboard shortcuts for better UX
  document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      showSaveIndicator('Manual save...', '#2196F3');
      savePagesState(false).catch((err) => {
        console.error('Manual save failed:', err);
        showSaveIndicator('Manual save failed ✗', '#f44336');
      });
    }

    // Ctrl+N or Cmd+N to add new page
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createPage();
      savePagesState(true).catch((err) => {
        console.error('Failed to save after adding page:', err);
      });
    }

    // Ctrl+E or Cmd+E to export PDF
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      if (exportPdfButton && !exportPdfButton.disabled) {
        exportPdfButton.click();
      }
    }

    // Ctrl+I or Cmd+I to export Images
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      if (exportImagesButton && !exportImagesButton.disabled) {
        exportImagesButton.click();
      }
    }

    // Ctrl+D or Cmd+D to debug layouts (capture individual screenshots)
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      debugLayouts();
    }

    // Escape to cancel any ongoing operations
    if (e.key === 'Escape') {
      document.querySelectorAll('.panel.drag-over').forEach((panel) => {
        panel.classList.remove('drag-over');
      });
    }
  });

  // Debug function to capture individual layout screenshots
  async function debugLayouts() {
    const layoutContainers = Array.from(document.querySelectorAll('.layout-container'));
    console.log('Debugging layout containers...');

    for (let i = 0; i < layoutContainers.length; i++) {
      const container = layoutContainers[i];
      console.log(`Capturing layout container ${i + 1}:`, container);
      console.log(`  - Size: ${container.offsetWidth}x${container.offsetHeight}`);
      console.log(`  - Background: ${container.style.background}`);

      const layout = container.querySelector('.layout');
      if (layout) {
        console.log(`  - Layout background: ${layout.style.background}`);
        console.log(`  - Panel count: ${layout.querySelectorAll('.panel').length}`);
      }

      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          backgroundColor: '#fffbe6',
          logging: true,
          useCORS: true,
          allowTaint: true,
        });

        // Convert to blob and create download link
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `layout-container-${i + 1}-debug.png`;
          link.click();
          URL.revokeObjectURL(url);
        });

        console.log(
          `Layout container ${i + 1} captured successfully (${canvas.width}x${canvas.height})`
        );
      } catch (error) {
        console.error(`Failed to capture layout container ${i + 1}:`, error);
      }
    }
  }
});
