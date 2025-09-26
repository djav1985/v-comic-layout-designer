const { contextBridge, ipcRenderer } = require("electron");

/**
 * Preload script for secure communication between main and renderer processes
 * Exposes limited APIs to the renderer process through contextBridge
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Application lifecycle methods
  closeApp: () => ipcRenderer.invoke("app:close"),
  minimizeApp: () => ipcRenderer.invoke("app:minimize"),
  maximizeApp: () => ipcRenderer.invoke("app:maximize"),

  // File system operations (if needed in the future)
  selectFile: (filters) => ipcRenderer.invoke("dialog:selectFile", filters),
  selectFolder: () => ipcRenderer.invoke("dialog:selectFolder"),
  saveFile: (content, filters) =>
    ipcRenderer.invoke("dialog:saveFile", content, filters),

  // System information
  getPlatform: () => ipcRenderer.invoke("system:getPlatform"),
  getVersion: () => ipcRenderer.invoke("app:getVersion"),

  // PHP server status (if needed for debugging)
  getServerStatus: () => ipcRenderer.invoke("php:getStatus"),

  // Environment detection
  isElectron: () => true,
  isPackaged: () => process.env.NODE_ENV === "production",

  // Event listeners for main process events
  onServerReady: (callback) => {
    const wrappedCallback = (event, ...args) => callback(...args);
    ipcRenderer.on("server:ready", wrappedCallback);
    return () => ipcRenderer.removeListener("server:ready", wrappedCallback);
  },

  onServerError: (callback) => {
    const wrappedCallback = (event, ...args) => callback(...args);
    ipcRenderer.on("server:error", wrappedCallback);
    return () => ipcRenderer.removeListener("server:error", wrappedCallback);
  },
});

// Add error handling for the renderer process
window.addEventListener("error", (event) => {
  console.error("Renderer error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Log that preload script has loaded (for debugging)
console.log("Electron preload script loaded successfully");
