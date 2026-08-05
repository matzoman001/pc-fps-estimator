/* ============================================================
   Where to Buy - page logic
   Links go to retailer search results (not guessed product pages
   or invented prices), since exact listings change constantly.
   Prebuilt suggestions are anchored on the user's chosen GPU tier
   so different suggested builds naturally land at different real
   price points, without us inventing any numbers ourselves.
   ============================================================ */

const GENERIC_TIERS = [
  {
    name: "Budget",
    desc: "Good for esports titles and older games at 1080p on Low-Medium settings. Typically pairs an entry CPU (like a Core i5 or Ryzen 5) with a GPU around the RTX 4060 / RX 7600 class.",
    query: "budget gaming",
    priceRange: "$600 - $900"
  },
  {
    name: "Mid-Range",
    desc: "Handles most modern games at 1080p-1440p on High settings. Typically a Core i5/i7 or Ryzen 5/7 with an RTX 4070-class GPU.",
    query: "mid range gaming",
    priceRange: "$900 - $1,400"
  },
  {
    name: "High-End",
    desc: "Strong 1440p and entry-level 4K performance. Typically a Core i7/i9 or Ryzen 7/9 with an RTX 4080-class GPU.",
    query: "high end gaming",
    priceRange: "$1,600 - $2,200"
  },
  {
    name: "Enthusiast",
    desc: "Built for 4K and high refresh-rate gaming. Typically a top-tier CPU paired with an RTX 4090/5090-class GPU.",
    query: "enthusiast extreme gaming",
    priceRange: "$2,800+"
  }
];

const REST_OF_SYSTEM_ESTIMATE = 350; // rough estimate for RAM, storage, PSU, case, etc. not itemized here

function formatPrice(n) {
  return "$" + n.toLocaleString();
}

function estimateSystemPrice(gpu, cpu) {
  return (gpu.price || 0) + (cpu ? (cpu.price || 0) : 0) + REST_OF_SYSTEM_ESTIMATE;
}

function findInGroup(groupObj, id) {
  if (!id) return null;
  for (const brand in groupObj) {
    const found = groupObj[brand].find(item => item.id === id);
    if (found) return { ...found, brand };
  }
  return null;
}

function searchLink(retailer, query) {
  const q = encodeURIComponent(query);
  if (retailer === "amazon") return `https://www.amazon.com/s?k=${q}`;
  if (retailer === "newegg") return `https://www.newegg.com/p/pl?d=${q}`;
  if (retailer === "bestbuy") return `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`;
  return "#";
}

function buyLinksHtml(query) {
  return `
    <div class="buy-links">
      <a class="pill-btn" href="${searchLink("amazon", query)}" target="_blank" rel="noopener noreferrer">Amazon</a>
      <a class="pill-btn" href="${searchLink("newegg", query)}" target="_blank" rel="noopener noreferrer">Newegg</a>
      <a class="pill-btn" href="${searchLink("bestbuy", query)}" target="_blank" rel="noopener noreferrer">Best Buy</a>
    </div>
  `;
}

function partIconHtml(type) {
  return `<span class="part-icon icon-${type}"></span>`;
}

function renderPartRow(part, highlightIds, type) {
  const isHighlighted = highlightIds.includes(part.id);
  const priceTag = typeof part.price === "number" ? `<span class="buy-part-price">Est. ${formatPrice(part.price)}</span>` : "";
  return `
    <div class="buy-part-row ${isHighlighted ? "highlighted" : ""}" id="part-${part.id}">
      <div class="buy-part-name">${partIconHtml(type)}${part.name}${priceTag}${isHighlighted ? '<span class="buy-highlight-tag">Your Pick</span>' : ""}</div>
      ${buyLinksHtml(part.name)}
    </div>
  `;
}

/* ---------- Parts tab: "Your Parts" + full list ---------- */

const PART_TYPE_MAP = { cpu: "cpu", gpu: "gpu", ram: "ram", extra: "motherboard" };

function renderYourParts(selected) {
  const rows = ["cpu", "gpu", "ram", "extra"]
    .filter(key => selected[key])
    .map(key => renderPartRow(selected[key], [selected[key].id], PART_TYPE_MAP[key]))
    .join("");

  if (!rows) return "";

  return `
    <h3 class="buy-section-title">Your Parts</h3>
    <p class="result-sub" style="margin-bottom:10px;">Based on what you picked on the FPS Estimator page.</p>
    ${rows}
  `;
}

function renderPartsView(selected) {
  const container = document.getElementById("parts-buy-list");
  const highlightIds = ["cpu", "gpu", "ram", "extra"].map(k => selected[k] && selected[k].id).filter(Boolean);
  const yourPartsHtml = renderYourParts(selected);

  let html = yourPartsHtml;
  if (yourPartsHtml) {
    html += `<h3 class="buy-section-title">Other Parts You Might Want to Check Out</h3>`;
  }

  html += `<h3 class="buy-section-title">Processors (CPU)</h3>`;
  Object.keys(DESKTOP_PARTS.cpu).forEach(brand => {
    html += `<h4 class="buy-brand-title">${brand}</h4>`;
    DESKTOP_PARTS.cpu[brand].forEach(part => { html += renderPartRow(part, highlightIds, "cpu"); });
  });

  html += `<h3 class="buy-section-title">Graphics Cards (GPU)</h3>`;
  Object.keys(DESKTOP_PARTS.gpu).forEach(brand => {
    html += `<h4 class="buy-brand-title">${brand}</h4>`;
    DESKTOP_PARTS.gpu[brand].forEach(part => { html += renderPartRow(part, highlightIds, "gpu"); });
  });

  html += `<h3 class="buy-section-title">Memory (RAM)</h3>`;
  DESKTOP_PARTS.ram.forEach(part => { html += renderPartRow(part, highlightIds, "ram"); });

  html += `<h3 class="buy-section-title">Motherboards</h3>`;
  Object.keys(DESKTOP_PARTS.motherboard).forEach(brand => {
    html += `<h4 class="buy-brand-title">${brand}</h4>`;
    DESKTOP_PARTS.motherboard[brand].forEach(part => { html += renderPartRow(part, highlightIds, "motherboard"); });
  });

  container.innerHTML = html;
}

/* ---------- Prebuilt tab: personalized or generic tiers ---------- */

function getSortedGpus(mode) {
  const partsData = mode === "desktop" ? DESKTOP_PARTS : LAPTOP_PARTS;
  const all = [];
  Object.keys(partsData.gpu).forEach(brand => {
    partsData.gpu[brand].forEach(g => all.push({ ...g, brand }));
  });
  return all.sort((a, b) => a.score - b.score);
}

function tierCardHtml(title, desc, query, priceLabel) {
  return `
    <div class="tier-card">
      <div class="tier-card-title">${title}</div>
      <p class="result-sub">${desc}</p>
      ${priceLabel ? `<div class="tier-card-price">${priceLabel}</div>` : ""}
      ${buyLinksHtml(query)}
    </div>
  `;
}

function renderPersonalizedTiers(deviceLabel, deviceQueryWord, gpu, cpu) {
  const sortedGpus = getSortedGpus(deviceLabel === "Desktop" ? "desktop" : "laptop");
  const idx = sortedGpus.findIndex(g => g.id === gpu.id);
  const cards = [];

  if (idx > 0) {
    const lower = sortedGpus[idx - 1];
    cards.push(tierCardHtml(
      `Budget Alternative`,
      `A step down from your ${gpu.name} pick. Search for ${deviceQueryWord}s built around a ${lower.name}-class GPU for a cheaper option.`,
      `${deviceQueryWord} gaming ${lower.name}`,
      `Est. ${formatPrice(estimateSystemPrice(lower, cpu))} total system`
    ));
  }

  const matchDesc = cpu
    ? `Closely matches your selected build: ${cpu.name} paired with a ${gpu.name}.`
    : `Closely matches your selected ${gpu.name} GPU.`;
  cards.push(tierCardHtml(
    `Matches Your Build`,
    matchDesc,
    cpu ? `${deviceQueryWord} gaming ${gpu.name} ${cpu.name}` : `${deviceQueryWord} gaming ${gpu.name}`,
    `Est. ${formatPrice(estimateSystemPrice(gpu, cpu))} total system`
  ));

  if (idx >= 0 && idx < sortedGpus.length - 1) {
    const higher = sortedGpus[idx + 1];
    cards.push(tierCardHtml(
      `Higher-Tier Alternative`,
      `A step up from your ${gpu.name} pick. Search for ${deviceQueryWord}s built around a ${higher.name}-class GPU for more headroom.`,
      `${deviceQueryWord} gaming ${higher.name}`,
      `Est. ${formatPrice(estimateSystemPrice(higher, cpu))} total system`
    ));
  }

  return `<div class="tier-grid">${cards.join("")}</div>`;
}

function renderGenericTiers(deviceLabel, deviceQueryWord) {
  const cards = GENERIC_TIERS.map(tier => tierCardHtml(
    `${tier.name} ${deviceLabel}`,
    tier.desc,
    `${tier.query} ${deviceQueryWord}`,
    `Rough estimate: ${tier.priceRange}`
  ));
  return `<div class="tier-grid">${cards.join("")}</div>`;
}

function renderPrebuiltView(mode, selected) {
  const container = document.getElementById("prebuilt-list");
  const deviceLabel = mode === "desktop" ? "Desktop" : "Laptop";
  const deviceQueryWord = mode === "desktop" ? "desktop" : "laptop";

  const html = selected.gpu
    ? renderPersonalizedTiers(deviceLabel, deviceQueryWord, selected.gpu, selected.cpu)
    : renderGenericTiers(deviceLabel, mode === "desktop" ? "desktop pc" : "laptop");

  container.innerHTML = `
    <h3 class="buy-section-title">${deviceLabel} Prebuilts</h3>
    ${html}
  `;
}

/* ---------- Tab switching + init ---------- */

function switchView(view) {
  document.getElementById("parts-view").classList.toggle("active", view === "parts");
  document.getElementById("prebuilt-view").classList.toggle("active", view === "prebuilt");
  document.querySelectorAll(".mode-tab").forEach(tab => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function init() {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") === "l" ? "laptop" : "desktop";
  const partsData = mode === "desktop" ? DESKTOP_PARTS : LAPTOP_PARTS;

  const cpu = findInGroup(partsData.cpu, params.get("cpu"));
  const gpu = findInGroup(partsData.gpu, params.get("gpu"));
  const ram = partsData.ram.find(r => r.id === params.get("ram")) || null;
  const extra = mode === "desktop"
    ? findInGroup(partsData.motherboard, params.get("extra"))
    : null; // laptop chassis isn't a separately purchasable part

  const selectedDesktopParts = mode === "desktop" ? { cpu, gpu, ram, extra } : { cpu: null, gpu: null, ram: null, extra: null };
  const hasSelection = Boolean(cpu || gpu);

  renderPartsView(selectedDesktopParts);
  renderPrebuiltView(mode, { cpu, gpu });

  const banner = document.getElementById("highlight-banner");
  if (hasSelection && mode === "laptop") {
    banner.innerHTML = `<p class="result-sub" style="margin-bottom:16px;">Laptop components aren't sold or upgraded separately, so check the Laptop Prebuilts below - they're built around your selected GPU tier.</p>`;
  } else if (hasSelection) {
    banner.innerHTML = `<p class="result-sub" style="margin-bottom:16px;">Your selected parts are highlighted in the PC Parts tab, and the Desktop Prebuilts below are built around your GPU pick.</p>`;
  }

  const initialView = (mode === "desktop" && hasSelection) ? "parts" : "prebuilt";
  switchView(initialView);

  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
}

init();
