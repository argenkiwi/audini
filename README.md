<p align="center">
  <img src="images/icon128.png" width="128" height="128" alt="Audini Logo">
</p>

# Audini

Audini is a Chrome extension that automatically detects audio files on the web pages you visit, allowing you to curate and play your own custom playlist directly in your browser.

## Features

- **Automatic Detection**: Scans pages for common audio formats (`.mp3`, `.wav`, `.ogg`, `.aac`, `.flac`, `.m4a`, `.opus`).
- **Dynamic Monitoring**: Uses `MutationObserver` to find audio links added dynamically by modern web apps.
- **Integrated Player**: A dedicated player interface to listen to your discovered tracks.
- **Playlist Management**:
  - **Reorder**: Drag-and-drop tracks to organize your queue.
  - **Persistent State**: Automatically saves your current track, playback position, and volume.
  - **Import/Export**: Support for `.m3u` playlist files.
- **Specialized Support**: Advanced resolving for sites like KHInsider to get direct audio links.

## Installation

### Prerequisites
- [Yarn](https://yarnpkg.com/getting-started/install) (v4+)

### Development Setup
1. Clone this repository.
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Build the player bundle:
   ```bash
   yarn build
   ```
4. Load the extension in Chrome:
   - Navigate to `chrome://extensions`.
   - Enable **Developer mode** (top right toggle).
   - Click **Load unpacked** and select the root directory of this project.

## Usage

1. **Pin the extension**: Click the puzzle icon in Chrome and pin Audini for easy access.
2. **Discover Audio**: Visit any site containing audio links (e.g., [vurez.com](https://www.vurez.com)).
3. **Add to Playlist**: Click the Audini icon to see detected links. Use `+` to add specific tracks or **Add All** to grab everything.
4. **Listen**: Click **Open Player** to launch the playlist interface.
5. **Download (Optional)**: If you export your playlist as an `.m3u` file, you can use this [bash script](https://gist.github.com/argenkiwi/cd72182713cdf0e56b46f659bfb10e1e) to download all items into a local directory.

> [!TIP]
> Audini saves your playback position and volume automatically, so you can pick up right where you left off even after closing the player.
