import Sortable from 'sortablejs';

document.addEventListener("DOMContentLoaded", () => {
  const audioPlayer = document.getElementById("audio-player");
  const playlistElement = document.getElementById("playlist");
  const currentTrackElement = document.getElementById("current-track");
  const prevTrackButton = document.getElementById("prev-track");
  const nextTrackButton = document.getElementById("next-track");
  const exportPlaylistButton = document.getElementById("export-playlist");
  const importPlaylistInput = document.getElementById("import-playlist");
  const clearPlaylistButton = document.getElementById("clear-playlist");

  let playlist = [];
  let currentTrackIndex = 0;

  async function loadState() {
    const result = await chrome.storage.local.get({
      playlist: [],
      currentTrackIndex: 0,
      currentTime: 0,
      volume: 1
    });
    playlist = result.playlist;
    currentTrackIndex = result.currentTrackIndex;
    renderPlaylist();
    
    if (playlist.length > 0) {
      if (currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0;
      }
      await playTrack(currentTrackIndex, false);
      audioPlayer.currentTime = result.currentTime || 0;
    }
    audioPlayer.volume = result.volume;
  }

  function saveState() {
    chrome.storage.local.set({
      currentTrackIndex,
      currentTime: audioPlayer.currentTime,
      volume: audioPlayer.volume
    });
  }

  // Save state every 5 seconds and when pausing/ending
  setInterval(saveState, 5000);
  audioPlayer.addEventListener("pause", saveState);
  audioPlayer.addEventListener("volumechange", saveState);

  async function playTrack(index, autoPlay = true) {
    if (index >= 0 && index < playlist.length) {
      currentTrackIndex = index;
      let trackUrl = playlist[currentTrackIndex];

      if (trackUrl.startsWith("https://downloads.khinsider.com/game-soundtracks")) {
        const resolvedUrl = await resolveKhinsiderUrl(trackUrl);
        if (resolvedUrl !== trackUrl) {
          playlist[currentTrackIndex] = resolvedUrl;
          trackUrl = resolvedUrl;
          await chrome.storage.local.set({ playlist: playlist });
          renderPlaylist();
        }
      }

      audioPlayer.src = trackUrl;
      if (autoPlay) {
        audioPlayer.play().catch(e => console.error("Playback failed:", e));
      }
    currentTrackElement.textContent = decodeURIComponent(trackUrl).split("/").pop();
    updateActivePlaylistItem(currentTrackIndex);

    saveState();
  } else if (playlist.length > 0) {
    playTrack(0, autoPlay);
  } else {
    currentTrackElement.textContent = "No track selected";
    audioPlayer.pause();
    audioPlayer.src = "";
  }
}

  function renderPlaylist() {
    playlistElement.innerHTML = "";
    
    // Update track count badge
    const trackCountBadge = document.getElementById("track-count-badge");
    if (trackCountBadge) {
      trackCountBadge.textContent = `${playlist.length} ${playlist.length === 1 ? 'track' : 'tracks'}`;
    }

    if (playlist.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.textContent = "Your playlist is empty. Detect and add audio from the extension popup!";
      emptyMessage.classList.add("empty-playlist-message");
      playlistElement.appendChild(emptyMessage);
      return;
    }

    playlist.forEach((track, index) => {
      const decodedTrack = decodeURIComponent(track);
      const listItem = document.createElement("li");

      const dragHandle = document.createElement("span");
      dragHandle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`;
      dragHandle.classList.add("drag-handle");
      dragHandle.title = "Drag to reorder";

      const trackNum = document.createElement("span");
      trackNum.classList.add("track-num");
      trackNum.textContent = index + 1;

      const trackName = document.createElement("span");
      trackName.textContent = decodedTrack.substring(decodedTrack.lastIndexOf('/') + 1);
      trackName.classList.add("track-name");
      trackName.title = decodedTrack;
      trackName.addEventListener("click", () => playTrack(index));

      const removeButton = document.createElement("button");
      removeButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      removeButton.classList.add("remove-button");
      removeButton.title = "Remove from playlist";
      removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeTrack(index);
      });

      listItem.appendChild(dragHandle);
      listItem.appendChild(trackNum);
      listItem.appendChild(trackName);
      listItem.appendChild(removeButton);
      playlistElement.appendChild(listItem);
    });

    updateActivePlaylistItem(currentTrackIndex);
  }



  function playNextTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playTrack(currentTrackIndex);
  }

  function playPrevTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrack(currentTrackIndex);
  }

  async function resolveKhinsiderUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const audioElement = doc.querySelector('audio[src]');
      if (audioElement) {
        return audioElement.src;
      }
    } catch (error) {
      console.error("Error resolving khinsider URL:", error);
    }
    return url;
  }

  function updateActivePlaylistItem(activeIndex) {

    const items = playlistElement.getElementsByTagName("li");
    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle("active", i === activeIndex);
    }
  }

  function exportPlaylist() {
    const m3uContent = "#EXTM3U\n" + playlist.join("\n");
    const blob = new Blob([m3uContent], { type: "audio/x-mpegurl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playlist.m3u";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importPlaylist(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const importedUrls = content.split(/\r?\n/).filter(line => line && !line.startsWith("#"));
        playlist = Array.from(new Set([...playlist, ...importedUrls])); // Merge and deduplicate
        chrome.storage.local.set({ playlist }, () => {
          renderPlaylist();
          if (playlist.length > 0 && audioPlayer.paused) {
            playTrack(0);
          }
        });
      };
      reader.readAsText(file);
    }
  }

  audioPlayer.addEventListener("ended", playNextTrack);
  prevTrackButton.addEventListener("click", playPrevTrack);
  nextTrackButton.addEventListener("click", playNextTrack);
  exportPlaylistButton.addEventListener("click", exportPlaylist);
  importPlaylistInput.addEventListener("change", importPlaylist);
  clearPlaylistButton.addEventListener("click", clearPlaylist);

  loadState();

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.playlist && namespace === 'local') {
      playlist = changes.playlist.newValue;
      renderPlaylist();
    }
  });

  function removeTrack(index) {
    playlist.splice(index, 1);
    chrome.storage.local.set({ playlist }).then(() => {
      if (index === currentTrackIndex) {
        playTrack(currentTrackIndex);
      } else if (index < currentTrackIndex) {
        currentTrackIndex--;
        renderPlaylist();
      } else {
        renderPlaylist();
      }
    });
  }

  function clearPlaylist() {
    playlist = [];
    chrome.storage.local.set({ playlist, currentTrackIndex: 0, currentTime: 0 }).then(() => {
      renderPlaylist();
      currentTrackElement.textContent = "";
      audioPlayer.pause();
      audioPlayer.src = "";
      currentTrackIndex = 0;
    });
  }

  // Initialize Sortable.js
  new Sortable(playlistElement, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: function(evt) {

      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;

      const [movedItem] = playlist.splice(oldIndex, 1);
      playlist.splice(newIndex, 0, movedItem);

      chrome.storage.local.set({ playlist }).then(() => {
        // After reordering, ensure the active track is still correctly highlighted
        // and if the current track was moved, update its index
        if (oldIndex === currentTrackIndex) {
          currentTrackIndex = newIndex;
        } else if (oldIndex < currentTrackIndex && newIndex >= currentTrackIndex) {
          currentTrackIndex--;
        } else if (oldIndex > currentTrackIndex && newIndex <= currentTrackIndex) {
          currentTrackIndex++;
        }
        updateActivePlaylistItem(currentTrackIndex);
      });

    },
  });
});
