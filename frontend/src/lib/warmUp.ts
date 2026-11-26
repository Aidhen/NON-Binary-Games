import { backendUrl } from "./backendUrl";

let warmedUp = false;

// On a free hosting plan the server sleeps after a while. Any request wakes it up, so the home page
// sends one in the background: the server is already starting while the player reads the page.
// "no-cors" is enough because the response is never read (even a 404 wakes the server).
export const warmUpServer = () => {
  if (warmedUp) return;
  warmedUp = true;

  const url = backendUrl();
  fetch(`${url}/healthz`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
};
