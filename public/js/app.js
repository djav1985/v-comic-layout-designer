window.addEventListener("DOMContentLoaded", () => {
  const imageList = document.getElementById("imageList");
  let pageCounter = 0;
  let saveTimeout = null;
  let isUpdatingFromServer = false;
  let saveIndicator = null;
  const clipPathRuleCache = new Map();
  const overlayMaskCache = new Map();
  const CSS_RULE_TYPES = window.CSSRule
    ? {
        STYLE: window.CSSRule.STYLE_RULE,
        MEDIA: window.CSSRule.MEDIA_RULE,
      }
    : {
        STYLE: 1,
        MEDIA: 4,
      };
  const PDF_PAGE_WIDTH = 792;
  const PDF_PAGE_HEIGHT = 612;
  const PDF_COLUMN_WIDTH = PDF_PAGE_WIDTH / 2;

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

  function savePagesState(rebuildUI = true) {
    if (isUpdatingFromServer) return; // Prevent recursive updates

    const pages = [];
    document.querySelectorAll("#pages > .page").forEach((pageDiv) => {
      const layout = pageDiv.querySelector("select").value;
      const gutterColorInput = pageDiv.querySelector('input[type="color"]');
      const gutterColor = gutterColorInput ? gutterColorInput.value : "#cccccc";
      const slots = {};
      const transforms = {};
      pageDiv.querySelectorAll(".panel").forEach((panel) => {
        const slot = String(panel.getAttribute("data-slot"));
        const img = panel.querySelector("img");
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

    // Save to server in background
    fetch("/save-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages, pageCount: pages.length }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Save request failed");
        showSaveIndicator("Saved ✓", "#4CAF50");
        // Only rebuild UI if explicitly requested (like adding/deleting pages)
        if (rebuildUI) {
          return fetch("/get-pages")
            .then((r) => {
              if (!r.ok) throw new Error("Load request failed");
              return r.json();
            })
            .then((data) => {
              if (!data || !Array.isArray(data.pages)) {
                throw new Error("Invalid page data");
              }
              rebuildPagesUI(data.pages);
            });
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
      panel.innerHTML = "";
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

  function sanitizeLayoutName(name) {
    return (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim() || "layout";
  }

  function ensureLayoutStyle(name) {
    if (document.getElementById("style-" + name)) return;
    const style = document.createElement("style");
    style.id = "style-" + name;
    style.textContent = layoutStyles[name] || "";
    document.head.appendChild(style);
  }

  function collectClipPathRules(ruleList, target) {
    if (!ruleList || !target) return;
    Array.from(ruleList).forEach((rule) => {
      if (!rule) return;
      if (
        rule.type === CSS_RULE_TYPES.STYLE &&
        rule.style &&
        (rule.style.getPropertyValue("clip-path") ||
          rule.style.getPropertyValue("-webkit-clip-path"))
      ) {
        const clipPath =
          rule.style.getPropertyValue("clip-path") ||
          rule.style.getPropertyValue("-webkit-clip-path");
        if (clipPath && clipPath !== "none") {
          const selectors = (rule.selectorText || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          selectors.forEach((selector) => {
            target.push({ selector, clipPath: clipPath.trim() });
          });
        }
      } else if (rule.type === CSS_RULE_TYPES.MEDIA && rule.cssRules) {
        collectClipPathRules(rule.cssRules, target);
      }
    });
  }

  function getClipPathRules(layoutName) {
    if (!layoutName) return [];
    if (clipPathRuleCache.has(layoutName)) {
      return clipPathRuleCache.get(layoutName);
    }
    const results = [];
    const styleEl = document.getElementById("style-" + layoutName);
    if (styleEl && styleEl.sheet) {
      try {
        collectClipPathRules(styleEl.sheet.cssRules, results);
      } catch (err) {
        console.warn(
          "Unable to read clip-path rules for layout:",
          layoutName,
          err,
        );
      }
    }
    clipPathRuleCache.set(layoutName, results);
    return results;
  }

  function applyClipPathDataAttributes(layoutElement, layoutName) {
    if (!layoutElement) return;
    const rules = getClipPathRules(layoutName);
    if (!rules.length) return;
    rules.forEach(({ selector, clipPath }) => {
      if (!selector || !clipPath) return;
      try {
        const scope = layoutElement.ownerDocument || document;
        scope.querySelectorAll(selector).forEach((el) => {
          if (layoutElement.contains(el) || el === layoutElement) {
            el.dataset.clipPath = clipPath;
          }
        });
      } catch (err) {
        console.warn(
          "Failed to apply cached clip-path selector:",
          selector,
          "for layout",
          layoutName,
          err,
        );
      }
    });
  }

  function createLayoutSandbox(layoutName) {
    const wrapper = document.createElement("div");
    wrapper.className = "layout-container";
    wrapper.style.position = "absolute";
    wrapper.style.left = "-99999px";
    wrapper.style.top = "0";
    wrapper.style.width = `${LAYOUT_SANDBOX_WIDTH}px`;
    wrapper.style.height = `${LAYOUT_SANDBOX_HEIGHT}px`;
    wrapper.style.pointerEvents = "none";
    wrapper.style.opacity = "0";
    wrapper.style.zIndex = "-1";
    wrapper.innerHTML = layoutTemplates[layoutName] || "";
    document.body.appendChild(wrapper);

    ensureLayoutStyle(layoutName);

    const layout = wrapper.querySelector(".layout");
    if (layout) {
      layout.classList.add(layoutName);
      layout.dataset.layoutName = layoutName;
      applyClipPathDataAttributes(layout, layoutName);
      layout.querySelectorAll(".panel").forEach((panel) => {
        const computed = window.getComputedStyle(panel);
        const resolvedClip =
          (panel.dataset.clipPath && panel.dataset.clipPath !== "none"
            ? panel.dataset.clipPath
            : null) ||
          (computed.clipPath && computed.clipPath !== "none"
            ? computed.clipPath
            : null) ||
          (computed.webkitClipPath && computed.webkitClipPath !== "none"
            ? computed.webkitClipPath
            : null) ||
          getClipPathFromRules(layoutName, panel);
        if (resolvedClip) {
          panel.dataset.clipPath = resolvedClip;
        }
      });
    }

    return { wrapper, layout };
  }

  function cleanupLayoutSandbox(wrapper) {
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      image.src = url;
    });
  }

  function getClipPathFromRules(layoutName, element) {
    if (!layoutName || !element) return null;
    const rules = getClipPathRules(layoutName);
    for (const { selector, clipPath } of rules) {
      if (!selector || !clipPath) continue;
      try {
        if (element.matches(selector)) {
          return clipPath;
        }
      } catch (err) {
        // Ignore selectors that querySelector cannot evaluate
      }
    }
    return null;
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

  function parseClipPathCoordinate(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (trimmed.endsWith("%")) {
      return { value: parseFloat(trimmed.slice(0, -1)), unit: "%" };
    }
    if (trimmed.endsWith("px")) {
      return { value: parseFloat(trimmed.slice(0, -2)), unit: "px" };
    }
    const parsed = parseFloat(trimmed);
    if (Number.isFinite(parsed)) {
      return { value: parsed, unit: "px" };
    }
    return null;
  }

  function parseClipPathPolygon(clipPath) {
    if (!clipPath || clipPath === "none") return null;
    const match = clipPath.match(/^polygon\((.+)\)$/i);
    if (!match) return null;
    const parts = match[1].split(",");
    const points = [];
    for (const part of parts) {
      const [xRaw, yRaw] = part.trim().split(/\s+/);
      if (!xRaw || !yRaw) return null;
      const x = parseClipPathCoordinate(xRaw);
      const y = parseClipPathCoordinate(yRaw);
      if (!x || !y) return null;
      points.push([x, y]);
    }
    return points.length ? points : null;
  }

  function convertClipValue(coord, size) {
    if (!coord) return 0;
    if (coord.unit === "%") {
      return (coord.value / 100) * size;
    }
    return coord.value;
  }

  function isAxisAlignedRectangle(points, width, height) {
    if (!points.length) return true;
    const approx = (a, b) => Math.abs(a - b) < 0.5;
    return points.every(
      ([x, y]) =>
        (approx(x, 0) || approx(x, width)) &&
        (approx(y, 0) || approx(y, height)),
    );
  }

  function generateOverlayCanvas(layout, layoutName) {
    if (!layout) return null;
    const rect = layout.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.width * LAYOUT_OVERLAY_SCALE);
    canvas.height = Math.round(rect.height * LAYOUT_OVERLAY_SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    layout.querySelectorAll(".panel").forEach((panel) => {
      const panelRect = panel.getBoundingClientRect();
      if (!panelRect.width || !panelRect.height) {
        return;
      }

      const offsetX = Math.round((panelRect.left - rect.left) * LAYOUT_OVERLAY_SCALE);
      const offsetY = Math.round((panelRect.top - rect.top) * LAYOUT_OVERLAY_SCALE);
      const width = Math.round(panelRect.width * LAYOUT_OVERLAY_SCALE);
      const height = Math.round(panelRect.height * LAYOUT_OVERLAY_SCALE);

      const clipPath =
        (panel.dataset.clipPath && panel.dataset.clipPath !== "none"
          ? panel.dataset.clipPath
          : null) || getClipPathFromRules(layoutName, panel);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();

      let drewPath = false;
      if (clipPath) {
        const polygon = parseClipPathPolygon(clipPath);
        if (polygon && polygon.length) {
          polygon.forEach(([xCoord, yCoord], index) => {
            const px = convertClipValue(xCoord, panelRect.width) * LAYOUT_OVERLAY_SCALE;
            const py = convertClipValue(yCoord, panelRect.height) * LAYOUT_OVERLAY_SCALE;
            if (index === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          });
          ctx.closePath();
          drewPath = true;
        }
      }

      if (!drewPath) {
        ctx.rect(0, 0, width, height);
      }

      ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    });

    return canvas;
  }

  async function buildOverlayMask(layoutName) {
    const { wrapper, layout } = createLayoutSandbox(layoutName);
    try {
      if (!layout) {
        throw new Error(`Missing template markup for layout: ${layoutName}`);
      }
      const canvas = generateOverlayCanvas(layout, layoutName);
      if (!canvas) {
        throw new Error(`Failed to create overlay canvas for ${layoutName}`);
      }
      const dataUrl = canvas.toDataURL("image/png");
      const entry = {
        canvas,
        width: canvas.width,
        height: canvas.height,
        dataUrl,
        safeName: sanitizeLayoutName(layoutName),
      };
      overlayMaskCache.set(layoutName, entry);
      return entry;
    } finally {
      cleanupLayoutSandbox(wrapper);
    }
  }

  async function loadOverlayMask(layoutName) {
    if (!layoutName) return null;
    if (overlayMaskCache.has(layoutName)) {
      return overlayMaskCache.get(layoutName);
    }

    const safeName = sanitizeLayoutName(layoutName);
    try {
      const response = await fetch(`/overlays/${safeName}.png`, {
        cache: "no-store",
      });
      if (response.ok) {
        const blob = await response.blob();
        const image = await loadImageFromBlob(blob);
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const entry = {
          canvas,
          width: canvas.width,
          height: canvas.height,
          safeName,
        };
        overlayMaskCache.set(layoutName, entry);
        return entry;
      }
    } catch (error) {
      console.warn(`Overlay fetch failed for ${layoutName}:`, error);
    }

    try {
      return await buildOverlayMask(layoutName);
    } catch (error) {
      console.warn(`Overlay build failed for ${layoutName}:`, error);
      return null;
    }
  }

  async function applyTemplateOverlay(layout, canvas) {
    if (!layout || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const layoutName = layout.dataset ? layout.dataset.layoutName : null;
    if (!layoutName) return;

    const mask = await loadOverlayMask(layoutName);
    if (!mask || !mask.canvas) return;

    const tinted = document.createElement("canvas");
    tinted.width = canvas.width;
    tinted.height = canvas.height;
    const tintCtx = tinted.getContext("2d");
    if (!tintCtx) return;

    const computed = window.getComputedStyle(layout);
    let gutterColor = computed.backgroundColor;
    if (
      !gutterColor ||
      gutterColor === "transparent" ||
      gutterColor === "rgba(0, 0, 0, 0)"
    ) {
      gutterColor = "#ffffff";
    }

    tintCtx.fillStyle = gutterColor;
    tintCtx.fillRect(0, 0, tinted.width, tinted.height);
    tintCtx.globalCompositeOperation = "destination-in";
    tintCtx.drawImage(mask.canvas, 0, 0, tinted.width, tinted.height);
    tintCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(tinted, 0, 0, canvas.width, canvas.height);
  }

  function applyClipPathsToCanvas(layout, canvas) {
    if (!layout || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layoutRect = layout.getBoundingClientRect();
    if (!layoutRect.width || !layoutRect.height) return;

    const scaleX = canvas.width / layoutRect.width;
    const scaleY = canvas.height / layoutRect.height;
    const computedLayoutStyle = window.getComputedStyle(layout);
    let gutterColor = computedLayoutStyle.backgroundColor;
    if (
      !gutterColor ||
      gutterColor === "transparent" ||
      gutterColor === "rgba(0, 0, 0, 0)"
    ) {
      gutterColor = "#ffffff";
    }

    const layoutName = layout.dataset ? layout.dataset.layoutName : null;
    layout.querySelectorAll(".panel").forEach((panel) => {
      const panelStyle = window.getComputedStyle(panel);
      const clipPath =
        (panel.dataset.clipPath && panel.dataset.clipPath !== "none"
          ? panel.dataset.clipPath
          : null) ||
        (panelStyle.clipPath && panelStyle.clipPath !== "none"
          ? panelStyle.clipPath
          : null) ||
        (panelStyle.webkitClipPath && panelStyle.webkitClipPath !== "none"
          ? panelStyle.webkitClipPath
          : null) ||
        (layoutName ? getClipPathFromRules(layoutName, panel) : null);
      if (!clipPath || clipPath === "none") {
        return;
      }
      const polygon = parseClipPathPolygon(clipPath);
      if (!polygon) return;

      const panelRect = panel.getBoundingClientRect();
      const panelWidth = panelRect.width;
      const panelHeight = panelRect.height;
      if (!panelWidth || !panelHeight) return;

      const numericPoints = polygon.map(([xCoord, yCoord]) => [
        convertClipValue(xCoord, panelWidth),
        convertClipValue(yCoord, panelHeight),
      ]);

      if (
        !numericPoints.length ||
        isAxisAlignedRectangle(numericPoints, panelWidth, panelHeight)
      ) {
        return;
      }

      const canvasWidth = Math.round(panelWidth * scaleX);
      const canvasHeight = Math.round(panelHeight * scaleY);
      if (canvasWidth <= 0 || canvasHeight <= 0) return;

      const offsetX = Math.round((panelRect.left - layoutRect.left) * scaleX);
      const offsetY = Math.round((panelRect.top - layoutRect.top) * scaleY);

      try {
        const imageData = ctx.getImageData(
          offsetX,
          offsetY,
          canvasWidth,
          canvasHeight,
        );
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        tempCtx.putImageData(imageData, 0, 0);

        const scalePointX = canvasWidth / panelWidth;
        const scalePointY = canvasHeight / panelHeight;
        const scaledPoints = numericPoints.map(([x, y]) => [
          x * scalePointX,
          y * scalePointY,
        ]);

        tempCtx.globalCompositeOperation = "destination-in";
        tempCtx.beginPath();
        scaledPoints.forEach(([px, py], index) => {
          if (index === 0) {
            tempCtx.moveTo(px, py);
          } else {
            tempCtx.lineTo(px, py);
          }
        });
        tempCtx.closePath();
        tempCtx.fillStyle = "#ffffff";
        tempCtx.fill();
        tempCtx.globalCompositeOperation = "source-over";

        ctx.save();
        ctx.fillStyle = gutterColor;
        ctx.fillRect(offsetX, offsetY, canvasWidth, canvasHeight);
        ctx.restore();
        ctx.drawImage(tempCanvas, offsetX, offsetY);
      } catch (error) {
        console.warn("Failed to apply clip-path for panel export:", error);
      }
    });
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
      applyClipPathDataAttributes(layoutDiv, layoutName);

      // Find gutter color from parent page
      let gutterColor = "#cccccc";
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
      const computed = window.getComputedStyle(panel);
      const resolvedClip =
        (computed.clipPath && computed.clipPath !== "none"
          ? computed.clipPath
          : null) ||
        (computed.webkitClipPath && computed.webkitClipPath !== "none"
          ? computed.webkitClipPath
          : null);
      if (resolvedClip) {
        panel.dataset.clipPath = resolvedClip;
      }

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
        const oldImg = panel.querySelector("img");
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

        panel.innerHTML = "";
        const clone = img.cloneNode();
        clone.draggable = false;
        const transformInput = document.createElement("input");
        transformInput.type = "hidden";
        transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
        container.appendChild(transformInput);
        enableImageControls(clone, transformInput);
        panel.appendChild(clone);
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

        const transformInput = document.createElement("input");
        transformInput.type = "hidden";
        transformInput.name = `pages[${pageIndex}][transforms][${slot}]`;
        const initial = transforms[slot] || {};
        transformInput.value = JSON.stringify(initial);
        container.appendChild(transformInput);
        enableImageControls(clone, transformInput, initial);
        panel.appendChild(clone);

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
    deleteBtn.innerHTML = '<span aria-hidden="true">✕</span> Remove Page';

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
    gutterColor.value = data && data.gutterColor ? data.gutterColor : "#cccccc";
    gutterColor.title = "Gutter Color";
    gutterColor.className = "gutter-color-picker";

    const layoutGroup = document.createElement("label");
    layoutGroup.className = "input-group";
    layoutGroup.innerHTML = "<span>Layout</span>";
    layoutGroup.appendChild(select);

    const gutterGroup = document.createElement("label");
    gutterGroup.className = "input-group";
    gutterGroup.innerHTML = "<span>Gutter</span>";
    gutterGroup.appendChild(gutterColor);

    const meta = document.createElement("div");
    meta.className = "page-meta";
    meta.appendChild(layoutGroup);
    meta.appendChild(gutterGroup);

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "page-controls";
    controlsDiv.appendChild(meta);
    controlsDiv.appendChild(deleteBtn);
    page.appendChild(controlsDiv);

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
          applyClipPathDataAttributes(layoutDiv, select.value);
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

  // Initialize pages and then load images
  if (Array.isArray(savedPages) && savedPages.length) {
    console.log("Loading saved pages:", savedPages);
    savedPages.forEach((p, index) => {
      console.log(`Creating page ${index + 1} with layout: ${p.layout}`);
      createPage(p);
    });
  } else {
    console.log("Creating new default page");
    createPage();
  }

  // Debug: Log available layouts and templates
  console.log("Available layouts:", layouts);
  console.log("Available templates:", Object.keys(layoutTemplates || {}));

  // Load images AFTER pages are created so assigned images are properly filtered
  setTimeout(() => {
    updateImages(typeof initialImages !== "undefined" ? initialImages : []);
  }, 100);

  document.getElementById("uploadForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("imageInput");
    if (!input.files.length) return;
    const formData = new FormData();
    Array.from(input.files).forEach((file) =>
      formData.append("images[]", file),
    );
    fetch("/upload", { method: "POST", body: formData })
      .then((r) => r.json())
      .then((imageList) => {
        // Update the global image list
        if (typeof initialImages !== "undefined") {
          initialImages.length = 0;
          initialImages.push(...imageList);
        }
        updateImages(imageList);
      })
      .finally(() => {
        input.value = "";
      });
  });

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
        const img = panel.querySelector("img");
        if (img) {
          slots[slot] = img.dataset.name;
        }
      });
      pages.push({ slots });
    });
    return pages;
  }

  // Removed comicForm submit handler since the form no longer exists

  const buildTemplatesBtn = document.getElementById("buildTemplates");
  if (buildTemplatesBtn) {
    buildTemplatesBtn.addEventListener("click", async () => {
      try {
        showSaveIndicator("Building template overlays...", "#2196F3");
        buildTemplatesBtn.disabled = true;
        buildTemplatesBtn.textContent = "Building...";

        const payload = [];
        for (const layoutName of layouts) {
          const entry = await buildOverlayMask(layoutName);
          if (entry && entry.dataUrl) {
            payload.push({ name: layoutName, dataUrl: entry.dataUrl });
          }
        }

        if (payload.length) {
          const response = await fetch("/build-overlays", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ overlays: payload }),
          });
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
        }

        showSaveIndicator("Template overlays updated ✓", "#4CAF50");
      } catch (error) {
        console.error("Failed to build overlays", error);
        showSaveIndicator("Template build failed ✗", "#f44336");
        alert(`Failed to build template overlays: ${error.message}`);
      } finally {
        buildTemplatesBtn.disabled = false;
        buildTemplatesBtn.textContent = "Build Templates";
      }
    });
  }

  // Export PDF (Client-side)
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
          const canvas1 = await html2canvas(layout1, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: layout1.offsetWidth,
            height: layout1.offsetHeight,
          });

          applyClipPathsToCanvas(layout1, canvas1);
          await applyTemplateOverlay(layout1, canvas1);

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

            canvas2 = await html2canvas(layout2, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: null,
              logging: false,
              width: layout2.offsetWidth,
              height: layout2.offsetHeight,
            });

            applyClipPathsToCanvas(layout2, canvas2);
            await applyTemplateOverlay(layout2, canvas2);

            if (canvas2.width === 0 || canvas2.height === 0) {
              throw new Error(`Canvas ${i + 2} has zero dimensions`);
            }

            img2 = canvas2.toDataURL("image/png", 1.0);
          }

          addCanvasToPdf(pdf, canvas1, img1, 0);
          if (img2 && canvas2) {
            addCanvasToPdf(pdf, canvas2, img2, 1);
          }

          if (i + 2 < layouts.length) {
            pdf.addPage([792, 612], "landscape");
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

          const canvas = await html2canvas(layout, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: layout.offsetWidth,
            height: layout.offsetHeight,
          });

          applyClipPathsToCanvas(layout, canvas);
          await applyTemplateOverlay(layout, canvas);

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
      console.log(`Capturing layout container ${i + 1}:`, container);
      console.log(
        `  - Size: ${container.offsetWidth}x${container.offsetHeight}`,
      );
      console.log(`  - Background: ${container.style.background}`);

      const layout = container.querySelector(".layout");
      if (layout) {
        console.log(`  - Layout background: ${layout.style.background}`);
        console.log(
          `  - Panel count: ${layout.querySelectorAll(".panel").length}`,
        );
      }

      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          backgroundColor: "#fffbe6",
          logging: true,
          useCORS: true,
          allowTaint: true,
        });

        if (layout) {
          applyClipPathsToCanvas(layout, canvas);
          await applyTemplateOverlay(layout, canvas);
        }

        // Convert to blob and create download link
        canvas.toBlob((blob) => {
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
  const LAYOUT_SANDBOX_WIDTH = 528;
  const LAYOUT_SANDBOX_HEIGHT = Math.round((LAYOUT_SANDBOX_WIDTH * 17) / 11);
  const LAYOUT_OVERLAY_SCALE = Math.max(2, Math.ceil(window.devicePixelRatio || 1));
