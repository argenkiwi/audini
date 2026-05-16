document.addEventListener("DOMContentLoaded", async () => {
  const openPlaylistButton = document.getElementById("open-playlist");
  openPlaylistButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "openPlaylist" });
  });

  const addAllButton = document.getElementById("add-all");
  const exportPlaylistButton = document.getElementById("export-playlist");
  const audioList = document.getElementById("audio-list");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab.id;

  async function updateUI() {
    const result = await chrome.storage.local.get({ audioUrls: {} });
    const urls = result.audioUrls[tabId] || [];
    audioList.innerHTML = "";

    if (urls.length > 0) {
      urls.forEach((url) => {
        const listItem = document.createElement("li");
        const link = document.createElement("a");
        link.href = url;
        link.textContent = decodeURIComponent(url).split("/").pop();
        link.target = "_blank";
        link.title = url;

        const addButton = document.createElement("button");
        addButton.textContent = "+";
        addButton.addEventListener("click", () => {
          chrome.runtime.sendMessage({ type: "addToPlaylist", url });
        });

        listItem.appendChild(link);
        listItem.appendChild(addButton);
        audioList.appendChild(listItem);
      });

      addAllButton.style.display = "inline-block";
      exportPlaylistButton.style.display = "inline-block";
    } else {
      const noAudioMessage = document.createElement("p");
      noAudioMessage.textContent = "No audio files detected on this page.";
      audioList.appendChild(noAudioMessage);
      addAllButton.style.display = "none";
      exportPlaylistButton.style.display = "none";
    }
    return urls;
  }

  let urls = await updateUI();

  addAllButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "addToPlaylist", url: urls });
  });

  exportPlaylistButton.addEventListener("click", () => {
    const m3uContent = "#EXTM3U\n" + urls.join("\n");
    const blob = new Blob([m3uContent], { type: "audio/x-mpegurl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "detected_audio.m3u";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});


