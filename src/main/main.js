const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const fsp = fs.promises;

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif']);
const maxFileSize = 5 * 1024 * 1024; // 5MB

const state = {
  images: [],
  pages: [],
  pageCount: 0,
};

let uploadDir;
let storageDir;
let stateFile;
let layoutCache = {
  names: [],
  templates: {},
  styles: {},
};

async function ensureStoragePaths() {
  if (uploadDir && storageDir && stateFile) {
    return;
  }

  const userData = app.getPath('userData');
  storageDir = path.join(userData, 'storage');
  uploadDir = path.join(userData, 'uploads');
  stateFile = path.join(storageDir, 'state.json');

  await fsp.mkdir(storageDir, { recursive: true });
  await fsp.mkdir(uploadDir, { recursive: true });
}

async function loadState() {
  await ensureStoragePaths();
  try {
    const raw = await fsp.readFile(stateFile, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      state.images = Array.isArray(parsed.images) ? parsed.images : [];
      state.pages = Array.isArray(parsed.pages) ? parsed.pages : [];
      state.pageCount =
        typeof parsed.pageCount === 'number' ? parsed.pageCount : state.pages.length;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load state file:', error);
    }
  }
}

async function persistState() {
  await ensureStoragePaths();
  const payload = {
    images: state.images,
    pages: state.pages,
    pageCount: state.pageCount,
  };
  await fsp.writeFile(stateFile, JSON.stringify(payload, null, 2), 'utf-8');
}

async function refreshImages() {
  await ensureStoragePaths();
  let entries = [];
  try {
    entries = await fsp.readdir(uploadDir, { withFileTypes: true });
  } catch (error) {
    console.error('Failed to read uploads directory:', error);
  }

  const images = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => allowedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const changed =
    images.length !== state.images.length ||
    images.some((name, index) => name !== state.images[index]);
  if (changed) {
    state.images = images;
    await persistState();
  }

  return images.map((name) => ({
    name,
    src: pathToFileURL(path.join(uploadDir, name)).toString(),
  }));
}

async function loadLayouts() {
  const appPath = app.getAppPath();
  const layoutDir = path.join(appPath, 'layouts');
  const templates = {};
  const styles = {};

  try {
    const entries = await fsp.readdir(layoutDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      const base = path.basename(entry.name, ext);
      const fullPath = path.join(layoutDir, entry.name);
      if (ext === '.php' || ext === '.html') {
        templates[base] = await fsp.readFile(fullPath, 'utf-8');
      } else if (ext === '.css') {
        styles[base] = await fsp.readFile(fullPath, 'utf-8');
      }
    }
  } catch (error) {
    console.error('Failed to load layout templates:', error);
  }

  layoutCache = {
    names: Object.keys(templates).sort(),
    templates,
    styles,
  };
}

async function handleUploads(files) {
  if (!Array.isArray(files) || !files.length) {
    throw new Error('No files provided');
  }

  await ensureStoragePaths();

  for (const file of files) {
    if (!file || !file.name || !file.data) {
      throw new Error('Invalid upload payload');
    }

    const name = path.basename(file.name);
    const ext = path.extname(name).toLowerCase();
    const mime = file.type || '';
    const size = typeof file.size === 'number' ? file.size : Buffer.byteLength(file.data, 'base64');

    if (!allowedExtensions.has(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    if (mime && !allowedMimeTypes.has(mime)) {
      throw new Error(`Unsupported MIME type: ${mime}`);
    }

    if (size > maxFileSize) {
      throw new Error(`File exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`);
    }

    const buffer = Buffer.from(file.data, 'base64');
    if (buffer.length > maxFileSize) {
      throw new Error(`File exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`);
    }

    const targetPath = path.join(uploadDir, name);
    await fsp.writeFile(targetPath, buffer);
  }

  return refreshImages();
}

async function deleteImage(name) {
  if (!name) {
    throw new Error('Missing image name');
  }

  await ensureStoragePaths();
  const targetPath = path.join(uploadDir, path.basename(name));
  try {
    await fsp.unlink(targetPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return refreshImages();
}

async function resolveImage(name) {
  if (!name) {
    return null;
  }

  await ensureStoragePaths();
  const targetPath = path.join(uploadDir, path.basename(name));
  try {
    await fsp.access(targetPath, fs.constants.F_OK);
    return pathToFileURL(targetPath).toString();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to resolve image path:', error);
    }
    return null;
  }
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' }).catch(() => {
      // Ignore failures when dev tools cannot be opened
    });
  }
}

app
  .whenReady()
  .then(async () => {
    await ensureStoragePaths();
    await loadState();
    await loadLayouts();
    await refreshImages();
    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow().catch((error) => {
          console.error('Failed to recreate window:', error);
        });
      }
    });
  })
  .catch((error) => {
    console.error('Failed to initialize application:', error);
    app.quit();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-initial-data', async () => {
  const images = await refreshImages();
  if (!layoutCache.names.length) {
    await loadLayouts();
  }
  return {
    layouts: layoutCache.names,
    layoutTemplates: layoutCache.templates,
    layoutStyles: layoutCache.styles,
    pages: state.pages || [],
    images,
  };
});

ipcMain.handle('save-pages', async (_event, pages) => {
  if (!Array.isArray(pages)) {
    pages = [];
  }
  state.pages = pages;
  state.pageCount = pages.length;
  await persistState();
  return {
    status: 'ok',
    pages: state.pages,
  };
});

ipcMain.handle('upload-images', async (_event, files) => {
  try {
    const images = await handleUploads(files);
    return {
      status: 'ok',
      images,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { error: error.message };
  }
});

ipcMain.handle('delete-image', async (_event, name) => {
  try {
    const images = await deleteImage(name);
    return {
      status: 'ok',
      images,
    };
  } catch (error) {
    console.error('Delete failed:', error);
    return { error: error.message };
  }
});

ipcMain.handle('resolve-image', async (_event, name) => resolveImage(name));
