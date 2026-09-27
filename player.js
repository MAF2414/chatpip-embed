// ChatPiP embed page: one Twitch or YouTube stream in the platform's official
// player, for the ChatPiP browser extension. The extension frames this page in
// its picture-in-picture window and switches sound or playback through a few
// postMessage commands; the page answers with the player's state. The players
// are driven only through their documented APIs (Twitch.Player, YouTube IFrame
// Player API). Nothing is stored and nothing is tracked here.
(() => {
  "use strict";

  // Only a ChatPiP window opened from one of these pages may steer the player.
  const PARENTS = ["https://www.twitch.tv", "https://www.youtube.com"];
  const params = new URLSearchParams(location.search);
  const platform = params.get("platform");
  const parentOrigin = (location.ancestorOrigins && location.ancestorOrigins[0]) || "";
  const trusted = window.parent !== window && PARENTS.includes(parentOrigin);
  const holder = document.getElementById("player");
  const state = { error: "", muted: true, playing: false, ready: false };
  let controls = null;

  function report(patch) {
    Object.assign(state, patch);
    if (trusted) window.parent.postMessage({ chatpip: 1, state: { ...state } }, parentOrigin);
  }

  function fail(error, text) {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = text;
    holder.replaceChildren(note);
    report({ error });
  }

  function load(src) {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.onerror = () => fail("unavailable", "The player could not be loaded.");
    document.head.append(script);
    return script;
  }

  function sync() {
    if (controls) report({ muted: controls.muted(), playing: controls.playing() });
  }

  window.addEventListener("message", event => {
    if (!trusted || !controls || event.source !== window.parent || event.origin !== parentOrigin) return;
    const command = event.data && event.data.chatpip === 1 ? event.data.command : "";
    if (command === "mute") controls.mute(true);
    else if (command === "unmute") controls.mute(false);
    else if (command === "play") controls.play();
    else if (command === "pause") controls.pause();
    else return;
    setTimeout(sync, 250);
  });

  // The player's own buttons change the sound without telling anyone; a slow
  // poll keeps the window's idea of which stream is audible truthful.
  setInterval(sync, 1000);

  if (platform === "twitch") {
    const channel = String(params.get("channel") || "").toLowerCase();
    if (!/^[a-z0-9_]{1,30}$/.test(channel)) {
      fail("unavailable", "Unknown channel.");
      return;
    }
    load("https://player.twitch.tv/js/embed/v1.js").onload = () => {
      const Player = window.Twitch.Player;
      const player = new Player("player", {
        autoplay: true,
        channel,
        height: "100%",
        muted: true,
        parent: [location.hostname],
        width: "100%"
      });
      controls = {
        mute(value) {
          player.setMuted(value);
          if (!value) player.setVolume(1);
        },
        muted: () => player.getMuted(),
        pause: () => player.pause(),
        play: () => player.play(),
        playing: () => !player.isPaused()
      };
      player.addEventListener(Player.READY, () => report({ ready: true }));
      player.addEventListener(Player.PLAYING, sync);
      player.addEventListener(Player.PAUSE, sync);
      player.addEventListener(Player.OFFLINE, () => report({ error: "offline" }));
      player.addEventListener(Player.ONLINE, () => report({ error: "" }));
    };
  } else if (platform === "youtube") {
    const video = String(params.get("v") || "");
    if (!/^[\w-]{11}$/.test(video)) {
      fail("unavailable", "Unknown video.");
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      const player = new window.YT.Player("player", {
        events: {
          // 101 and 150: the owner does not allow the video to be embedded.
          onError: event => report({ error: event.data === 101 || event.data === 150 ? "not-embeddable" : "unavailable" }),
          onReady: () => {
            controls = {
              mute(value) {
                if (value) player.mute();
                else {
                  player.unMute();
                  player.setVolume(100);
                }
              },
              muted: () => player.isMuted(),
              pause: () => player.pauseVideo(),
              play: () => player.playVideo(),
              playing: () => player.getPlayerState() === window.YT.PlayerState.PLAYING
            };
            report({ ready: true });
            sync();
          },
          onStateChange: sync
        },
        height: "100%",
        playerVars: { autoplay: 1, mute: 1, origin: location.origin, playsinline: 1 },
        videoId: video,
        width: "100%"
      });
    };
    load("https://www.youtube.com/iframe_api");
  } else {
    fail("unavailable", "Nothing to show.");
  }
})();
