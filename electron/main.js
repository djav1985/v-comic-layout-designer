const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow = null;
let phpProcess = null;
let serverPort = null;

const PHP_BINARY_ENV = "PHP_BINARY_PATH";

function resolvePhpBinary() {
  if (process.env[PHP_BINARY_ENV]) {
    return process.env[PHP_BINARY_ENV];
  }

  if (app.isPackaged) {
    const executable = process.platform === "win32" ? "php.exe" : "php";
    return path.join(process.resourcesPath, "php", executable);
  }

  return "php";
}

function ensurePhpBinaryExists(phpBinary) {
  if (phpBinary === "php") {
    return true;
  }

  try {
    return fs.existsSync(phpBinary);
  } catch (error) {
    console.error("Failed to verify PHP binary location:", error);
    return false;
  }
}

function terminatePhpServer() {
  if (phpProcess && !phpProcess.killed) {
    phpProcess.kill();
  }
  phpProcess = null;
  serverPort = null;
}

async function startPhpServer() {
  const { default: getPort, portNumbers } = await import("get-port");
  const { default: waitOn } = await import("wait-on");

  const phpBinary = resolvePhpBinary();

  if (!ensurePhpBinaryExists(phpBinary)) {
    const message = [
      "The bundled PHP runtime could not be located.",
      "If you are running a development build, make sure PHP is installed and available on your PATH.",
      "If you are running a packaged build, ensure the PHP binary is placed in resources/php inside the app folder.",
    ].join("\n");

    dialog.showErrorBox("PHP Runtime Missing", message);
    app.quit();
    return null;
  }

  serverPort = await getPort({ port: portNumbers(9000, 9100) });
  const projectRoot = app.isPackaged
    ? path.join(process.resourcesPath, "app")
    : path.join(__dirname, "..");
  const publicDir = path.join(projectRoot, "public");

  phpProcess = spawn(
    phpBinary,
    ["-S", `127.0.0.1:${serverPort}`, "-t", publicDir],
    {
      cwd: projectRoot,
      stdio: "pipe",
      env: {
        ...process.env,
        APP_ENV: app.isPackaged ? "production" : "development",
      },
    },
  );

  phpProcess.stdout.on("data", (data) => {
    console.log(`[php] ${data.toString()}`.trim());
  });

  phpProcess.stderr.on("data", (data) => {
    console.error(`[php] ${data.toString()}`.trim());
  });

  phpProcess.on("error", (error) => {
    console.error("Failed to launch PHP server:", error);

    // Notify renderer of error if window exists
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("server:error", {
        message: error.message,
        type: "launch_error",
      });
    }

    dialog.showErrorBox(
      "PHP Server Error",
      `Unable to start the embedded PHP server: ${error.message}`,
    );
    terminatePhpServer();
    app.quit();
  });

  phpProcess.on("exit", (code, signal) => {
    console.log(`PHP server exited with code ${code} signal ${signal}`);

    // Notify renderer of server exit if window exists
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("server:error", {
        message: `PHP server stopped unexpectedly (code: ${code}, signal: ${signal})`,
        type: "exit_error",
        code,
        signal,
      });
    }

    if (!app.isQuitting) {
      dialog.showErrorBox(
        "PHP Server Stopped",
        "The embedded PHP server stopped unexpectedly. The application will now close.",
      );
    }
    app.quit();
  });

  try {
    await waitOn({
      resources: [`http://127.0.0.1:${serverPort}`],
      timeout: 20000,
    });
  } catch (error) {
    dialog.showErrorBox(
      "PHP Server Timeout",
      "The embedded PHP server did not start in time.",
    );
    terminatePhpServer();
    app.quit();
    return null;
  }

  return serverPort;
}

async function createWindow() {
  const port = await startPhpServer();
  if (!port) {
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const appUrl = `http://127.0.0.1:${port}`;
  await mainWindow.loadURL(appUrl);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Notify renderer that server is ready
  mainWindow.webContents.send("server:ready", { port, url: appUrl });
}

// IPC handlers for secure communication with renderer process
function setupIpcHandlers() {
  // Application lifecycle handlers
  ipcMain.handle("app:close", () => {
    app.quit();
  });

  ipcMain.handle("app:minimize", () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle("app:maximize", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle("app:getVersion", () => {
    return app.getVersion();
  });

  // System information handlers
  ipcMain.handle("system:getPlatform", () => {
    return process.platform;
  });

  // Dialog handlers
  ipcMain.handle("dialog:selectFile", async (event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: filters || [{ name: "All Files", extensions: ["*"] }],
    });
    return result;
  });

  ipcMain.handle("dialog:selectFolder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    return result;
  });

  ipcMain.handle("dialog:saveFile", async (event, content, filters) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: filters || [{ name: "All Files", extensions: ["*"] }],
    });
    return result;
  });

  // PHP server status handler
  ipcMain.handle("php:getStatus", () => {
    return {
      running: phpProcess && !phpProcess.killed,
      port: serverPort,
      pid: phpProcess ? phpProcess.pid : null,
    };
  });
}

app.on("ready", () => {
  setupIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  terminatePhpServer();
});

process.on("exit", terminatePhpServer);
process.on("SIGINT", () => {
  terminatePhpServer();
  process.exit();
});
