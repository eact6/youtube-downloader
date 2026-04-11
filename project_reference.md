# YT-DLP GUI Wrapper Reference

This document serves as a technical reference for the Electron-based GUI built around `yt-dlp`. It explains the architecture, how the different components communicate, and the specific underlying commands used to achieve the desired file formats.

## Architecture Overview

The application utilizes a standard Electron architecture, which strictly separates the back-end OS processes from the front-end user interface for security and stability.

- **Main Process (`main.js`)**: Runs in a Node.js environment. It has full OS access. It handles the window creation, parses the downloads directory, runs asynchronous child processes (like the update checkers), and executes the actual `yt-dlp` commands for video, audio, and subtitles.
- **Preload Script (`preload.js`)**: Acts as a secure bridge. It uses Electron's `contextBridge` to expose specific, safe APIs to the Renderer Process without giving it full OS access (like `downloadVideo` and `downloadSubtitles`).
- **Renderer Process (`renderer.js`, `index.html`, `styles.css`)**: The visual frontend strictly adhering to a Shadcn-inspired aesthetic (true dark mode, semantic variables, Lucide UI icons). Handles DOM interactions, creates visually rich Recents with YouTube thumbnails fetched synchronously, and sends parameters to the IPC channel.

## Inter-Process Communication (IPC)

When a user clicks a download button, a specific flow occurs:
1. **Renderer**: `renderer.js` captures the click, reads the input values (URL, Quality), and calls `window.electronAPI.downloadVideo(...)`.
2. **Preload**: The preload script securely forwards this call to the Main Process using `ipcRenderer.send('download-video')`.
3. **Main**: `main.js` catches this event using `ipcMain.on('download-video')`. It constructs the command line arguments, spawns the `yt-dlp` child process, and streams the standard output (`stdout`/`stderr`) back to the window via `win.webContents.send()`.
4. **Renderer**: Listens for the incoming `download-progress` and appends the lines to the UI terminal.

## Core Mechanics & Commands

### Asynchronous Update Checker
When the app launches, `main.js` immediately spawns background processes to check the status of `yt-dlp` and `ffmpeg`.
- `spawn('yt-dlp', ['-U'])`: Triggers `yt-dlp` to update itself. Because it's asynchronous, the user can start using the app immediately while this runs in the background.
- `spawn('ffmpeg', ['-version'])`: Checks if `ffmpeg` is accessible in the system PATH.

### Video Downloads (Adobe After Effects Compatibility)
Adobe After Effects requires specific, highly standardized codecs to import without lagging or failing. The preferred web delivery format is an MP4 container housing H.264 video. 

**The yt-dlp Command Breakdown:**
```js
const args = [
  '-f', 'bestvideo[vcodec^=avc1][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best',
  '--merge-output-format', 'mp4',
];
```
- `-f FORMAT_STRING`: This is a complex format string. It explicitly looks for a video stream where the codec starts with `avc1` (H.264) and the height is equal to or less than the user's selected dropdown quality. It then pairs that with the best corresponding `m4a` audio stream.
- `--merge-output-format mp4`: Ensures the final merged file is guaranteed to be wrapped in `.mp4`.

### Audio Downloads (Best MP3)
**The yt-dlp Command Breakdown:**
```js
const args = [
  '-f', 'bestaudio',
  '-x',
  '--audio-format', 'mp3',
  '--audio-quality', '0',
];
```
- `-f bestaudio`: Tells `yt-dlp` to download the highest quality raw audio stream.
- `-x`: Stands for `--extract-audio`. It discards the video portion.
- `--audio-format mp3`: Prompts `ffmpeg` to encode the downloaded raw stream into an MP3.
- `--audio-quality 0`: Sets Variable Bitrate (VBR) to level 0, which is the highest possible MP3 quality.

### Subtitle Downloads (VTT/SRT)
A new core functionality allows extracting and downloading subtitles without downloading the video itself.
**The yt-dlp Command Breakdown:**
```js
const args = [
  '--write-subs',
  '--write-auto-subs',
  '--sub-langs', 'en.*', // Or '--all-subs'
  '--skip-download'
];
```
- `--write-subs` / `--write-auto-subs`: Instructs `yt-dlp` to write the standard subtitles and automatic youtube closed-captions to disk.
- `--skip-download`: Halts the video download phase entirely so the process completes almost instantly.

## Default Directories
The app automatically detects the user's primary "Downloads" folder using Electron's `app.getPath('downloads')`. It then ensures three sub-directories exist:
- `Downloads/yt-videos/`
- `Downloads/yt-audios/`
- `Downloads/yt-subs/`

## Recent Downloads Data
The "Recents" tab leverages the `localStorage` API inherent to the Chromium browser running inside Electron.
When a download successfully completes, `renderer.js` pushes a record object to `localStorage`.
A robust regex matches against typical YouTube URL variants (like `youtu.be`, `/v/`, `v=`) to scrape the 11-character video ID synchronously. It then populates the list with native `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg">` blocks to achieve immediate cache-hitting thumbnail rendering.

## Packaging & Building
The application is pre-packaged with **electron-builder**. A custom `build` block in the `package.json` links the `build/icon.png` generated securely using the Antigravity system, and builds an NSIS Installer payload when executing:
```sh
npm run dist
```
This encapsulates `ffmpeg` dependencies (if available via user path or bundled statically) and provides a standalone distributable for Windows (`.exe`).
