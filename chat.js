// ChatPiP embed page: a YouTube live chat for the ChatPiP browser extension.
// YouTube only serves an embedded live chat to the domain named in
// embed_domain, which has to be the page that frames it — this one.
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const video = String(params.get("v") || "");
  const holder = document.getElementById("player");
  if (params.get("platform") !== "youtube" || !/^[\w-]{11}$/.test(video)) {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "Nothing to show.";
    holder.replaceChildren(note);
    return;
  }
  const frame = document.createElement("iframe");
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.title = "YouTube live chat";
  frame.src = `https://www.youtube.com/live_chat?v=${video}&embed_domain=${location.hostname}&dark_theme=1`;
  holder.replaceChildren(frame);
})();
