const audioUrlPatterns = [
  ".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a", ".opus"
];

function findAudioUrls() {
  const urls = new Set();

  document.querySelectorAll("a[href]").forEach(el => {
    if (audioUrlPatterns.some(ext => el.href.endsWith(ext))) {
      urls.add(el.href);
    }
  });

  document.querySelectorAll("audio[src], source[src]").forEach(el => {
    if (audioUrlPatterns.some(ext => el.src.endsWith(ext))) {
      urls.add(el.src);
    }
  });

  return Array.from(urls);
}

function sendUrlsToBackground() {
  const audioUrls = findAudioUrls();
  if (audioUrls.length > 0) {
    chrome.runtime.sendMessage({ type: "audioUrls", urls: audioUrls });
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedSendUrlsToBackground = debounce(sendUrlsToBackground, 500);

// Initial scan
sendUrlsToBackground();

// Use MutationObserver to detect dynamically added elements
const observer = new MutationObserver((mutations) => {
  // Only re-scan if nodes were added
  const nodesAdded = mutations.some(mutation => mutation.addedNodes.length > 0);
  if (nodesAdded) {
    debouncedSendUrlsToBackground();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

