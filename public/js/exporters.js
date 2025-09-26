import { state } from "./state.js";
import { showSaveIndicator } from "./save-indicator.js";
import {
  EXPORT_SCALE,
  PDF_COLUMN_WIDTH,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  renderLayoutToCanvas,
  savePagesState,
  createPage,
} from "./pages.js";

function getJsPdfConstructor() {
  const namespace = window.jspdf;

  if (!namespace || typeof namespace.jsPDF !== "function") {
    throw new Error(
      "jsPDF failed to load. Verify that /vendor/jspdf.umd.min.js is accessible.",
    );
  }

  return namespace.jsPDF;
}

export async function exportPdf(exportBtn) {
  if (!exportBtn) return;

  try {
    showSaveIndicator("Preparing export...", "#2196F3");
    exportBtn.disabled = true;
    exportBtn.textContent = "Generating PDF...";

    await new Promise((resolve) => {
      if (state.isUpdatingFromServer) {
        setTimeout(() => {
          savePagesState(false);
          setTimeout(resolve, 1000);
        }, 1000);
      } else {
        savePagesState(false);
        setTimeout(resolve, 1000);
      }
    });

    const layouts = Array.from(document.querySelectorAll(".layout"));
    if (layouts.length === 0) {
      alert("No pages to export!");
      return;
    }

    const JsPdf = getJsPdfConstructor();
    const pdf = new JsPdf({
      orientation: "landscape",
      unit: "pt",
      format: [PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT],
    });

    for (let i = 0; i < layouts.length; i += 2) {
      showSaveIndicator(
        `Rendering page ${Math.floor(i / 2) + 1}/${Math.ceil(layouts.length / 2)}...`,
        "#2196F3",
      );

      const layout1 = layouts[i];
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas1 = await renderLayoutToCanvas(layout1, EXPORT_SCALE);

      if (canvas1.width === 0 || canvas1.height === 0) {
        throw new Error(`Canvas ${i + 1} has zero dimensions`);
      }

      const img1 = canvas1.toDataURL("image/png", 1.0);

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

        const aspectRatio = canvas.width === 0 ? 1 : canvas.height / canvas.width;

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
    exportBtn.disabled = false;
    exportBtn.textContent = "Export PDF";
  }
}

export async function exportImages(exportImagesBtn) {
  if (!exportImagesBtn) return;

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

      await new Promise((resolve) =>
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve();
              return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `comic-page-${i + 1}.png`;
            link.click();
            URL.revokeObjectURL(url);
            resolve();
          },
          "image/png",
          1.0,
        ),
      );

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
}

export async function debugLayouts() {
  const layoutContainers = Array.from(document.querySelectorAll(".layout-container"));

  for (let i = 0; i < layoutContainers.length; i++) {
    const container = layoutContainers[i];
    const layout = container.querySelector(".layout");

    if (!layout) {
      console.warn(`No .layout found in container ${i + 1}`);
      continue;
    }

    try {
      const canvas = await renderLayoutToCanvas(layout, EXPORT_SCALE);

      await new Promise((resolve) =>
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve();
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `layout-container-${i + 1}-debug.png`;
          link.click();
          URL.revokeObjectURL(url);
          resolve();
        }),
      );
    } catch (error) {
      console.error(`Failed to capture layout container ${i + 1}:`, error);
    }
  }
}

export function setupExportButtons({ exportPdfButton, exportImagesButton }) {
  if (exportPdfButton) {
    exportPdfButton.addEventListener("click", () => exportPdf(exportPdfButton));
  }

  if (exportImagesButton) {
    exportImagesButton.addEventListener("click", () =>
      exportImages(exportImagesButton),
    );
  }
}

export function setupKeyboardShortcuts({
  saveState,
  exportPdfButton,
  exportImagesButton,
}) {
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      showSaveIndicator("Manual save...", "#2196F3");
      saveState(false);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      createPage();
      saveState(true);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "e") {
      e.preventDefault();
      if (exportPdfButton && !exportPdfButton.disabled) {
        exportPdfButton.click();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      if (exportImagesButton && !exportImagesButton.disabled) {
        exportImagesButton.click();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      debugLayouts();
    }

    if (e.key === "Escape") {
      document.querySelectorAll(".panel.drag-over").forEach((panel) => {
        panel.classList.remove("drag-over");
      });
    }
  });
}
