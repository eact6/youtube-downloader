const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    backgroundColor: '#121212'
  });

  win.loadFile('index.html');
  
  // Async update check
  checkUpdates(win);
}

function checkUpdates(win) {
  // Check yt-dlp update
  const ytUpdate = spawn('yt-dlp', ['-U']);
  ytUpdate.stdout.on('data', (data) => {
    win.webContents.send('update-log', `[yt-dlp update] ${data.toString()}`);
  });
  ytUpdate.stderr.on('data', (data) => {
    win.webContents.send('update-log', `[yt-dlp stderr] ${data.toString()}`);
  });
  ytUpdate.on('error', () => {
    win.webContents.send('update-log', `[yt-dlp error] yt-dlp might not be installed or not in PATH.`);
  });
  
  // Verify FFmpeg is available
  const ffmpegCheck = spawn('ffmpeg', ['-version']);
  ffmpegCheck.stdout.once('data', (data) => {
    const versionLine = data.toString().split('\n')[0];
    win.webContents.send('update-log', `[ffmpeg check] ${versionLine}`);
  });
  ffmpegCheck.on('error', () => {
    win.webContents.send('update-log', `[ffmpeg error] ffmpeg not found in PATH! Audio extraction and video merging may fail.`);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.on('download-video', (event, { url, quality }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const downloadsPath = app.getPath('downloads');
  const videoDir = path.join(downloadsPath, 'yt-videos');
  
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

  const outPath = path.join(videoDir, '%(title)s.%(ext)s');
  // H264 MP4 format string, requesting specified quality or lower
  const formatStr = `bestvideo[vcodec^=avc1][height<=${quality}]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
  
  const args = [
    '-f', formatStr,
    '--merge-output-format', 'mp4',
    '-o', outPath,
    '--no-mtime',
    url
  ];

  win.webContents.send('download-status', `[VIDEO] Starting download for ${url}...`);
  const ytProcess = spawn('yt-dlp', args);

  ytProcess.stdout.on('data', (data) => win.webContents.send('download-progress', data.toString()));
  ytProcess.stderr.on('data', (data) => win.webContents.send('download-progress', data.toString()));
  ytProcess.on('close', (code) => {
    if (code === 0) win.webContents.send('download-complete', { type: 'video', url, status: 'Success' });
    else win.webContents.send('download-error', `[VIDEO] Download failed with code ${code}`);
  });
});

ipcMain.on('download-audio', (event, { url }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const downloadsPath = app.getPath('downloads');
  const audioDir = path.join(downloadsPath, 'yt-audios');
  
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  const outPath = path.join(audioDir, '%(title)s.%(ext)s');
  
  const args = [
    '-f', 'bestaudio',
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', outPath,
    '--no-mtime',
    url
  ];

  win.webContents.send('download-status', `[AUDIO] Starting download for ${url}...`);
  const ytProcess = spawn('yt-dlp', args);

  ytProcess.stdout.on('data', (data) => win.webContents.send('download-progress', data.toString()));
  ytProcess.stderr.on('data', (data) => win.webContents.send('download-progress', data.toString()));
  ytProcess.on('close', (code) => {
    if (code === 0) win.webContents.send('download-complete', { type: 'audio', url, status: 'Success' });
    else win.webContents.send('download-error', `[AUDIO] Download failed with code ${code}`);
  });
});

ipcMain.on('download-subtitles', (event, { url, lang }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const downloadsPath = app.getPath('downloads');
  const subsDir = path.join(downloadsPath, 'yt-subs');
  
  if (!fs.existsSync(subsDir)) fs.mkdirSync(subsDir, { recursive: true });

  const outPath = path.join(subsDir, '%(title)s.%(ext)s');
  
  const subLang = lang || 'en';
  
  const args = [
    '--write-subs',
    '--write-auto-subs',
    '--skip-download',
    '-o', outPath,
    '--no-mtime',
    url
  ];

  if (subLang === 'all') {
    args.splice(2, 0, '--all-subs');
  } else {
    args.splice(2, 0, '--sub-langs', `${subLang}.*`);
  }

  win.webContents.send('download-status', `[SUBS] Starting download for ${url}...`);
  const ytProcess = spawn('yt-dlp', args);

  ytProcess.stdout.on('data', (data) => win.webContents.send('download-progress', data.toString()));
  ytProcess.stderr.on('data', (data) => win.webContents.send('download-progress', data.toString()));
  ytProcess.on('close', (code) => {
    if (code === 0) win.webContents.send('download-complete', { type: 'subtitles', url, status: 'Success' });
    else win.webContents.send('download-error', `[SUBS] Download failed with code ${code}`);
  });
});
