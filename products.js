/* Coastal Ghost Team Shop — Catalog rendering & product detail flow
   Everything here is data-driven from /data/*.json. No product, price,
   color, or size is invented here — if data is missing it is flagged
   in the UI instead of guessed. */

const Catalog = {
  products: [],
  designs: [],
  dtf: [],
  sizePricing: {},
  itemTypes: [],
};

let activeProduct = null;
let activeColorIndex = 0;
let activeSize = null;
let activeQty = 1;
let activePlacement = null;

// The site supports both layouts used during this project:
// 1. a normal data/products.json file, and
// 2. the split manifest/product-group files used to stay under upload limits.
// It also translates the original "assets/master-files/..." paths in the
// product data to the shorter paths stored in the asset manifest.
let AssetPathMap = new Map();

function normalizeAssetKey(value) {
  if (!value) return "";
  let key = String(value).replace(/\\\\/g, "/");
  try { key = decodeURIComponent(key); } catch (_) {}
  key = key.replace(/^\/?assets\/master-files\//i, "");
  key = key.replace(/^\/?assets\//i, "");
  return key.replace(/\/+/g, "/").toLowerCase().trim();
}

async function fetchJsonIfPresent(path) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (_) {
    return null;
  }
}

async function loadAssetPathMap() {
  const manifest = await fetchJsonIfPresent("data/manifest-index.json");
  if (!manifest || !Array.isArray(manifest.assetChunks)) return;

  const chunks = await Promise.all(
    manifest.assetChunks.map((file) => fetchJsonIfPresent(`data/${file}`))
  );

  for (const chunk of chunks) {
    if (!Array.isArray(chunk)) continue;
    for (const asset of chunk) {
      if (!asset || !asset.assetPath) continue;
      if (asset.sourcePath) AssetPathMap.set(normalizeAssetKey(asset.sourcePath), asset.assetPath);
      if (asset.filename) AssetPathMap.set(normalizeAssetKey(asset.filename), asset.assetPath);
      if (asset.id) AssetPathMap.set(normalizeAssetKey(asset.id), asset.assetPath);
    }
  }
}

function resolveAssetPath(path) {
  if (!path) return path;
  const direct = AssetPathMap.get(normalizeAssetKey(path));
  if (direct) return direct;

  // Last fallback: match by filename if the source folders changed.
  const raw = normalizeAssetKey(path);
  const filename = raw.split("/").pop();
  if (filename) {
    for (const [key, value] of AssetPathMap.entries()) {
      if (key.endsWith("/" + filename) || key === filename) return value;
    }
  }
  return path;
}

function resolveCatalogAssetPaths(list) {
  for (const product of list || []) {
    for (const color of product.colors || []) {
      color.image = resolveAssetPath(color.image);
      if (color.images && typeof color.images === "object") {
        for (const placement of Object.keys(color.images)) {
          color.images[placement] = resolveAssetPath(color.images[placement]);
        }
      }
    }
  }
}

async function loadProducts() {
  const direct = await fetchJsonIfPresent("data/products.json");
  if (Array.isArray(direct) && direct.length) return direct;

  const manifest = await fetchJsonIfPresent("data/manifest-index.json");
  if (!manifest || !Array.isArray(manifest.productGroupChunks)) return [];

  const chunks = await Promise.all(
    manifest.productGroupChunks.map((file) => fetchJsonIfPresent(`data/${file}`))
  );

  return chunks.flatMap((chunk) => {
    if (Array.isArray(chunk)) return chunk;
    if (Array.isArray(chunk?.products)) return chunk.products;
    return [];
  });
}

async function loadCatalog() {
  await loadAssetPathMap();

  const [products, designs, dtf, sizePricing, itemTypes] = await Promise.all([
    loadProducts(),
    fetchJsonIfPresent("data/designs.json"),
    fetchJsonIfPresent("data/dtf.json"),
    fetchJsonIfPresent("data/sizePricing.json"),
    fetchJsonIfPresent("data/itemTypes.json"),
  ]);

  resolveCatalogAssetPaths(products || []);
  for (const item of dtf || []) item.image = resolveAssetPath(item.image);
  for (const item of designs || []) item.thumbnail = resolveAssetPath(item.thumbnail);

  Catalog.products = products || [];
  Catalog.designs = designs || [];
  Catalog.dtf = dtf || [];
  Catalog.sizePricing = sizePricing || {};
  Catalog.itemTypes = itemTypes || [];
}

function uniqueBy(list, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const k = keyFn(item);
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/* ---------- Category rendering ---------- */

/* Artwork files (DTF transfers, design art) are flat, wide graphics rather than
   garment photos, so their thumbnails are fitted inside the frame, not cropped. */
function isArtwork(path) {
  return typeof path === "string" && /(^|\/)dtf([\/-]|$)|dtf-decals/i.test(path);
}

function thumbClass(base, path) {
  return isArtwork(path) ? `${base} is-art` : base;
}

function categoryCard(label, thumb, attrs, sublabel) {
  const thumbHtml = thumb
    ? `<img src="${thumb}" alt="${label} thumbnail" loading="lazy" />`
    : `<span class="placeholder">👕</span>`;
  return `
    <button class="category-card" ${attrs}>
      <div class="${thumbClass("category-thumb", thumb)}">${thumbHtml}</div>
      <div class="category-label">${label}${sublabel ? `<small>${sublabel}</small>` : ""}</div>
    </button>
  `;
}

/* Item types are two levels deep: data/itemTypes.json sets the browse order and
   any subcategories (Sweatshirts → Crewnecks, Hoodies, 1/4 Zips), so a
   subcategory can be listed before the workbook supplies products for it. An
   itemType that appears on a product but not in that file is appended, so
   adding a product with a brand new type still shows up on its own. */
function itemTypeTree() {
  const types = Catalog.itemTypes.map((t) => ({ name: t.name, subTypes: t.subTypes || [] }));
  const known = new Set(types.map((t) => t.name));
  for (const product of Catalog.products) {
    if (product.itemType && !known.has(product.itemType)) {
      known.add(product.itemType);
      types.push({ name: product.itemType, subTypes: [] });
    }
  }
  return types;
}

function itemTypeThumb(itemType, subType) {
  const match = Catalog.products.find(
    (p) => p.itemType === itemType && (!subType || p.subType === subType)
  );
  return match && match.colors && match.colors[0] ? match.colors[0].image : null;
}

function renderDesignGrid() {
  const grid = document.getElementById("designGrid");
  const designsWithProducts = Catalog.designs.filter((d) =>
    Catalog.products.some((p) => p.design === d.name) || d.thumbnail
  );

  grid.innerHTML = designsWithProducts
    .map((design) => {
      const thumb = design.thumbnail
        ? `<img src="${design.thumbnail}" alt="${design.name} design thumbnail" loading="lazy" />`
        : `<span class="placeholder">👻</span>`;
      return `
        <button class="category-card" data-filter="design" data-value="${escapeAttr(design.name)}">
          <div class="${thumbClass("category-thumb", design.thumbnail)}">${thumb}</div>
          <div class="category-label">${design.name}<small>${design.type || ""}</small></div>
        </button>
      `;
    })
    .join("");
}

function renderItemTypeGrid() {
  const grid = document.getElementById("itemTypeGrid");
  const cards = itemTypeTree().map((type) => {
    const attrs = type.subTypes.length
      ? `data-filter="itemTypeMenu" data-value="${escapeAttr(type.name)}"`
      : `data-filter="itemType" data-value="${escapeAttr(type.name)}"`;
    const sublabel = type.subTypes.length ? type.subTypes.join(" · ") : "";
    return categoryCard(type.name, itemTypeThumb(type.name), attrs, sublabel);
  });
  cards.push(
    categoryCard(
      "DTF Transfers",
      Catalog.dtf[0] ? Catalog.dtf[0].image : null,
      `data-filter="dtf-jump" data-value="dtf"`
    )
  );

  document.getElementById("itemTypeCrumb").innerHTML = "";
  grid.innerHTML = cards.join("");
}

/* Drill-down for an item type that has subcategories, e.g. Sweatshirts. */
function renderItemSubTypeGrid(typeName) {
  const type = itemTypeTree().find((t) => t.name === typeName);
  if (!type || !type.subTypes.length) return;

  document.getElementById("itemTypeGrid").innerHTML = type.subTypes
    .map((sub) => {
      const styles = Catalog.products.filter(
        (p) => p.status === "Active" && p.itemType === typeName && p.subType === sub
      ).length;
      const attrs = `data-filter="itemSubType" data-value="${escapeAttr(sub)}" data-parent="${escapeAttr(typeName)}"`;
      const sublabel = styles ? `${styles} style${styles === 1 ? "" : "s"}` : "Coming soon";
      return categoryCard(sub, itemTypeThumb(typeName, sub), attrs, sublabel);
    })
    .join("");

  document.getElementById("itemTypeCrumb").innerHTML = `
    <button class="crumb-btn" data-filter="itemTypeRoot">&larr; All item types</button>
    <span class="crumb-current">${typeName}</span>
  `;
}

function renderFitGrid() {
  const grid = document.getElementById("fitGrid");
  const fits = uniqueBy(Catalog.products, (p) => p.fit);

  grid.innerHTML = fits
    .map((p) => {
      const thumb = p.colors && p.colors[0] ? p.colors[0].image : null;
      const thumbHtml = thumb
        ? `<img src="${thumb}" alt="${p.fit} thumbnail" loading="lazy" />`
        : `<span class="placeholder">🎽</span>`;
      return `
        <button class="category-card" data-filter="fit" data-value="${escapeAttr(p.fit)}">
          <div class="category-thumb">${thumbHtml}</div>
          <div class="category-label">${p.fit}<small>${p.sizeRange || ""}</small></div>
        </button>
      `;
    })
    .join("");
}

function escapeAttr(str) {
  return String(str || "").replace(/"/g, "&quot;");
}

/* ---------- Product grid rendering ---------- */

/* A garment whose brand/style has no Products row in the master workbook has no
   base price to show. Like the DTF designs, it is listed and flagged rather than
   given a guessed price, and it cannot be added to the Family Order. */
function isPricingPending(product) {
  return Boolean(product.pricingPending) || product.basePrice === null;
}

function priceRangeLabel(product) {
  if (isPricingPending(product)) return "Pricing TBD";
  const base = product.basePrice;
  const max = base + Math.max(product.upcharge2xl || 0, product.upcharge3xl || 0);
  return max > base ? `${formatCurrency(base)} – ${formatCurrency(max)}` : formatCurrency(base);
}

function renderProductGrid(filter = { type: "all" }) {
  const grid = document.getElementById("productGrid");
  const title = document.getElementById("productSectionTitle");
  const subtitle = document.getElementById("productSectionSubtitle");

  let list = Catalog.products.filter((p) => p.status === "Active");

  if (filter.type === "design") {
    list = list.filter((p) => p.design === filter.value);
    title.textContent = filter.value;
    subtitle.textContent = "Every item currently offered in this design";
  } else if (filter.type === "itemType") {
    list = list.filter((p) => p.itemType === filter.value);
    title.textContent = filter.value;
    subtitle.textContent = "Filtered by item type";
  } else if (filter.type === "itemSubType") {
    list = list.filter(
      (p) => p.subType === filter.value && (!filter.parent || p.itemType === filter.parent)
    );
    title.textContent = filter.value;
    subtitle.textContent = filter.parent
      ? `Filtered by item type · ${filter.parent}`
      : "Filtered by item type";
  } else if (filter.type === "fit") {
    list = list.filter((p) => p.fit === filter.value);
    title.textContent = filter.value;
    subtitle.textContent = "Filtered by fit &amp; size range";
  } else {
    title.textContent = "All Products";
    subtitle.textContent = "Every garment currently available in the master catalog";
  }

  /* Empty categories still scroll into view, so a subcategory that has no
     products yet reads as "nothing here yet" rather than as a dead click. */
  grid.innerHTML = list.length
    ? list.map(renderProductCard).join("")
    : `<p class="cart-empty">No products found in this category yet.</p>`;

  document.getElementById("productSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProductCard(product) {
  const primaryColor = product.colors[0];
  const flagged = primaryColor.mockupConfidence === "approximate";
  return `
    <button class="product-card" data-product-id="${product.id}">
      <div class="product-thumb">
        <img src="${primaryColor.image}" alt="${product.productName} - ${product.design}" loading="lazy" />
      </div>
      <div class="product-info">
        <span class="design-tag">${product.design}</span>
        <h3>${product.productName}</h3>
        <span class="meta">${product.subType || product.itemType} · ${product.fit}</span>
        ${flagged ? `<span class="badge pending">Mockup pending confirmation</span>` : ""}
        ${isPricingPending(product) ? `<span class="badge pending">Pricing pending confirmation</span>` : ""}
        <span class="price">${priceRangeLabel(product)}</span>
      </div>
    </button>
  `;
}

/* ---------- DTF grid ---------- */

function renderDtfGrid() {
  const grid = document.getElementById("dtfGrid");
  grid.innerHTML = Catalog.dtf
    .map((d, index) => {
      const minPrice = d.placements.length ? Math.min(...d.placements.map((p) => p.price)) : null;
      const priceLabel = minPrice !== null ? `From ${formatCurrency(minPrice)}` : "Pricing TBD";
      return `
        <button class="product-card" data-dtf-index="${index}">
          <div class="${thumbClass("product-thumb", d.image)}">
            <img src="${d.image}" alt="${d.name} DTF transfer" loading="lazy" />
          </div>
          <div class="product-info">
            <span class="design-tag">DTF Transfer</span>
            <h3>${d.name}</h3>
            ${d.pricingPending ? `<span class="badge pending">Pricing pending confirmation</span>` : ""}
            <span class="price">${priceLabel}</span>
          </div>
        </button>
      `;
    })
    .join("");
}

/* ---------- Product detail modal ---------- */

/* A product may ship one mockup per print placement (colors[].images keyed by
   placement name). Fall back to colors[].image for products that only have the
   single default-placement mockup. */
function placementOptions(product) {
  return product.placements && product.placements.length ? product.placements : [product.placement];
}

function colorImage(color, placement) {
  return (color.images && color.images[placement]) || color.image;
}

/* A supplied mockup set can cover some colors for a placement and not others.
   When the selected combination has no file, colorImage falls back to that
   color's default mockup, so say which print is actually on screen rather than
   letting it read as the selected placement. */
function shownPlacement(color, placement) {
  if (!color.images || color.images[placement]) return placement;
  const match = Object.keys(color.images).find((p) => color.images[p] === color.image);
  return match || null;
}

function openProductModal(product) {
  activeProduct = product;
  activeColorIndex = 0;
  activeSize = null;
  activeQty = 1;
  activePlacement = placementOptions(product)[0];
  renderProductModal();
  document.getElementById("productModal").classList.add("open");
}

function currentUnitPrice() {
  if (!activeProduct || isPricingPending(activeProduct)) return 0;
  let price = activeProduct.basePrice;
  if (activeSize === "2XL") price += activeProduct.upcharge2xl || 0;
  if (activeSize === "3XL") price += activeProduct.upcharge3xl || 0;
  return price;
}

function renderProductModal() {
  const product = activeProduct;
  const color = product.colors[activeColorIndex];
  const placements = placementOptions(product);

  document.getElementById("modalImage").src = colorImage(color, activePlacement);
  document.getElementById("modalImage").alt = `${product.productName} in ${color.name}, ${activePlacement} print`;
  document.querySelector(".modal-media").classList.remove("is-art");

  const colorSwatches = product.colors
    .map(
      (c, i) => `
      <button class="color-swatch ${i === activeColorIndex ? "selected" : ""}" data-color-index="${i}">
        ${c.name}
      </button>`
    )
    .join("");

  const placementSwatches = placements
    .map(
      (p) => `
      <button class="color-swatch ${p === activePlacement ? "selected" : ""}" data-placement="${escapeAttr(p)}">
        ${p}
      </button>`
    )
    .join("");

  const sizeButtons = product.availableSizes
    .map((size) => {
      const upcharge =
        size === "2XL" ? product.upcharge2xl : size === "3XL" ? product.upcharge3xl : 0;
      return `
        <button class="size-btn ${size === activeSize ? "selected" : ""}" data-size="${size}">
          ${size}
          ${upcharge ? `<span class="upcharge">+${formatCurrency(upcharge)}</span>` : ""}
        </button>`;
    })
    .join("");

  const mockupNote =
    color.mockupConfidence === "approximate"
      ? `<p class="note">This mockup is the closest sample available for ${escapeAttr(
          product.brandStyle
        )} — an exact "${color.name}" mockup hasn't been supplied yet. ${product.notes || ""}</p>`
      : "";

  const shown = shownPlacement(color, activePlacement);
  const placementNote =
    shown === activePlacement
      ? ""
      : `<p class="note">No ${activePlacement} mockup has been supplied for ${color.name} yet${
          shown ? ` — showing the ${shown} print instead` : ""
        }. The print itself is still available in ${activePlacement}.</p>`;

  const pricingNote = isPricingPending(product)
    ? `<p class="note">${escapeAttr(
        product.brandStyle
      )} doesn't have a base price in the master product list yet, so this style can't be added to the Family Order. Ask the team to confirm pricing.</p>`
    : "";

  const priceLabel = isPricingPending(product)
    ? "Pricing TBD"
    : formatCurrency(currentUnitPrice());

  document.getElementById("modalPanel").innerHTML = `
    <span class="design-tag">${product.design}</span>
    <h2 id="modalTitle">${product.productName}</h2>
    <p class="subtitle">${product.brandStyle} · ${product.garmentDescription}</p>
    <p class="subtitle">${product.fit} · Placement: ${activePlacement}</p>
    <div class="modal-price" id="modalPrice">
      ${priceLabel}
      <small>${product.sizeRange} sizing</small>
    </div>

    ${pricingNote}
    ${mockupNote}
    ${placementNote}

    <div class="field-group">
      <label>Select Color</label>
      <div class="color-swatches" id="colorSwatches">${colorSwatches}</div>
    </div>

    ${
      placements.length > 1
        ? `<div class="field-group">
      <label>Select Print Placement</label>
      <div class="color-swatches" id="placementSwatches">${placementSwatches}</div>
    </div>`
        : ""
    }

    <div class="field-group">
      <label>Select Size</label>
      <div class="size-grid" id="sizeGrid">${sizeButtons}</div>
    </div>

    <div class="field-group">
      <label>Quantity</label>
      <div class="qty-row">
        <div class="qty-stepper">
          <button type="button" id="qtyMinus" aria-label="Decrease quantity">&minus;</button>
          <input type="text" id="qtyInput" value="${activeQty}" readonly />
          <button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>
        </div>
      </div>
    </div>

    <button class="btn btn-primary btn-block" id="addToOrderBtn" ${
      isPricingPending(product) ? "disabled" : ""
    }>${isPricingPending(product) ? "Contact team for pricing" : "Add to Family Order"}</button>
  `;

  bindModalControls();
}

function bindModalControls() {
  document.querySelectorAll("#colorSwatches .color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeColorIndex = Number(btn.dataset.colorIndex);
      renderProductModal();
    });
  });

  document.querySelectorAll("#placementSwatches .color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      activePlacement = btn.dataset.placement;
      renderProductModal();
    });
  });

  document.querySelectorAll("#sizeGrid .size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSize = btn.dataset.size;
      updatePriceDisplay();
      document
        .querySelectorAll("#sizeGrid .size-btn")
        .forEach((b) => b.classList.toggle("selected", b === btn));
    });
  });

  document.getElementById("qtyMinus").addEventListener("click", () => {
    activeQty = Math.max(1, activeQty - 1);
    document.getElementById("qtyInput").value = activeQty;
  });
  document.getElementById("qtyPlus").addEventListener("click", () => {
    activeQty = activeQty + 1;
    document.getElementById("qtyInput").value = activeQty;
  });

  document.getElementById("addToOrderBtn").addEventListener("click", handleAddProductToOrder);
}

function updatePriceDisplay() {
  const priceEl = document.getElementById("modalPrice");
  const label = isPricingPending(activeProduct)
    ? "Pricing TBD"
    : formatCurrency(currentUnitPrice());
  priceEl.innerHTML = `${label}<small>${activeProduct.sizeRange} sizing</small>`;
}

function handleAddProductToOrder() {
  if (isPricingPending(activeProduct)) {
    showToast("This style has no confirmed price yet.");
    return;
  }
  if (!activeSize) {
    showToast("Please select a size first.");
    return;
  }
  const color = activeProduct.colors[activeColorIndex];
  Cart.add({
    productId: activeProduct.id,
    name: activeProduct.productName,
    design: activeProduct.design,
    itemType: activeProduct.itemType,
    color: color.name,
    size: activeSize,
    placement: activePlacement,
    quantity: activeQty,
    unitPrice: currentUnitPrice(),
    image: colorImage(color, activePlacement),
  });
  renderCart();
  showToast(
    `Added ${activeProduct.productName} (${color.name}, ${activeSize}, ${activePlacement}) to your Family Order.`
  );
  closeProductModal();
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
  document.getElementById("modalImage").parentElement.style.display = "";
  activeProduct = null;
  activePlacement = null;
}

/* ---------- DTF detail modal (reuses the same product modal shell) ---------- */

function openDtfModal(dtf) {
  activeQty = 1;
  let activePlacementIndex = 0;

  document.getElementById("modalImage").src = dtf.image;
  document.getElementById("modalImage").alt = `${dtf.name} DTF transfer`;
  document.querySelector(".modal-media").classList.toggle("is-art", isArtwork(dtf.image));

  const render = () => {
    const placement = dtf.placements[activePlacementIndex];
    const placementButtons = dtf.placements
      .map(
        (p, i) => `
        <button class="color-swatch ${i === activePlacementIndex ? "selected" : ""}" data-placement-index="${i}">
          ${p.label} (${formatCurrency(p.price)})
        </button>`
      )
      .join("");

    const priceLabel = placement ? formatCurrency(placement.price) : "TBD";
    const pendingNote = dtf.pricingPending
      ? `<p class="note">${dtf.notes || "Pricing for this design has not been confirmed yet."}</p>`
      : "";

    document.getElementById("modalPanel").innerHTML = `
      <span class="design-tag">DTF Transfer</span>
      <h2 id="modalTitle">${dtf.name}</h2>
      <p class="subtitle">Iron-on transfer decal</p>
      <div class="modal-price" id="modalPrice">${priceLabel}</div>

      ${pendingNote}

      ${
        dtf.placements.length
          ? `<div class="field-group">
              <label>Select Size / Placement</label>
              <div class="color-swatches" id="placementSwatches">${placementButtons}</div>
            </div>`
          : ""
      }

      <div class="field-group">
        <label>Quantity</label>
        <div class="qty-row">
          <div class="qty-stepper">
            <button type="button" id="qtyMinus" aria-label="Decrease quantity">&minus;</button>
            <input type="text" id="qtyInput" value="${activeQty}" readonly />
            <button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-block" id="addToOrderBtn" ${
        dtf.placements.length === 0 ? "disabled" : ""
      }>${dtf.placements.length === 0 ? "Contact team for pricing" : "Add to Family Order"}</button>
    `;

    document.querySelectorAll("#placementSwatches .color-swatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        activePlacementIndex = Number(btn.dataset.placementIndex);
        render();
      });
    });

    const qtyInput = document.getElementById("qtyInput");
    const minus = document.getElementById("qtyMinus");
    const plus = document.getElementById("qtyPlus");
    if (minus) minus.addEventListener("click", () => { activeQty = Math.max(1, activeQty - 1); qtyInput.value = activeQty; });
    if (plus) plus.addEventListener("click", () => { activeQty = activeQty + 1; qtyInput.value = activeQty; });

    const addBtn = document.getElementById("addToOrderBtn");
    if (addBtn && dtf.placements.length) {
      addBtn.addEventListener("click", () => {
        const placement = dtf.placements[activePlacementIndex];
        Cart.add({
          productId: `dtf-${dtf.name}`,
          name: `DTF Transfer — ${dtf.name}`,
          design: dtf.name,
          itemType: "DTF Transfer",
          color: null,
          size: null,
          placement: placement.label,
          quantity: activeQty,
          unitPrice: placement.price,
          image: dtf.image,
        });
        renderCart();
        showToast(`Added ${dtf.name} DTF transfer (${placement.label}) to your Family Order.`);
        closeProductModal();
      });
    }
  };

  render();
  document.getElementById("productModal").classList.add("open");
}

/* ---------- Wiring ---------- */

function setActiveNav(button) {
  document.querySelectorAll(".shop-nav-btn").forEach((b) => b.classList.remove("active"));
  if (button) button.classList.add("active");
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadCatalog();
  } catch (error) {
    console.error("Catalog failed to load", error);
    const grid = document.getElementById("productGrid");
    if (grid) grid.innerHTML = `<p class="cart-empty">The catalog could not load. Please verify the files in the data folder and refresh.</p>`;
    return;
  }
  renderDesignGrid();
  renderItemTypeGrid();
  renderFitGrid();
  renderProductGrid();
  renderDtfGrid();

  document.getElementById("shopNav").addEventListener("click", (e) => {
    const btn = e.target.closest(".shop-nav-btn");
    if (!btn) return;
    setActiveNav(btn);
    const filterType = btn.dataset.filterType;
    if (filterType === "all") {
      renderProductGrid({ type: "all" });
    } else if (filterType === "dtf") {
      document.getElementById("dtfSection").scrollIntoView({ behavior: "smooth" });
    } else if (filterType === "design-menu") {
      document.getElementById("designSection").scrollIntoView({ behavior: "smooth" });
    } else if (filterType === "item-menu") {
      document.getElementById("itemTypeSection").scrollIntoView({ behavior: "smooth" });
    } else if (filterType === "fit-menu") {
      document.getElementById("fitSection").scrollIntoView({ behavior: "smooth" });
    }
  });

  document.getElementById("designGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".category-card");
    if (!card) return;
    setActiveNav(null);
    renderProductGrid({ type: "design", value: card.dataset.value });
  });

  document.getElementById("itemTypeGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".category-card");
    if (!card) return;
    if (card.dataset.filter === "dtf-jump") {
      document.getElementById("dtfSection").scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (card.dataset.filter === "itemTypeMenu") {
      renderItemSubTypeGrid(card.dataset.value);
      return;
    }
    setActiveNav(null);
    if (card.dataset.filter === "itemSubType") {
      renderProductGrid({
        type: "itemSubType",
        value: card.dataset.value,
        parent: card.dataset.parent,
      });
      return;
    }
    renderProductGrid({ type: "itemType", value: card.dataset.value });
  });

  document.getElementById("itemTypeCrumb").addEventListener("click", (e) => {
    if (e.target.closest(".crumb-btn")) renderItemTypeGrid();
  });

  document.getElementById("fitGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".category-card");
    if (!card) return;
    setActiveNav(null);
    renderProductGrid({ type: "fit", value: card.dataset.value });
  });

  document.getElementById("productGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const product = Catalog.products.find((p) => p.id === card.dataset.productId);
    if (product) openProductModal(product);
  });

  document.getElementById("dtfGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const dtf = Catalog.dtf[Number(card.dataset.dtfIndex)];
    if (dtf) openDtfModal(dtf);
  });

  document.getElementById("closeModalBtn").addEventListener("click", closeProductModal);
  document.getElementById("productModal").addEventListener("click", (e) => {
    if (e.target.id === "productModal") closeProductModal();
  });
});
