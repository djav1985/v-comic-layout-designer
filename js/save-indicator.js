import { state } from "./state.js";

function createSaveIndicator() {
  if (!state.saveIndicator) {
    const indicator = document.createElement("div");
    indicator.id = "saveIndicator";
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

export function showSaveIndicator(message, color = "#4CAF50") {
  const indicator = createSaveIndicator();
  indicator.textContent = message;
  indicator.style.background = color;
  indicator.style.opacity = "1";
  setTimeout(() => {
    indicator.style.opacity = "0";
  }, 2000);
}
