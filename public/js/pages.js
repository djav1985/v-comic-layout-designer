import { state } from "./state.js";
import { showSaveIndicator } from "./save-indicator.js";
import {
  updateImages,
  clearSelectedImage,
  openImageLibrary,
  getSelectedImageName,
  isMobileViewport,
  setInitialImages,
} from "./image-library.js";

export const PDF_PAGE_WIDTH = 792;
export const PDF_PAGE_HEIGHT = 612;
export const PDF_COLUMN_WIDTH = PDF_PAGE_WIDTH / 2;
export const DEFAULT_GUTTER_COLOR = "#cccccc";
export const EXPORT_SCALE = 2;

const dom = {
  pages: null,
  addPageButton: null,
  toggleShortcutsButton: null,
  shortcutList: null,
  resetButton: null,
  saveStateButton: null,
  loadStateButton: null,
  loadStateInput: null,
};

const normalizedTransformHandlers = new WeakMap();
const layoutResizeObservers = new WeakMap();
let hasWindowLayoutResizeListener = false;

function getPagesContainer() {
  if (dom.pages) {
    return dom.pages;
  }
  dom.pages = document.getElementById("pages");
  return dom.pages;
}

export function isPageLocked(node) {
  if (!node) return false;
  const page = node.closest(".page");
  return page ? page.classList.contains("is-locked") : false;
}

function getPanelContent(panel) {
  if (!panel) return null;
  return panel.querySelector(".panel-inner") || panel;
}

function getPanelImage(panel) {
  const content = getPanelContent(panel);
  return content ? content.querySelector("img") : null;
}

function getPanelContentDimensions(panel) {
  const content = getPanelContent(panel);
  const element = content || panel;
  if (!element) {
    return { width: 0, height: 0 };
  }
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width || 0,
    height: rect.height || 0,
  };
}

function clearPanel(panel) {
  const content = getPanelContent(panel);
  if (content) {
    content.innerHTML = "";
  }
}

function ensureWindowLayoutResizeListener() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (hasWindowLayoutResizeListener) return;
  hasWindowLayoutResizeListener = true;
  window.addEventListener("resize", () => {
    document.querySelectorAll(".layout-container").forEach((container) => {
      reapplyNormalizedTransforms(container);
    });
  });
}

function observeLayoutContainer(container) {
  if (!container) return;

  if (typeof window === "undefined") {
    return;
  }

  if (window.ResizeObserver) {
    if (layoutResizeObservers.has(container)) {
      return;
    }

    const observer = new ResizeObserver(() => {
      reapplyNormalizedTransforms(container);
    });
    observer.observe(container);
    layoutResizeObservers.set(container, observer);
  } else {
    ensureWindowLayoutResizeListener();
  }
}

function unobserveLayoutContainer(container) {
  if (!container) return;
  const observer = layoutResizeObservers.get(container);
  if (observer) {
    observer.disconnect();
    layoutResizeObservers.delete(container);
  }
}

function ensureLayoutStyle(name) {
  if (document.getElementById("style-" + name)) return;
  const style = document.createElement("style");
  style.id = "style-" + name;
  style.textContent = layoutStyles[name] || "";
  document.head.appendChild(style);
}

export function debouncedSave() {
  if (state.saveTimeout) {
    clearTimeout(state.saveTimeout);
  }
  showSaveIndicator("Saving...", "#FF9800");
  state.saveTimeout = setTimeout(() => {
    savePagesState(false);
  }, 500);
}

function removeSlotInputs(container, pageIndex, slot) {
  container
    .querySelectorAll(`input[name="pages[${pageIndex}][slots][${slot}]"]`)
    .forEach((input) => input.remove());
  container
    .querySelectorAll(`input[name="pages[${pageIndex}][transforms][${slot}]"]`)
    .forEach((input) => input.remove());
}

function enableImageControls(img, hiddenInput, initial = {}) {
  const toFiniteNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  let scale = toFiniteNumber(initial.scale);
  if (scale === null) {
    scale = 1;
  }

  const initialTranslateX = toFiniteNumber(initial.translateX);
  const initialTranslateY = toFiniteNumber(initial.translateY);
  let translateX = initialTranslateX ?? 0;
  let translateY = initialTranslateY ?? 0;

  // Standardize on translateXPercent and translateYPercent property names
  const normalizedX = toFiniteNumber(initial.translateXPercent);
  const normalizedY = toFiniteNumber(initial.translateYPercent);

  let translateXPct = normalizedX ?? 0;
  let translateYPct = normalizedY ?? 0;

  const hasNormalizedX = normalizedX !== null;
  const hasNormalizedY = normalizedY !== null;

  let rafId = null;
  let deriveXFromNormalized = hasNormalizedX;
  let deriveYFromNormalized = hasNormalizedY;

  function updateCursor() {
    img.style.cursor = isPageLocked(img) ? "not-allowed" : "move";
  }

  const applyTransform = ({ fromNormalizedX = false, fromNormalizedY = false } = {}) => {
    const panel = img.closest(".panel");
    const { width, height } = getPanelContentDimensions(panel);
    const baseWidth = width || img.clientWidth || img.naturalWidth || 1;
    const baseHeight = height || img.clientHeight || img.naturalHeight || 1;

    if (fromNormalizedX) {
      const pct = Number.isFinite(translateXPct) ? translateXPct : 0;
      translateX = (baseWidth * pct) / 100;
    }

    if (fromNormalizedY) {
      const pct = Number.isFinite(translateYPct) ? translateYPct : 0;
      translateY = (baseHeight * pct) / 100;
    }

    const safeWidth = baseWidth || 1;
    const safeHeight = baseHeight || 1;
    translateXPct = (translateX / safeWidth) * 100;
    translateYPct = (translateY / safeHeight) * 100;

    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    img.dataset.scale = String(scale);
    img.dataset.translateX = String(translateX);
    img.dataset.translateY = String(translateY);
    img.dataset.translateXPct = String(translateXPct);
    img.dataset.translateYPct = String(translateYPct);

    if (hiddenInput) {
      hiddenInput.value = JSON.stringify({ scale, translateXPct, translateYPct });
    }
  };

  const updateTransform = ({ fromNormalizedX = false, fromNormalizedY = false, immediate = false } = {}) => {
    if (fromNormalizedX) {
      deriveXFromNormalized = true;
    }
    if (fromNormalizedY) {
      deriveYFromNormalized = true;
    }

    if (immediate) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      applyTransform({
        fromNormalizedX: deriveXFromNormalized,
        fromNormalizedY: deriveYFromNormalized,
      });
      deriveXFromNormalized = false;
      deriveYFromNormalized = false;
      return;
    }

    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      applyTransform({
        fromNormalizedX: deriveXFromNormalized,
        fromNormalizedY: deriveYFromNormalized,
      });
      deriveXFromNormalized = false;
      deriveYFromNormalized = false;
      rafId = null;
    });
  };

  img.addEventListener("wheel", (e) => {
    if (isPageLocked(img)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    scale = Math.min(3, Math.max(0.5, scale + delta));
    updateTransform();
    debouncedSave();
  });

  let dragging = false;
  let startX;
  let startY;

  img.addEventListener("mousedown", (e) => {
    if (isPageLocked(img)) {
      e.preventDefault();
      updateCursor();
      return;
    }
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
    updateTransform();
  });

  document.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      img.style.cursor = "move";
      debouncedSave();
    }
  });

  img.addEventListener("load", () => {
    updateTransform({ fromNormalizedX: true, fromNormalizedY: true });
  });

  normalizedTransformHandlers.set(img, (options = {}) => {
    updateTransform({
      fromNormalizedX: true,
      fromNormalizedY: true,
      immediate: Boolean(options.immediate),
    });
  });

  updateTransform({ fromNormalizedX: hasNormalizedX, fromNormalizedY: hasNormalizedY });
  updateCursor();
}

function placeImageInPanel({
  panel,
  slot,
  imageName,
  container,
  pageIndex,
  initialTransform = {},
  skipLibraryUpdate = false,
  skipSave = false,
  overrideLock = false,
}) {
  if (!panel || !imageName) return false;
  if (!overrideLock && isPageLocked(panel)) {
    return false;
  }
  const content = getPanelContent(panel);
  if (!content) return false;

  removeSlotInputs(container, pageIndex, slot);
  clearPanel(panel);

  const clone = document.createElement("img");
  clone.src = `/uploads/${imageName}`;
  clone.draggable = false;
  clone.dataset.name = imageName;
  clone.classList.add("panel-image");

  const transformInput = document.createElement("input");
  transformInput.type = "hidden";
  transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
  transformInput.value = JSON.stringify(initialTransform || {});
  container.appendChild(transformInput);

  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = `pages[${pageIndex}][slots][${slot}]`;
  hidden.value = imageName;
  container.appendChild(hidden);

  content.appendChild(clone);
  clone.style.cursor = isPageLocked(panel) ? "not-allowed" : "move";
  
  // Enable image controls after appending to DOM so getPanelContentDimensions can measure actual dimensions
  enableImageControls(clone, transformInput, initialTransform || {});

  if (!skipLibraryUpdate) {
    setTimeout(() => {
      updateImages(typeof initialImages !== "undefined" ? initialImages : []);
    }, 0);
  }

  if (!skipSave) {
    debouncedSave();
  }

  return true;
}

function handleSelectedImagePlacement(panel, slot, container, pageIndex) {
  if (isPageLocked(panel)) {
    return false;
  }

  const selectedName = getSelectedImageName();
  if (!selectedName) {
    if (isMobileViewport()) {
      openImageLibrary();
    }
    return false;
  }
  const placed = placeImageInPanel({
    panel,
    slot,
    imageName: selectedName,
    container,
    pageIndex,
  });
  if (placed) {
    clearSelectedImage();
  }
  return placed;
}

function returnImagesFromPage(container) {
  container.querySelectorAll('input[type="hidden"]').forEach((input) => input.remove());
  container.querySelectorAll(".panel").forEach((panel) => {
    clearPanel(panel);
  });
  setTimeout(() => {
    updateImages(typeof initialImages !== "undefined" ? initialImages : []);
  }, 0);
}

function renderLayout(
  container,
  layoutName,
  pageIndex,
  slots = {},
  transforms = {},
) {
  if (!layoutTemplates[layoutName]) {
    container.innerHTML = `<div style='color:red'>Layout template not found: ${layoutName}</div>`;
    console.error(`Layout template not found: ${layoutName}`);
    return;
  }

  container.innerHTML = layoutTemplates[layoutName];
  ensureLayoutStyle(layoutName);

  const layoutDiv = container.querySelector(".layout");
  if (layoutDiv) {
    layoutDiv.classList.add(layoutName);
    layoutDiv.dataset.layoutName = layoutName;

    let gutterColor = DEFAULT_GUTTER_COLOR;
    const pageDiv = container.closest(".page");
    if (pageDiv) {
      const colorInput = pageDiv.querySelector('input[type="color"]');
      if (colorInput) gutterColor = colorInput.value;
    }
    layoutDiv.style.background = gutterColor;
  }

  container.querySelectorAll(".panel").forEach((panel) => {
    const slot = panel.getAttribute("data-slot");

    panel.addEventListener("dragover", (e) => {
      if (isPageLocked(panel)) {
        e.preventDefault();
        panel.classList.remove("drag-over");
        return;
      }
      e.preventDefault();
      panel.classList.add("drag-over");
    });

    panel.addEventListener("dragleave", () => {
      panel.classList.remove("drag-over");
    });

    panel.addEventListener("drop", (e) => {
      if (isPageLocked(panel)) {
        e.preventDefault();
        panel.classList.remove("drag-over");
        return;
      }
      e.preventDefault();
      panel.classList.remove("drag-over");

      const name = e.dataTransfer.getData("text/plain");
      const imageList = document.getElementById("imageList");
      const img = imageList ? imageList.querySelector(`img[data-name="${name}"]`) : null;
      if (!img) return;

      const wrapper = img.closest(".image-wrapper");
      if (wrapper) wrapper.remove();
      if (getSelectedImageName() === name) {
        clearSelectedImage();
      }

      placeImageInPanel({
        panel,
        slot,
        imageName: name,
        container,
        pageIndex,
      });
    });

    if (slots[slot]) {
      const imageName = slots[slot];
      const initial = transforms[slot] || {};
      placeImageInPanel({
        panel,
        slot,
        imageName,
        container,
        pageIndex,
        initialTransform: initial,
        skipLibraryUpdate: true,
        skipSave: true,
        overrideLock: true,
      });
    }

    let lastTouchTime = 0;

    panel.addEventListener("touchend", (event) => {
      if (event.touches && event.touches.length > 0) return;
      if (isPageLocked(panel)) {
        return;
      }
      const now = Date.now();
      if (now - lastTouchTime < 300) {
        event.preventDefault();
        handleSelectedImagePlacement(panel, slot, container, pageIndex);
      }
      lastTouchTime = now;
    });

    panel.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (isPageLocked(panel)) {
        return;
      }
      handleSelectedImagePlacement(panel, slot, container, pageIndex);
    });
  });
}

export function createPage(
  data,
  pagesContainer = getPagesContainer(),
) {
  const page = document.createElement("div");
  page.className = "page";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-page-btn";
  deleteBtn.innerHTML = '<span aria-hidden="true">✕</span>';
  deleteBtn.setAttribute("aria-label", "Remove page");

  const lockBtn = document.createElement("button");
  lockBtn.type = "button";
  lockBtn.className = "page-lock-btn";
  lockBtn.textContent = "U";
  lockBtn.setAttribute("aria-label", "Lock page");
  lockBtn.setAttribute("aria-pressed", "false");

  const select = document.createElement("select");
  layouts.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    select.appendChild(opt);
  });

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

  const controlsContainer = document.createElement("div");
  controlsContainer.className = "page-controls";
  controlsContainer.appendChild(layoutGroup);
  controlsContainer.appendChild(deleteBtn);
  controlsContainer.appendChild(lockBtn);
  controlsContainer.appendChild(gutterGroup);

  page.appendChild(controlsContainer);

  const container = document.createElement("div");
  container.className = "layout-container";
  page.appendChild(container);
  pagesContainer.appendChild(page);

  observeLayoutContainer(container);

  const index = state.pageCounter++;
  select.name = `pages[${index}][layout]`;
  gutterColor.name = `pages[${index}][gutterColor]`;
  if (data && data.layout) {
    select.value = data.layout;
  }

  select.addEventListener("change", () => {
    returnImagesFromPage(container);
    renderLayout(container, select.value, index);

    setTimeout(() => {
      const layoutDiv = container.querySelector(".layout");
      if (layoutDiv) {
        layoutDiv.classList.remove(...layouts);
        layoutDiv.classList.add(select.value);
        layoutDiv.dataset.layoutName = select.value;
      }
    }, 100);

    savePagesState(true);
  });

  gutterColor.addEventListener("input", () => {
    const layoutDiv = container.querySelector(".layout");
    if (layoutDiv) {
      layoutDiv.style.background = gutterColor.value;
    }
    debouncedSave();
  });

  container.style.background = gutterColor.value;
  renderLayout(
    container,
    select.value,
    index,
    data ? data.slots : {},
    data ? data.transforms : {},
  );

  if (!data) {
    debouncedSave();
  }

  const applyLockState = (locked) => {
    page.classList.toggle("is-locked", locked);
    lockBtn.classList.toggle("is-locked", locked);
    lockBtn.textContent = locked ? "L" : "U";
    lockBtn.setAttribute("aria-pressed", String(locked));
    lockBtn.setAttribute("aria-label", locked ? "Unlock page" : "Lock page");
    lockBtn.title = locked ? "Page locked" : "Page unlocked";
    page.querySelectorAll(".panel-image").forEach((img) => {
      img.style.cursor = locked ? "not-allowed" : "move";
    });
  };

  lockBtn.addEventListener("click", () => {
    const shouldLock = !page.classList.contains("is-locked");
    applyLockState(shouldLock);
    debouncedSave();
  });

  applyLockState(Boolean(data && data.locked));

  deleteBtn.addEventListener("click", () => {
    returnImagesFromPage(container);
    unobserveLayoutContainer(container);
    page.remove();
    savePagesState(true);
  });
}

export function capturePagesFromDom() {
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
        const scaleValue = parseFloat(img.dataset.scale);
        const rawTranslateXPct = parseFloat(img.dataset.translateXPct);
        const rawTranslateYPct = parseFloat(img.dataset.translateYPct);
        let translateXPct = Number.isFinite(rawTranslateXPct) ? rawTranslateXPct : null;
        let translateYPct = Number.isFinite(rawTranslateYPct) ? rawTranslateYPct : null;

        if (translateXPct === null || translateYPct === null) {
          const { width, height } = getPanelContentDimensions(panel);
          const pxX = parseFloat(img.dataset.translateX);
          const pxY = parseFloat(img.dataset.translateY);

          if (translateXPct === null) {
            translateXPct = width ? ((Number.isFinite(pxX) ? pxX : 0) / width) * 100 : 0;
          }

          if (translateYPct === null) {
            translateYPct = height ? ((Number.isFinite(pxY) ? pxY : 0) / height) * 100 : 0;
          }
        }

        transforms[slot] = {
          scale: Number.isFinite(scaleValue) ? scaleValue : 1,
          translateXPct,
          translateYPct,
        };
      }
    });
    const locked = pageDiv.classList.contains("is-locked");
    pages.push({ layout, gutterColor, slots, transforms, locked });
  });
  return pages;
}

export function savePagesState(rebuildUI = true) {
  if (state.isUpdatingFromServer) return;

  const pages = capturePagesFromDom();
  const signature = JSON.stringify(pages);

  fetch("/save-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pages, pageCount: pages.length }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Save request failed");
      showSaveIndicator("Saved ✓", "#4CAF50");
      state.lastSyncedSignature = signature;
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

export function rebuildPagesUI(pages) {
  state.isUpdatingFromServer = true;
  const currentPagesDiv = getPagesContainer();
  const newPagesDiv = document.createElement("div");
  newPagesDiv.id = "pages";
  const prevCounter = state.pageCounter;
  state.pageCounter = 0;

  try {
    window.savedPages = pages;
    state.lastSyncedSignature = JSON.stringify(pages);
    if (pages.length) {
      pages.forEach((p) => createPage(p, newPagesDiv));
    } else {
      createPage(undefined, newPagesDiv);
    }
    currentPagesDiv
      .querySelectorAll(".layout-container")
      .forEach((container) => unobserveLayoutContainer(container));
    currentPagesDiv.replaceWith(newPagesDiv);
    dom.pages = newPagesDiv;

    setTimeout(() => {
      updateImages(typeof initialImages !== "undefined" ? initialImages : []);
    }, 0);
  } catch (err) {
    console.error(err);
    alert("Failed to render pages");
    state.pageCounter = prevCounter;
  } finally {
    state.isUpdatingFromServer = false;
  }
}

export async function initializePages() {
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

    rebuildPagesUI(data.pages);
  } catch (error) {
    console.error("Failed to load saved pages from state.json:", error);
    rebuildPagesUI([]);
  }
}

export function cleanupEventSource() {
  if (state.pageStreamSource) {
    state.pageStreamSource.close();
    state.pageStreamSource = null;
  }
}

function processIncomingPages(incomingPages) {
  const incomingSignature = JSON.stringify(incomingPages);

  if (incomingSignature === state.lastSyncedSignature) {
    return;
  }

  const currentSignature = JSON.stringify(capturePagesFromDom());
  if (incomingSignature === currentSignature) {
    state.lastSyncedSignature = incomingSignature;
    return;
  }

  rebuildPagesUI(incomingPages);
  state.lastSyncedSignature = incomingSignature;
}

export function subscribeToStateStream() {
  if (!window.EventSource) {
    console.warn("EventSource is not supported in this browser; live sync disabled.");
    return;
  }

  if (state.pageStreamSource) {
    return;
  }

  state.pageStreamSource = new EventSource("/pages/stream");

  state.pageStreamSource.addEventListener("pages", (event) => {
    if (!event.data) {
      return;
    }

    try {
      const payload = JSON.parse(event.data);
      const incomingPages = Array.isArray(payload.pages) ? payload.pages : [];

      if (state.isUpdatingFromServer) {
        setTimeout(() => processIncomingPages(incomingPages), 100);
      } else {
        processIncomingPages(incomingPages);
      }
    } catch (err) {
      console.error("Failed to process streaming page update", err);
    }
  });

  state.pageStreamSource.addEventListener("error", (event) => {
    console.error("Page stream connection error", event);
    cleanupEventSource();
    setTimeout(() => {
      if (document.visibilityState !== "hidden") {
        subscribeToStateStream();
      }
    }, 5000);
  });

  state.pageStreamSource.addEventListener("keepalive", () => {
    cleanupEventSource();
    setTimeout(() => {
      if (document.visibilityState !== "hidden") {
        subscribeToStateStream();
      }
    }, 1000);
  });
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

export function applyLoadedState(payload) {
  const pages = Array.isArray(payload && payload.pages) ? payload.pages : [];
  const images = Array.isArray(payload && payload.images) ? payload.images : [];

  setInitialImages(images);
  rebuildPagesUI(pages);
}

function setupResetButton() {
  const { resetButton } = dom;
  if (!resetButton) return;

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

function setupStateImportExport() {
  const { saveStateButton, loadStateButton, loadStateInput } = dom;
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
}

function setupShortcutToggle() {
  const { toggleShortcutsButton, shortcutList } = dom;
  if (!toggleShortcutsButton || !shortcutList) {
    return;
  }

  const setExpandedHeight = () => {
    const currentHeight = shortcutList.scrollHeight;
    shortcutList.style.setProperty("--shortcuts-expanded-height", `${currentHeight}px`);
  };

  const updateToggleState = (isOpen) => {
    toggleShortcutsButton.setAttribute("aria-expanded", String(isOpen));
    toggleShortcutsButton.classList.toggle("active", isOpen);
    toggleShortcutsButton.textContent = isOpen ? "Hide Shortcuts" : "Show Shortcuts";
    shortcutList.setAttribute("aria-hidden", String(!isOpen));
  };

  setExpandedHeight();
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

export function initializePageModule(refs) {
  Object.assign(dom, refs);

  setupShortcutToggle();
  setupResetButton();
  setupStateImportExport();

  if (dom.addPageButton) {
    dom.addPageButton.addEventListener("click", () => {
      createPage();
      savePagesState(true);
    });
  }
}

export function parseRadiusValue(value) {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function buildRoundedRectPath(ctx, x, y, width, height, radii) {
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
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  ctx.lineTo(x + bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

export function waitForImageLoad(img) {
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

export function reapplyNormalizedTransforms(root = document) {
  let images = [];

  if (root instanceof HTMLImageElement) {
    images = [root];
  } else if (root && typeof root.querySelectorAll === "function") {
    images = Array.from(root.querySelectorAll(".panel img"));
  } else {
    images = Array.from(document.querySelectorAll(".panel img"));
  }

  images.forEach((img) => {
    const handler = normalizedTransformHandlers.get(img);
    if (handler) {
      handler({ immediate: true });
    }
  });
}

export async function renderLayoutToCanvas(layout, scale = EXPORT_SCALE) {
  if (!layout) {
    throw new Error("Cannot render export for an empty layout");
  }

  reapplyNormalizedTransforms(layout);

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
  if (!gutterColor || gutterColor === "transparent" || gutterColor === "rgba(0, 0, 0, 0)") {
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
    if (!panelBackground || panelBackground === "transparent" || panelBackground === "rgba(0, 0, 0, 0)") {
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

export function initializeLifecycleHandlers() {
  window.addEventListener("beforeunload", cleanupEventSource);
  window.addEventListener("pagehide", cleanupEventSource);
  window.addEventListener("unload", cleanupEventSource);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      cleanupEventSource();
    } else if (document.visibilityState === "visible") {
      if (!state.pageStreamSource) {
        subscribeToStateStream();
      }
    }
  });
}
