# audini
A Chrome Extension that finds audio in the pages you visit and lets you add them to a playlist.
## Installation
- If you haven't already, install [Yarn](https://yarnpkg.com/getting-started/install).
- Run `yarn install`.
- Run `yarn build`.
- In you browser, go to `chrome://extensions`.
- If you haven't already, enable _Developer mode_.
- Press the _Load unpacked_ button and select the root folder of this project.

## Instructions
- Click on the extensions and icon and pin Audini.
- Visit a site which contains links to audio files (e.g. [vurez.com](https://www.vurez.com)).
- Click on Audini's icon and _Add All_ or some (`+`) of the items to the playlist.
- Click on the _Open Player_ button.

If you exprort the playlist as an m3u file, you can use this handy [bash script](https://gist.github.com/argenkiwi/cd72182713cdf0e56b46f659bfb10e1e) to download all items into an output directory of your choosing.
