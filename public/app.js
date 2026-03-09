document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('crawl-form');
  const btnLaunch = document.getElementById('btn-launch');
  const btnStop = document.getElementById('btn-stop');
  const consoleOutput = document.getElementById('console-output');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  
  const statsOverlay = document.getElementById('stats-overlay');
  const btnReset = document.getElementById('btn-reset');
  const statVisited = document.getElementById('stat-visited');
  const statSuccess = document.getElementById('stat-success');
  const statFailed = document.getElementById('stat-failed');
  const statTime = document.getElementById('stat-time');
  const statInventoryFile = document.getElementById('stat-inventory-file');

  const liveStats = document.getElementById('live-stats');
  const liveTime = document.getElementById('live-time');
  const liveVisited = document.getElementById('live-visited');
  const liveSuccess = document.getElementById('live-success');
  const liveErrors = document.getElementById('live-errors');

  let activeEventSource = null;
  let activeJobId = null;

  function setStatus(status, text) {
    statusIndicator.className = 'status-indicator ' + status;
    statusText.textContent = text;
  }

  function appendLog(type, message, nodeId = null) {
    const span = document.createElement('span');
    span.className = `log-line ${type}`;
    span.textContent = message;
    if (nodeId) span.id = nodeId;
    consoleOutput.appendChild(span);
    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  function updateLog(nodeId, type, appendMessage) {
    if (!nodeId) return appendLog(type, appendMessage);
    const existingSpan = document.getElementById(nodeId);
    if (existingSpan) {
      const appendSpan = document.createElement('span');
      appendSpan.className = `log-append ${type}`; // Use a dedicated class for appended text if needed, or just rely on color
      appendSpan.textContent = appendMessage;
      
      // We'll apply some contextual styling based on type directly here
      if (type === 'done') {
        appendSpan.style.color = 'var(--success)';
        appendSpan.style.fontWeight = 'bold';
      } else if (type === 'error') {
        appendSpan.style.color = 'var(--error)';
        appendSpan.style.fontWeight = 'bold';
      }
      
      existingSpan.appendChild(appendSpan);
    } else {
      appendLog(type, appendMessage);
    }
  }

  function startListening(id) {
    activeJobId = id;
    localStorage.setItem('activeJobId', id);
    activeEventSource = new EventSource(`/api/stream/${id}`);

    activeEventSource.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.stats) {
        requestAnimationFrame(() => {
          if (liveTime) liveTime.textContent = (msg.stats.duration_sec || 0).toFixed(1) + 's';
          if (liveVisited) liveVisited.textContent = msg.stats.pages_visited || 0;
          if (liveSuccess) liveSuccess.textContent = msg.stats.pages_success || 0;
          if (liveErrors) liveErrors.textContent = msg.stats.pages_failed || 0;
        });
      }

      switch (msg.type) {
        case 'heartbeat':
          // Already updated stats above
          break;
        case 'progress':
          appendLog('progress', msg.message, msg.nodeId);
          break;
        case 'redirect':
          appendLog('redirect', msg.message);
          break;
        case 'success':
          updateLog(msg.nodeId, 'done', msg.message); // Verdes appending
          break;
        case 'page_error':
          updateLog(msg.nodeId, 'error', msg.message); // Rojos appending
          break;
        case 'done':
          appendLog('done', msg.message);
          finishCrawl(msg.stats, 'completed');
          break;
        case 'fatal_error':
          appendLog('error', msg.message);
          finishCrawl(null, 'failed');
          break;
        default:
          appendLog('info', JSON.stringify(msg));
      }
    };

    activeEventSource.onerror = () => {
      activeEventSource.close();
      if (statusText.textContent === 'Running') {
         setStatus('failed', 'Connection lost');
         btnLaunch.disabled = false;
         btnLaunch.textContent = 'Launch Crawler';
         btnStop.style.display = 'none';
      }
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset UI for new crawl
    consoleOutput.innerHTML = '';
    statsOverlay.style.display = 'none';
    liveStats.style.display = 'flex';
    liveTime.textContent = '0.0s';
    liveVisited.textContent = '0';
    liveSuccess.textContent = '0';
    liveErrors.textContent = '0';
    btnLaunch.disabled = true;
    btnLaunch.textContent = 'Crawling...';
    btnStop.style.display = 'block';
    btnStop.disabled = false;
    setStatus('running', 'Running');
    
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start crawler');
      }

      // Connect to Server-Sent Events to receive real-time updates
      startListening(data.id);

    } catch (err) {
      appendLog('error', err.message);
      setStatus('failed', 'Error');
      btnLaunch.disabled = false;
      btnLaunch.textContent = 'Launch Crawler';
      btnStop.style.display = 'none';
    }
  });

  function finishCrawl(stats, finalStatus) {
    if (activeEventSource) {
      activeEventSource.close();
    }
    
    activeJobId = null;
    localStorage.removeItem('activeJobId');
    btnLaunch.disabled = false;
    btnLaunch.textContent = 'Launch Crawler';
    btnStop.style.display = 'none';
    
    if (finalStatus === 'completed' && stats) {
      setStatus('completed', 'Finished');
      
      // Populate stats in the overlay
      statVisited.textContent = stats.pages_visited || 0;
      statSuccess.textContent = stats.pages_success || 0;
      statFailed.textContent = stats.pages_failed || 0;
      statTime.textContent = (stats.duration_sec || 0).toFixed(2);
      statInventoryFile.textContent = `CSV saved at: ${stats.inventoryFile || 'N/A'}`;
      
      // Show stats overlay
      statsOverlay.style.display = 'flex';
    } else {
      setStatus('failed', 'Failed');
    }
  }

  // Reset view to configure another crawl
  btnReset.addEventListener('click', () => {
    statsOverlay.style.display = 'none';
    liveStats.style.display = 'none';
    setStatus('idle', 'Idle');
    consoleOutput.innerHTML = '<span class="log-line info">Ready to start crawling...</span>';
  });

  // Handle Stop Crawl
  btnStop.addEventListener('click', async () => {
    if (!activeJobId) return;
    try {
      btnStop.disabled = true;
      btnStop.textContent = 'Stopping...';
      const res = await fetch(`/api/stop/${activeJobId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to stop');
      appendLog('info', 'Solicitado el cese de operaciones. Esperando hilos...');
    } catch (err) {
      console.error(err);
      btnStop.disabled = false;
      btnStop.textContent = 'Stop Crawler';
    }
  });

  // Attempt to recover active job on page refresh
  const savedJobId = localStorage.getItem('activeJobId');
  if (savedJobId) {
    // Check if job is still running remotely
    fetch(`/api/results/${savedJobId}`)
      .then(res => res.json())
      .then(job => {
        if (job && job.status === 'running') {
           // Reconnect UI
           consoleOutput.innerHTML = '';
           appendLog('info', 'Reconectando al crawler en ejecución...');
           statsOverlay.style.display = 'none';
           liveStats.style.display = 'flex';
           btnLaunch.disabled = true;
           btnLaunch.textContent = 'Crawling...';
           btnStop.style.display = 'block';
           btnStop.disabled = false;
           setStatus('running', 'Running');
           startListening(savedJobId);
        } else if (job && job.status !== 'running') {
           // Clear if job was finished while we were away
           localStorage.removeItem('activeJobId');
           if (job.stats) finishCrawl(job.stats, job.status);
        }
      })
      .catch(err => {
         console.warn('Could not recover job', err);
         localStorage.removeItem('activeJobId');
      });
  }
});
