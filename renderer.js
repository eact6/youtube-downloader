// Tab switching logic
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Download Video
document.getElementById('btn-download-video').addEventListener('click', () => {
  const url = document.getElementById('video-url').value;
  const quality = document.getElementById('video-quality').value;
  if (!url) return;
  window.electronAPI.downloadVideo({ url, quality });
  document.getElementById('video-url').value = '';
});

// Download Audio
document.getElementById('btn-download-audio').addEventListener('click', () => {
  const url = document.getElementById('audio-url').value;
  if (!url) return;
  window.electronAPI.downloadAudio({ url });
  document.getElementById('audio-url').value = '';
});

// Download Subtitles
document.getElementById('btn-download-subs').addEventListener('click', () => {
  const url = document.getElementById('subs-url').value;
  const lang = document.getElementById('subs-lang').value;
  if (!url) return;
  window.electronAPI.downloadSubtitles({ url, lang });
  document.getElementById('subs-url').value = '';
});

// Download All Subtitles
document.getElementById('btn-download-all-subs').addEventListener('click', () => {
  const url = document.getElementById('subs-url').value;
  if (!url) return;
  // pass lang as 'all' to indicate downloading all subs
  window.electronAPI.downloadSubtitles({ url, lang: 'all' });
  document.getElementById('subs-url').value = '';
});

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
});

window.electronAPI.onDownloadComplete((data) => {
  appendLog(`[✓] Download Complete: ${data.url} (${data.type})`, 'log-success');
  saveRecent(data.url, data.type);
});

// Recents Logic
function getRecents() {
  const recents = localStorage.getItem('yt-recents');
  return recents ? JSON.parse(recents) : [];
}

function saveRecent(url, type) {
  const recents = getRecents();
  recents.unshift({ url, type, date: new Date().toLocaleString() });
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
    const thumbnailHtml = videoId 
      ? `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Thumbnail" class="recent-thumbnail">`
      : `<div class="recent-thumbnail"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>`;
    
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
    list.appendChild(li);
  });
}

// Initial render
renderRecents();
