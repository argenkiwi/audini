let playerTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "audioUrls") {
    handleAudioUrls(message.urls, sender.tab.id);
  } else if (message.type === "addToPlaylist") {
    addToPlaylist(message.url);
  } else if (message.type === "openPlaylist") {
    openPlayer();
  }
});

async function handleAudioUrls(urls, tabId) {
  const result = await chrome.storage.local.get({ audioUrls: {} });
  const audioUrls = result.audioUrls;
  const existingUrls = new Set(audioUrls[tabId] || []);
  urls.forEach(url => existingUrls.add(url));
  audioUrls[tabId] = Array.from(existingUrls);
  await chrome.storage.local.set({ audioUrls });
  updateBadge(tabId);
}

function createPlayerTab() {
  chrome.tabs.create({ url: chrome.runtime.getURL("player.html") }, (tab) => {
    playerTabId = tab.id;
  });
}

function findPlayer() {
  chrome.tabs.query({ url: chrome.runtime.getURL("player.html") }, (tabs) => {
    if (tabs.length > 0) {
      playerTabId = tabs[0].id;
      chrome.tabs.update(playerTabId, { active: true });
    } else {
      createPlayerTab();
    }
  });
}

function openPlayer() {
  if (playerTabId) {
    chrome.tabs.get(playerTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        findPlayer();
      } else {
        chrome.tabs.update(playerTabId, { active: true });
      }
    });
  } else {
    findPlayer();
  }
}

async function addToPlaylist(url) {
  const result = await chrome.storage.local.get({ playlist: [] });
  let playlist = result.playlist;
  const initialCount = playlist.length;

  if (Array.isArray(url)) {
    const uniqueSet = new Set(playlist);
    url.forEach(item => uniqueSet.add(item));
    playlist = Array.from(uniqueSet);
  } else if (!playlist.includes(url)) {
    playlist.push(url);
  }

  if (playlist.length > initialCount) {
    await chrome.storage.local.set({ playlist });
  }
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === playerTabId) {
    playerTabId = null;
  }
  const result = await chrome.storage.local.get({ audioUrls: {} });
  const audioUrls = result.audioUrls;
  if (audioUrls[tabId]) {
    delete audioUrls[tabId];
    await chrome.storage.local.set({ audioUrls });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateBadge(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    const result = await chrome.storage.local.get({ audioUrls: {} });
    const audioUrls = result.audioUrls;
    if (audioUrls[tabId]) {
      delete audioUrls[tabId];
      await chrome.storage.local.set({ audioUrls });
      updateBadge(tabId);
    }
  }
});

async function updateBadge(tabId) {
  const result = await chrome.storage.local.get({ audioUrls: {} });
  const count = result.audioUrls[tabId] ? result.audioUrls[tabId].length : 0;
  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "", tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#007bff", tabId });
}

