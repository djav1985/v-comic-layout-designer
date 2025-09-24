const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('comicAPI', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  savePages: (pages) => ipcRenderer.invoke('save-pages', pages),
  uploadImages: (files) => ipcRenderer.invoke('upload-images', files),
  deleteImage: (name) => ipcRenderer.invoke('delete-image', name),
  resolveImageSrc: (name) => ipcRenderer.invoke('resolve-image', name),
});
