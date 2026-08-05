/* ============================================================
   Get a PC Built For You - recommendation engine
   Generates a few CPU+GPU combos that fit a price range and clear
   a minimum FPS target, scored across the user's chosen games,
   using the same performance model as the main builder. If nothing
   fits both the price range and the FPS floor, two fallback builds
   are shown instead: the cheapest option that hits the FPS target,
   and the best FPS available within the stated budget ceiling.
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

/* ---------- Range sliders (two linked inputs per range) ---------- */

function setupRangeSlider(minId, maxId, minLabelId, maxLabelId) {
  const minInput = document.getElementById(minId);
  const maxInput = document.getElementById(maxId);
  const minLabel = document.getElementById(minLabelId);
  const maxLabel = document.getElementById(maxLabelId);

  function update(movedInput) {
    let minVal = Number(minInput.value);
    let maxVal = Number(maxInput.value);
    if (minVal > maxVal) {
      if (movedInput === maxInput) {
        minVal = maxVal;
        minInput.value = minVal;
      } else {
        maxVal = minVal;
        maxInput.value = maxVal;
      }
    }
    minLabel.textContent = minVal;
    maxLabel.textContent = maxVal;
  }

  minInput.addEventListener("input", () => update(minInput));
  maxInput.addEventListener("input", () => update(maxInput));
  update(minInput);
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

function buildAllCombos(priceMidpoint) {
  const parts = currentRecParts();
  const selectedGames = GAMES.filter(g => recState.selectedGameIds.has(g.id));
  const gamesToScore = selectedGames.length > 0 ? selectedGames : GAMES;

  const ramGB = priceMidpoint >= 1800 ? 32 : 16;
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

  return { allCombos, gamesToScore };
}

function generateRecommendations() {
  const priceMin = Number(document.getElementById("price-min").value);
  const priceMax = Number(document.getElementById("price-max").value);
  const fpsMin = Number(document.getElementById("fps-min").value);
  const fpsMax = Number(document.getElementById("fps-max").value);

  const { allCombos, gamesToScore } = buildAllCombos((priceMin + priceMax) / 2);

  const inBand = allCombos.filter(c => c.price >= priceMin && c.price <= priceMax && c.avgFps >= fpsMin);

  if (inBand.length === 0) {
    const meetsFpsFloor = allCombos.filter(c => c.avgFps >= fpsMin);
    const performanceCombo = meetsFpsFloor.length > 0
      ? meetsFpsFloor.reduce((min, c) => (c.price < min.price ? c : min))
      : allCombos.reduce((best, c) => (c.avgFps > best.avgFps ? c : best));

    const withinMaxBudget = allCombos.filter(c => c.price <= priceMax);
    const budgetCombo = withinMaxBudget.length > 0
      ? withinMaxBudget.reduce((best, c) => (c.avgFps > best.avgFps ? c : best))
      : allCombos.reduce((min, c) => (c.price < min.price ? c : min));

    const performancePick = { label: "Meets Your Performance Target", ...performanceCombo };
    const budgetPick = { label: "Fits Your Budget", ...budgetCombo };

    return {
      infeasible: true,
      priceMin, priceMax, fpsMin, fpsMax, gamesToScore,
      performancePick, budgetPick
    };
  }

  const byPriceAsc = [...inBand].sort((a, b) => a.price - b.price);
  const byFpsDesc = [...inBand].sort((a, b) => b.avgFps - a.avgFps);
  const byValueDesc = [...inBand].sort((a, b) => (b.avgFps / b.price) - (a.avgFps / a.price));

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

  return { infeasible: false, priceMin, priceMax, fpsMin, fpsMax, gamesToScore, picks };
}

/* ---------- Rendering: results ---------- */

function recBuildCard(pick, gamesToScore, note) {
  const perGameHtml = gamesToScore.length > 1
    ? `<ul class="rec-per-game">${gamesToScore.map(g => {
        const fps = calcFPS(g, pick.cpu, pick.gpu, pick.ramGB, recState.preset, recState.resolution, pick.chassisMult, 1.0);
        return `<li>${g.name}<span>${fps} FPS</span></li>`;
      }).join("")}</ul>`
    : "";

  const builderParams = new URLSearchParams();
  builderParams.set("m", recState.mode === "desktop" ? "d" : "l");
  builderParams.set("c", pick.cpu.id);
  builderParams.set("v", pick.gpu.id);
  builderParams.set("a", pick.ram.id);
  builderParams.set("t", "ddr4");
  builderParams.set("e", pick.extra.id);

  const buyParams = new URLSearchParams();
  buyParams.set("mode", recState.mode === "desktop" ? "d" : "l");
  buyParams.set("cpu", pick.cpu.id);
  buyParams.set("gpu", pick.gpu.id);
  buyParams.set("ram", pick.ram.id);
  buyParams.set("extra", pick.extra.id);

  return `
    <div class="rec-build-card">
      <div class="rec-build-label">${pick.label}</div>
      ${note ? `<p class="rec-build-note">${note}</p>` : ""}
      <div class="rec-build-price">${formatRecPrice(pick.price)}</div>
      <div class="rec-build-fps">${Math.round(pick.avgFps)}<span>avg FPS</span></div>
      <ul class="build-summary">
        <li>CPU: <span>${pick.cpu.name}</span></li>
        <li>GPU: <span>${pick.gpu.name}</span></li>
        <li>RAM: <span>${pick.ram.name} DDR4</span></li>
        <li>${recState.mode === "desktop" ? "Motherboard" : "Chassis"}: <span>${pick.extra.name}</span></li>
      </ul>
      ${perGameHtml}
      <div class="rec-card-actions">
        <a class="pill-btn rec-card-btn" href="builder.html?${builderParams.toString()}">Compare With Other Builds</a>
        <a class="pill-btn rec-card-btn secondary" href="buy.html?${buyParams.toString()}">Where to Buy These Parts</a>
      </div>
    </div>
  `;
}

function renderRecResults() {
  const container = document.getElementById("rec-results");
  const result = generateRecommendations();
  const deviceWord = recState.mode === "desktop" ? "a desktop" : "a laptop";

  if (result.infeasible) {
    const perfNote = result.performancePick.avgFps >= result.fpsMin
      ? `What ${result.fpsMin}+ FPS actually costs`
      : `The best available - still short of your ${result.fpsMin} FPS target`;
    const budgetNote = result.budgetPick.price <= result.priceMax
      ? `Best performance up to ${formatRecPrice(result.priceMax)}`
      : `The cheapest available - still over your ${formatRecPrice(result.priceMax)} budget`;

    container.innerHTML = `
      <div class="panel">
        <h2 class="panel-title">That Combination Isn't Achievable</h2>
        <div class="result-bottleneck warn" style="margin-bottom:18px;">
          Hitting at least ${result.fpsMin} FPS for ${deviceWord} within a ${formatRecPrice(result.priceMin)} - ${formatRecPrice(result.priceMax)} budget isn't possible with the parts we track. Here are the two closest alternatives - one keeps your performance target and shows the real cost, the other keeps your budget and shows the real performance.
        </div>
        <div class="rec-build-grid">
          ${recBuildCard(result.performancePick, result.gamesToScore, perfNote)}
          ${recBuildCard(result.budgetPick, result.gamesToScore, budgetNote)}
        </div>
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
      <p class="result-sub" style="margin-bottom:16px;">Estimated FPS ${gamesNote}, at ${PRESET_LABELS[recState.preset]} preset / ${RES_LABELS_REC[recState.resolution]}. Showing builds between ${formatRecPrice(result.priceMin)} and ${formatRecPrice(result.priceMax)} that reach at least ${result.fpsMin} FPS.</p>
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
  setupRangeSlider("fps-min", "fps-max", "fps-min-label", "fps-max-label");
  setupRangeSlider("price-min", "price-max", "price-min-label", "price-max-label");

  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => switchRecMode(tab.dataset.mode));
  });

  document.getElementById("generate-btn").addEventListener("click", renderRecResults);
}

init();
