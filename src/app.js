import { WorkshopScene } from "./scene.js";
import {
  DEFAULT_STATE,
  DEFAULT_CALIBRATION,
  restore,
  move,
  limits,
  gearCount,
  loadMass,
  validCalibration,
  physicalModel,
  initialDirection,
  anchorX,
  pivotX,
} from "./model.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  key = "lever-workshop-v2";
let saved;
try {
  saved = restore(localStorage.getItem(key));
} catch {
  saved = restore(null);
}
let state = { ...saved.state },
  calibration = { ...saved.calibration },
  reduced =
    saved.reducedMotion ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
let scene = null,
  ready = false,
  held = false,
  editing = false,
  selected = "pivot",
  toastTimer,
  fallback = false;
function save() {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 2,
        state,
        calibration,
        reducedMotion: reduced,
      }),
    );
  } catch {
    /* Exploration still works with browser storage disabled. */
  }
}
function notice(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
}
function holdScene() {
  scene?.setHeld(held || editing || !!document.querySelector("dialog[open]"));
}
function setState(next) {
  state = { ...next };
  if (ready) scene.setState(state, calibration);
  render();
  save();
}
function select(part) {
  selected = part;
  scene?.select(part);
  renderSelection();
}
function renderSelection() {
  for (const b of $$("[data-select]"))
    b.setAttribute("aria-pressed", String(b.dataset.select === selected));
  for (const b of $$("[data-part]"))
    b.setAttribute("aria-pressed", String(b.dataset.part === selected));
  const [min, max] = limits(state, selected);
  Object.assign($("#position"), { min, max, value: state[selected] });
  $("#position-label").textContent =
    selected === "pivot" ? "Move pivot" : `Move load ${selected.toUpperCase()}`;
  $("#position-value").textContent =
    selected === "pivot"
      ? `Holes ${state.pivot} + ${state.pivot + 1}`
      : `Hole ${state[selected]}`;
  $("#position").setAttribute(
    "aria-valuetext",
    $("#position-value").textContent,
  );
}
function render() {
  for (const part of ["a", "b"]) {
    const n = state[part === "a" ? "loadA" : "loadB"],
      g = gearCount(n);
    $(`#load-${part}`).value = n;
    $(`#load-${part}`).setAttribute(
      "aria-valuetext",
      `${n} gears: ${g.large} large, ${g.small} small; ${g.pins} added pins`,
    );
    $(`#mass-${part}`).textContent =
      `≈ ${Number(loadMass(n, calibration).toFixed(1))} g`;
    $(`#recipe-${part}`).textContent =
      `${g.large} large · ${g.small} small\n+ ${g.pins} pins`;
  }
  for (const part of ["a", "b", "pivot"])
    $(`[data-part="${part}"] .tag-info`).textContent =
      part === "pivot"
        ? `${state.pivot} + ${state.pivot + 1}`
        : `hole ${state[part]}`;
  renderSelection();
  $("#hold").textContent = held ? "Release" : "Hold level";
  $("#hold").setAttribute("aria-pressed", String(held));
  if (fallback) drawFallback();
}
function status(direction, isHeld) {
  const text = isHeld
    ? "Held level"
    : direction === "balance"
      ? "Balanced from level"
      : `Load ${direction.toUpperCase()} dips`;
  if ($("#beam-status").textContent !== text)
    $("#beam-status").textContent = text;
  $("#beam-status").classList.toggle(
    "balanced",
    direction === "balance" && !isHeld,
  );
}
function onFrame({ positions, direction, held: isHeld }) {
  status(direction, isHeld);
  for (const [part, p] of Object.entries(positions)) {
    const tag = $(`[data-part="${part}"]`);
    tag.hidden = !p.visible;
    tag.style.left = `${p.x}px`;
    tag.style.top = `${p.y}px`;
  }
}
function drawFallback() {
  const model = physicalModel(state, calibration),
    direction = initialDirection(model),
    isHeld = held || editing;
  status(direction, isHeld);
  const angle =
    isHeld || direction === "balance"
      ? 0
      : direction === "a"
        ? model.positiveStop
        : model.negativeStop;
  const x = (v) => 400 + v * 23,
    px = x(pivotX(state)),
    degrees = (-angle * 180) / Math.PI;
  $("#fallback-svg").innerHTML =
    `<path d="M ${px} 246 l -24 55 h 48 z" fill="#354d4d"/><g transform="rotate(${degrees} ${px} 246)"><rect x="155" y="215" width="490" height="15" rx="5" fill="#849b99"/>${["a", "b"].map((p) => `<g><rect x="${x(anchorX(state, p)) - 10}" y="156" width="20" height="60" fill="#687d7c"/><circle cx="${x(anchorX(state, p))}" cy="155" r="${18 + state[p === "a" ? "loadA" : "loadB"] * 5}" fill="#a6b5b7" stroke="#355e53" stroke-width="4"/><text x="${x(anchorX(state, p))}" y="112" text-anchor="middle" fill="#163b39" font-size="20" font-weight="bold">${p.toUpperCase()} · hole ${state[p]}</text></g>`).join("")}</g><text x="${px}" y="334" text-anchor="middle" fill="#163b39" font-size="18">Pivot · ${state.pivot} + ${state.pivot + 1}</text>`;
}
function unavailable() {
  ready = false;
  fallback = true;
  if (scene) scene.active = false;
  $("#scene").hidden = true;
  $("#fallback").hidden = false;
  $("#part-tags").hidden = true;
  $$(".camera-controls button").forEach((b) => (b.disabled = true));
  drawFallback();
}
for (const b of $$("[data-select]"))
  b.addEventListener("click", () => select(b.dataset.select));
for (const b of $$("[data-part]")) {
  b.addEventListener("pointerdown", (e) => {
    if (ready) scene.beginDrag(e, b.dataset.part);
  });
  b.addEventListener("click", () => select(b.dataset.part));
  b.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      select(b.dataset.part);
      setState(
        move(
          state,
          selected,
          e.key === "Home"
            ? -100
            : e.key === "End"
              ? 100
              : state[selected] + (e.key === "ArrowRight" ? 1 : -1),
        ),
      );
    }
  });
}
$("#position").addEventListener("input", (e) =>
  setState(move(state, selected, +e.target.value)),
);
for (const part of ["a", "b"]) {
  const input = $(`#load-${part}`);
  input.addEventListener("input", () =>
    setState({ ...state, [part === "a" ? "loadA" : "loadB"]: +input.value }),
  );
  const panel = $(`[data-highlight="${part}"]`);
  const highlight = (on) => {
    panel.classList.toggle("active", on);
    scene?.highlight(on ? part : null);
  };
  panel.addEventListener("pointerenter", () => highlight(true));
  panel.addEventListener("pointerleave", () =>
    highlight(panel.contains(document.activeElement)),
  );
  panel.addEventListener("focusin", () => highlight(true));
  panel.addEventListener("focusout", () => highlight(false));
}
for (const input of $$("input[type=range]")) {
  input.addEventListener("pointerdown", () => {
    editing = true;
    holdScene();
    if (fallback) drawFallback();
  });
}
for (const event of ["pointerup", "pointercancel"])
  window.addEventListener(event, () => {
    editing = false;
    holdScene();
    if (fallback) drawFallback();
  });
$("#hold").addEventListener("click", () => {
  held = !held;
  holdScene();
  render();
});
$("#reset").addEventListener("click", () => {
  held = false;
  editing = false;
  holdScene();
  setState(DEFAULT_STATE);
  select("pivot");
  notice("Back to the starting arrangement.");
});
$("#view-reset").addEventListener("click", () => scene?.resetCamera());
$("#view-side").addEventListener("click", () => scene?.sideCamera());
$("#view-turn").addEventListener("click", () => scene?.turn());
$("#fullscreen").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    notice(
      "The workbench already fills this window. Full screen is unavailable in this browser.",
    );
  }
});
if (!document.fullscreenEnabled) $("#fullscreen").hidden = true;
document.addEventListener("fullscreenchange", () =>
  $("#fullscreen").setAttribute(
    "aria-label",
    document.fullscreenElement ? "Exit full screen" : "Enter full screen",
  ),
);
function openDialog(id) {
  $(id).showModal();
  holdScene();
}
$("#help").addEventListener("click", () => openDialog("#help-dialog"));
$("#settings").addEventListener("click", () => {
  fillCalibration();
  openDialog("#settings-dialog");
});
for (const b of $$(".dialog-close"))
  b.addEventListener("click", () => b.closest("dialog").close());
for (const dialog of $$("dialog")) dialog.addEventListener("close", holdScene);
const fields = [
  ["beam", "Beam (g)", 0.001, 100],
  ["bracket", "Bracket + 5 pins (g)", 0.001, 100],
  ["large", "Large gear + 3 pins (g)", 0.001, 100],
  ["small", "Small gear + 3 pins (g)", 0.001, 100],
  ["pin", "One pin (g)", 0.001, 100],
  ["connector", "One offset connector (g)", 0.001, 100],
  ["friction", "Shaft resistance (g × hole spacing)", 0, 5],
  ["damping", "Motion damping (1/s)", 0, 12],
];
$("#mass-inputs").innerHTML = fields
  .map(
    ([key, label, min, max]) =>
      `<label for="mass-${key}">${label}</label><input id="mass-${key}" name="${key}" type="number" min="${min}" max="${max}" step="any" required/>`,
  )
  .join("");
function fillCalibration() {
  for (const [key] of fields)
    $(`#mass-${key}`).value = Number(calibration[key].toFixed(5));
  $("#calibration-error").textContent = "";
  $("#reduced-motion").checked = reduced;
}
$("#calibration-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const next = Object.fromEntries(
    fields.map(([key]) => [key, +$(`#mass-${key}`).value]),
  );
  if (!validCalibration(next)) {
    $("#calibration-error").textContent =
      "Each bracket or gear pack must weigh more than its included pins. Check the mass values.";
    return;
  }
  calibration = next;
  setState(state);
  $("#calibration-error").textContent = "";
  notice("Model settings applied.");
});
$("#defaults").addEventListener("click", () => {
  calibration = { ...DEFAULT_CALIBRATION };
  fillCalibration();
  setState(state);
  notice("Approximate starting masses restored.");
});
$("#reduced-motion").addEventListener("change", (e) => {
  reduced = e.target.checked;
  if (scene) {
    scene.reduced = reduced;
    scene.level();
  }
  save();
});
render();
try {
  scene = new WorkshopScene($("#scene"), {
    onChange: setState,
    onSelect: (part) => {
      selected = part;
      renderSelection();
    },
    onNotice: notice,
    onRelease: () => {
      editing = false;
      holdScene();
    },
    onFrame,
    onUnavailable: unavailable,
  });
  await scene.init();
  ready = true;
  scene.reduced = reduced;
  scene.setState(state, calibration);
  scene.select(selected);
  holdScene();
  $("#app").dataset.ready = "true";
} catch (error) {
  console.warn("3D unavailable; using the diagram view.", error.message);
  unavailable();
  $("#app").dataset.ready = "fallback";
}
