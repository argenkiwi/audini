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

// Initial scan
sendUrlsToBackground();

// Use MutationObserver to detect dynamically added elements
const observer = new MutationObserver(sendUrlsToBackground);
observer.observe(document.body, { childList: true, subtree: true });
