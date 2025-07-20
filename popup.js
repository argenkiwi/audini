document.addEventListener("DOMContentLoaded", () => {
  const openPlaylistButton = document.getElementById("open-playlist");
  openPlaylistButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "openPlaylist" });
  });

  const addAllButton = document.getElementById("add-all");
  const exportPlaylistButton = document.getElementById("export-playlist");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.storage.local.get({ audioUrls: {} }, (result) => {
      const audioList = document.getElementById("audio-list");
      const urls = result.audioUrls[tabId] || [];
      if (urls.length > 0) {
        urls.forEach((url) => {
          const listItem = document.createElement("li");
          const link = document.createElement("a");
          link.href = url;
          link.textContent = decodeURI(url).split("/").pop();
          link.target = "_blank";

          const addButton = document.createElement("button");
          addButton.textContent = "+";
          addButton.addEventListener("click", () => {
            chrome.runtime.sendMessage({ type: "addToPlaylist", url });
          });

          listItem.appendChild(link);
          listItem.appendChild(addButton);
          audioList.appendChild(listItem);
        });

        addAllButton.addEventListener("click", () => {
          chrome.runtime.sendMessage({ type: "addToPlaylist", url: urls });
        });

        exportPlaylistButton.addEventListener("click", () => {
          const m3uContent = "#EXTM3U\n" + urls.join("\n");
          const blob = new Blob([m3uContent], { type: "audio/x-mpegurl" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "playlist.m3u";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

      } else {
        const noAudioMessage = document.createElement("p");
        noAudioMessage.textContent = "No audio files detected on this page.";
        audioList.parentElement.replaceChild(noAudioMessage, audioList);
        addAllButton.style.display = "none";
        exportPlaylistButton.style.display = "none";
      }
    });
  });
});
