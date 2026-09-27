# ChatPiP embed pages

Static pages that the ChatPiP browser extension frames in its picture-in-picture window to show
additional streams with the platforms' official embedded players:

- `player.html?platform=twitch&channel=<login>`: Twitch, through `Twitch.Player` (`player.twitch.tv/js/embed/v1.js`).
- `player.html?platform=youtube&v=<videoId>`: YouTube, through the YouTube IFrame Player API.
- `chat.html?platform=youtube&v=<videoId>`: a YouTube live chat (`embed_domain` is this site).

## Messages

Only a window whose origin is `https://www.twitch.tv` or `https://www.youtube.com` and that is this
page's direct parent can steer the player:

- to the page: `{ chatpip: 1, command: "mute" | "unmute" | "play" | "pause" }`
- from the page: `{ chatpip: 1, state: { ready, playing, muted, error } }`, where `error` is `""`,
  `"offline"`, `"not-embeddable"` or `"unavailable"`.

The pages set no cookies, store nothing and send nothing anywhere but to the parent window.
