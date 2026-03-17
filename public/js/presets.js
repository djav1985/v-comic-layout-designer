/**
 * Layout Presets — save and recall favourite page configurations.
 *
 * Presets are stored in localStorage under the key "v-comic-presets" as a
 * JSON array of preset objects:
 *   { name: string, layout: string, gutterColor: string }
 *
 * The module exposes a single `initializePresets(options)` entry point that
 * wires up the preset UI inside the page builder toolbar.
 */

const STORAGE_KEY = "v-comic-presets";
const MAX_PRESETS = 20;

// ── Persistence helpers ────────────────────────────────────────────────────

function loadPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePresets(presets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // localStorage quota exceeded — silently ignore
  }
}

function sanitizePreset(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : null;
  const layout = typeof raw.layout === "string" && raw.layout.trim() ? raw.layout.trim() : null;
  const gutterColor =
    typeof raw.gutterColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.gutterColor)
      ? raw.gutterColor
      : "#cccccc";
  if (!name || !layout) return null;
  return { name, layout, gutterColor };
}

// ── DOM helpers ────────────────────────────────────────────────────────────

function buildPresetItem(preset, index, onApply, onDelete) {
  const li = document.createElement("li");
  li.className = "preset-item";

  const info = document.createElement("span");
  info.className = "preset-info";
  info.textContent = preset.name;
  info.title = `Layout: ${preset.layout}`;

  const swatch = document.createElement("span");
  swatch.className = "preset-swatch";
  swatch.style.background = preset.gutterColor;
  swatch.setAttribute("aria-hidden", "true");
  info.prepend(swatch);

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "preset-apply-btn";
  applyBtn.textContent = "Apply";
  applyBtn.setAttribute("aria-label", `Apply preset "${preset.name}"`);
  applyBtn.addEventListener("click", () => onApply(preset, index));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "preset-delete-btn";
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", `Delete preset "${preset.name}"`);
  deleteBtn.addEventListener("click", () => onDelete(index));

  li.appendChild(info);
  li.appendChild(applyBtn);
  li.appendChild(deleteBtn);
  return li;
}

// ── Non-blocking notification banner ──────────────────────────────────────

function showPresetsNotice(message, type = "info") {
  const existing = document.getElementById("presetsNotice");
  if (existing) existing.remove();

  const notice = document.createElement("div");
  notice.id = "presetsNotice";
  notice.className = `presets-notice presets-notice--${type}`;
  notice.setAttribute("role", "status");
  notice.textContent = message;

  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 4000);
}


/**
 * @param {object} options
 * @param {HTMLElement} options.container   - Element to append the presets panel into
 * @param {function():object|null} options.getCurrentPageData
 *   Returns { layout, gutterColor } for the currently focused page, or null if
 *   no page is focused / available.
 * @param {function(object):void} options.applyPreset
 *   Called with { layout, gutterColor } when the user applies a preset.
 */
export function initializePresets({ container, getCurrentPageData, applyPreset }) {
  if (!container) return;

  // ── Panel shell ───────────────────────────────────────────────────────────
  const panel = document.createElement("div");
  panel.id = "presetsPanel";
  panel.className = "presets-panel";
  panel.setAttribute("aria-label", "Layout presets");

  const header = document.createElement("div");
  header.className = "presets-header";

  const title = document.createElement("h3");
  title.textContent = "Layout Presets";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.id = "togglePresetsBtn";
  toggleBtn.className = "ghost presets-toggle-btn";
  toggleBtn.textContent = "▼ Presets";
  toggleBtn.setAttribute("aria-expanded", "false");
  toggleBtn.setAttribute("aria-controls", "presetsPanelBody");

  header.appendChild(toggleBtn);
  panel.appendChild(header);

  const body = document.createElement("div");
  body.id = "presetsPanelBody";
  body.className = "presets-body";
  body.hidden = true;

  // ── Save-current-page-as-preset form ─────────────────────────────────────
  const saveForm = document.createElement("div");
  saveForm.className = "presets-save-form";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = "presetNameInput";
  nameInput.className = "presets-name-input";
  nameInput.placeholder = "Preset name…";
  nameInput.maxLength = 40;
  nameInput.setAttribute("aria-label", "New preset name");

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "primary presets-save-btn";
  saveBtn.textContent = "Save current page as preset";
  saveBtn.setAttribute("aria-label", "Save current page layout as preset");

  saveForm.appendChild(nameInput);
  saveForm.appendChild(saveBtn);
  body.appendChild(saveForm);

  // ── Preset list ───────────────────────────────────────────────────────────
  const list = document.createElement("ul");
  list.id = "presetList";
  list.className = "preset-list";
  list.setAttribute("aria-label", "Saved presets");

  body.appendChild(list);

  const emptyMsg = document.createElement("p");
  emptyMsg.className = "presets-empty";
  emptyMsg.textContent = "No presets saved yet.";
  body.appendChild(emptyMsg);

  panel.appendChild(body);
  container.appendChild(panel);

  // ── State ─────────────────────────────────────────────────────────────────
  let presets = loadPresets();

  function renderList() {
    list.innerHTML = "";
    const valid = [];
    presets.forEach((preset, originalIndex) => {
      if (preset) {
        valid.push({ preset, originalIndex });
      }
    });
    emptyMsg.hidden = valid.length > 0;

    valid.forEach(({ preset, originalIndex }, i) => {
      list.appendChild(
        buildPresetItem(
          preset,
          originalIndex,
          (p) => {
            applyPreset(p);
          },
          (idx) => {
            presets.splice(idx, 1);
            savePresets(presets);
            renderList();
          },
        ),
      );
    });
  }

  renderList();

  // ── Toggle ────────────────────────────────────────────────────────────────
  toggleBtn.addEventListener("click", () => {
    const open = !body.hidden;
    body.hidden = open;
    toggleBtn.setAttribute("aria-expanded", String(!open));
    toggleBtn.textContent = open ? "▼ Presets" : "▲ Presets";
  });

  // ── Save current page ─────────────────────────────────────────────────────
  saveBtn.addEventListener("click", () => {
    const pageName = nameInput.value.trim();
    if (!pageName) {
      nameInput.focus();
      nameInput.classList.add("input-error");
      setTimeout(() => nameInput.classList.remove("input-error"), 1500);
      return;
    }
    if (presets.length >= MAX_PRESETS) {
      showPresetsNotice(`Maximum of ${MAX_PRESETS} presets reached. Remove one first.`, "error");
      return;
    }
    const data = getCurrentPageData();
    if (!data) {
      showPresetsNotice("No page is currently available to save as a preset.", "error");
      return;
    }
    const preset = sanitizePreset({ name: pageName, ...data });
    if (!preset) {
      showPresetsNotice("Could not read a valid layout from the current page.", "error");
      return;
    }
    presets.push(preset);
    savePresets(presets);
    nameInput.value = "";
    renderList();
    showPresetsNotice(`Preset "${preset.name}" saved.`, "success");
  });
}
