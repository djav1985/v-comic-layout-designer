window.addEventListener("DOMContentLoaded", () => {
  const imageList = document.getElementById("imageList");
  const uploadForm = document.getElementById("uploadForm");
  const imageInput = document.getElementById("imageInput");
  const resetButton = document.getElementById("resetWorkspace");
  const saveStateButton = document.getElementById("saveState");
  const loadStateButton = document.getElementById("loadState");
  const loadStateInput = document.getElementById("loadStateInput");
  const toggleShortcutsButton = document.getElementById("toggleShortcuts");
  const shortcutList = document.getElementById("shortcutList");
  let pageCounter = 0;
  let saveTimeout = null;
  let isUpdatingFromServer = false;
  let saveIndicator = null;
  let lastSyncedSignature = null;
  let pageStreamSource = null;
  const PDF_PAGE_WIDTH = 792;
  const PDF_PAGE_HEIGHT = 612;
  const PDF_COLUMN_WIDTH = PDF_PAGE_WIDTH / 2;
  const DEFAULT_GUTTER_COLOR = "#cccccc";
  const EXPORT_SCALE = 2;

  function setInitialImages(list) {
    if (typeof initialImages === "undefined" || !Array.isArray(initialImages)) {
      return;
    }

    initialImages.length = 0;
    if (Array.isArray(list)) {
      initialImages.push(...list);
    }
  }

  function uploadImages(files) {
    if (!files || !files.length) {
      return Promise.resolve();
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images[]", file);
    });

    return fetch("/upload", { method: "POST", body: formData }).then((response) =>
      response
        .json()
        .catch(() => ({ error: "Upload failed" }))
        .then((data) => {
          if (!response.ok || (data && data.error)) {
            const message = data && data.error ? data.error : "Upload failed";
            throw new Error(message);
          }

          if (Array.isArray(data)) {
            setInitialImages(data);
            updateImages(data);
            showSaveIndicator("Images uploaded ✓", "#4CAF50");
          }

          return data;
        }),
    );
  }

  function parseFilenameFromDisposition(disposition) {
    if (!disposition) {
      return `comic-state-${Date.now()}.zip`;
    }

    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch && utfMatch[1]) {
      try {
        return decodeURIComponent(utfMatch[1]);
      } catch (err) {
        console.warn("Failed to decode UTF-8 filename", err);
      }
    }

    const quotedMatch = disposition.match(/filename="?([^";]+)"?/i);
    if (quotedMatch && quotedMatch[1]) {
      return quotedMatch[1];
    }

    return `comic-state-${Date.now()}.zip`;
  }

  function getPanelContent(panel) {
    if (!panel) return null;
    return panel.querySelector(".panel-inner") || panel;
  }

  function getPanelImage(panel) {
    const content = getPanelContent(panel);
    return content ? content.querySelector("img") : null;
  }

  function clearPanel(panel) {
    const content = getPanelContent(panel);
    if (content) {
      content.innerHTML = "";
    }
  }

  // Create save indicator
  function createSaveIndicator() {
    if (!saveIndicator) {
      saveIndicator = document.createElement("div");
      saveIndicator.id = "saveIndicator";
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

  if (toggleShortcutsButton && shortcutList) {
    const setExpandedHeight = () => {
      const currentHeight = shortcutList.scrollHeight;
      shortcutList.style.setProperty(
        "--shortcuts-expanded-height",
        `${currentHeight}px`,
      );
    };

    setExpandedHeight();

    const updateToggleState = (isOpen) => {
      toggleShortcutsButton.setAttribute("aria-expanded", String(isOpen));
      toggleShortcutsButton.classList.toggle("active", isOpen);
      toggleShortcutsButton.textContent = isOpen
        ? "Hide Shortcuts"
        : "Show Shortcuts";
      shortcutList.setAttribute("aria-hidden", String(!isOpen));
    };

    updateToggleState(false);

    toggleShortcutsButton.addEventListener("click", () => {
      const willOpen = !shortcutList.classList.contains("is-open");
      if (willOpen) {
        setExpandedHeight();
        shortcutList.classList.add("is-open");
      } else {
        setExpandedHeight();
        requestAnimationFrame(() => {
          shortcutList.classList.remove("is-open");
          shortcutList.style.setProperty("--shortcuts-expanded-height", "0px");
        });
      }

      updateToggleState(willOpen);
    });

    window.addEventListener("resize", () => {
      if (shortcutList.classList.contains("is-open")) {
        setExpandedHeight();
      }
    });
  }

  function showSaveIndicator(message, color = "#4CAF50") {
    const indicator = createSaveIndicator();
    indicator.textContent = message;
    indicator.style.background = color;
    indicator.style.opacity = "1";
    setTimeout(() => {
      indicator.style.opacity = "0";
    }, 2000);
  }

  // Debounced save function to prevent excessive server calls
  function debouncedSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    showSaveIndicator("Saving...", "#FF9800");
    saveTimeout = setTimeout(() => {
      savePagesState(false); // false = don't rebuild UI
    }, 500); // Wait 500ms after last change before saving
  }

  function capturePagesFromDom() {
    const pages = [];
    document.querySelectorAll("#pages > .page").forEach((pageDiv) => {
      const layout = pageDiv.querySelector("select").value;
      const gutterColorInput = pageDiv.querySelector('input[type="color"]');
      const gutterColor = gutterColorInput ? gutterColorInput.value : DEFAULT_GUTTER_COLOR;
      const slots = {};
      const transforms = {};
      pageDiv.querySelectorAll(".panel").forEach((panel) => {
        const slot = String(panel.getAttribute("data-slot"));
        const img = getPanelImage(panel);
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
    return pages;
  }

  function savePagesState(rebuildUI = true) {
    if (isUpdatingFromServer) return; // Prevent recursive updates

    const pages = capturePagesFromDom();
    const signature = JSON.stringify(pages);

    // Save to server in background
    fetch("/save-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages, pageCount: pages.length }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Save request failed");
        showSaveIndicator("Saved ✓", "#4CAF50");
        lastSyncedSignature = signature;
        if (rebuildUI) {
          rebuildPagesUI(pages);
        }
      })
      .catch((err) => {
        console.error(err);
        showSaveIndicator("Save failed ✗", "#f44336");
        if (rebuildUI) {
          alert("Failed to save pages");
        }
      });
  }

  function rebuildPagesUI(pages) {
    isUpdatingFromServer = true;
    const currentPagesDiv = document.getElementById("pages");
    const newPagesDiv = document.createElement("div");
    newPagesDiv.id = "pages";
    const prevCounter = pageCounter;
    pageCounter = 0;

    try {
      window.savedPages = pages;
      lastSyncedSignature = JSON.stringify(pages);
      if (pages.length) {
        pages.forEach((p) => createPage(p, newPagesDiv));
      } else {
        createPage(undefined, newPagesDiv);
      }
      currentPagesDiv.replaceWith(newPagesDiv);

      // Update images after DOM is ready, using current DOM state for accuracy
      setTimeout(() => {
        updateImages(typeof initialImages !== "undefined" ? initialImages : []);
      }, 0);
    } catch (err) {
      console.error(err);
      alert("Failed to render pages");
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

    img.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      scale = Math.min(3, Math.max(0.5, scale + delta));
      updateTransform();
      debouncedSave(); // Use debounced save for live scaling
    });

    let dragging = false;
    let startX, startY;
    img.addEventListener("mousedown", (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      img.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform(); // Live update transform with RAF optimization
    });

    document.addEventListener("mouseup", () => {
      if (dragging) {
        dragging = false;
        img.style.cursor = "move";
        debouncedSave(); // Save after drag ends
      }
    });

    updateTransform();
  }

  function returnImagesFromPage(container) {
    // Remove any hidden inputs associated with this container
    container
      .querySelectorAll('input[type="hidden"]')
      .forEach((i) => i.remove());
    // Clear all panels
    container.querySelectorAll(".panel").forEach((panel) => {
      clearPanel(panel);
    });
    // Refresh the image list to show returned images
    setTimeout(() => {
      updateImages(typeof initialImages !== "undefined" ? initialImages : []);
    }, 0);
  }

  imageList.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("thumb")) {
      e.dataTransfer.setData("text/plain", e.target.dataset.name);
    }
  });

  function ensureLayoutStyle(name) {
    if (document.getElementById("style-" + name)) return;
    const style = document.createElement("style");
    style.id = "style-" + name;
    style.textContent = layoutStyles[name] || "";
    document.head.appendChild(style);
  }

  function addCanvasToPdf(pdf, canvas, imgData, columnIndex) {
    if (!pdf || !canvas || !imgData) return;
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    if (!originalWidth || !originalHeight) return;
    const scale = Math.min(
      PDF_COLUMN_WIDTH / originalWidth,
      PDF_PAGE_HEIGHT / originalHeight,
    );
    const renderWidth = originalWidth * scale;
    const renderHeight = originalHeight * scale;
    const offsetX =
      columnIndex * PDF_COLUMN_WIDTH +
      (PDF_COLUMN_WIDTH - renderWidth) / 2;
    const offsetY = (PDF_PAGE_HEIGHT - renderHeight) / 2;
    pdf.addImage(imgData, "PNG", offsetX, offsetY, renderWidth, renderHeight);
  }

  function renderLayout(
    container,
    layoutName,
    pageIndex,
    slots = {},
    transforms = {},
  ) {
    console.log(`Rendering layout: ${layoutName} for page ${pageIndex}`);
    console.log("Available templates:", Object.keys(layoutTemplates));

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
    const layoutDiv = container.querySelector(".layout");
    if (layoutDiv) {
      // Add the specific layout class name for CSS targeting
      layoutDiv.classList.add(layoutName);
      layoutDiv.dataset.layoutName = layoutName;

      // Find gutter color from parent page
      let gutterColor = DEFAULT_GUTTER_COLOR;
      const pageDiv = container.closest(".page");
      if (pageDiv) {
        const colorInput = pageDiv.querySelector('input[type="color"]');
        if (colorInput) gutterColor = colorInput.value;
      }
      layoutDiv.style.background = gutterColor;
      console.log(
        `Set layout background to: ${gutterColor} and added class: ${layoutName}`,
      );
    } else {
      console.warn(`No .layout div found in template: ${layoutName}`);
    }

    container.querySelectorAll(".panel").forEach((panel) => {
      const slot = panel.getAttribute("data-slot");

      panel.addEventListener("dragover", (e) => {
        e.preventDefault();
        panel.classList.add("drag-over");
      });

      panel.addEventListener("dragleave", (e) => {
        panel.classList.remove("drag-over");
      });

      panel.addEventListener("drop", (e) => {
        e.preventDefault();
        panel.classList.remove("drag-over");

        const name = e.dataTransfer.getData("text/plain");
        const img = imageList.querySelector(`img[data-name="${name}"]`);
        if (!img) return;

        // Remove the entire image-wrapper for the new image
        const wrapper = img.closest(".image-wrapper");
        if (wrapper) wrapper.remove();

        // If panel already has an image, return it to imageList
        const oldImg = getPanelImage(panel);
        if (oldImg) {
          const oldName = oldImg.dataset.name;
          // Remove old image's hidden inputs
          const hiddenInputs = container.querySelectorAll(
            `input[value="${oldName}"]`,
          );
          hiddenInputs.forEach((input) => input.remove());

          // Return image to list by refreshing the image list
          // This ensures proper state management
          setTimeout(() => {
            updateImages(
              typeof initialImages !== "undefined" ? initialImages : [],
            );
          }, 0);
        }

        clearPanel(panel);
        const content = getPanelContent(panel);
        if (!content) return;
        const clone = img.cloneNode();
        clone.draggable = false;
        clone.classList.remove("thumb");
        clone.classList.add("panel-image");
        clone.removeAttribute("width");
        clone.removeAttribute("height");
        clone.removeAttribute("style");
        const transformInput = document.createElement("input");
        transformInput.type = "hidden";
        transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
        container.appendChild(transformInput);
        enableImageControls(clone, transformInput);
        content.appendChild(clone);
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = `pages[${pageIndex}][slots][${slot}]`;
        hidden.value = name;
        container.appendChild(hidden);
        debouncedSave(); // Use debounced save for drag & drop
      });

      if (slots[slot]) {
        // For page restoration, don't try to find image in imageList since it was filtered out by PHP
        // Instead, create the image element directly
        const imageName = slots[slot];
        const clone = document.createElement("img");
        clone.src = `/uploads/${imageName}`;
        clone.draggable = false;
        clone.dataset.name = imageName;
        clone.classList.add("panel-image");

        const transformInput = document.createElement("input");
        transformInput.type = "hidden";
        transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
        const initial = transforms[slot] || {};
        transformInput.value = JSON.stringify(initial);
        container.appendChild(transformInput);
        enableImageControls(clone, transformInput, initial);
        const content = getPanelContent(panel);
        if (content) {
          clearPanel(panel);
          content.appendChild(clone);
        }

        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = `pages[${pageIndex}][slots][${slot}]`;
        hidden.value = imageName;
        container.appendChild(hidden);
      }
    });
  }

  function createPage(data, pagesContainer = document.getElementById("pages")) {
    const page = document.createElement("div");
    page.className = "page";
    // Add delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-page-btn";
    deleteBtn.innerHTML = '<span aria-hidden="true">✕</span>';
    deleteBtn.setAttribute("aria-label", "Remove page");

    // Layout selector
    const select = document.createElement("select");
    layouts.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = l;
      select.appendChild(opt);
    });

    // Gutter color picker
    const gutterColor = document.createElement("input");
    gutterColor.type = "color";
    gutterColor.value = data && data.gutterColor ? data.gutterColor : DEFAULT_GUTTER_COLOR;
    gutterColor.title = "Gutter Color";
    gutterColor.className = "gutter-color-picker";

    const layoutGroup = document.createElement("div");
    layoutGroup.className = "layout-selector";
    layoutGroup.appendChild(select);

    const gutterGroup = document.createElement("div");
    gutterGroup.className = "gutter-selector";
    gutterGroup.appendChild(gutterColor);

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "page-controls";
    controlsDiv.appendChild(layoutGroup);
    controlsDiv.appendChild(gutterGroup);
    
    // Create a container for controls and delete button
    const controlsContainer = document.createElement("div");
    controlsContainer.style.display = "flex";
    controlsContainer.style.gap = "18px";
    controlsContainer.style.alignItems = "flex-start";
    
    controlsContainer.appendChild(controlsDiv);
    controlsContainer.appendChild(deleteBtn);
    
    page.appendChild(controlsContainer);

    const container = document.createElement("div");
    container.className = "layout-container";
    page.appendChild(container);
    pagesContainer.appendChild(page);
    const index = pageCounter++;
    select.name = `pages[${index}][layout]`;
    gutterColor.name = `pages[${index}][gutterColor]`;
    if (data && data.layout) {
      select.value = data.layout;
    }

    select.addEventListener("change", () => {
      console.log(
        `Layout changed to: ${select.value} for page index: ${index}`,
      );
      returnImagesFromPage(container);
      renderLayout(container, select.value, index);

      // Force immediate visual update and class application
      setTimeout(() => {
        const layoutDiv = container.querySelector(".layout");
        if (layoutDiv) {
          // Ensure the layout class is properly applied
          layoutDiv.classList.remove(...layouts); // Remove all layout classes
          layoutDiv.classList.add(select.value); // Add the selected layout class
          layoutDiv.dataset.layoutName = select.value;
          console.log(
            `After layout change - background: ${layoutDiv.style.background}, classes: ${layoutDiv.className}`,
          );
        }
      }, 100);

      savePagesState(true); // Rebuild UI for layout changes
    });

    gutterColor.addEventListener("input", () => {
      // Live update gutter color in layout container
      const layoutDiv = container.querySelector(".layout");
      if (layoutDiv) {
        layoutDiv.style.background = gutterColor.value;
      }
      debouncedSave(); // Use debounced save for color changes
    });

    // Set initial gutter color on render
    container.style.background = gutterColor.value;
    renderLayout(
      container,
      select.value,
      index,
      data ? data.slots : {},
      data ? data.transforms : {},
    );
    if (!data) {
      debouncedSave(); // Use debounced save for new pages
    }

    // Delete page logic
    deleteBtn.addEventListener("click", () => {
      returnImagesFromPage(container);
      page.remove();
      savePagesState(true); // Rebuild UI when deleting pages
    });
  }

  document.getElementById("addPage").addEventListener("click", () => {
    createPage();
    // Adding a page requires UI rebuild to maintain proper indexing
    savePagesState(true);
  });

  async function initializePages() {
    try {
      const response = await fetch("/get-pages", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to load pages (status ${response.status})`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.pages)) {
        throw new Error("Response payload was missing a pages array");
      }

      console.log("Loaded pages from server state:", data.pages);
      rebuildPagesUI(data.pages);
    } catch (error) {
      console.error("Failed to load saved pages from state.json:", error);
      rebuildPagesUI([]);
    }
  }

  function cleanupEventSource() {
    if (pageStreamSource) {
      pageStreamSource.close();
      pageStreamSource = null;
    }
  }

  function subscribeToStateStream() {
    if (!window.EventSource) {
      console.warn("EventSource is not supported in this browser; live sync disabled.");
      return;
    }

    if (pageStreamSource) {
      return;
    }

    pageStreamSource = new EventSource("/pages/stream");

    const processIncomingPages = (incomingPages) => {
      const incomingSignature = JSON.stringify(incomingPages);

      if (incomingSignature === lastSyncedSignature) {
        return;
      }

      const currentSignature = JSON.stringify(capturePagesFromDom());
      if (incomingSignature === currentSignature) {
        lastSyncedSignature = incomingSignature;
        return;
      }

      rebuildPagesUI(incomingPages);
      lastSyncedSignature = incomingSignature;
    };

    pageStreamSource.addEventListener("pages", (event) => {
      if (!event.data) {
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        const incomingPages = Array.isArray(payload.pages) ? payload.pages : [];

        if (isUpdatingFromServer) {
          setTimeout(() => processIncomingPages(incomingPages), 100);
        } else {
          processIncomingPages(incomingPages);
        }
      } catch (err) {
        console.error("Failed to process streaming page update", err);
      }
    });

    pageStreamSource.addEventListener("error", (event) => {
      console.error("Page stream connection error", event);
      // Clean up and attempt to reconnect after a delay
      cleanupEventSource();
      setTimeout(() => {
        if (document.visibilityState !== "hidden") {
          subscribeToStateStream();
        }
      }, 5000);
    });

    pageStreamSource.addEventListener("keepalive", (event) => {
      console.log("EventSource connection timed out, reconnecting...");
      cleanupEventSource();
      setTimeout(() => {
        if (document.visibilityState !== "hidden") {
          subscribeToStateStream();
        }
      }, 1000);
    });
  }

  initializePages().finally(() => {
    subscribeToStateStream();
  });

  // Multiple cleanup event listeners to ensure EventSource is properly closed
  window.addEventListener("beforeunload", cleanupEventSource);
  window.addEventListener("pagehide", cleanupEventSource);
  window.addEventListener("unload", cleanupEventSource);
  
  // Also cleanup on visibility change to handle some edge cases
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      cleanupEventSource();
    } else if (document.visibilityState === "visible") {
      // Reconnect EventSource when tab becomes visible again
      if (!pageStreamSource) {
        subscribeToStateStream();
      }
    }
  });

  // Debug: Log available layouts and templates
  console.log("Available layouts:", layouts);
  console.log("Available templates:", Object.keys(layoutTemplates || {}));

  // Load images AFTER pages are created so assigned images are properly filtered
  // (rebuildPagesUI triggers this once the DOM is ready).

  if (uploadForm && imageInput) {
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!imageInput.files.length) return;

      uploadImages(imageInput.files).catch((error) => {
        console.error(error);
        showSaveIndicator("Upload failed ✗", "#f44336");
        alert(`Failed to upload images: ${error.message}`);
      }).finally(() => {
        imageInput.value = "";
      });
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      uploadForm.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        uploadForm.classList.add("drag-active");
      });
    });

    ["dragleave", "dragend"].forEach((eventName) => {
      uploadForm.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        uploadForm.classList.remove("drag-active");
      });
    });

    uploadForm.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      uploadForm.classList.remove("drag-active");

      const files = event.dataTransfer ? event.dataTransfer.files : null;
      if (files && files.length) {
        uploadImages(files).catch((error) => {
          console.error(error);
          showSaveIndicator("Upload failed ✗", "#f44336");
          alert(`Failed to upload images: ${error.message}`);
        });
      }
    });
  }

  function applyLoadedState(payload) {
    const pages = Array.isArray(payload && payload.pages) ? payload.pages : [];
    const images = Array.isArray(payload && payload.images) ? payload.images : [];

    setInitialImages(images);
    rebuildPagesUI(pages);
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const confirmed = window.confirm("Resetting will remove all images and pages. Continue?");
      if (!confirmed) {
        return;
      }

      resetButton.disabled = true;
      showSaveIndicator("Resetting workspace...", "#2196F3");

      fetch("/state/reset", { method: "POST" })
        .then((response) =>
          response
            .json()
            .catch(() => ({ error: "Reset failed" }))
            .then((data) => {
              if (!response.ok || (data && data.error)) {
                const message = data && data.error ? data.error : "Reset failed";
                throw new Error(message);
              }

              applyLoadedState(data);
              showSaveIndicator("Workspace reset ✓", "#4CAF50");
            }),
        )
        .catch((error) => {
          console.error(error);
          showSaveIndicator("Reset failed ✗", "#f44336");
          alert(`Failed to reset workspace: ${error.message}`);
        })
        .finally(() => {
          resetButton.disabled = false;
        });
    });
  }

  if (saveStateButton) {
    saveStateButton.addEventListener("click", () => {
      saveStateButton.disabled = true;
      showSaveIndicator("Preparing state archive...", "#2196F3");

      fetch("/state/export")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to export state (status ${response.status})`);
          }

          const disposition = response.headers.get("Content-Disposition");
          return response.blob().then((blob) => ({ blob, disposition }));
        })
        .then(({ blob, disposition }) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = parseFilenameFromDisposition(disposition);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          showSaveIndicator("State downloaded ✓", "#4CAF50");
        })
        .catch((error) => {
          console.error(error);
          showSaveIndicator("State download failed ✗", "#f44336");
          alert(`Failed to download state: ${error.message}`);
        })
        .finally(() => {
          saveStateButton.disabled = false;
        });
    });
  }

  if (loadStateButton && loadStateInput) {
    loadStateButton.addEventListener("click", () => {
      loadStateInput.click();
    });

    loadStateInput.addEventListener("change", () => {
      const files = loadStateInput.files;
      if (!files || !files.length) {
        return;
      }

      const archive = files[0];
      const formData = new FormData();
      formData.append("state", archive);

      loadStateButton.disabled = true;
      showSaveIndicator("Loading state...", "#2196F3");

      fetch("/state/import", { method: "POST", body: formData })
        .then((response) =>
          response
            .json()
            .catch(() => ({ error: "State import failed" }))
            .then((data) => {
              if (!response.ok || (data && data.error)) {
                const message = data && data.error ? data.error : "State import failed";
                throw new Error(message);
              }

              applyLoadedState(data);
              showSaveIndicator("State loaded ✓", "#4CAF50");
            }),
        )
        .catch((error) => {
          console.error(error);
          showSaveIndicator("State load failed ✗", "#f44336");
          alert(`Failed to load state: ${error.message}`);
        })
        .finally(() => {
          loadStateButton.disabled = false;
          loadStateInput.value = "";
        });
    });
  }

  function getAssignedImages(pages) {
    const assigned = new Set();

    // Get currently assigned images from the DOM (most accurate)
    document.querySelectorAll("#pages .panel img").forEach((img) => {
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

  function createImagePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "empty-state";
    placeholder.dataset.placeholder = "";
    placeholder.innerHTML = `
      <span class="icon" aria-hidden="true">🖼️</span>
      <p>Drop panels into your story by uploading artwork.</p>
    `;
    return placeholder;
  }

  function updateImages(list, pages = null) {
    // If no pages provided, use current DOM state
    const currentPages = pages || getCurrentPageState();
    const assigned = getAssignedImages(currentPages);

    // Clear image list
    imageList.innerHTML = "";

    let appended = 0;
    list.forEach((name) => {
      if (!assigned.has(name)) {
        const wrapper = document.createElement("div");
        wrapper.className = "image-wrapper";
        const img = document.createElement("img");
        img.src = `/uploads/${name}`;
        img.className = "thumb";
        img.draggable = true;
        img.dataset.name = name;

        // Add delete button
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "delete-image-btn";
        delBtn.innerHTML = '<span aria-hidden="true">✕</span> Remove';
        delBtn.setAttribute("aria-label", "Delete image");
        delBtn.addEventListener("click", () => {
          fetch("/delete-image", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `name=${encodeURIComponent(name)}`,
          })
            .then((r) => r.json())
            .then(() => {
              wrapper.remove();
              if (!imageList.querySelector(".image-wrapper")) {
                imageList.appendChild(createImagePlaceholder());
              }
            });
        });
        wrapper.appendChild(img);
        wrapper.appendChild(delBtn);
        imageList.appendChild(wrapper);
        appended += 1;
      }
    });

    if (appended === 0) {
      imageList.appendChild(createImagePlaceholder());
    }
  }

  // Helper function to get current page state from DOM
  function getCurrentPageState() {
    const pages = [];
    document.querySelectorAll("#pages > .page").forEach((pageDiv) => {
      const slots = {};
      pageDiv.querySelectorAll(".panel").forEach((panel) => {
        const slot = String(panel.getAttribute("data-slot"));
        const img = getPanelImage(panel);
        if (img) {
          slots[slot] = img.dataset.name;
        }
      });
      pages.push({ slots });
    });
    return pages;
  }

  // Removed comicForm submit handler since the form no longer exists

  // Export PDF (Client-side)
  function parseRadiusValue(value) {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function buildRoundedRectPath(ctx, x, y, width, height, radii) {
    if (!radii || radii.every((r) => r === 0)) {
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      return;
    }

    const [tl, tr, br, bl] = radii;
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + width - tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
    ctx.lineTo(x + width, y + height - br);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - br,
      y + height,
    );
    ctx.lineTo(x + bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
  }

  function waitForImageLoad(img) {
    if (!img) return Promise.resolve();
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const cleanup = () => {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      };
      const onLoad = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        resolve();
      };
      img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onError, { once: true });
    });
  }

  async function renderLayoutToCanvas(layout, scale = EXPORT_SCALE) {
    if (!layout) {
      throw new Error("Cannot render export for an empty layout");
    }

    const layoutRect = layout.getBoundingClientRect();
    if (!layoutRect.width || !layoutRect.height) {
      throw new Error("Layout has zero dimensions");
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(layoutRect.width * scale);
    canvas.height = Math.round(layoutRect.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to obtain 2D canvas context");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const computedLayoutStyle = window.getComputedStyle(layout);
    let gutterColor = computedLayoutStyle.backgroundColor;
    if (
      !gutterColor ||
      gutterColor === "transparent" ||
      gutterColor === "rgba(0, 0, 0, 0)"
    ) {
      gutterColor = DEFAULT_GUTTER_COLOR;
    }

    ctx.fillStyle = gutterColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const images = Array.from(layout.querySelectorAll(".panel img"));
    await Promise.all(images.map((img) => waitForImageLoad(img)));

    layout.querySelectorAll(".panel").forEach((panel) => {
      const panelRect = panel.getBoundingClientRect();
      if (!panelRect.width || !panelRect.height) {
        return;
      }

      const offsetX = (panelRect.left - layoutRect.left) * scale;
      const offsetY = (panelRect.top - layoutRect.top) * scale;
      const panelWidth = panelRect.width * scale;
      const panelHeight = panelRect.height * scale;

      const panelStyle = window.getComputedStyle(panel);
      const radii = [
        parseRadiusValue(panelStyle.borderTopLeftRadius) * scale,
        parseRadiusValue(panelStyle.borderTopRightRadius) * scale,
        parseRadiusValue(panelStyle.borderBottomRightRadius) * scale,
        parseRadiusValue(panelStyle.borderBottomLeftRadius) * scale,
      ];

      const inner = panel.querySelector(".panel-inner");
      const innerStyle = inner ? window.getComputedStyle(inner) : null;
      let panelBackground = innerStyle ? innerStyle.backgroundColor : "#ffffff";
      if (
        !panelBackground ||
        panelBackground === "transparent" ||
        panelBackground === "rgba(0, 0, 0, 0)"
      ) {
        panelBackground = "#ffffff";
      }

      ctx.save();
      buildRoundedRectPath(ctx, offsetX, offsetY, panelWidth, panelHeight, radii);
      ctx.clip();
      ctx.fillStyle = panelBackground;
      ctx.fillRect(offsetX, offsetY, panelWidth, panelHeight);

      const img = panel.querySelector("img");
      if (img && img.naturalWidth && img.naturalHeight) {
        const imgRect = img.getBoundingClientRect();
        const imgX = (imgRect.left - layoutRect.left) * scale;
        const imgY = (imgRect.top - layoutRect.top) * scale;
        const imgWidth = imgRect.width * scale;
        const imgHeight = imgRect.height * scale;

        if (imgWidth > 0 && imgHeight > 0) {
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
        }
      }

      ctx.restore();
    });

    return canvas;
  }

  const exportBtn = document.getElementById("exportPdf");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        // Show export progress
        showSaveIndicator("Preparing export...", "#2196F3");
        exportBtn.disabled = true;
        exportBtn.textContent = "Generating PDF...";

        // First, ensure current state is saved and DOM is updated
        await new Promise((resolve) => {
          console.log("Starting export preparation...");

          // Save current state and force UI refresh if needed
          if (isUpdatingFromServer) {
            console.log("Waiting for server update to complete...");
            // Wait for any ongoing updates to complete
            setTimeout(() => {
              savePagesState(false);
              setTimeout(resolve, 1000);
            }, 1000);
          } else {
            console.log("Saving current state...");
            savePagesState(false);
            setTimeout(resolve, 1000);
          }
        });

        // Get .layout elements (children of layout-container)
        const layouts = Array.from(document.querySelectorAll(".layout"));
        if (layouts.length === 0) {
          alert("No pages to export!");
          return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [792, 612],
        });

        for (let i = 0; i < layouts.length; i += 2) {
          showSaveIndicator(
            `Rendering page ${Math.floor(i / 2) + 1}/${Math.ceil(layouts.length / 2)}...`,
            "#2196F3",
          );

          const layout1 = layouts[i];
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Capture first layout
          const canvas1 = await renderLayoutToCanvas(layout1, EXPORT_SCALE);

          if (canvas1.width === 0 || canvas1.height === 0) {
            throw new Error(`Canvas ${i + 1} has zero dimensions`);
          }

          const img1 = canvas1.toDataURL("image/png", 1.0);

          // Capture second layout if exists
          let img2 = null;
          let canvas2 = null;
          if (layouts[i + 1]) {
            const layout2 = layouts[i + 1];
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            canvas2 = await renderLayoutToCanvas(layout2, EXPORT_SCALE);

            if (canvas2.width === 0 || canvas2.height === 0) {
              throw new Error(`Canvas ${i + 2} has zero dimensions`);
            }

            img2 = canvas2.toDataURL("image/png", 1.0);
          }
          const pageHeight = PDF_PAGE_HEIGHT;
          const slotWidth = PDF_COLUMN_WIDTH;

          const canvases = [canvas1, canvas2];
          const images = [img1, img2];

          images.forEach((img, columnIndex) => {
            const canvas = canvases[columnIndex];
            if (!img || !canvas) return;

            const aspectRatio =
              canvas.width === 0 ? 1 : canvas.height / canvas.width;

            let renderWidth = slotWidth;
            let renderHeight = renderWidth * aspectRatio;
            if (renderHeight > pageHeight) {
              renderHeight = pageHeight;
              renderWidth = renderHeight / aspectRatio;
            }

            const offsetX =
              columnIndex * slotWidth + (slotWidth - renderWidth) / 2;
            const offsetY = (pageHeight - renderHeight) / 2;

            pdf.addImage(img, "PNG", offsetX, offsetY, renderWidth, renderHeight);
          });

          if (i + 2 < layouts.length) {
            pdf.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT], "landscape");
          }
        }

        // Create unique filename with timestamp
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, -5);
        const filename = `comic-layout-${timestamp}.pdf`;

        showSaveIndicator("Saving PDF...", "#2196F3");
        pdf.save(filename);
        showSaveIndicator("PDF exported successfully! ✓", "#4CAF50");
      } catch (error) {
        console.error("PDF export failed:", error);
        showSaveIndicator("PDF export failed ✗", "#f44336");
        alert(`Failed to export PDF: ${error.message}`);
      } finally {
        // Reset button
        exportBtn.disabled = false;
        exportBtn.textContent = "Export PDF";
      }
    });
  }

  // Export Images functionality
  const exportImagesBtn = document.getElementById("exportImages");
  if (exportImagesBtn) {
    exportImagesBtn.addEventListener("click", async () => {
      try {
        showSaveIndicator("Preparing export...", "#2196F3");
        exportImagesBtn.disabled = true;
        exportImagesBtn.textContent = "Generating Images...";

        const layouts = Array.from(document.querySelectorAll(".layout"));
        if (layouts.length === 0) {
          alert("No pages to export!");
          return;
        }

        for (let i = 0; i < layouts.length; i++) {
          showSaveIndicator(
            `Rendering page ${i + 1}/${layouts.length}...`,
            "#2196F3",
          );

          const layout = layouts[i];
          await new Promise((resolve) => setTimeout(resolve, 100));

          const canvas = await renderLayoutToCanvas(layout, EXPORT_SCALE);

          if (canvas.width === 0 || canvas.height === 0) {
            throw new Error(`Canvas ${i + 1} has zero dimensions`);
          }

          // Convert to blob and download
          canvas.toBlob(
            (blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `comic-page-${i + 1}.png`;
              link.click();
              URL.revokeObjectURL(url);
            },
            "image/png",
            1.0,
          );

          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        showSaveIndicator("Images exported successfully! ✓", "#4CAF50");
      } catch (error) {
        console.error("Image export failed:", error);
        showSaveIndicator("Image export failed ✗", "#f44336");
        alert(`Failed to export images: ${error.message}`);
      } finally {
        exportImagesBtn.disabled = false;
        exportImagesBtn.textContent = "Export Images";
      }
    });
  }

  // Keyboard shortcuts for better UX
  document.addEventListener("keydown", (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      showSaveIndicator("Manual save...", "#2196F3");
      savePagesState(false);
    }

    // Ctrl+N or Cmd+N to add new page
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      createPage();
      savePagesState(true);
    }

    // Ctrl+E or Cmd+E to export PDF
    if ((e.ctrlKey || e.metaKey) && e.key === "e") {
      e.preventDefault();
      const exportBtn = document.getElementById("exportPdf");
      if (exportBtn && !exportBtn.disabled) {
        exportBtn.click();
      }
    }

    // Ctrl+I or Cmd+I to export Images
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      const exportImagesBtn = document.getElementById("exportImages");
      if (exportImagesBtn && !exportImagesBtn.disabled) {
        exportImagesBtn.click();
      }
    }

    // Ctrl+D or Cmd+D to debug layouts (capture individual screenshots)
    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      debugLayouts();
    }

    // Escape to cancel any ongoing operations
    if (e.key === "Escape") {
      document.querySelectorAll(".panel.drag-over").forEach((panel) => {
        panel.classList.remove("drag-over");
      });
    }
  });

  // Debug function to capture individual layout screenshots
  async function debugLayouts() {
    const layoutContainers = Array.from(
      document.querySelectorAll(".layout-container"),
    );
    console.log("Debugging layout containers...");

    for (let i = 0; i < layoutContainers.length; i++) {
      const container = layoutContainers[i];
      const layout = container.querySelector(".layout");

      if (!layout) {
        console.warn(`No .layout found in container ${i + 1}`);
        continue;
      }

      console.log(`Capturing layout container ${i + 1}:`, container);
      console.log(
        `  - Layout size: ${layout.offsetWidth}x${layout.offsetHeight}`,
      );
      console.log(`  - Layout background: ${layout.style.background}`);
      console.log(
        `  - Panel count: ${layout.querySelectorAll(".panel").length}`,
      );

      try {
        const canvas = await renderLayoutToCanvas(layout, EXPORT_SCALE);

        // Convert to blob and create download link
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `layout-container-${i + 1}-debug.png`;
          link.click();
          URL.revokeObjectURL(url);
        });

        console.log(
          `Layout container ${i + 1} captured successfully (${canvas.width}x${canvas.height})`,
        );
      } catch (error) {
        console.error(`Failed to capture layout container ${i + 1}:`, error);
      }
    }
  }
});
