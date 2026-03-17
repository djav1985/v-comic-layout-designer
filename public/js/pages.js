import { state } from "./state.js";
import { showSaveIndicator, updateSyncHealth, createSyncHealthIndicator } from "./save-indicator.js";
import { history } from "./history.js";
import {
  updateImages,
  clearSelectedImage,
  openImageLibrary,
  getSelectedImageName,
  isMobileViewport,
  setInitialImages,
} from "./image-library.js";
import { getCsrfHeaders } from "./csrf.js";

export const PDF_PAGE_WIDTH = 792;
export const PDF_PAGE_HEIGHT = 612;
export const PDF_COLUMN_WIDTH = PDF_PAGE_WIDTH / 2;
export const DEFAULT_GUTTER_COLOR = "#cccccc";
export const EXPORT_SCALE = 2;
export const CANONICAL_LAYOUT_WIDTH = 900;
export const CANONICAL_LAYOUT_ASPECT_RATIO = 1.545;
export const CANONICAL_LAYOUT_HEIGHT = Math.round(
  CANONICAL_LAYOUT_WIDTH * CANONICAL_LAYOUT_ASPECT_RATIO,
);

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

/**
 * Calculates percentage from pixel value relative to a dimension
 * @param {number} pixelValue - The pixel value to convert
 * @param {number} dimension - The dimension to calculate percentage against
 * @param {boolean} useFiniteCheck - Whether to validate pixelValue with Number.isFinite
 * @returns {number} The calculated percentage (0-100 range)
 */
function calculatePercentage(pixelValue, dimension, useFiniteCheck = false) {
  if (!dimension) {
    return 0;
  }

  const safePixelValue = useFiniteCheck
    ? Number.isFinite(pixelValue)
      ? pixelValue
      : 0
    : pixelValue;

  return (safePixelValue / dimension) * 100;
}

// Removes only the image element from a panel, leaving bubbles and other
// overlay content intact. Called before placing a new image so that existing
// bubbles survive image replacement.
function clearPanel(panel) {
  const content = getPanelContent(panel);
  if (content) {
    content.querySelectorAll("img").forEach((img) => img.remove());
  }
}

// ---- Bubble helpers ----

let bubbleIdCounter = 0;

function generateBubbleId() {
  return `bubble-${Date.now()}-${++bubbleIdCounter}`;
}

function captureBubblesFromPanels(pageDiv) {
  const bubbles = {};
  pageDiv.querySelectorAll(".panel").forEach((panel) => {
    const slot = String(panel.getAttribute("data-slot"));
    const panelBubbles = [];
    panel.querySelectorAll(".bubble").forEach((el) => {
      const textEl = el.querySelector(".bubble-text");
      panelBubbles.push({
        id: el.dataset.bubbleId || generateBubbleId(),
        text: textEl ? textEl.textContent.trim() : "",
        xPct: parseFloat(el.style.left) || 0,
        yPct: parseFloat(el.style.top) || 0,
        widthPct: parseFloat(el.style.width) || 40,
        heightPct: parseFloat(el.style.height) || 20,
        tail: el.dataset.tail || "none",
        style: el.dataset.style || "speech",
        zIndex: parseInt(el.style.zIndex, 10) || 10,
      });
    });
    if (panelBubbles.length) {
      bubbles[slot] = panelBubbles;
    }
  });
  return bubbles;
}

function enableBubbleDrag(el, panel) {
  let startMouseX, startMouseY, startLeftPx, startTopPx;

  el.addEventListener("mousedown", (e) => {
    if (isPageLocked(panel)) return;
    if (
      e.target.classList.contains("bubble-delete-btn") ||
      e.target.classList.contains("bubble-style-btn") ||
      e.target.classList.contains("bubble-resize-handle") ||
      e.target.classList.contains("bubble-text")
    )
      return;
    e.preventDefault();
    e.stopPropagation();
    const content = getPanelContent(panel);
    const rect = content.getBoundingClientRect();
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startLeftPx = (parseFloat(el.style.left) / 100) * rect.width;
    startTopPx = (parseFloat(el.style.top) / 100) * rect.height;

    const onMouseMove = (moveEvent) => {
      const moveContent = getPanelContent(panel);
      const moveRect = moveContent.getBoundingClientRect();
      if (!moveRect.width || !moveRect.height) return;
      const newLeft =
        ((startLeftPx + (moveEvent.clientX - startMouseX)) / moveRect.width) *
        100;
      const newTop =
        ((startTopPx + (moveEvent.clientY - startMouseY)) / moveRect.height) *
        100;
      el.style.left = `${newLeft}%`;
      el.style.top = `${newTop}%`;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      debouncedSave();
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

function enableBubbleResize(el, handle, panel) {
  let startMouseX, startMouseY, startWidthPx, startHeightPx;

  handle.addEventListener("mousedown", (e) => {
    if (isPageLocked(panel)) return;
    e.preventDefault();
    e.stopPropagation();
    const content = getPanelContent(panel);
    const rect = content.getBoundingClientRect();
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startWidthPx = (parseFloat(el.style.width) / 100) * rect.width;
    startHeightPx = (parseFloat(el.style.height) / 100) * rect.height;

    const onMouseMove = (moveEvent) => {
      const moveContent = getPanelContent(panel);
      const moveRect = moveContent.getBoundingClientRect();
      if (!moveRect.width || !moveRect.height) return;
      const newWidth = Math.max(
        60,
        startWidthPx + (moveEvent.clientX - startMouseX)
      );
      const newHeight = Math.max(
        30,
        startHeightPx + (moveEvent.clientY - startMouseY)
      );
      el.style.width = `${(newWidth / moveRect.width) * 100}%`;
      el.style.height = `${(newHeight / moveRect.height) * 100}%`;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      debouncedSave();
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

function createBubbleElement(data, panel, container, pageIndex, slot) {
  const content = getPanelContent(panel);
  if (!content) return null;

  const BUBBLE_STYLES = ["speech", "thought", "narration"];
  const bubbleStyle = BUBBLE_STYLES.includes(data.style) ? data.style : "speech";

  const el = document.createElement("div");
  el.className = `bubble bubble-${bubbleStyle}`;
  el.dataset.bubbleId = data.id || generateBubbleId();
  el.dataset.style = bubbleStyle;
  el.dataset.tail = data.tail || "none";
  el.style.left = `${data.xPct ?? 5}%`;
  el.style.top = `${data.yPct ?? 5}%`;
  el.style.width = `${data.widthPct ?? 40}%`;
  el.style.height = `${data.heightPct ?? 20}%`;
  el.style.zIndex = String(data.zIndex ?? 10);

  const textEl = document.createElement("div");
  textEl.className = "bubble-text";
  textEl.contentEditable = "plaintext-only";
  textEl.textContent = data.text || "";
  el.appendChild(textEl);

  const styleBtn = document.createElement("button");
  styleBtn.type = "button";
  styleBtn.className = "bubble-style-btn";
  styleBtn.setAttribute("aria-label", "Change bubble style");
  styleBtn.title = "Cycle style: speech → thought → narration";
  styleBtn.textContent = "◉";
  el.appendChild(styleBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "bubble-delete-btn";
  deleteBtn.setAttribute("aria-label", "Delete bubble");
  deleteBtn.title = "Delete bubble";
  deleteBtn.textContent = "✕";
  el.appendChild(deleteBtn);

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "bubble-resize-handle";
  resizeHandle.setAttribute("aria-hidden", "true");
  el.appendChild(resizeHandle);

  content.appendChild(el);

  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPageLocked(panel)) return;
    el.remove();
    debouncedSave();
  });

  styleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPageLocked(panel)) return;
    const current = el.dataset.style || "speech";
    const next =
      BUBBLE_STYLES[(BUBBLE_STYLES.indexOf(current) + 1) % BUBBLE_STYLES.length];
    BUBBLE_STYLES.forEach((s) => el.classList.remove(`bubble-${s}`));
    el.classList.add(`bubble-${next}`);
    el.dataset.style = next;
    debouncedSave();
  });

  textEl.addEventListener("input", () => {
    if (isPageLocked(panel)) return;
    debouncedSave();
  });

  textEl.addEventListener("paste", (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const text = clipboardData ? clipboardData.getData("text/plain") : "";
    if (typeof document.execCommand === "function") {
      document.execCommand("insertText", false, text);
    } else {
      // Fallback: replace the entire content with plain text
      textEl.textContent =
        textEl.textContent.slice(0, 0) + text + textEl.textContent.slice(0);
    }
  });

  textEl.addEventListener("keydown", (e) => {
    e.stopPropagation();
  });

  enableBubbleDrag(el, panel);
  enableBubbleResize(el, resizeHandle, panel);

  return el;
}

// ---- End bubble helpers ----

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

  const applyTransform = ({
    fromNormalizedX = false,
    fromNormalizedY = false,
  } = {}) => {
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
    translateXPct = calculatePercentage(translateX, safeWidth);
    translateYPct = calculatePercentage(translateY, safeHeight);

    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    img.dataset.scale = String(scale);
    img.dataset.translateX = String(translateX);
    img.dataset.translateY = String(translateY);
    img.dataset.translateXPct = String(translateXPct);
    img.dataset.translateYPct = String(translateYPct);

    if (hiddenInput) {
      hiddenInput.value = JSON.stringify({
        scale,
        translateXPct,
        translateYPct,
      });
    }
  };

  const updateTransform = ({
    fromNormalizedX = false,
    fromNormalizedY = false,
    immediate = false,
  } = {}) => {
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

  updateTransform({
    fromNormalizedX: hasNormalizedX,
    fromNormalizedY: hasNormalizedY,
  });
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
  container
    .querySelectorAll('input[type="hidden"]')
    .forEach((input) => input.remove());
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
  bubbles = {},
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
      const img = imageList
        ? imageList.querySelector(`img[data-name="${name}"]`)
        : null;
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

    // Add Bubble button (preserved through image placements since clearPanel only removes img)
    const panelContent = getPanelContent(panel);
    if (panelContent) {
      const addBubbleBtn = document.createElement("button");
      addBubbleBtn.type = "button";
      addBubbleBtn.className = "add-bubble-btn";
      addBubbleBtn.textContent = "+ Bubble";
      addBubbleBtn.setAttribute("aria-label", "Add speech bubble to panel");
      // Append as a sibling of the panel content so .panel-inner can be truly empty
      panel.appendChild(addBubbleBtn);

      addBubbleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isPageLocked(panel)) return;
        createBubbleElement(
          {
            id: generateBubbleId(),
            text: "Edit text…",
            xPct: 5,
            yPct: 5,
            widthPct: 45,
            heightPct: 22,
            tail: "none",
            style: "speech",
            zIndex: 10,
          },
          panel,
          container,
          pageIndex,
          slot,
        );
        debouncedSave();
      });
    }

    // Restore bubbles for this slot
    const slotBubbles = Array.isArray(bubbles[slot]) ? bubbles[slot] : [];
    slotBubbles.forEach((bubbleData) => {
      createBubbleElement(bubbleData, panel, container, pageIndex, slot);
    });
  });
}

export function createPage(data, pagesContainer = getPagesContainer()) {
  const page = document.createElement("div");
  page.className = "page";
  page.setAttribute("tabindex", "0");

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-page-btn";
  deleteBtn.innerHTML = '<span aria-hidden="true">✕</span><span class="sr-only">Remove page</span>';
  deleteBtn.setAttribute("aria-label", "Remove page");

  const lockBtn = document.createElement("button");
  lockBtn.type = "button";
  lockBtn.className = "page-lock-btn";
  // Label text is set by applyLockState below
  lockBtn.setAttribute("aria-pressed", "false");

  const duplicateBtn = document.createElement("button");
  duplicateBtn.type = "button";
  duplicateBtn.className = "duplicate-page-btn";
  duplicateBtn.innerHTML = '<span aria-hidden="true">⧉</span><span class="sr-only">Duplicate page</span>';
  duplicateBtn.setAttribute("aria-label", "Duplicate page");
  duplicateBtn.title = "Duplicate page";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "clear-page-btn";
  clearBtn.innerHTML = '<span aria-hidden="true">⊘</span><span class="sr-only">Clear page images</span>';
  clearBtn.setAttribute("aria-label", "Clear all images from page");
  clearBtn.title = "Clear all images from page";

  const select = document.createElement("select");
  select.setAttribute("aria-label", "Page layout");
  layouts.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    select.appendChild(opt);
  });

  const gutterColor = document.createElement("input");
  gutterColor.type = "color";
  gutterColor.value =
    data && data.gutterColor ? data.gutterColor : DEFAULT_GUTTER_COLOR;
  gutterColor.title = "Gutter Color";
  gutterColor.setAttribute("aria-label", "Gutter color");
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
  controlsContainer.appendChild(duplicateBtn);
  controlsContainer.appendChild(clearBtn);
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
    history.push(capturePagesFromDom());
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
    data ? (data.bubbles || {}) : {},
  );

  if (!data) {
    debouncedSave();
  }

  const applyLockState = (locked) => {
    page.classList.toggle("is-locked", locked);
    lockBtn.classList.toggle("is-locked", locked);
    lockBtn.innerHTML = locked
      ? '<span aria-hidden="true">🔒</span><span class="lock-label">Locked</span>'
      : '<span aria-hidden="true">🔓</span><span class="lock-label">Unlocked</span>';
    lockBtn.setAttribute("aria-pressed", String(locked));
    lockBtn.setAttribute("aria-label", locked ? "Unlock page" : "Lock page");
    lockBtn.title = locked ? "Click to unlock page" : "Click to lock page";
    page.querySelectorAll(".panel-image").forEach((img) => {
      img.style.cursor = locked ? "not-allowed" : "move";
    });
  };

  lockBtn.addEventListener("click", () => {
    const shouldLock = !page.classList.contains("is-locked");
    history.push(capturePagesFromDom());
    applyLockState(shouldLock);
    debouncedSave();
  });

  applyLockState(Boolean(data && data.locked));

  let lastClickedPanel = null;

  deleteBtn.addEventListener("click", () => {
    history.push(capturePagesFromDom());
    returnImagesFromPage(container);
    unobserveLayoutContainer(container);
    page.remove();
    savePagesState(true);
  });

  duplicateBtn.addEventListener("click", () => {
    const currentData = capturePagesFromDom();
    history.push(currentData);
    // Capture the data for just this page
    const thisIndex = Array.from(getPagesContainer().querySelectorAll(".page")).indexOf(page);
    const pageData = thisIndex >= 0 ? currentData[thisIndex] : undefined;
    // Duplicate without images (slots/transforms empty) to avoid library confusion
    const dupData = pageData
      ? { layout: pageData.layout, gutterColor: pageData.gutterColor, slots: {}, transforms: {}, locked: false, bubbles: {} }
      : undefined;
    createPage(dupData, getPagesContainer());
    savePagesState(true);
  });

  clearBtn.addEventListener("click", () => {
    if (isPageLocked(page)) return;
    history.push(capturePagesFromDom());
    returnImagesFromPage(container);
    savePagesState(true);
  });

  // Track the last clicked panel so keyboard shortcuts can target it
  page.addEventListener("click", (e) => {
    const panel = e.target.closest && e.target.closest(".panel");
    if (panel && page.contains(panel)) {
      lastClickedPanel = panel;
    }
  });

  // Keyboard: press Enter/Space on a panel (or last clicked panel) to place selected image
  page.addEventListener("keydown", (e) => {
    let panel = e.target.closest && e.target.closest(".panel");
    if (!panel && lastClickedPanel && page.contains(lastClickedPanel)) {
      panel = lastClickedPanel;
    }
    if (panel && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      const slot = panel.getAttribute("data-slot");
      handleSelectedImagePlacement(panel, slot, container, index);
    }
  });
}

/**
 * Validate and sanitize a single page data object.
 * Returns a clean page object with safe defaults, logging any repairs.
 */
export function sanitizePageData(raw) {
  if (!raw || typeof raw !== "object") {
    console.warn("[schema] Invalid page object replaced with default.");
    return { layout: layouts[0] || "1-panel", gutterColor: DEFAULT_GUTTER_COLOR, slots: {}, transforms: {}, locked: false, bubbles: {} };
  }

  const layout =
    typeof raw.layout === "string" && layouts.includes(raw.layout)
      ? raw.layout
      : (layouts[0] || "1-panel");

  if (layout !== raw.layout && raw.layout !== undefined) {
    console.warn(`[schema] Unknown layout "${raw.layout}" replaced with "${layout}".`);
  }

  const gutterColor =
    typeof raw.gutterColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.gutterColor)
      ? raw.gutterColor
      : DEFAULT_GUTTER_COLOR;

  const slots = {};
  const transforms = {};

  if (raw.slots && typeof raw.slots === "object") {
    for (const [slot, name] of Object.entries(raw.slots)) {
      if (typeof name === "string" && name.length > 0) {
        slots[slot] = name;
      } else {
        console.warn(`[schema] Invalid slot value for slot "${slot}" discarded.`);
      }
    }
  }

  if (raw.transforms && typeof raw.transforms === "object") {
    for (const [slot, t] of Object.entries(raw.transforms)) {
      if (t && typeof t === "object") {
        const scale = Number.isFinite(parseFloat(t.scale)) ? parseFloat(t.scale) : 1;
        const translateXPct = Number.isFinite(parseFloat(t.translateXPct)) ? parseFloat(t.translateXPct) : 0;
        const translateYPct = Number.isFinite(parseFloat(t.translateYPct)) ? parseFloat(t.translateYPct) : 0;
        transforms[slot] = { scale, translateXPct, translateYPct };
      }
    }
  }

  return {
    layout,
    gutterColor,
    slots,
    transforms,
    locked: Boolean(raw.locked),
    bubbles: raw.bubbles && typeof raw.bubbles === "object" ? raw.bubbles : {},
  };
}

export function capturePagesFromDom() {
  const pages = [];
  document.querySelectorAll("#pages > .page").forEach((pageDiv) => {
    const layout = pageDiv.querySelector("select").value;
    const gutterColorInput = pageDiv.querySelector('input[type="color"]');
    const gutterColor = gutterColorInput
      ? gutterColorInput.value
      : DEFAULT_GUTTER_COLOR;
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
        let translateXPct = Number.isFinite(rawTranslateXPct)
          ? rawTranslateXPct
          : null;
        let translateYPct = Number.isFinite(rawTranslateYPct)
          ? rawTranslateYPct
          : null;

        if (translateXPct === null || translateYPct === null) {
          const { width, height } = getPanelContentDimensions(panel);
          const pxX = parseFloat(img.dataset.translateX);
          const pxY = parseFloat(img.dataset.translateY);

          if (translateXPct === null) {
            translateXPct = calculatePercentage(pxX, width, true);
          }

          if (translateYPct === null) {
            translateYPct = calculatePercentage(pxY, height, true);
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
    const bubbles = captureBubblesFromPanels(pageDiv);
    pages.push({ layout, gutterColor, slots, transforms, locked, bubbles });
  });
  return pages;
}

export function savePagesState(rebuildUI = true) {
  if (state.isUpdatingFromServer) return;

  const pages = capturePagesFromDom();
  const signature = JSON.stringify(pages);

  fetch("/save-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
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

/**
 * Attempt to patch a single page in place when only that page changed.
 * Returns true if a targeted patch was applied, false if a full rebuild is needed.
 */
function tryPatchSinglePage(currentPages, incomingPages) {
  const container = getPagesContainer();
  const pageDivs = Array.from(container.querySelectorAll(".page"));

  if (currentPages.length !== incomingPages.length) return false;
  if (pageDivs.length !== incomingPages.length) return false;

  let changedIdx = -1;
  for (let i = 0; i < currentPages.length; i++) {
    if (JSON.stringify(currentPages[i]) !== JSON.stringify(incomingPages[i])) {
      if (changedIdx !== -1) return false; // more than one change
      changedIdx = i;
    }
  }

  if (changedIdx === -1) return true; // nothing changed

  const incoming = incomingPages[changedIdx];
  const current = currentPages[changedIdx];
  const pageDiv = pageDivs[changedIdx];

  // Only patch gutter color change (cheap, no re-render needed)
  if (incoming.layout === current.layout &&
      incoming.gutterColor !== current.gutterColor) {
    const colorInput = pageDiv.querySelector('input[type="color"]');
    if (colorInput) colorInput.value = incoming.gutterColor;
    const layoutDiv = pageDiv.querySelector(".layout");
    if (layoutDiv) layoutDiv.style.background = incoming.gutterColor;
    return true;
  }

  // Only patch lock state change
  if (incoming.layout === current.layout &&
      JSON.stringify(incoming.slots) === JSON.stringify(current.slots) &&
      incoming.locked !== current.locked) {
    setPageLocked(pageDiv, incoming.locked);
    return true;
  }

  return false;
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

    const serverPages = data.pages.map(sanitizePageData);

    // "Restore last session" prompt: check if there are local unsaved changes
    const localSignature = JSON.stringify(capturePagesFromDom());
    const serverSignature = JSON.stringify(serverPages);
    const savedLocal = localStorage.getItem("v-comic-local-session");

    if (savedLocal && savedLocal !== serverSignature && serverPages.length > 0) {
      try {
        const localPages = JSON.parse(savedLocal).map(sanitizePageData);
        if (JSON.stringify(localPages) !== serverSignature) {
          const restore = window.confirm(
            "Unsaved local changes were found from your last session. Restore them?"
          );
          if (restore) {
            rebuildPagesUI(localPages);
            localStorage.removeItem("v-comic-local-session");
            return;
          }
        }
      } catch {
        // ignore corrupt local session data
      }
    }

    localStorage.removeItem("v-comic-local-session");
    rebuildPagesUI(serverPages);
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
  updateSyncHealth(false);
}

/**
 * Show a non-blocking conflict banner allowing the user to choose
 * between local and remote state.
 */
function showConflictBanner(incomingPages) {
  if (state.conflictBannerVisible) {
    // Update the pending conflict but don't create another banner
    state.pendingConflict = incomingPages;
    return;
  }

  state.conflictBannerVisible = true;
  state.pendingConflict = incomingPages;

  const banner = document.createElement("div");
  banner.id = "conflictBanner";
  banner.className = "conflict-banner";
  banner.setAttribute("role", "alertdialog");
  banner.setAttribute("aria-label", "Sync conflict detected");
  banner.innerHTML = `
    <span class="conflict-icon" aria-hidden="true">⚠️</span>
    <span class="conflict-msg">A newer version was received from the server. What would you like to do?</span>
    <button type="button" class="conflict-btn-local ghost" aria-label="Keep your local changes">Keep local</button>
    <button type="button" class="conflict-btn-remote primary" aria-label="Accept the server version">Accept remote</button>
    <button type="button" class="conflict-btn-dismiss ghost" aria-label="Dismiss this notification">✕</button>
  `;

  document.body.appendChild(banner);

  const dismiss = () => {
    banner.remove();
    state.conflictBannerVisible = false;
    state.pendingConflict = null;
  };

  banner.querySelector(".conflict-btn-local").addEventListener("click", dismiss);

  banner.querySelector(".conflict-btn-remote").addEventListener("click", () => {
    const pages = state.pendingConflict;
    dismiss();
    if (pages) {
      history.push(capturePagesFromDom());
      rebuildPagesUI(pages);
      state.lastSyncedSignature = JSON.stringify(pages);
      showSaveIndicator("Remote version applied", "#4CAF50");
    }
  });

  banner.querySelector(".conflict-btn-dismiss").addEventListener("click", dismiss);
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

  // If local state has diverged from last-synced, we have a conflict
  if (state.lastSyncedSignature && currentSignature !== state.lastSyncedSignature) {
    showConflictBanner(incomingPages);
    return;
  }

  rebuildPagesUI(incomingPages);
  state.lastSyncedSignature = incomingSignature;
}

export function subscribeToStateStream() {
  if (!window.EventSource) {
    console.warn(
      "EventSource is not supported in this browser; live sync disabled.",
    );
    return;
  }

  if (state.pageStreamSource) {
    return;
  }

  state.pageStreamSource = new EventSource("/pages/stream");
  updateSyncHealth(true);

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

  // Checkpoint before destructive state replacement
  history.checkpoint(capturePagesFromDom());
  history.clear();

  setInitialImages(images);
  rebuildPagesUI(pages);
}

function setupResetButton() {
  const { resetButton } = dom;
  if (!resetButton) return;

  resetButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Resetting will remove all images and pages. Continue?",
    );
    if (!confirmed) {
      return;
    }

    // Checkpoint before destructive reset
    history.checkpoint(capturePagesFromDom());

    resetButton.disabled = true;
    showSaveIndicator("Resetting workspace...", "#2196F3");

    fetch("/state/reset", { method: "POST", headers: getCsrfHeaders() })
      .then((response) =>
        response
          .json()
          .catch(() => ({ error: "Reset failed" }))
          .then((data) => {
            if (!response.ok || (data && data.error)) {
              const message = data && data.error ? data.error : "Reset failed";
              throw new Error(message);
            }

            history.clear();
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
            throw new Error(
              `Failed to export state (status ${response.status})`,
            );
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

      fetch("/state/import", { method: "POST", headers: getCsrfHeaders(), body: formData })
        .then((response) =>
          response
            .json()
            .catch(() => ({ error: "State import failed" }))
            .then((data) => {
              if (!response.ok || (data && data.error)) {
                const message =
                  data && data.error ? data.error : "State import failed";
                throw new Error(message);
              }

              // Checkpoint before destructive import
              history.checkpoint(capturePagesFromDom());
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
    shortcutList.style.setProperty(
      "--shortcuts-expanded-height",
      `${currentHeight}px`,
    );
  };

  const updateToggleState = (isOpen) => {
    toggleShortcutsButton.setAttribute("aria-expanded", String(isOpen));
    toggleShortcutsButton.classList.toggle("active", isOpen);
    toggleShortcutsButton.textContent = isOpen
      ? "Hide Shortcuts"
      : "Show Shortcuts";
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

/**
 * Set the lock state of a page element directly, without triggering click events.
 * Works by updating the page class, lock button, and image cursors.
 */
function setPageLocked(pageEl, locked) {
  const lockBtn = pageEl.querySelector(".page-lock-btn");
  if (!lockBtn) return;
  pageEl.classList.toggle("is-locked", locked);
  lockBtn.classList.toggle("is-locked", locked);
  lockBtn.innerHTML = locked
    ? '<span aria-hidden="true">🔒</span><span class="lock-label">Locked</span>'
    : '<span aria-hidden="true">🔓</span><span class="lock-label">Unlocked</span>';
  lockBtn.setAttribute("aria-pressed", String(locked));
  lockBtn.setAttribute("aria-label", locked ? "Unlock page" : "Lock page");
  lockBtn.title = locked ? "Click to unlock page" : "Click to lock page";
  pageEl.querySelectorAll(".panel-image").forEach((img) => {
    img.style.cursor = locked ? "not-allowed" : "move";
  });
}

/** Place the currently selected image into a panel (keyboard accessibility helper). */
function handleSelectedImagePlacementFromKeyboard(panel, slot, container, index) {
  const selectedName = getSelectedImageName && getSelectedImageName();
  if (!selectedName) return;
  const pageEl = panel.closest(".page");
  if (pageEl && isPageLocked(pageEl)) return;
  // Trigger the same drop logic by dispatching a synthetic drop event
  const dt = new DataTransfer();
  dt.setData("text/plain", selectedName);
  const dropEvent = new DragEvent("drop", { dataTransfer: dt, bubbles: true });
  panel.dispatchEvent(dropEvent);
}

/**
 * Perform undo: restores the previous page state.
 */
export function undoPageState() {
  if (!history.canUndo()) return;
  const current = capturePagesFromDom();
  const prev = history.undo(current);
  if (prev) {
    rebuildPagesUI(prev);
    showSaveIndicator("Undone ✓", "#2196F3");
  }
  updateHistoryButtons();
}

/**
 * Perform redo: restores the next page state.
 */
export function redoPageState() {
  if (!history.canRedo()) return;
  const current = capturePagesFromDom();
  const next = history.redo(current);
  if (next) {
    rebuildPagesUI(next);
    showSaveIndicator("Redone ✓", "#2196F3");
  }
  updateHistoryButtons();
}

/** Update enabled/disabled state of undo and redo buttons. */
function updateHistoryButtons() {
  if (dom.undoButton) dom.undoButton.disabled = !history.canUndo();
  if (dom.redoButton) dom.redoButton.disabled = !history.canRedo();
}

/**
 * Lock all pages.
 */
export function lockAllPages() {
  history.push(capturePagesFromDom());
  getPagesContainer().querySelectorAll(".page").forEach((p) => {
    if (!p.classList.contains("is-locked")) setPageLocked(p, true);
  });
}

/**
 * Unlock all pages.
 */
export function unlockAllPages() {
  history.push(capturePagesFromDom());
  updateHistoryButtons();
  getPagesContainer().querySelectorAll(".page").forEach((p) => {
    if (p.classList.contains("is-locked")) setPageLocked(p, false);
  });
}

export function initializePageModule(refs) {
  Object.assign(dom, refs);

  setupShortcutToggle();
  setupResetButton();
  setupStateImportExport();

  // Initialize sync health indicator
  createSyncHealthIndicator();

  if (dom.addPageButton) {
    dom.addPageButton.addEventListener("click", () => {
      history.push(capturePagesFromDom());
      updateHistoryButtons();
      createPage();
      savePagesState(true);
    });
  }

  // Bulk lock/unlock buttons (optional DOM refs)
  if (dom.lockAllButton) {
    dom.lockAllButton.addEventListener("click", () => {
      lockAllPages();
      savePagesState(false);
    });
  }

  if (dom.unlockAllButton) {
    dom.unlockAllButton.addEventListener("click", () => {
      unlockAllPages();
      savePagesState(false);
    });
  }

  // Undo/redo buttons (optional DOM refs)
  if (dom.undoButton) {
    dom.undoButton.addEventListener("click", () => {
      undoPageState();
      updateHistoryButtons();
    });
  }
  if (dom.redoButton) {
    dom.redoButton.addEventListener("click", () => {
      redoPageState();
      updateHistoryButtons();
    });
  }

  // Global keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toUpperCase();
    const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      (e.target.isContentEditable);

    if ((e.ctrlKey || e.metaKey) && !inInput) {
      if (e.key === "z" || e.key === "Z") {
        if (e.shiftKey) {
          e.preventDefault();
          redoPageState();
        } else {
          e.preventDefault();
          undoPageState();
        }
        updateHistoryButtons();
        return;
      }
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        redoPageState();
        updateHistoryButtons();
        return;
      }
      // Ctrl+L: toggle lock on focused page
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        const focusedPage = document.activeElement && document.activeElement.closest(".page");
        if (focusedPage) {
          const btn = focusedPage.querySelector(".page-lock-btn");
          if (btn) {
            history.push(capturePagesFromDom());
            updateHistoryButtons();
            btn.click();
          }
        }
        return;
      }
    }
  });

  // Persist local state before unload for "restore last session" feature
  window.addEventListener("beforeunload", () => {
    try {
      const pages = capturePagesFromDom();
      if (pages.length > 0) {
        localStorage.setItem("v-comic-local-session", JSON.stringify(pages));
      }
    } catch {
      // Ignore storage errors
    }
  });
}

export function parseRadiusValue(value) {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseCornerRadius(value) {
  if (typeof value === "number") {
    const numeric = Number.isFinite(value) ? value : 0;
    return { x: numeric, y: numeric };
  }

  if (!value) {
    return { x: 0, y: 0 };
  }

  const sanitized = String(value).replace(/\//g, " ");
  const parts = sanitized
    .trim()
    .split(/\s+/)
    .map((part) => parseFloat(part))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 0) {
    return { x: 0, y: 0 };
  }

  const [x, y] = parts;
  const xRadius = Number.isFinite(x) ? x : 0;
  const yRadius = Number.isFinite(y) ? y : xRadius;

  return { x: xRadius, y: yRadius };
}

function scaleCornerRadius(value, scaleX, scaleY) {
  const { x, y } = parseCornerRadius(value);
  return {
    x: x * scaleX,
    y: y * scaleY,
  };
}

export function buildRoundedRectPath(ctx, x, y, width, height, radii) {
  if (!radii || radii.length === 0) {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    return;
  }

  const normalizedRadii = radii.map((radius) => {
    if (!radius) {
      return { x: 0, y: 0 };
    }

    if (typeof radius === "number") {
      return { x: radius, y: radius };
    }

    const xRadius = Number.isFinite(radius.x) ? radius.x : 0;
    const yRadius = Number.isFinite(radius.y) ? radius.y : 0;

    return { x: xRadius, y: yRadius };
  });

  if (normalizedRadii.every((radius) => radius.x === 0 && radius.y === 0)) {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    return;
  }

  const [
    tl = { x: 0, y: 0 },
    tr = { x: 0, y: 0 },
    br = { x: 0, y: 0 },
    bl = { x: 0, y: 0 },
  ] = normalizedRadii;
  ctx.beginPath();
  ctx.moveTo(x + tl.x, y);
  ctx.lineTo(x + width - tr.x, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr.y);
  ctx.lineTo(x + width, y + height - br.y);
  ctx.quadraticCurveTo(x + width, y + height, x + width - br.x, y + height);
  ctx.lineTo(x + bl.x, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl.y);
  ctx.lineTo(x, y + tl.y);
  ctx.quadraticCurveTo(x, y, x + tl.x, y);
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
  const baseScaleX = CANONICAL_LAYOUT_WIDTH / layoutRect.width;
  const baseScaleY = CANONICAL_LAYOUT_HEIGHT / layoutRect.height;
  const scaleX = baseScaleX * scale;
  const scaleY = baseScaleY * scale;

  canvas.width = Math.round(CANONICAL_LAYOUT_WIDTH * scale);
  canvas.height = Math.round(CANONICAL_LAYOUT_HEIGHT * scale);

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

  /** @type {string[]} Diagnostic messages collected during export */
  const diagnostics = [];

  const images = Array.from(layout.querySelectorAll(".panel img"));
  await Promise.all(images.map(async (img) => {
    try {
      await waitForImageLoad(img);
      if (!img.naturalWidth || !img.naturalHeight) {
        diagnostics.push(`Image failed to load: ${img.dataset.name || img.src || "(unknown)"}`);
      }
    } catch {
      diagnostics.push(`Error loading image: ${img.dataset.name || img.src || "(unknown)"}`);
    }
  }));

  let zeroPanels = 0;

  layout.querySelectorAll(".panel").forEach((panel) => {
    const panelRect = panel.getBoundingClientRect();
    if (!panelRect.width || !panelRect.height) {
      zeroPanels++;
      diagnostics.push(`Panel slot ${panel.getAttribute("data-slot") || "?"} has zero size — skipped.`);
      return;
    }

    const offsetX = (panelRect.left - layoutRect.left) * scaleX;
    const offsetY = (panelRect.top - layoutRect.top) * scaleY;
    const panelWidth = panelRect.width * scaleX;
    const panelHeight = panelRect.height * scaleY;

    const panelStyle = window.getComputedStyle(panel);
    const radii = [
      scaleCornerRadius(panelStyle.borderTopLeftRadius, scaleX, scaleY),
      scaleCornerRadius(panelStyle.borderTopRightRadius, scaleX, scaleY),
      scaleCornerRadius(panelStyle.borderBottomRightRadius, scaleX, scaleY),
      scaleCornerRadius(panelStyle.borderBottomLeftRadius, scaleX, scaleY),
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
      const imgX = (imgRect.left - layoutRect.left) * scaleX;
      const imgY = (imgRect.top - layoutRect.top) * scaleY;
      const imgWidth = imgRect.width * scaleX;
      const imgHeight = imgRect.height * scaleY;

      if (imgWidth > 0 && imgHeight > 0) {
        ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
      } else {
        diagnostics.push(`Image in slot ${panel.getAttribute("data-slot") || "?"} has zero render dimensions — skipped.`);
      }
    } else if (img) {
      diagnostics.push(`Image "${img.dataset.name || "(unnamed)"}" in slot ${panel.getAttribute("data-slot") || "?"} could not be drawn — skipped.`);
    }

    // Draw bubbles clipped to the panel
    const bubbleEls = Array.from(panel.querySelectorAll(".bubble"));
    const bubblesInPaintOrder = bubbleEls
      .map((bubbleEl, index) => {
        const computed = window.getComputedStyle(bubbleEl);
        const parsedZ = parseFloat(computed.zIndex);
        const zIndex = Number.isFinite(parsedZ) ? parsedZ : 0;
        return { bubbleEl, index, zIndex };
      })
      .sort((a, b) => {
        if (a.zIndex === b.zIndex) {
          // Deterministic tie-breaker: DOM order
          return a.index - b.index;
        }
        return a.zIndex - b.zIndex;
      });

    bubblesInPaintOrder.forEach(({ bubbleEl }) => {
      const bubbleRect = bubbleEl.getBoundingClientRect();
      if (!bubbleRect.width || !bubbleRect.height) return;

      const bx = (bubbleRect.left - layoutRect.left) * scaleX;
      const by = (bubbleRect.top - layoutRect.top) * scaleY;
      const bw = bubbleRect.width * scaleX;
      const bh = bubbleRect.height * scaleY;
      const bubStyle = bubbleEl.dataset.style || "speech";
      const unitScale = Math.min(scaleX, scaleY);

      const fillColor =
        bubStyle === "narration" ? "rgba(255, 255, 200, 0.92)" : "white";
      const rawRadius = bubStyle === "narration" ? 4 : 20;
      const scaledR = rawRadius * unitScale;
      const cornerRadius = { x: scaledR, y: scaledR };

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2 * unitScale;
      buildRoundedRectPath(ctx, bx, by, bw, bh, [
        cornerRadius,
        cornerRadius,
        cornerRadius,
        cornerRadius,
      ]);
      ctx.fill();
      if (bubStyle === "thought") {
        ctx.setLineDash([5 * unitScale, 3 * unitScale]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw wrapped text
      const BUBBLE_MIN_FONT_PX = 10;
      const BUBBLE_BASE_FONT_PX = 13;
      const BUBBLE_TEXT_PADDING = 8;
      const textEl = bubbleEl.querySelector(".bubble-text");
      const text = textEl ? textEl.textContent.trim() : "";
      if (text) {
        const fontSize = Math.max(BUBBLE_MIN_FONT_PX, Math.round(BUBBLE_BASE_FONT_PX * unitScale));
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "#222222";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const padding = BUBBLE_TEXT_PADDING * unitScale;
        const maxWidth = bw - padding * 2;
        const lineHeight = fontSize * 1.4;
        const words = text.split(/\s+/);
        const lines = [];
        let cur = "";

        for (const word of words) {
          const test = cur ? `${cur} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && cur) {
            lines.push(cur);
            cur = word;
          } else {
            cur = test;
          }
        }
        if (cur) lines.push(cur);

        const totalH = lines.length * lineHeight;
        let ty = by + bh / 2 - totalH / 2 + lineHeight / 2;
        for (const line of lines) {
          ctx.fillText(line, bx + bw / 2, ty, maxWidth);
          ty += lineHeight;
        }
      }
    });

    ctx.restore();
  });

  // Surface export diagnostics in the UI if any issues were found
  if (diagnostics.length > 0) {
    showExportDiagnostics(diagnostics);
  }

  return canvas;
}

/**
 * Show a non-blocking export diagnostics overlay listing skipped/failed items.
 */
function showExportDiagnostics(messages) {
  // Remove any existing diagnostics overlay
  const existing = document.getElementById("exportDiagnostics");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "exportDiagnostics";
  overlay.className = "export-diagnostics";
  overlay.setAttribute("role", "alert");
  overlay.setAttribute("aria-label", "Export warnings");

  const title = document.createElement("strong");
  title.textContent = "⚠ Export warnings:";
  overlay.appendChild(title);

  const list = document.createElement("ul");
  messages.forEach((msg) => {
    const li = document.createElement("li");
    li.textContent = msg;
    list.appendChild(li);
  });
  overlay.appendChild(list);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "export-diagnostics-close";
  closeBtn.setAttribute("aria-label", "Dismiss export warnings");
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => overlay.remove());
  overlay.appendChild(closeBtn);

  document.body.appendChild(overlay);

  // Auto-dismiss after 12 seconds
  setTimeout(() => overlay.remove(), 12000);
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
