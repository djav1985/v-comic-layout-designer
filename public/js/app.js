import { initializeImageLibrary } from "./image-library.js";
import {
  initializePageModule,
  initializePages,
  subscribeToStateStream,
  initializeLifecycleHandlers,
  savePagesState,
} from "./pages.js";
import { setupExportButtons, setupKeyboardShortcuts } from "./exporters.js";

window.addEventListener("DOMContentLoaded", () => {
  // Detect if running in Electron and set up appropriate handlers
  if (window.electronAPI) {
    console.log("Running in Electron environment");
    
    // Set up Electron-specific error handlers
    window.electronAPI.onServerError((error) => {
      console.error("Server error from Electron:", error);
      // Show user-friendly error message
      if (error.type === "launch_error") {
        alert("Failed to start the application server. Please check the installation and try again.");
      } else if (error.type === "exit_error") {
        alert("The application server stopped unexpectedly. The app will now close.");
      }
    });

    window.electronAPI.onServerReady((info) => {
      console.log("Server ready:", info);
    });
  }

  const imageList = document.getElementById("imageList");
  const uploadForm = document.getElementById("uploadForm");
  const imageInput = document.getElementById("imageInput");
  const resetButton = document.getElementById("resetWorkspace");
  const saveStateButton = document.getElementById("saveState");
  const loadStateButton = document.getElementById("loadState");
  const loadStateInput = document.getElementById("loadStateInput");
  const toggleShortcutsButton = document.getElementById("toggleShortcuts");
  const shortcutList = document.getElementById("shortcutList");
  const imagesSection = document.getElementById("images");
  const mobileImageToggle = document.getElementById("mobileImageToggle");
  const mobileImageBackdrop = document.getElementById("mobileImageBackdrop");
  const mobileModalClose = document.getElementById("closeImageModal");
  const pages = document.getElementById("pages");
  const addPageButton = document.getElementById("addPage");
  const exportPdfButton = document.getElementById("exportPdf");
  const exportImagesButton = document.getElementById("exportImages");

  initializeImageLibrary({
    imageList,
    imagesSection,
    mobileImageToggle,
    mobileImageBackdrop,
    mobileModalClose,
    uploadForm,
    imageInput,
  });

  initializePageModule({
    pages,
    addPageButton,
    toggleShortcutsButton,
    shortcutList,
    resetButton,
    saveStateButton,
    loadStateButton,
    loadStateInput,
  });

  setupExportButtons({ exportPdfButton, exportImagesButton });
  setupKeyboardShortcuts({
    saveState: savePagesState,
    exportPdfButton,
    exportImagesButton,
  });

  initializePages().finally(() => {
    subscribeToStateStream();
  });

  initializeLifecycleHandlers();
});
