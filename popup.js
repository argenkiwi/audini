document.addEventListener("DOMContentLoaded", () => {
  const openPlaylistButton = document.getElementById("open-playlist");
  openPlaylistButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "openPlaylist" });
  });

  const addAllButton = document.getElementById("add-all");
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
      } else {
        const noAudioMessage = document.createElement("p");
        noAudioMessage.textContent = "No audio files detected on this page.";
        audioList.parentElement.replaceChild(noAudioMessage, audioList);
        addAllButton.style.display = "none"; // Hide Add All button if no URLs
      }
    });
  });
});
