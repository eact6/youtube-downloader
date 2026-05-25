// Global State Tracking
let isDownloading = false;

// Tab switching logic
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

function updateTerminalVisibility(tabId) {
  const terminalEl = document.querySelector('.status-terminal');
  const progressEl = document.getElementById('download-progress-container');
  
  if (terminalEl) {
    if (tabId === 'settings-tab') {
      terminalEl.style.display = 'none';
      if (progressEl) progressEl.style.display = 'none';
    } else {
      terminalEl.style.display = 'flex';
      if (progressEl && progressEl.classList.contains('active')) {
        progressEl.style.display = 'block';
      }
    }
  }
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    
    // Toggle terminal visibility
    updateTerminalVisibility(btn.dataset.tab);
  });
});

// Progress Bar Helper Routines
function startDownloadIndicator(statusMsg) {
  isDownloading = true;
  const progressEl = document.getElementById('download-progress-container');
  if (progressEl) {
    progressEl.classList.add('active');
    const currentTab = document.querySelector('.nav-btn.active').dataset.tab;
    if (currentTab !== 'settings-tab') {
      progressEl.style.display = 'block';
    }
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-percent-text').textContent = '0%';
    document.getElementById('progress-status-text').textContent = statusMsg;
  }
}

function stopDownloadIndicator() {
  isDownloading = false;
  const progressEl = document.getElementById('download-progress-container');
  if (progressEl) {
    progressEl.classList.remove('active');
    progressEl.style.display = 'none';
  }
}

// Download Video
document.getElementById('btn-download-video').addEventListener('click', () => {
  if (isDownloading) {
    alert('A download is already in progress. Please wait for the current download to finish!');
    appendLog('[⚠️ Warning] A download is already in progress. Concurrent downloads are disabled.', 'log-warn');
    return;
  }
  const url = document.getElementById('video-url').value;
  const quality = document.getElementById('video-quality').value;
  if (!url) return;
  
  startDownloadIndicator('Downloading video...');
  window.electronAPI.downloadVideo({ url, quality });
  document.getElementById('video-url').value = '';
});

// Download Audio
document.getElementById('btn-download-audio').addEventListener('click', () => {
  if (isDownloading) {
    alert('A download is already in progress. Please wait for the current download to finish!');
    appendLog('[⚠️ Warning] A download is already in progress. Concurrent downloads are disabled.', 'log-warn');
    return;
  }
  const url = document.getElementById('audio-url').value;
  if (!url) return;
  
  startDownloadIndicator('Extracting audio...');
  window.electronAPI.downloadAudio({ url });
  document.getElementById('audio-url').value = '';
});

// Download Subtitles
document.getElementById('btn-download-subs').addEventListener('click', () => {
  if (isDownloading) {
    alert('A download is already in progress. Please wait for the current download to finish!');
    appendLog('[⚠️ Warning] A download is already in progress. Concurrent downloads are disabled.', 'log-warn');
    return;
  }
  const url = document.getElementById('subs-url').value;
  const lang = document.getElementById('subs-lang').value;
  if (!url) return;
  
  startDownloadIndicator('Extracting subtitles...');
  window.electronAPI.downloadSubtitles({ url, lang });
  document.getElementById('subs-url').value = '';
});

// Download All Subtitles
document.getElementById('btn-download-all-subs').addEventListener('click', () => {
  if (isDownloading) {
    alert('A download is already in progress. Please wait for the current download to finish!');
    appendLog('[⚠️ Warning] A download is already in progress. Concurrent downloads are disabled.', 'log-warn');
    return;
  }
  const url = document.getElementById('subs-url').value;
  if (!url) return;
  
  startDownloadIndicator('Extracting all subtitles...');
  window.electronAPI.downloadSubtitles({ url, lang: 'all' });
  document.getElementById('subs-url').value = '';
});

// Download Instagram
const btnDownloadInstagram = document.getElementById('btn-download-instagram');
if (btnDownloadInstagram) {
  btnDownloadInstagram.addEventListener('click', () => {
    if (isDownloading) {
      alert('A download is already in progress. Please wait for the current download to finish!');
      appendLog('[⚠️ Warning] A download is already in progress. Concurrent downloads are disabled.', 'log-warn');
      return;
    }
    const url = document.getElementById('instagram-url').value.trim();
    const format = document.getElementById('instagram-format').value;
    if (!url) return;
    
    const label = format === 'audio' ? 'audio' : 'video';
    startDownloadIndicator(`Downloading Instagram ${label}...`);
    window.electronAPI.downloadInstagram({ url, format });
    document.getElementById('instagram-url').value = '';
  });
}

// Terminal Output
const terminal = document.getElementById('terminal-output');

function appendLog(message, className = '') {
  const div = document.createElement('div');
  div.textContent = message;
  if (className) div.classList.add(className);
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

window.electronAPI.onDownloadStatus((status) => {
  appendLog(status, 'log-info');
});

window.electronAPI.onDownloadProgress((progress) => {
  // Try to parse out the carriage returns yt-dlp uses to update the same line
  const lines = progress.split('\r');
  const text = lines[lines.length - 1].trim();
  if (text) appendLog(text);
  
  // Parse percentage from yt-dlp output
  const percentMatch = progress.match(/\[download\]\s+([0-9.]+)%/);
  if (percentMatch) {
    const percentage = parseFloat(percentMatch[1]);
    const fill = document.getElementById('progress-fill');
    const percentText = document.getElementById('progress-percent-text');
    if (fill && percentText) {
      fill.style.width = `${percentage}%`;
      percentText.textContent = `${Math.round(percentage)}%`;
      
      const statusText = document.getElementById('progress-status-text');
      if (percentage === 100) {
        statusText.textContent = 'Processing and finalizing files...';
      } else {
        statusText.textContent = 'Downloading media...';
      }
    }
  }
});

window.electronAPI.onUpdateLog((log) => {
  if (log.toLowerCase().includes('error')) {
    appendLog(log, 'log-error');
  } else {
    appendLog(log, 'log-warn');
  }
});

window.electronAPI.onDownloadError((error) => {
  appendLog(error, 'log-error');
  stopDownloadIndicator();
});

window.electronAPI.onDownloadComplete((data) => {
  appendLog(`[✓] Download Complete: ${data.url} (${data.type})`, 'log-success');
  saveRecent(data.url, data.type, data.filePath);
  if (currentSettings.soundEnabled) {
    playSuccessChime();
  }
  stopDownloadIndicator();
});

// Recents Logic
function getRecents() {
  const recents = localStorage.getItem('yt-recents');
  return recents ? JSON.parse(recents) : [];
}

function saveRecent(url, type, filePath) {
  const recents = getRecents();
  recents.unshift({ url, type, filePath, date: new Date().toLocaleString() });
  if (recents.length > 20) recents.pop();
  localStorage.setItem('yt-recents', JSON.stringify(recents));
  renderRecents();
}

function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function renderRecents() {
  const list = document.getElementById('recents-list');
  list.innerHTML = '';
  const recents = getRecents();
  
  if (recents.length === 0) {
    list.innerHTML = '<li style="color: var(--muted-foreground); text-align: center; padding: 2rem;">No recent downloads.</li>';
    return;
  }
  
  recents.forEach(item => {
    const li = document.createElement('li');
    li.className = 'recent-item';
    
    const videoId = extractVideoId(item.url);
    const isInstagram = item.url.includes('instagram.com') || item.url.includes('instagr.am') || item.type.startsWith('ig-');
    
    let thumbnailHtml = '';
    if (videoId) {
      thumbnailHtml = `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Thumbnail" class="recent-thumbnail" style="cursor: pointer;" title="Click to open folder">`;
    } else if (isInstagram) {
      thumbnailHtml = `<div class="recent-thumbnail" style="cursor: pointer; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: white; border: none;" title="Click to open folder">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
      </div>`;
    } else {
      thumbnailHtml = `<div class="recent-thumbnail" style="cursor: pointer;" title="Click to open folder"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>`;
    }
    
    li.innerHTML = `
      ${thumbnailHtml}
      <div class="recent-details">
        <a href="${item.url}" target="_blank" class="recent-url" title="${item.url}">${item.url}</a>
        <div class="recent-meta">
          <span class="badge">${item.type.toUpperCase()}</span>
          <span>${item.date}</span>
        </div>
      </div>
    `;

    const thumbEl = li.querySelector('.recent-thumbnail');
    if (thumbEl && item.filePath) {
      thumbEl.addEventListener('click', () => {
        window.electronAPI.openFolder(item.filePath);
      });
    }

    list.appendChild(li);
  });
}

// Initial render
renderRecents();

// Settings Variables and State
let currentSettings = {};
let selectedAccent = 'default';

// Success Sound Synthesizer
function playSuccessChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // First tone (C5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);
    
    // Second tone (E5, delayed by 0.1s)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); 
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    
    osc2.start(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 0.5);
  } catch (err) {
    console.error('Failed to play success chime:', err);
  }
}

// Apply Theme
function applyTheme(accent) {
  document.documentElement.setAttribute('data-theme', accent || 'default');
}

// Theme Picker Interactions
document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedAccent = btn.dataset.theme;
    
    // Instant live preview
    applyTheme(selectedAccent);
  });
});

// Select folder browser
document.getElementById('btn-select-dir').addEventListener('click', async () => {
  const dirPath = await window.electronAPI.selectFolder();
  if (dirPath) {
    document.getElementById('settings-save-dir').value = dirPath;
  }
});

// Reset folder browser to default
document.getElementById('btn-reset-dir').addEventListener('click', () => {
  document.getElementById('settings-save-dir').value = '';
});

// Save settings handler
document.getElementById('btn-save-settings').addEventListener('click', async () => {
  const newSettings = {
    downloadDir: document.getElementById('settings-save-dir').value,
    defaultQuality: document.getElementById('settings-default-quality').value,
    defaultSubLang: document.getElementById('settings-default-sublang').value,
    videoFormat: document.getElementById('settings-video-format').value,
    audioFormat: document.getElementById('settings-audio-format').value,
    accentColor: selectedAccent,
    soundEnabled: document.getElementById('settings-sound-enabled').checked,
    autoOpenFolder: document.getElementById('settings-auto-open').checked
  };

  const success = await window.electronAPI.saveSettings(newSettings);
  if (success) {
    currentSettings = newSettings;
    
    // Instantly update copywriting descriptions
    updateTabDescriptions(currentSettings);
    
    // Instantly update main panel options
    if (document.getElementById('video-quality')) {
      document.getElementById('video-quality').value = currentSettings.defaultQuality || '1080';
    }
    if (document.getElementById('subs-lang')) {
      document.getElementById('subs-lang').value = currentSettings.defaultSubLang || 'en';
    }

    // Display nice animated visual feedback
    const indicator = document.getElementById('settings-save-indicator');
    indicator.style.display = 'inline-flex';
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }
});

// Dynamically update video/audio tab descriptions based on current format settings
function updateTabDescriptions(settings) {
  const videoFormat = settings.videoFormat || 'mp4';
  const audioFormat = settings.audioFormat || 'mp3';

  const videoDescEl = document.getElementById('video-card-desc');
  if (videoDescEl) {
    if (videoFormat === 'mp4') {
      videoDescEl.textContent = 'Downloads MP4 (H.264 / AAC) format specifically optimized for AE/PR compatibility.';
    } else if (videoFormat === 'mkv') {
      videoDescEl.textContent = 'Downloads MKV (Matroska) container optimized for best quality archiving.';
    } else if (videoFormat === 'webm') {
      videoDescEl.textContent = 'Downloads WebM (VP9/AV1 / Opus) format optimized for high efficiency web delivery.';
    }
  }

  const audioDescEl = document.getElementById('audio-card-desc');
  if (audioDescEl) {
    if (audioFormat === 'mp3') {
      audioDescEl.textContent = 'Extracts high-quality audio as MP3 (320kbps Level 0 VBR).';
    } else if (audioFormat === 'm4a') {
      audioDescEl.textContent = 'Extracts highly efficient web-standard audio as M4A (AAC codec).';
    } else if (audioFormat === 'wav') {
      audioDescEl.textContent = 'Extracts uncompressed studio-grade lossless audio as WAV (24-bit PCM).';
    } else if (audioFormat === 'flac') {
      audioDescEl.textContent = 'Extracts high-fidelity compressed lossless audio as FLAC.';
    }
  }
}

// Load settings on startup
async function initSettingsUI() {
  try {
    currentSettings = await window.electronAPI.getSettings();
    selectedAccent = currentSettings.accentColor || 'default';
    
    applyTheme(selectedAccent);
    
    document.getElementById('settings-save-dir').value = currentSettings.downloadDir || '';
    document.getElementById('settings-default-quality').value = currentSettings.defaultQuality || '1080';
    document.getElementById('settings-default-sublang').value = currentSettings.defaultSubLang || 'en';
    document.getElementById('settings-video-format').value = currentSettings.videoFormat || 'mp4';
    document.getElementById('settings-audio-format').value = currentSettings.audioFormat || 'mp3';
    document.getElementById('settings-sound-enabled').checked = !!currentSettings.soundEnabled;
    document.getElementById('settings-auto-open').checked = !!currentSettings.autoOpenFolder;
    
    // Instantly update copywriting descriptions based on loaded settings
    updateTabDescriptions(currentSettings);
    
    document.querySelectorAll('.theme-option').forEach(btn => {
      if (btn.dataset.theme === selectedAccent) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Populate main panel dropdowns on startup
    if (document.getElementById('video-quality')) {
      document.getElementById('video-quality').value = currentSettings.defaultQuality || '1080';
    }
    if (document.getElementById('subs-lang')) {
      document.getElementById('subs-lang').value = currentSettings.defaultSubLang || 'en';
    }
  } catch (err) {
    console.error('Failed to init settings UI:', err);
  }
}

// Run settings loader
initSettingsUI();

// Open Video / Audio save location buttons in Recents
const openVideoDirBtn = document.getElementById('btn-open-video-dir');
const openAudioDirBtn = document.getElementById('btn-open-audio-dir');

if (openVideoDirBtn) {
  openVideoDirBtn.addEventListener('click', () => {
    window.electronAPI.openDownloadFolder('video');
  });
}

if (openAudioDirBtn) {
  openAudioDirBtn.addEventListener('click', () => {
    window.electronAPI.openDownloadFolder('audio');
  });
}

const openInstagramDirBtn = document.getElementById('btn-open-instagram-dir');
if (openInstagramDirBtn) {
  openInstagramDirBtn.addEventListener('click', () => {
    window.electronAPI.openDownloadFolder('instagram');
  });
}

// Drag-to-Resize Status Terminal
const terminalResizer = document.getElementById('terminal-resizer');
const statusTerminalEl = document.querySelector('.status-terminal');

if (terminalResizer && statusTerminalEl) {
  terminalResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleTerminalResize);
    document.addEventListener('mouseup', stopTerminalResize);
    statusTerminalEl.classList.add('resizing');
  });

  function handleTerminalResize(e) {
    const rect = statusTerminalEl.getBoundingClientRect();
    // Calculate new height from cursor position to bottom of the element
    const newHeight = rect.bottom - e.clientY;
    
    // Enforce min/max height limits for usability
    if (newHeight >= 100 && newHeight <= 450) {
      statusTerminalEl.style.height = `${newHeight}px`;
    }
  }

  function stopTerminalResize() {
    document.removeEventListener('mousemove', handleTerminalResize);
    document.removeEventListener('mouseup', stopTerminalResize);
    statusTerminalEl.classList.remove('resizing');
  }
}

// Dependency installer IPC listener
const depModal = document.getElementById('dependency-modal');
const depValYt = document.getElementById('dep-val-yt');
const depValFfmpeg = document.getElementById('dep-val-ffmpeg');
const depStatusYt = document.getElementById('dep-status-yt');
const depStatusFfmpeg = document.getElementById('dep-status-ffmpeg');
const depProgressContainer = document.getElementById('dependency-progress-container');
const depProgressText = document.getElementById('dep-progress-text');
const depProgressPercent = document.getElementById('dep-progress-percent');
const depProgressFill = document.getElementById('dep-progress-fill');

if (depModal) {
  window.electronAPI.onDependencyStatus((data) => {
    switch (data.type) {
      case 'checking':
        depModal.classList.add('active');
        if (depValYt) depValYt.textContent = 'Verifying...';
        if (depValFfmpeg) depValFfmpeg.textContent = 'Verifying...';
        break;

      case 'init':
        depModal.classList.add('active');
        
        // Update states based on what needs download
        if (data.needYtDlp) {
          if (depStatusYt) {
            depStatusYt.className = 'dependency-status-item downloading';
          }
          if (depValYt) depValYt.textContent = 'Awaiting download...';
        } else {
          if (depStatusYt) {
            depStatusYt.className = 'dependency-status-item completed';
          }
          if (depValYt) depValYt.textContent = 'Ready';
        }

        if (data.needFfmpeg) {
          if (depStatusFfmpeg) {
            depStatusFfmpeg.className = 'dependency-status-item downloading';
          }
          if (depValFfmpeg) depValFfmpeg.textContent = 'Awaiting download...';
        } else {
          if (depStatusFfmpeg) {
            depStatusFfmpeg.className = 'dependency-status-item completed';
          }
          if (depValFfmpeg) depValFfmpeg.textContent = 'Ready';
        }
        break;

      case 'download-start':
        depModal.classList.add('active');
        if (depProgressContainer) depProgressContainer.style.display = 'block';
        if (depProgressFill) depProgressFill.style.width = '0%';
        if (depProgressPercent) depProgressPercent.textContent = '0%';
        
        if (data.item === 'yt-dlp') {
          if (depStatusYt) depStatusYt.className = 'dependency-status-item downloading';
          if (depValYt) depValYt.textContent = 'Downloading (0%)...';
          if (depProgressText) depProgressText.textContent = 'Downloading yt-dlp core...';
        } else if (data.item === 'ffmpeg') {
          if (depStatusFfmpeg) depStatusFfmpeg.className = 'dependency-status-item downloading';
          if (depValFfmpeg) depValFfmpeg.textContent = 'Downloading (0%)...';
          if (depProgressText) depProgressText.textContent = 'Downloading FFmpeg utilities...';
        }
        break;

      case 'progress':
        if (depProgressFill) depProgressFill.style.width = `${data.progress}%`;
        if (depProgressPercent) depProgressPercent.textContent = `${data.progress}%`;
        
        if (data.item === 'yt-dlp') {
          if (depValYt) depValYt.textContent = `Downloading (${data.progress}%)...`;
        } else if (data.item === 'ffmpeg') {
          if (depValFfmpeg) depValFfmpeg.textContent = `Downloading (${data.progress}%)...`;
        }
        break;

      case 'extracting':
        if (depProgressFill) depProgressFill.style.width = '100%';
        if (depProgressPercent) depProgressPercent.textContent = '100%';
        if (depProgressText) depProgressText.textContent = 'Extracting FFmpeg binaries...';
        if (depStatusFfmpeg) depStatusFfmpeg.className = 'dependency-status-item extracting';
        if (depValFfmpeg) depValFfmpeg.textContent = 'Extracting...';
        break;

      case 'download-complete':
        if (data.item === 'yt-dlp') {
          if (depStatusYt) depStatusYt.className = 'dependency-status-item completed';
          if (depValYt) depValYt.textContent = 'Completed';
        } else if (data.item === 'ffmpeg') {
          if (depStatusFfmpeg) depStatusFfmpeg.className = 'dependency-status-item completed';
          if (depValFfmpeg) depValFfmpeg.textContent = 'Completed';
        }
        break;

      case 'all-ready':
        if (depProgressText) depProgressText.textContent = 'Dependencies loaded. Launching...';
        if (depProgressFill) depProgressFill.style.width = '100%';
        if (depProgressPercent) depProgressPercent.textContent = '100%';
        
        // Final transition: remove active class to fade out the modal
        setTimeout(() => {
          depModal.classList.remove('active');
          if (depProgressContainer) depProgressContainer.style.display = 'none';
        }, 1200);
        break;

      case 'error':
        if (depProgressText) depProgressText.textContent = 'Setup Error!';
        if (depProgressPercent) depProgressPercent.textContent = 'Fail';
        
        if (depStatusYt && depStatusYt.classList.contains('downloading')) {
          depStatusYt.className = 'dependency-status-item error';
          if (depValYt) depValYt.textContent = 'Download failed';
        }
        if (depStatusFfmpeg && depStatusFfmpeg.classList.contains('downloading')) {
          depStatusFfmpeg.className = 'dependency-status-item error';
          if (depValFfmpeg) depValFfmpeg.textContent = 'Download failed';
        }
        
        alert(`Failed to configure dependencies:\n${data.message}\n\nPlease check your internet connection or install them manually.`);
        break;
    }
  });
}
