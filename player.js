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

  function renderPlaylist() {
    playlistElement.innerHTML = "";
    playlist.map(track => decodeURI(track)).forEach((track, index) => {
      const listItem = document.createElement("li");

      const trackName = document.createElement("span");
      trackName.textContent = track.substring(track.lastIndexOf('/') + 1);
      trackName.addEventListener("click", () => playTrack(index));

      const removeButton = document.createElement("button");
      removeButton.textContent = "x";
      removeButton.classList.add("remove-button");
      removeButton.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent playing the track when clicking remove
        removeTrack(index);
      });

      listItem.appendChild(trackName);
      listItem.appendChild(removeButton);
      playlistElement.appendChild(listItem);
    });

    updateActivePlaylistItem(currentTrackIndex);
  }

  function playTrack(index) {
    if (index >= 0 && index < playlist.length) {
      currentTrackIndex = index;
      const trackUrl = playlist[currentTrackIndex];
      audioPlayer.src = trackUrl;
      audioPlayer.play();
      currentTrackElement.textContent = decodeURI(trackUrl).split("/").pop();
      updateActivePlaylistItem(currentTrackIndex);
    } else if (playlist.length > 0) {
      // If current track is removed and playlist is not empty, play the first track
      playTrack(0);
    } else {
      // If playlist is empty, clear current track display and pause player
      currentTrackElement.textContent = "";
      audioPlayer.pause();
      audioPlayer.src = "";
    }
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

  function removeTrack(index) {
    playlist.splice(index, 1);
    chrome.storage.local.set({ playlist }, () => {
      if (index === currentTrackIndex) {
        // If the current track was removed, play the next one or clear if playlist is empty
        playTrack(currentTrackIndex);
      } else if (index < currentTrackIndex) {
        // If a track before the current one was removed, adjust currentTrackIndex
        currentTrackIndex--;
        renderPlaylist(); // Re-render to update active item index
      } else {
        renderPlaylist();
      }
    });
  }

  function clearPlaylist() {
    playlist = [];
    chrome.storage.local.set({ playlist }, () => {
      renderPlaylist();
      currentTrackElement.textContent = "";
      audioPlayer.pause();
      audioPlayer.src = "";
      currentTrackIndex = 0;
    });
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

  chrome.storage.local.get({ playlist: [] }, (result) => {
    playlist = result.playlist;
    renderPlaylist();
    if (playlist.length > 0) {
      playTrack(0);
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.playlist) {
      playlist = changes.playlist.newValue;
      renderPlaylist();
    }
  });

  // Initialize Sortable.js
  new Sortable(playlistElement, {
    animation: 150,
    onEnd: function(evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;

      const [movedItem] = playlist.splice(oldIndex, 1);
      playlist.splice(newIndex, 0, movedItem);

      chrome.storage.local.set({ playlist }, () => {
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
