// Electron entry point: wraps the Vite-built web app (dist/) in a desktop window.
const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');

/**
 * Exported PDF/PNG files arrive as browser downloads. Ask where to save them with a
 * native Save dialog (remembering the last folder). PFP_DOWNLOAD_DIR saves straight into
 * a folder without a dialog (used for automated testing).
 */
function setupDownloads(win) {
  let lastDir = app.getPath('documents');
  win.webContents.session.on('will-download', (_event, item) => {
    const filename = item.getFilename();
    const autoDir = process.env.PFP_DOWNLOAD_DIR;
    if (autoDir) {
      item.setSavePath(path.join(autoDir, filename));
      return;
    }
    const ext = path.extname(filename).toLowerCase();
    const filters =
      ext === '.pdf'
        ? [{ name: 'PDF', extensions: ['pdf'] }]
        : ext === '.png'
        ? [{ name: 'PNG', extensions: ['png'] }]
        : [];
    const savePath = dialog.showSaveDialogSync(win, {
      title: 'Lưu file',
      defaultPath: path.join(lastDir, filename),
      filters: [...filters, { name: 'Tất cả', extensions: ['*'] }],
    });
    if (!savePath) {
      item.cancel();
      return;
    }
    lastDir = path.dirname(savePath);
    item.setSavePath(savePath);
  });
}

const isDev = !app.isPackaged && process.env.ELECTRON_DEV_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Photobooth Frame Puncher',
    backgroundColor: '#f1f5f9',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  setupDownloads(win);

  // Open external links (e.g. https://...) in the user's browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL(process.env.ELECTRON_DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// Only one running instance; focus it if the exe is started again
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
