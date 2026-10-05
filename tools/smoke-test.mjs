/**
 * Headless smoke test: stubs just enough DOM/Canvas/Audio to let the real ES
 * module graph evaluate, boots the game, then drives the animation loop, mouse
 * handlers and keyboard handlers for a few frames.
 *
 * Run: node tools/smoke-test.mjs
 */
import { pathToFileURL } from "node:url";
import { setTimeout as realSetTimeout } from "node:timers/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// ---------------------------------------------------------------- DOM stubs
function makeContext(canvas) {
  const state = {};
  return new Proxy(state, {
    get(t, k) {
      if (k === "canvas") return canvas;
      if (k in t) return t[k];
      if (k === "measureText") return () => ({ width: 10 });
      if (k === "getImageData")
      return (x, y, w, h) => ({
        data: new Uint8ClampedArray(Math.max(4, w * h * 4)),
        width: w,
        height: h,
      });
      if (k === "createImageData") return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      return () => {};
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
}

function makeCanvas(width = 640, height = 535) {
  const listeners = {};
  const canvas = {
    width,
    height,
    style: {},
    addEventListener: (type, fn) => ((listeners[type] ??= []).push(fn)),
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    getContext: () => (canvas._ctx ??= makeContext(canvas)),
  };
  canvas._listeners = listeners;
  return canvas;
}

class FakeImage {
  constructor() {
    this._listeners = {};
    this.width = 100;
    this.height = 50;
    this._src = "";
  }
  get src() {
    return this._src;
  }
  set src(v) {
    this._src = v;
    // the level map is 31x31 tiles of 24px; other assets are sprite sheets and icons
    if (/maps\//.test(v)) {
      this.width = 31 * 24;
      this.height = 31 * 24;
    }
    // browsers fire load asynchronously; so must we, otherwise listeners that
    // are attached after the assignment would never run
    queueMicrotask(() => {
      if (this._fail) return;
      for (const fn of this._listeners.load ?? []) fn({ type: "load" });
    });
  }
  addEventListener(type, fn) {
    (this._listeners[type] ??= []).push(fn);
  }
  removeEventListener() {}
}

class FakeAudio {
  constructor(src) {
    this.src = src;
  }
  load() {}
  play() {}
}

const elements = {
  canvas: makeCanvas(),
  // mirrors index.html: <div id="debugger" style="display: none"></div>
  debugger: { style: { display: "none" }, innerHTML: "", addEventListener: () => {} },
  debug_mode: { style: {}, addEventListener: () => {} },
};

const docListeners = {};
globalThis.HTMLImageElement = FakeImage;
globalThis.Image = FakeImage;
globalThis.Audio = FakeAudio;
globalThis.document = {
  getElementById: (id) => elements[id] ?? null,
  createElement: (tag) => (tag === "canvas" ? makeCanvas(0, 0) : { style: {} }),
  addEventListener: (type, fn) => ((docListeners[type] ??= []).push(fn)),
  body: { appendChild: () => {} },
};
globalThis.window = globalThis;
globalThis.alert = (msg) => console.log("  [alert] " + String(msg).split("\n")[0]);

const fakeEvent = (props = {}) => ({ preventDefault() {}, stopPropagation() {}, ...props });

const timers = [];
globalThis.setInterval = (fn, ms) => (timers.push({ fn, ms, every: true }), timers.length);
globalThis.clearInterval = () => {};
globalThis.setTimeout = (fn) => {
  timers.push({ fn, once: true });
  return timers.length;
};
globalThis.clearTimeout = () => {};

// ---------------------------------------------------------------- run
const errors = [];
const alerts = [];
const realAlert = globalThis.alert;
globalThis.alert = (m) => alerts.push(m);

function step(label, fn) {
  try {
    fn();
    console.log("  ok   " + label);
  } catch (err) {
    errors.push(`${label}: ${err && err.stack ? err.stack.split("\n").slice(0, 3).join("\n      ") : err}`);
    console.log("  FAIL " + label + " -> " + err);
  }
}

const runAsync = (fn) => fn();
await runAsync(async () => {
  console.log("loading module graph...");
  const mod = await import(pathToFileURL(path.join(ROOT, "js/main.js")).href);
  console.log("  ok   js/main.js evaluated (all imports resolved)\n");

  const { game } = await import(pathToFileURL(path.join(ROOT, "js/game/game.js")).href);
  const { mouse } = await import(pathToFileURL(path.join(ROOT, "js/game/mouse.js")).href);

  console.log("state after boot:");
  step("level loaded", () => {
    if (!game.currentLevel || !game.currentLevel.mapImage) throw new Error("no currentLevel");
  });
  step("objects spawned", () => {
    if (game.units.length < 5) throw new Error("units: " + game.units.length);
    if (game.buildings.length < 3) throw new Error("buildings: " + game.buildings.length);
    if (game.turrets.length < 9) throw new Error("turrets: " + game.turrets.length);
    if (game.overlay.length < 1) throw new Error("overlay: " + game.overlay.length);
    console.log(
      `       units=${game.units.length} buildings=${game.buildings.length} turrets=${game.turrets.length} overlay=${game.overlay.length} cash=${game.currentLevel.startingCash}`
    );
  });
  step("intervals scheduled", () => {
    if (timers.filter((t) => t.every).length < 3) throw new Error("timers: " + timers.length);
  });

  console.log("\nimage preloading (async):");
  await realSetTimeout(50);
  const { buildings } = await import(pathToFileURL(path.join(ROOT, "js/game/buildings.js")).href);
  const { vehicles } = await import(pathToFileURL(path.join(ROOT, "js/game/vehicles.js")).href);
  const { sidebar } = await import(pathToFileURL(path.join(ROOT, "js/game/sidebar.js")).href);
  const buildingsMod = await import(pathToFileURL(path.join(ROOT, "js/game/buildings.js")).href);
  const { findPath } = await import(pathToFileURL(path.join(ROOT, "js/core/queries.js")).href);
  const { toggleDebugger } = await import(pathToFileURL(path.join(ROOT, "js/core/dom.js")).href);

  step("debug panel toggles both ways", () => {
    if (elements.debugger.style.display !== "none") throw new Error("panel not hidden at boot");
    toggleDebugger();
    if (elements.debugger.style.display !== "") throw new Error("panel not shown after toggle");
    toggleDebugger();
    if (elements.debugger.style.display !== "none") throw new Error("panel not re-hidden");
  });
  step("sprite sheets transformed", () => {
    if (!buildings.loaded) throw new Error("buildings not loaded");
    if (!vehicles.loaded) throw new Error("vehicles not loaded");
    console.log(`       buildings.loaded=${buildings.loaded} vehicles.loaded=${vehicles.loaded}`);
  });

  console.log("\nanimation frames:");
  const loop = timers.find((t) => t.every && t.ms === 50);
  step("50ms animation loop exists", () => {
    if (!loop) throw new Error("no animation loop");
  });
  step("run 25 frames", () => {
    for (let i = 0; i < 25; i++) loop.fn();
  });
  step("mouse over the map", () => {
    const rect = elements.canvas.getBoundingClientRect();
    const move = elements.canvas._listeners.mousemove[0];
    move(fakeEvent({ clientX: rect.left + 300, clientY: rect.top + 250, shiftKey: false }));
    mouse.draw();
  });
  step("drag select units", () => {
    const c = elements.canvas._listeners;
    const move = c.mousemove[0];
    // mouse.gameX/gameY are recomputed once per frame inside setViewport(), and
    // hovering near an edge pans the viewport, so keep the drag well inside the
    // map and interleave it with animation frames.
    c.mousedown[0](fakeEvent({ button: 0, clientX: 150, clientY: 120, shiftKey: false }));
    loop.fn();
    move(fakeEvent({ clientX: 300, clientY: 250, shiftKey: false }));
    loop.fn();
    move(fakeEvent({ clientX: 520, clientY: 400, shiftKey: false }));
    loop.fn();
    c.mouseup[0](fakeEvent({ button: 0, clientX: 520, clientY: 400, shiftKey: false }));
    if (game.selectedItems.length === 0)
      throw new Error(
        `nothing selected: dragSelect=${mouse.dragSelect} rect=${mouse.dragX},${mouse.dragY} -> ${mouse.gameX},${mouse.gameY} team=${game.currentLevel.team}`
      );
    console.log(`       selected ${game.selectedItems.length} units`);
    game.clearSelection();
  });
  step("left click on map", () => {
    elements.canvas._listeners.click[0](fakeEvent({ shiftKey: false, clientX: 320, clientY: 300 }));
  });
  step("right click (context menu)", () => {
    const ev = { shiftKey: false, clientX: 320, clientY: 300 };
    let prevented = false;
    elements.canvas._listeners.contextmenu[0]({ ...ev, preventDefault: () => (prevented = true) });
    if (!prevented) throw new Error("contextmenu default not prevented");
  });
  step("keyboard: ctrl+1 stores a control group, 1 restores it", () => {
    const key = docListeners.keydown[0];
    const own = game.units.filter((u) => u.team === game.currentLevel.team);
    for (const u of own) game.selectItem(u, true);
    if (game.selectedItems.length !== own.length)
      throw new Error(`expected ${own.length} selected, got ${game.selectedItems.length}`);
    key(fakeEvent({ keyCode: 49, ctrlKey: true }));
    if (!game.controlGroups[1] || game.controlGroups[1].length !== own.length)
      throw new Error(`control group 1 empty (${game.controlGroups[1] ? game.controlGroups[1].length : "unset"})`);
    game.clearSelection();
    if (game.selectedItems.length !== 0) throw new Error("clearSelection did not clear");
    key(fakeEvent({ keyCode: 49, ctrlKey: false }));
    if (game.selectedItems.length !== own.length)
      throw new Error(`control group 1 restored ${game.selectedItems.length}/${own.length}`);
    console.log(`       group 1 stored and restored ${own.length} units`);
    game.clearSelection();
  });
  step("debug mode panel renders", () => {
    game.debugMode = true;
    game.showDebugger();
    if (!elements.debugger.innerHTML.includes("<li>")) throw new Error("panel not populated");
    game.debugMode = false;
  });
  step("mission status + message box", () => {
    game.missionStatus();
    game.displayMessage("hello\nworld");
    loop.fn();
    if (!game.messageVisible) throw new Error("message not visible");
  });
  step("sidebar: no build options without a construction yard", () => {
    sidebar.visible = true;
    loop.fn();
    if (sidebar.allButtons.length === 0) throw new Error("sidebar.load() registered no buttons");
    if (sidebar.leftButtons.length + sidebar.rightButtons.length !== 0)
      throw new Error("build options unlocked without a construction yard");
    console.log(`       player team=${game.currentLevel.team}, allButtons=${sidebar.allButtons.length}, unlocked=0`);
  });
  step("sidebar: construction yard + power plant unlock build options", () => {
    const { buildings } = buildingsMod;
    game.buildings.push(buildings.add({ name: "construction-yard", x: 2, y: 14, team: game.currentLevel.team }));
    game.buildings.push(buildings.add({ name: "power-plant", x: 5, y: 14, team: game.currentLevel.team }));
    sidebar.checkDependency();
    const unlocked = sidebar.leftButtons.length + sidebar.rightButtons.length;
    if (unlocked === 0) throw new Error("still no build options after a construction yard + power plant");
    console.log(`       unlocked=${unlocked}: ${sidebar.allButtons.filter((x) => unlocked).length} of 7 options visible`);
  });
  step("sidebar: cash display + power bars", () => {
    sidebar.cash = 1234;
    loop.fn();
    if (sidebar.powerIn === undefined) throw new Error("power not computed");
    console.log(`       cash=${sidebar.cash} powerIn=${Math.round(sidebar.powerIn)} powerOut=${Math.round(sidebar.powerOut)}`);
  });
  step("pathfinding across the grid", () => {
    const path = findPath([1, 1], [24, 24], true);
    if (!Array.isArray(path) || path.length === 0) throw new Error("no path returned");
    console.log(`       path length ${path.length}`);
  });

  console.log("\nremaining timers fired:");
  step("all microtasks/timers drained", () => {
    for (const t of timers) if (t.once) t.fn();
  });

  console.log(`\nalerts fired during the run: ${alerts.length}`);
  if (alerts.length) console.log("  first: " + alerts[0].split("\n")[0]);
});

globalThis.alert = realAlert;
if (errors.length) {
  console.error(`\n${errors.length} failure(s):`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log("\nSMOKE TEST PASSED");