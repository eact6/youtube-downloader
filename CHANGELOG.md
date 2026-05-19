# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-19

### Added
- Add Electron wrapper with modern Shadcn-inspired responsive user interface (`index.html`, `styles.css`, `renderer.js`).
- Add robust `yt-dlp` integration supporting high-quality video (Adobe After Effects compatible H.264 MP4), audio-only (MP3 320kbps), and subtitle extraction (`main.js`).
- Add asynchronous background update checkers for `yt-dlp` and `ffmpeg` availability on launch.
- Add file path tracking to capture final downloaded file paths from `yt-dlp` stdout.
- Add beautiful Recents list with YouTube thumbnails fetched synchronously from video IDs (`renderer.js`).
- Add secure folder opening on Windows Explorer when clicking history cards, calling Electron's `shell.showItemInFolder()` via IPC.
- Add standard NPM packaging scripts and `electron-builder` configuration for distributables.
- Add local project-level auto-updater skill under `.skills/changelog-updater/SKILL.md` to guide AI agents in automatically recording future workspace changes.
