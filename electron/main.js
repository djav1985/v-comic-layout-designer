const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");

let mainWindow = null;
let phpProcess = null;
let serverPort = null;

const PHP_BINARY_ENV = "PHP_BINARY_PATH";

// Check for development mode flag
const isDevelopment = process.argv.includes("--dev") || !app.isPackaged;

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
      "The PHP runtime could not be located.",
      "If you are running a development build, make sure PHP is installed and available on your PATH.",
      "If you are running a packaged build, ensure the PHP binary is placed in resources/php inside the app folder.",
      `Searched for PHP at: ${phpBinary}`,
    ].join("\n");

    dialog.showErrorBox("PHP Runtime Missing", message);
    app.quit();
    return null;
  }

  // Verify PHP version compatibility
  try {
    const versionCheck = spawnSync(phpBinary, ["--version"], {
      encoding: "utf8",
    });

    if (versionCheck.error) {
      throw versionCheck.error;
    }

    if (versionCheck.status !== 0) {
      throw new Error(`PHP version check failed with code ${versionCheck.status}`);
    }

    const versionOutput = versionCheck.stdout || "";

    console.log(`PHP version check: ${versionOutput.split("\n")[0]}`);

    // Check if PHP version is >= 8.0
    const versionMatch = versionOutput.match(/PHP (\d+)\.(\d+)/);
    if (versionMatch) {
      const [, major, minor] = versionMatch;
      if (parseInt(major) < 8) {
        throw new Error(
          `PHP ${major}.${minor} is not supported. PHP 8.0+ is required.`,
        );
      }
    }
  } catch (error) {
    console.error("PHP compatibility check failed:", error);
    dialog.showErrorBox(
      "PHP Compatibility Error",
      `PHP version check failed: ${error.message}`,
    );
    app.quit();
    return null;
  }

  const requiredExtensions = ["zip", "pdo_sqlite", "sqlite3"];
  const missingExtensions = [];

  for (const extension of requiredExtensions) {
    const result = spawnSync(phpBinary, [
      "-r",
      `exit(extension_loaded('${extension}') ? 0 : 1);`,
    ]);

    if (result.error) {
      console.error(
        "Failed to verify required PHP extensions:",
        result.error,
      );
      dialog.showErrorBox(
        "PHP Extension Check Failed",
        `Unable to verify required PHP extensions: ${result.error.message}`,
      );
      app.quit();
      return null;
    }

    if (result.status !== 0) {
      missingExtensions.push(extension);
    }
  }

  if (missingExtensions.length > 0) {
    dialog.showErrorBox(
      "Required PHP Extensions Missing",
      [
        "The embedded PHP runtime is missing one or more required extensions.",
        "Please reinstall or repair the application to restore the bundled PHP extensions.",
        `Missing extensions: ${missingExtensions.join(", ")}`,
      ].join("\n"),
    );
    app.quit();
    return null;
  }

  serverPort = await getPort({ port: portNumbers(9000, 9100) });
  const projectRoot = app.isPackaged
    ? path.join(process.resourcesPath, "app")
    : path.join(__dirname, "..");
  const publicDir = path.join(projectRoot, "public");
  const routerScript = path.join(publicDir, "server-router.php");

  // Verify required files exist
  if (!fs.existsSync(publicDir)) {
    dialog.showErrorBox(
      "Application Files Missing",
      `Public directory not found: ${publicDir}`,
    );
    app.quit();
    return null;
  }

  if (!fs.existsSync(routerScript)) {
    dialog.showErrorBox(
      "Application Files Missing",
      `Server router script not found: ${routerScript}`,
    );
    app.quit();
    return null;
  }

  console.log(
    `Starting PHP server on port ${serverPort} with root: ${projectRoot}`,
  );

  phpProcess = spawn(
    phpBinary,
    ["-S", `127.0.0.1:${serverPort}`, "-t", publicDir, routerScript],
    {
      cwd: projectRoot,
      stdio: "pipe",
      env: {
        ...process.env,
        APP_ENV: app.isPackaged ? "production" : "development",
        ELECTRON_APP: "1", // Flag to indicate running in Electron
        ELECTRON_USER_DATA: app.getPath("userData"), // Pass user data path to PHP
      },
    },
  });

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
    show: false, // Don't show until ready-to-show
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, "preload.js"),
      // Add security configurations for Electron
      webSecurity: true,
      sandbox: false, // Required for PHP server communication
    },
  });

  const appUrl = `http://127.0.0.1:${port}`;

  // Set security headers before loading URL
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com;",
          ],
        },
      });
    },
  );

  // Show window only when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (!app.isPackaged || isDevelopment) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  });

  await mainWindow.loadURL(appUrl);

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

// Handle command line arguments for better compatibility
const argv = process.argv;

// Add sandbox disabling for CI environments
if (argv.includes("--no-sandbox") || process.env.CI) {
  app.commandLine.appendSwitch("--no-sandbox");
  app.commandLine.appendSwitch("--disable-setuid-sandbox");
}

// Disable GPU acceleration in headless environments
if (process.env.CI || !process.env.DISPLAY) {
  app.commandLine.appendSwitch("--disable-gpu");
  app.commandLine.appendSwitch("--disable-software-rasterizer");
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
