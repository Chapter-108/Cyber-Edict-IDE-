const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

/**
 * Windows：驱动 / 远程桌面 / 部分环境 GPU 子进程崩溃 → 进程直接退出、看不到窗口。
 * 必须在 app.ready 前执行。需要硬件加速时：set CYBER_EDICT_USE_GPU=1
 */
function applyGpuWorkarounds() {
  if (process.env.CYBER_EDICT_USE_GPU === '1') return;
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  if (process.platform === 'win32') {
    app.commandLine.appendSwitch('disable-gpu-sandbox');
  }
}
applyGpuWorkarounds();

const distIndex = path.resolve(__dirname, '..', 'dist', 'index.html');

/** 单实例：第二次启动会聚焦已有窗口。若上次异常退出仍占锁，任务管理器结束 Electron 后再开，或 set CYBER_EDICT_ALLOW_MULTI=1 调试 */
const allowMulti = process.env.CYBER_EDICT_ALLOW_MULTI === '1';
let gotLock = true;
if (!allowMulti) {
  gotLock = app.requestSingleInstanceLock();
}
if (!gotLock) {
  console.error(
    '[Cyber-Edict IDE] Another copy is running (or a stale Electron is holding the lock). Focus that window, or end Electron in Task Manager, then retry.',
  );
  app.quit();
  process.exit(0);
}
if (!allowMulti) {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mainWindow = null;

process.on('uncaughtException', (err) => {
  console.error('[Cyber-Edict IDE] uncaughtException:', err);
  try {
    dialog.showErrorBox('Cyber-Edict IDE — startup error', err?.message || String(err));
  } catch (_) {
    /* ignore */
  }
});

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 680,
      show: true,
      backgroundColor: '#0a0a0f',
      title: 'Cyber-Edict IDE',
      autoHideMenuBar: true,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        // Windows 下 sandbox 偶发与 GPU/路径组合导致白屏或秒退
        sandbox: process.platform === 'darwin',
      },
    });

    try {
      Menu.setApplicationMenu(null);
    } catch (_) {
      /* non-fatal */
    }

    const showFallback = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show();
      }
    }, 4000);
    mainWindow.once('ready-to-show', () => {
      clearTimeout(showFallback);
      if (process.env.ELECTRON_DEV !== '1' && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.maximize();
      }
    });

    const useDevServer = process.env.ELECTRON_DEV === '1';

    if (useDevServer) {
      mainWindow.loadURL('http://127.0.0.1:5173').catch((e) => showLoadError(mainWindow, e));
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else if (fs.existsSync(distIndex)) {
      const fileUrl = pathToFileURL(distIndex).href;
      mainWindow.loadURL(fileUrl).catch((e) => showLoadError(mainWindow, e));
    } else {
      mainWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<style>
body{font-family:system-ui;padding:40px;background:#0a0a0f;color:#e8e0d0;}
code{background:#1e1e30;padding:3px 8px;border-radius:4px;}
h2{color:#C9A84C;}
</style></head><body>
<h2>Cyber-Edict IDE — dist not found</h2>
<p>Run in project root:</p>
<p><code>npm run build</code></p>
<p>Or use dev: <code>npm run electron:dev</code></p>
</body></html>`)}`,
      );
    }

    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      if (url.startsWith('http://127.0.0.1:5173')) return;
      showLoadError(mainWindow, new Error(`Load failed (${code}): ${desc}\n${url}`));
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url);
      return { action: 'deny' };
    });

    if (process.env.ELECTRON_DEV !== '1') {
      mainWindow.webContents.on('before-input-event', (_event, input) => {
        if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
          _event.preventDefault();
        }
      });
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (err) {
    console.error('[Cyber-Edict IDE] createWindow failed:', err);
    dialog.showErrorBox('Cyber-Edict IDE', `Cannot create window:\n${err?.message || err}`);
    throw err;
  }
}

function showLoadError(win, err) {
  const msg = err?.message || String(err);
  console.error('[Cyber-Edict IDE] load error:', msg);
  if (!win || win.isDestroyed()) return;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:system-ui;padding:24px;background:#1a1020;color:#f0e6dc;}
    pre{white-space:pre-wrap;background:#0d0d14;padding:12px;border-radius:8px;font-size:13px;}
  </style></head><body><h2>Page failed to load</h2><pre>${msg.replace(/</g, '&lt;')}</pre>
  <p>If path contains non-ASCII characters, try moving the project to a short English path (e.g. C:\\dev\\cyber-edict).</p></body></html>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).catch(() => {});
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
