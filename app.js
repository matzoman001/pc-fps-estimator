/* ============================================================
   PC Game FPS Estimator - App Logic
   ============================================================ */

const state = {
  mode: "desktop",
  category: "all",
  gameId: null,
  preset: "high",
  resolution: "1080p",
  parts: {
    cpu: null,
    gpu: null,
    ram: null,
    ramType: null, // DDR3/DDR4/DDR5 id
    extra: null // motherboard id (desktop) or chassis id (laptop)
  },
  builds: {
    A: null, // snapshot: { mode, cpu, gpu, ram, ramType, extra }
    B: null
  }
};

const RES_LABELS = { "1080p": "1080p", "1440p": "1440p", "4k": "4K" };

function currentParts() {
  return state.mode === "desktop" ? DESKTOP_PARTS : LAPTOP_PARTS;
}

function findInGroup(groupObj, id) {
  for (const brand in groupObj) {
    const found = groupObj[brand].find(item => item.id === id);
    if (found) return { ...found, brand };
  }
  return null;
}

function getSelectedCpu() {
  return findInGroup(currentParts().cpu, state.parts.cpu);
}
function getSelectedGpu() {
  return findInGroup(currentParts().gpu, state.parts.gpu);
}
function getSelectedRam() {
  return currentParts().ram.find(r => r.id === state.parts.ram);
}
function getSelectedRamType() {
  return RAM_TYPES.find(t => t.id === state.parts.ramType);
}
function getSelectedExtra() {
  if (state.mode === "desktop") {
    return findInGroup(currentParts().motherboard, state.parts.extra);
  }
  return currentParts().chassis.find(c => c.id === state.parts.extra);
}
function getSelectedGame() {
  return GAMES.find(g => g.id === state.gameId) || null;
}

/* ---------- FPS calculation ---------- */

function calcFPS(game, cpu, gpu, ramGB, preset, resolution, chassisMultiplier, ramTypeMultiplier) {
  const gpuNorm = Math.pow(gpu.score / REFERENCE_SCORE, game.gpuWeight);
  const cpuNorm = Math.pow(cpu.score / REFERENCE_SCORE, game.cpuWeight);

  let ramFactor = 1;
  if (ramGB < game.minRAM) ramFactor = 0.75;
  else if (ramGB === game.minRAM) ramFactor = 0.92;

  const resFactor = RESOLUTION_MULTIPLIER[resolution];
  const base = game.presets[preset];

  const fps = base * gpuNorm * cpuNorm * ramFactor * resFactor * (chassisMultiplier || 1) * (ramTypeMultiplier || 1);
  return Math.max(1, Math.round(fps));
}

function resolveSnapshotParts(snapshot) {
  const partsData = snapshot.mode === "desktop" ? DESKTOP_PARTS : LAPTOP_PARTS;
  const cpu = findInGroup(partsData.cpu, snapshot.cpu);
  const gpu = findInGroup(partsData.gpu, snapshot.gpu);
  const ram = partsData.ram.find(r => r.id === snapshot.ram);
  const ramType = RAM_TYPES.find(t => t.id === snapshot.ramType);
  const extra = snapshot.mode === "desktop"
    ? findInGroup(partsData.motherboard, snapshot.extra)
    : partsData.chassis.find(c => c.id === snapshot.extra);
  return { cpu, gpu, ram, ramType, extra };
}

function snapshotCurrentBuild() {
  return {
    mode: state.mode,
    cpu: state.parts.cpu,
    gpu: state.parts.gpu,
    ram: state.parts.ram,
    ramType: state.parts.ramType,
    extra: state.parts.extra
  };
}

function getMaxScoreInBrand(groupObj, brand) {
  const list = groupObj[brand] || [];
  let max = -Infinity;
  list.forEach(item => { if (item.score > max) max = item.score; });
  return max;
}

function getBottleneck(game, cpu, gpu) {
  const gpuNorm = Math.pow(gpu.score / REFERENCE_SCORE, game.gpuWeight);
  const cpuNorm = Math.pow(cpu.score / REFERENCE_SCORE, game.cpuWeight);

  const parts = currentParts();
  const gpuIsBest = gpu.score >= getMaxScoreInBrand(parts.gpu, gpu.brand);
  const cpuIsBest = cpu.score >= getMaxScoreInBrand(parts.cpu, cpu.brand);

  if (gpuNorm < cpuNorm * 0.85) {
    if (gpuIsBest) {
      return { type: "balanced", text: `GPU-bound, but this is already the strongest ${gpu.brand} graphics card available - you're near the ceiling for this build.` };
    }
    return { type: "gpu", text: "GPU-bound - a stronger graphics card would improve FPS further." };
  }
  if (cpuNorm < gpuNorm * 0.85) {
    if (cpuIsBest) {
      return { type: "balanced", text: `CPU-bound, but this is already the strongest ${cpu.brand} processor available - you're near the ceiling for this build.` };
    }
    return { type: "cpu", text: "CPU-bound - a stronger processor would improve FPS further." };
  }
  return { type: "balanced", text: "Well balanced build for this game and these settings." };
}

/* ---------- Rendering: category tabs ---------- */

function renderCategoryTabs() {
  const container = document.getElementById("category-tabs");
  container.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "category-tab" + (state.category === cat.id ? " active" : "");
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      state.category = cat.id;
      renderCategoryTabs();
      renderGameGrid();
    });
    container.appendChild(btn);
  });
}

/* ---------- Rendering: game grid ---------- */

function renderGameGrid() {
  const container = document.getElementById("game-grid");
  container.innerHTML = "";
  const filtered = GAMES.filter(g => state.category === "all" || g.categories.includes(state.category));

  filtered.forEach(game => {
    const btn = document.createElement("button");
    btn.className = "game-card" + (state.gameId === game.id ? " selected" : "");
    const tagNames = game.categories
      .map(c => (CATEGORIES.find(cat => cat.id === c) || {}).name)
      .filter(Boolean)
      .join(" / ");
    btn.innerHTML = `<span class="game-tag">${tagNames}</span><span>${game.name}</span>`;
    btn.addEventListener("click", () => {
      state.gameId = game.id;
      renderGameGrid();
      renderResults();
    });
    container.appendChild(btn);
  });
}

/* ---------- Rendering: settings pills ---------- */

function renderSettings() {
  const presetContainer = document.getElementById("preset-group");
  presetContainer.innerHTML = "";
  PRESET_ORDER.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "pill-btn" + (state.preset === p ? " active" : "");
    btn.textContent = PRESET_LABELS[p];
    btn.addEventListener("click", () => {
      state.preset = p;
      renderSettings();
      renderResults();
    });
    presetContainer.appendChild(btn);
  });

  const resContainer = document.getElementById("resolution-group");
  resContainer.innerHTML = "";
  const resLabels = { "1080p": "1080p", "1440p": "1440p", "4k": "4K" };
  Object.keys(RESOLUTION_MULTIPLIER).forEach(r => {
    const btn = document.createElement("button");
    btn.className = "pill-btn" + (state.resolution === r ? " active" : "");
    btn.textContent = resLabels[r];
    btn.addEventListener("click", () => {
      state.resolution = r;
      renderSettings();
      renderResults();
    });
    resContainer.appendChild(btn);
  });
}

/* ---------- Rendering: part selectors ---------- */

function buildOptGroupSelect(groupObj, selectedId, onChange) {
  const select = document.createElement("select");
  Object.keys(groupObj).forEach(brand => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = brand;
    groupObj[brand].forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.name;
      opt.dataset.brand = brand;
      if (item.id === selectedId) opt.selected = true;
      optgroup.appendChild(opt);
    });
    select.appendChild(optgroup);
  });
  select.addEventListener("change", e => onChange(e.target.value));
  return select;
}

function buildFlatSelect(list, selectedId, onChange) {
  const select = document.createElement("select");
  list.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    if (item.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", e => onChange(e.target.value));
  return select;
}

function renderPartSelectors() {
  const container = document.getElementById("parts-grid");
  container.innerHTML = "";
  const parts = currentParts();

  // CPU
  const cpuField = document.createElement("div");
  cpuField.className = "part-field";
  cpuField.innerHTML = `<label>Processor (CPU)</label>`;
  cpuField.appendChild(buildOptGroupSelect(parts.cpu, state.parts.cpu, val => {
    state.parts.cpu = val;
    if (state.mode === "desktop") {
      const newCpuBrand = findInGroup(parts.cpu, val).brand;
      const currentBoard = findInGroup(parts.motherboard, state.parts.extra);
      if (!currentBoard || currentBoard.platform !== newCpuBrand) {
        state.parts.extra = parts.motherboard[newCpuBrand][0].id;
      }
      renderPartSelectors();
    }
    renderResults();
  }));
  container.appendChild(cpuField);

  // GPU
  const gpuField = document.createElement("div");
  gpuField.className = "part-field";
  gpuField.innerHTML = `<label>Graphics Card (GPU)</label>`;
  gpuField.appendChild(buildOptGroupSelect(parts.gpu, state.parts.gpu, val => {
    state.parts.gpu = val;
    renderResults();
  }));
  container.appendChild(gpuField);

  // RAM capacity
  const ramField = document.createElement("div");
  ramField.className = "part-field";
  ramField.innerHTML = `<label>Memory Capacity</label>`;
  ramField.appendChild(buildFlatSelect(parts.ram, state.parts.ram, val => {
    state.parts.ram = val;
    renderResults();
  }));
  container.appendChild(ramField);

  // RAM type
  const ramTypeField = document.createElement("div");
  ramTypeField.className = "part-field";
  ramTypeField.innerHTML = `<label>Memory Type</label>`;
  ramTypeField.appendChild(buildFlatSelect(RAM_TYPES, state.parts.ramType, val => {
    state.parts.ramType = val;
    renderResults();
  }));
  container.appendChild(ramTypeField);

  // Extra: motherboard (desktop) or chassis (laptop)
  const extraField = document.createElement("div");
  extraField.className = "part-field";
  if (state.mode === "desktop") {
    const cpuBrand = getSelectedCpu().brand;
    const compatibleBoards = { [cpuBrand]: parts.motherboard[cpuBrand] };
    extraField.innerHTML = `<label>Motherboard (${cpuBrand}-compatible)</label>`;
    extraField.appendChild(buildOptGroupSelect(compatibleBoards, state.parts.extra, val => {
      state.parts.extra = val;
      renderResults();
    }));
  } else {
    extraField.innerHTML = `<label>Laptop Chassis Type</label>`;
    extraField.appendChild(buildFlatSelect(parts.chassis, state.parts.extra, val => {
      state.parts.extra = val;
      renderResults();
    }));
  }
  container.appendChild(extraField);
}

/* ---------- Defaults ---------- */

function applyDefaultParts() {
  const parts = currentParts();
  state.parts.cpu = parts.cpu.Intel[2].id;
  state.parts.gpu = parts.gpu.NVIDIA[5].id;
  state.parts.ram = parts.ram[1].id;
  state.parts.ramType = RAM_TYPES[1].id;
  state.parts.extra = state.mode === "desktop" ? parts.motherboard.Intel[1].id : parts.chassis[1].id;
}

function ensureValidParts() {
  const parts = currentParts();
  if (!state.parts.cpu || !findInGroup(parts.cpu, state.parts.cpu)) {
    state.parts.cpu = parts.cpu.Intel[2].id;
  }
  if (!state.parts.gpu || !findInGroup(parts.gpu, state.parts.gpu)) {
    state.parts.gpu = parts.gpu.NVIDIA[5].id;
  }
  if (!state.parts.ram || !parts.ram.find(r => r.id === state.parts.ram)) {
    state.parts.ram = parts.ram[1].id;
  }
  if (!state.parts.ramType || !RAM_TYPES.find(t => t.id === state.parts.ramType)) {
    state.parts.ramType = RAM_TYPES[1].id;
  }
  if (state.mode === "desktop") {
    const cpuBrand = findInGroup(parts.cpu, state.parts.cpu).brand;
    const currentBoard = findInGroup(parts.motherboard, state.parts.extra);
    if (!currentBoard || currentBoard.platform !== cpuBrand) {
      state.parts.extra = parts.motherboard[cpuBrand][0].id;
    }
  } else {
    if (!state.parts.extra || !parts.chassis.find(c => c.id === state.parts.extra)) {
      state.parts.extra = parts.chassis[1].id;
    }
  }
}

/* ---------- Results rendering ---------- */

function renderResults() {
  renderSidebar();
  renderBottomResults();
  renderCompare();
  syncURL();
  updateBuyLink();
}

function updateBuyLink() {
  const link = document.getElementById("buy-link");
  if (!link) return;
  const params = new URLSearchParams();
  params.set("mode", state.mode === "desktop" ? "d" : "l");
  if (state.parts.cpu) params.set("cpu", state.parts.cpu);
  if (state.parts.gpu) params.set("gpu", state.parts.gpu);
  if (state.parts.ram) params.set("ram", state.parts.ram);
  if (state.parts.extra) params.set("extra", state.parts.extra);
  link.href = "buy.html?" + params.toString();
}

function renderSidebar() {
  const container = document.getElementById("sidebar-content");
  const game = getSelectedGame();

  if (!game) {
    container.innerHTML = `<p class="result-empty">Select a game above to see estimated performance for your chosen parts.</p>`;
    return;
  }

  const cpu = getSelectedCpu();
  const gpu = getSelectedGpu();
  const ram = getSelectedRam();
  const ramType = getSelectedRamType();
  const extra = getSelectedExtra();
  const chassisMult = state.mode === "laptop" && extra ? extra.multiplier : 1;

  const fps = calcFPS(game, cpu, gpu, ram.gb, state.preset, state.resolution, chassisMult, ramType.multiplier);
  const bottleneck = getBottleneck(game, cpu, gpu);

  container.innerHTML = `
    <div class="result-game-name">${game.name}</div>
    <div class="result-sub">${PRESET_LABELS[state.preset]} preset - ${RES_LABELS[state.resolution]}</div>
    <div class="result-fps-big">${fps}</div>
    <div class="result-fps-label">Estimated FPS</div>
    <div class="result-bottleneck ${bottleneck.type === "balanced" ? "" : "warn"}">${bottleneck.text}</div>
    <ul class="build-summary">
      <li>CPU: <span>${cpu.name}</span></li>
      <li>GPU: <span>${gpu.name}</span></li>
      <li>RAM: <span>${ram.name} ${ramType.name}</span></li>
      <li>${state.mode === "desktop" ? "Motherboard" : "Chassis"}: <span>${extra.name}</span></li>
    </ul>
  `;
}

function renderBottomResults() {
  const container = document.getElementById("bottom-results");
  const game = getSelectedGame();

  if (!game) {
    container.innerHTML = `<p class="result-empty">No game selected yet. Pick a game and settings above to see a full performance breakdown here.</p>`;
    return;
  }

  const cpu = getSelectedCpu();
  const gpu = getSelectedGpu();
  const ram = getSelectedRam();
  const ramType = getSelectedRamType();
  const extra = getSelectedExtra();
  const chassisMult = state.mode === "laptop" && extra ? extra.multiplier : 1;

  const allPresetFps = {};
  PRESET_ORDER.forEach(p => {
    allPresetFps[p] = calcFPS(game, cpu, gpu, ram.gb, p, state.resolution, chassisMult, ramType.multiplier);
  });
  const maxFps = Math.max(...Object.values(allPresetFps));

  const bottleneck = getBottleneck(game, cpu, gpu);

  const barsHtml = PRESET_ORDER.map(p => {
    const val = allPresetFps[p];
    const widthPct = Math.max(4, Math.round((val / maxFps) * 100));
    return `
      <div class="preset-bar-row ${p === state.preset ? "current-preset" : ""}">
        <span>${PRESET_LABELS[p]}</span>
        <div class="preset-bar-track"><div class="preset-bar-fill" style="width:${widthPct}%"></div></div>
        <span>${val}</span>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="bottom-grid">
      <div>
        <p class="result-sub" style="margin-bottom:12px;">FPS by quality preset at ${RES_LABELS[state.resolution]} for your current build</p>
        <div class="preset-bars">${barsHtml}</div>
        <div class="result-bottleneck ${bottleneck.type === "balanced" ? "" : "warn"}" style="margin-top:16px;">${bottleneck.text}</div>
      </div>
      <div>
        <p class="result-sub" style="margin-bottom:12px;">Full build summary</p>
        <table class="summary-table">
          <tr><td>PC Type</td><td>${state.mode === "desktop" ? "Desktop" : "Laptop"}</td></tr>
          <tr><td>Game</td><td>${game.name}</td></tr>
          <tr><td>Quality Preset</td><td>${PRESET_LABELS[state.preset]}</td></tr>
          <tr><td>Resolution</td><td>${RES_LABELS[state.resolution]}</td></tr>
          <tr><td>CPU</td><td>${cpu.name}</td></tr>
          <tr><td>GPU</td><td>${gpu.name}</td></tr>
          <tr><td>RAM</td><td>${ram.name} ${ramType.name}</td></tr>
          <tr><td>${state.mode === "desktop" ? "Motherboard" : "Chassis"}</td><td>${extra.name}</td></tr>
          <tr><td>Estimated FPS</td><td>${allPresetFps[state.preset]}</td></tr>
        </table>
      </div>
    </div>
  `;
}

/* ---------- Compare builds (opt-in flow) ---------- */
/* Flow: no builds saved -> offer to save one. One saved -> offer to
   compare against a second one. Both saved -> show the comparison. */

function saveBuild(slot) {
  state.builds[slot] = snapshotCurrentBuild();
  renderCompare();
  syncURL();
}

function startOver() {
  state.builds.A = null;
  state.builds.B = null;
  renderCompare();
  syncURL();
}

function buildSummaryList(cpu, gpu, ram, ramType, extra, mode) {
  return `
    <ul class="build-summary">
      <li>CPU: <span>${cpu.name}</span></li>
      <li>GPU: <span>${gpu.name}</span></li>
      <li>RAM: <span>${ram.name} ${ramType.name}</span></li>
      <li>${mode === "desktop" ? "Motherboard" : "Chassis"}: <span>${extra.name}</span></li>
    </ul>
  `;
}

function attachCompareHandlers(container) {
  container.querySelectorAll(".save-build-btn").forEach(btn => {
    btn.addEventListener("click", () => saveBuild(btn.dataset.slot));
  });
  const clearBtn = container.querySelector(".clear-saved-btn");
  if (clearBtn) clearBtn.addEventListener("click", startOver);
  const startOverBtn = container.querySelector(".start-over-btn");
  if (startOverBtn) startOverBtn.addEventListener("click", startOver);
}

function renderCompare() {
  const container = document.getElementById("compare-content");
  const game = getSelectedGame();

  const partsA = state.builds.A ? resolveSnapshotParts(state.builds.A) : null;
  const validA = partsA && partsA.cpu && partsA.gpu && partsA.ram && partsA.ramType && partsA.extra;

  if (!validA) {
    container.innerHTML = `
      <p class="result-sub" style="margin-bottom:14px;">Save your current part selections so you can compare them against another build later.</p>
      <button class="pill-btn save-build-btn" data-slot="A">Save This Build</button>
    `;
    attachCompareHandlers(container);
    return;
  }

  const cardA = `
    <div class="compare-slot filled">
      <div class="compare-slot-title">Saved Build <span class="compare-slot-tag">${state.builds.A.mode === "desktop" ? "Desktop" : "Laptop"}</span></div>
      ${buildSummaryList(partsA.cpu, partsA.gpu, partsA.ram, partsA.ramType, partsA.extra, state.builds.A.mode)}
    </div>
  `;

  const partsB = state.builds.B ? resolveSnapshotParts(state.builds.B) : null;
  const validB = partsB && partsB.cpu && partsB.gpu && partsB.ram && partsB.ramType && partsB.extra;

  if (!validB) {
    container.innerHTML = `
      <div class="compare-slots single">${cardA}</div>
      <div class="compare-actions">
        <button class="pill-btn save-build-btn" data-slot="B">Compare With Another Build</button>
        <button class="pill-btn secondary clear-saved-btn">Clear Saved Build</button>
      </div>
      <p class="result-sub" style="margin-top:10px;">Change your parts above, then click "Compare With Another Build" to see the difference.</p>
    `;
    attachCompareHandlers(container);
    return;
  }

  const cardB = `
    <div class="compare-slot filled">
      <div class="compare-slot-title">Comparison Build <span class="compare-slot-tag">${state.builds.B.mode === "desktop" ? "Desktop" : "Laptop"}</span></div>
      ${buildSummaryList(partsB.cpu, partsB.gpu, partsB.ram, partsB.ramType, partsB.extra, state.builds.B.mode)}
    </div>
  `;

  let comparisonHtml;
  if (!game) {
    comparisonHtml = `<p class="result-empty" style="margin-top:16px;">Select a game above to compare FPS between these two builds.</p>`;
  } else {
    const multA = state.builds.A.mode === "laptop" ? partsA.extra.multiplier : 1;
    const multB = state.builds.B.mode === "laptop" ? partsB.extra.multiplier : 1;

    const rows = PRESET_ORDER.map(p => {
      const fpsA = calcFPS(game, partsA.cpu, partsA.gpu, partsA.ram.gb, p, state.resolution, multA, partsA.ramType.multiplier);
      const fpsB = calcFPS(game, partsB.cpu, partsB.gpu, partsB.ram.gb, p, state.resolution, multB, partsB.ramType.multiplier);
      const diff = fpsB - fpsA;
      const diffText = diff === 0 ? "Tied" : (diff > 0 ? `Comparison +${diff} FPS` : `Saved +${-diff} FPS`);
      return `
        <tr class="${p === state.preset ? "current-preset-row" : ""}">
          <td>${PRESET_LABELS[p]}</td><td>${fpsA}</td><td>${fpsB}</td><td>${diffText}</td>
        </tr>
      `;
    }).join("");

    comparisonHtml = `
      <p class="result-sub" style="margin:16px 0 8px 0;">FPS comparison for ${game.name} at ${RES_LABELS[state.resolution]}</p>
      <table class="summary-table compare-table">
        <tr><td></td><td>Saved Build</td><td>Comparison Build</td><td>Difference</td></tr>
        ${rows}
      </table>
    `;
  }

  container.innerHTML = `
    <div class="compare-slots">${cardA}${cardB}</div>
    ${comparisonHtml}
    <div class="compare-actions">
      <button class="pill-btn save-build-btn" data-slot="B">Update Comparison Build</button>
      <button class="pill-btn secondary start-over-btn">Start Over</button>
    </div>
  `;
  attachCompareHandlers(container);
}

/* ---------- Save/share via URL ---------- */

function snapshotToParam(snap) {
  return [snap.mode === "desktop" ? "d" : "l", snap.cpu, snap.gpu, snap.ram, snap.ramType, snap.extra].join(",");
}

function paramToSnapshot(str) {
  const [m, cpu, gpu, ram, ramType, extra] = str.split(",");
  return { mode: m === "l" ? "laptop" : "desktop", cpu, gpu, ram, ramType, extra };
}

function syncURL() {
  const params = new URLSearchParams();
  params.set("m", state.mode === "desktop" ? "d" : "l");
  if (state.gameId) params.set("g", state.gameId);
  params.set("p", state.preset);
  params.set("r", state.resolution);
  if (state.parts.cpu) params.set("c", state.parts.cpu);
  if (state.parts.gpu) params.set("v", state.parts.gpu);
  if (state.parts.ram) params.set("a", state.parts.ram);
  if (state.parts.ramType) params.set("t", state.parts.ramType);
  if (state.parts.extra) params.set("e", state.parts.extra);
  if (state.builds.A) params.set("ba", snapshotToParam(state.builds.A));
  if (state.builds.B) params.set("bb", snapshotToParam(state.builds.B));

  history.replaceState(null, "", location.pathname + "?" + params.toString());

  const input = document.getElementById("share-link-input");
  if (input) input.value = location.href;
}

function loadStateFromURL() {
  const params = new URLSearchParams(location.search);
  if ([...params.keys()].length === 0) return false;

  if (params.has("m")) state.mode = params.get("m") === "l" ? "laptop" : "desktop";
  if (params.has("g") && GAMES.some(g => g.id === params.get("g"))) state.gameId = params.get("g");
  if (params.has("p") && PRESET_ORDER.includes(params.get("p"))) state.preset = params.get("p");
  if (params.has("r") && RES_LABELS[params.get("r")]) state.resolution = params.get("r");
  if (params.has("c")) state.parts.cpu = params.get("c");
  if (params.has("v")) state.parts.gpu = params.get("v");
  if (params.has("a")) state.parts.ram = params.get("a");
  if (params.has("t")) state.parts.ramType = params.get("t");
  if (params.has("e")) state.parts.extra = params.get("e");
  if (params.has("ba")) state.builds.A = paramToSnapshot(params.get("ba"));
  if (params.has("bb")) state.builds.B = paramToSnapshot(params.get("bb"));
  return true;
}

function showCopyFeedback(msg) {
  const el = document.getElementById("copy-feedback");
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 2000);
}

function copyShareLink() {
  const input = document.getElementById("share-link-input");
  input.select();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(input.value)
      .then(() => showCopyFeedback("Link copied to clipboard."))
      .catch(() => {
        try {
          document.execCommand("copy");
          showCopyFeedback("Link copied to clipboard.");
        } catch (e) {
          showCopyFeedback("Could not auto-copy - select the link above and copy manually.");
        }
      });
  } else {
    try {
      document.execCommand("copy");
      showCopyFeedback("Link copied to clipboard.");
    } catch (e) {
      showCopyFeedback("Could not auto-copy - select the link above and copy manually.");
    }
  }
}

/* ---------- Mode switching ---------- */

function renderDeviceVisual() {
  const desktopScene = document.getElementById("desktop-3d-scene");
  const laptopScene = document.getElementById("laptop-3d-scene");
  const caption = document.getElementById("device-caption");

  desktopScene.classList.toggle("visible", state.mode === "desktop");
  laptopScene.classList.toggle("visible", state.mode === "laptop");
  caption.textContent = state.mode === "desktop" ? "Desktop Build" : "Laptop Build";
}

function setupDeviceDrag(sceneId, dragId) {
  const scene = document.getElementById(sceneId);
  const drag = document.getElementById(dragId);
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotX = -18;
  let rotY = 25;

  function applyRotation() {
    drag.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }
  applyRotation();

  scene.addEventListener("pointerdown", e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    scene.classList.add("dragging");
    scene.setPointerCapture(e.pointerId);
  });

  scene.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    rotY += dx * 0.2;
    rotX = Math.max(-80, Math.min(80, rotX - dy * 0.2));
    applyRotation();
  });

  const stopDragging = () => {
    dragging = false;
    scene.classList.remove("dragging");
  };
  scene.addEventListener("pointerup", stopDragging);
  scene.addEventListener("pointercancel", stopDragging);
  scene.addEventListener("pointerleave", stopDragging);
}

function switchMode(mode) {
  state.mode = mode;
  applyDefaultParts();

  document.querySelectorAll(".mode-tab").forEach(tab => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  renderPartSelectors();
  renderResults();
  renderDeviceVisual();
}

/* ---------- Init ---------- */

function init() {
  const loadedFromURL = loadStateFromURL();
  if (loadedFromURL) ensureValidParts();
  else applyDefaultParts();

  document.querySelectorAll(".mode-tab").forEach(tab => {
    const isActive = tab.dataset.mode === state.mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  renderCategoryTabs();
  renderGameGrid();
  renderSettings();
  renderPartSelectors();
  renderResults();
  renderDeviceVisual();
  setupDeviceDrag("desktop-3d-scene", "desktop-3d-drag");
  setupDeviceDrag("laptop-3d-scene", "laptop-3d-drag");

  document.getElementById("copy-link-btn").addEventListener("click", copyShareLink);

  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => switchMode(tab.dataset.mode));
  });
}

init();
