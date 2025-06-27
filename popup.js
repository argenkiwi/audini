document.addEventListener("DOMContentLoaded", () => {
  
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
          link.textContent = url.split("/").pop();
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
          urls.forEach(url => {
            chrome.runtime.sendMessage({ type: "addToPlaylist", url });
          });
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
