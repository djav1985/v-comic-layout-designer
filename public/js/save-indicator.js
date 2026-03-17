import { state } from "./state.js";

function createSaveIndicator() {
  if (!state.saveIndicator) {
    const indicator = document.createElement("div");
    indicator.id = "saveIndicator";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-live", "polite");
    indicator.setAttribute("aria-atomic", "true");
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      font-size: 14px;
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(indicator);
    state.saveIndicator = indicator;
  }
  return state.saveIndicator;
}

export function createLiveRegion() {
  if (!state.liveRegion) {
    const region = document.createElement("div");
    region.id = "ariaLiveRegion";
    region.setAttribute("role", "alert");
    region.setAttribute("aria-live", "assertive");
    region.setAttribute("aria-atomic", "true");
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(region);
    state.liveRegion = region;
  }
  return state.liveRegion;
}

function announceToScreenReader(message) {
  const region = createLiveRegion();
  region.textContent = "";
  // Brief delay so screen readers detect the change
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

export function createSyncHealthIndicator() {
  if (!state.syncHealthEl) {
    const el = document.createElement("div");
    el.id = "syncHealth";
    el.className = "sync-health";
    el.setAttribute("aria-label", "Sync status");
    el.setAttribute("title", "Sync status");
    el.innerHTML = `<span class="sync-dot" aria-hidden="true"></span><span class="sync-label">Not synced</span>`;
    document.body.appendChild(el);
    state.syncHealthEl = el;
  }
  return state.syncHealthEl;
}

export function updateSyncHealth(connected) {
  state.streamConnected = connected;
  const el = createSyncHealthIndicator();
  const label = el.querySelector(".sync-label");

  el.classList.toggle("sync-connected", connected);
  el.classList.toggle("sync-disconnected", !connected);

  if (connected && state.lastSyncedAt) {
    const d = new Date(state.lastSyncedAt);
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    label.textContent = `Synced ${timeStr}`;
    el.setAttribute("title", `Last synced at ${d.toLocaleString()}`);
  } else if (connected) {
    label.textContent = "Connected";
    el.setAttribute("title", "Live sync connected");
  } else {
    label.textContent = "Disconnected";
    el.setAttribute("title", "Live sync disconnected");
  }
}

export function showSaveIndicator(message, color = "#4CAF50") {
  const indicator = createSaveIndicator();
  indicator.textContent = message;
  indicator.style.background = color;
  indicator.style.opacity = "1";

  // Track last synced time on successful saves
  if (color === "#4CAF50") {
    state.lastSyncedAt = new Date().toISOString();
    updateSyncHealth(state.streamConnected);
  }

  announceToScreenReader(message);

  setTimeout(() => {
    indicator.style.opacity = "0";
  }, 2000);
}
