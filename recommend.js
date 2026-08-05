/* ============================================================
   Get a PC Built For You - recommendation engine
   Generates a few CPU+GPU combos that fit a budget, scored by
   estimated FPS across the user's chosen games, using the same
   performance model as the main builder.
   ============================================================ */

const RES_LABELS_REC = { "1080p": "1080p", "1440p": "1440p", "4k": "4K" };

const recState = {
  mode: "desktop",
  category: "all",
  selectedGameIds: new Set(),
  preset: "high",
  resolution: "1080p"
};

function currentRecParts() {
  return recState.mode === "desktop" ? DESKTOP_PARTS : LAPTOP_PARTS;
}

function findInGroup(groupObj, id) {
  for (const brand in groupObj) {
    const found = groupObj[brand].find(item => item.id === id);
    if (found) return { ...found, brand };
  }
  return null;
}

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

function formatRecPrice(n) {
  return "$" + Math.round(n).toLocaleString();
}

/* ---------- Rendering: game picker ---------- */

function renderRecCategoryTabs() {
  const container = document.getElementById("rec-category-tabs");
  container.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-tab" + (recState.category === cat.id ? " active" : "");
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      recState.category = cat.id;
      renderRecCategoryTabs();
      renderRecGameGrid();
    });
    container.appendChild(btn);
  });
}

function renderRecGameGrid() {
  const container = document.getElementById("rec-game-grid");
  container.innerHTML = "";
  const filtered = GAMES.filter(g => recState.category === "all" || g.categories.includes(recState.category));

  filtered.forEach(game => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "game-card" + (recState.selectedGameIds.has(game.id) ? " selected" : "");
    const tagNames = game.categories
      .map(c => (CATEGORIES.find(cat => cat.id === c) || {}).name)
      .filter(Boolean)
      .join(" / ");
    btn.innerHTML = `<span class="game-tag">${tagNames}</span><span>${game.name}</span>`;
    btn.addEventListener("click", () => {
      if (recState.selectedGameIds.has(game.id)) recState.selectedGameIds.delete(game.id);
      else recState.selectedGameIds.add(game.id);
      renderRecGameGrid();
    });
    container.appendChild(btn);
  });
}

/* ---------- Rendering: settings pills ---------- */

function renderRecSettings() {
  const presetContainer = document.getElementById("rec-preset-group");
  presetContainer.innerHTML = "";
  PRESET_ORDER.forEach(p => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill-btn" + (recState.preset === p ? " active" : "");
    btn.textContent = PRESET_LABELS[p];
    btn.addEventListener("click", () => {
      recState.preset = p;
      renderRecSettings();
    });
    presetContainer.appendChild(btn);
  });

  const resContainer = document.getElementById("rec-resolution-group");
  resContainer.innerHTML = "";
  Object.keys(RESOLUTION_MULTIPLIER).forEach(r => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill-btn" + (recState.resolution === r ? " active" : "");
    btn.textContent = RES_LABELS_REC[r];
    btn.addEventListener("click", () => {
      recState.resolution = r;
      renderRecSettings();
    });
    resContainer.appendChild(btn);
  });
}

/* ---------- Mode switching ---------- */

function switchRecMode(mode) {
  recState.mode = mode;
  document.querySelectorAll(".mode-tab").forEach(tab => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

/* ---------- Recommendation engine ---------- */

function getCheapestCompatibleExtra(mode, cpuBrand) {
  const parts = mode === "desktop" ? DESKTOP_PARTS : LAPTOP_PARTS;
  if (mode === "desktop") {
    const boards = parts.motherboard[cpuBrand];
    return boards.reduce((min, b) => (b.price < min.price ? b : min), boards[0]);
  }
  return parts.chassis.find(c => c.id === "standard-gaming");
}

function generateRecommendations() {
  const parts = currentRecParts();
  const budgetInput = Number(document.getElementById("budget-input").value);
  const budget = Math.max(200, isNaN(budgetInput) ? 1200 : budgetInput);

  const selectedGames = GAMES.filter(g => recState.selectedGameIds.has(g.id));
  const gamesToScore = selectedGames.length > 0 ? selectedGames : GAMES;

  const ramGB = budget >= 1800 ? 32 : 16;
  const ram = parts.ram.find(r => r.gb === ramGB);

  const cpus = [];
  Object.keys(parts.cpu).forEach(brand => parts.cpu[brand].forEach(c => cpus.push({ ...c, brand })));
  const gpus = [];
  Object.keys(parts.gpu).forEach(brand => parts.gpu[brand].forEach(g => gpus.push({ ...g, brand })));

  const allCombos = [];
  cpus.forEach(cpu => {
    const extra = getCheapestCompatibleExtra(recState.mode, cpu.brand);
    const chassisMult = recState.mode === "laptop" ? extra.multiplier : 1;
    gpus.forEach(gpu => {
      const price = cpu.price + gpu.price + ram.price + extra.price;
      let totalFps = 0;
      gamesToScore.forEach(game => {
        totalFps += calcFPS(game, cpu, gpu, ramGB, recState.preset, recState.resolution, chassisMult, 1.0);
      });
      const avgFps = totalFps / gamesToScore.length;
      allCombos.push({ cpu, gpu, ram, extra, ramGB, price, avgFps, chassisMult });
    });
  });

  const withinBudget = allCombos.filter(c => c.price <= budget);

  if (withinBudget.length === 0) {
    const cheapest = [...allCombos].sort((a, b) => a.price - b.price)[0];
    return { budget, gamesToScore, picks: [{ label: "Closest Available", ...cheapest }], overBudget: true };
  }

  const byPriceAsc = [...withinBudget].sort((a, b) => a.price - b.price);
  const byFpsDesc = [...withinBudget].sort((a, b) => b.avgFps - a.avgFps);
  const byValueDesc = [...withinBudget].sort((a, b) => (b.avgFps / b.price) - (a.avgFps / a.price));

  const seen = new Set();
  const picks = [];
  function pickDistinct(label, sortedList) {
    for (const c of sortedList) {
      const key = c.cpu.id + "|" + c.gpu.id;
      if (!seen.has(key)) {
        seen.add(key);
        picks.push({ label, ...c });
        return;
      }
    }
  }
  pickDistinct("Budget-Friendly", byPriceAsc);
  pickDistinct("Max Performance", byFpsDesc);
  pickDistinct("Best Value", byValueDesc);

  picks.sort((a, b) => a.price - b.price);

  return { budget, gamesToScore, picks, overBudget: false };
}

/* ---------- Rendering: results ---------- */

function recBuildCard(pick, gamesToScore) {
  const perGameHtml = gamesToScore.length > 1
    ? `<ul class="rec-per-game">${gamesToScore.map(g => {
        const fps = calcFPS(g, pick.cpu, pick.gpu, pick.ramGB, recState.preset, recState.resolution, pick.chassisMult, 1.0);
        return `<li>${g.name}<span>${fps} FPS</span></li>`;
      }).join("")}</ul>`
    : "";

  const params = new URLSearchParams();
  params.set("m", recState.mode === "desktop" ? "d" : "l");
  params.set("c", pick.cpu.id);
  params.set("v", pick.gpu.id);
  params.set("a", pick.ram.id);
  params.set("t", "ddr4");
  params.set("e", pick.extra.id);

  return `
    <div class="rec-build-card">
      <div class="rec-build-label">${pick.label}</div>
      <div class="rec-build-price">${formatRecPrice(pick.price)}</div>
      <div class="rec-build-fps">${Math.round(pick.avgFps)}<span>avg FPS</span></div>
      <ul class="build-summary">
        <li>CPU: <span>${pick.cpu.name}</span></li>
        <li>GPU: <span>${pick.gpu.name}</span></li>
        <li>RAM: <span>${pick.ram.name} DDR4</span></li>
        <li>${recState.mode === "desktop" ? "Motherboard" : "Chassis"}: <span>${pick.extra.name}</span></li>
      </ul>
      ${perGameHtml}
      <a class="pill-btn rec-customize-btn" href="builder.html?${params.toString()}">Customize This Build</a>
    </div>
  `;
}

function renderRecResults() {
  const container = document.getElementById("rec-results");
  const result = generateRecommendations();

  if (result.overBudget) {
    const c = result.picks[0];
    container.innerHTML = `
      <div class="panel">
        <h2 class="panel-title">Closest We Could Get</h2>
        <p class="result-sub" style="margin-bottom:16px;">Nothing in our part list fits a ${formatRecPrice(result.budget)} budget for ${recState.mode === "desktop" ? "a desktop" : "a laptop"} - here's the cheapest option available, which runs a bit over.</p>
        <div class="rec-build-grid">${recBuildCard(c, result.gamesToScore)}</div>
      </div>
    `;
    container.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const gamesNote = recState.selectedGameIds.size === 0
    ? "averaged across all games (none selected)"
    : `averaged across ${result.gamesToScore.length} selected game${result.gamesToScore.length === 1 ? "" : "s"}`;

  container.innerHTML = `
    <div class="panel">
      <h2 class="panel-title">Recommended Builds</h2>
      <p class="result-sub" style="margin-bottom:16px;">Estimated FPS ${gamesNote}, at ${PRESET_LABELS[recState.preset]} preset / ${RES_LABELS_REC[recState.resolution]}. All builds fit within your ${formatRecPrice(result.budget)} budget.</p>
      <div class="rec-build-grid">
        ${result.picks.map(p => recBuildCard(p, result.gamesToScore)).join("")}
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Init ---------- */

function init() {
  renderRecCategoryTabs();
  renderRecGameGrid();
  renderRecSettings();

  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => switchRecMode(tab.dataset.mode));
  });

  document.getElementById("generate-btn").addEventListener("click", renderRecResults);
}

init();
