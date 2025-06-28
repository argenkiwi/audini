let playerTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "audioUrls") {
    const tabId = sender.tab.id;
    chrome.storage.local.get({ audioUrls: {} }, (result) => {
      const audioUrls = result.audioUrls;
      const existingUrls = new Set(audioUrls[tabId] || []);
      message.urls.forEach(url => existingUrls.add(url));
      audioUrls[tabId] = Array.from(existingUrls);
      chrome.storage.local.set({ audioUrls }, () => {
        updateBadge(tabId);
      });
    });
  } else if (message.type === "addToPlaylist") {
    addToPlaylist(message.url);
  } else if (message.type === "openPlaylist") {
    openPlayer();
  }
});

function openPlayer() {
  if (playerTabId) {
    chrome.tabs.get(playerTabId, (tab) => {
      if (tab) {
        chrome.tabs.update(playerTabId, { active: true });
      } else {
        createPlayerTab();
      }
    });
  } else {
    createPlayerTab();
  }
}

function createPlayerTab() {
  chrome.tabs.create({ url: chrome.runtime.getURL("player.html") }, (tab) => {
    playerTabId = tab.id;
  });
}

function addToPlaylist(url) {
  chrome.storage.local.get({ playlist: [] }, (result) => {
    let playlist = result.playlist;
    const count = playlist.length;
    if (Array.isArray(url)) {
      let uniqueSet = new Set(playlist);
      url.forEach(item => uniqueSet.add(item));
      playlist = [...uniqueSet];
    } else if (!playlist.includes(url)) {
      playlist.push(url);
    }

    if (playlist.length > count) {
      chrome.storage.local.set({ playlist });
    }
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === playerTabId) {
    playerTabId = null;
  }
  chrome.storage.local.get({ audioUrls: {} }, (result) => {
    const audioUrls = result.audioUrls;
    delete audioUrls[tabId];
    chrome.storage.local.set({ audioUrls });
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateBadge(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.storage.local.get({ audioUrls: {} }, (result) => {
      const audioUrls = result.audioUrls;
      if (audioUrls[tabId]) {
        delete audioUrls[tabId];
        chrome.storage.local.set({ audioUrls }, () => {
          updateBadge(tabId);
        });
      }
    });
  }
});

function updateBadge(tabId) {
  chrome.storage.local.get({ audioUrls: {} }, (result) => {
    const count = result.audioUrls[tabId] ? result.audioUrls[tabId].length : 0;
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#007bff", tabId });
  });
}
