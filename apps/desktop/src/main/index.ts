import { app, BrowserWindow, session } from 'electron';
import { join } from 'node:path';

function createWindow(): void {
  const devURL = process.env.ELECTRON_RENDERER_URL;
  if (devURL && new URL(devURL).origin !== 'http://127.0.0.1:5173') {
    throw new Error('Unexpected development renderer origin.');
  }

  const window = new BrowserWindow({
    title: 'Online Exam — Nhóm 4',
    width: 1120,
    height: 760,
    minWidth: 760,
    minHeight: 520,
    backgroundColor: '#f5f7fb',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false
    }
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());

  const load = devURL
    ? window.loadURL(devURL)
    : window.loadFile(join(__dirname, '../renderer/index.html'));
  void load.catch((error: unknown) => {
    console.error('Failed to load the desktop shell:', error);
    app.quit();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0];
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  void app.whenReady().then(() => {
    const dev = Boolean(process.env.ELECTRON_RENDERER_URL);
    const policy = [
      "default-src 'self'",
      `script-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
      `style-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
      "img-src 'self' data:",
      "font-src 'self'",
      dev ? "connect-src 'self' ws://127.0.0.1:5173" : "connect-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'"
    ].join('; ');
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [policy] } });
    });
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }).catch((error: unknown) => {
    console.error('Desktop startup failed:', error);
    app.quit();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
