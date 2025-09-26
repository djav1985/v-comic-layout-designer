const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const getPort = require("get-port");
const waitOn = require("wait-on");

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
    return path.join(process.resourcesPath, "resources", "php", executable);
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

  serverPort = await getPort({ port: getPort.makeRange(9000, 9100) });
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
    dialog.showErrorBox(
      "PHP Server Error",
      `Unable to start the embedded PHP server: ${error.message}`,
    );
    terminatePhpServer();
    app.quit();
  });

  phpProcess.on("exit", (code, signal) => {
    console.log(`PHP server exited with code ${code} signal ${signal}`);
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
}

app.on("ready", createWindow);

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
