/* Coastal Ghost Team Shop — product catalog controller
   Reads:
   data/designs.json
   data/styles.json
   data/product-groups.json
   data/dtf-products.json
*/

let SHOP = { designs: [], styles: [], groups: [], dtf: [] };
let activeProducts = [];

const $ = (id) => document.getElementById(id);
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const titleCase = (s) => String(s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

async function loadShopData() {
  const [designs, styles, groups, dtf] = await Promise.all([
    fetch('data/designs.json').then(r => r.json()),
    fetch('data/styles.json').then(r => r.json()),
    fetch('data/product-groups.json').then(r => r.json()),
    fetch('data/dtf-products.json').then(r => r.json())
  ]);
  SHOP = { designs, styles, groups, dtf };
  buildCatalog();
}

function styleFor(styleId) {
  return SHOP.styles.find(s => s.styleId === styleId);
}

function groupLabel(group) {
  const style = styleFor(group.styleId) || {};
  return `${titleCase(group.design)} — ${style.productName || group.styleId}`;
}

function firstImage(group) {
  return group.mockups?.[0]?.image || '';
}

function pricedGroups(groups) {
  return groups.filter(g => styleFor(g.styleId)?.basePrice !== null && styleFor(g.styleId)?.basePrice !== undefined);
}

function buildCatalog() {
  renderDesignCards();
  renderItemTypeCards();
  renderFitCards();
  renderProducts(pricedGroups(SHOP.groups));
  renderDTF();
  bindNav();
}

function renderDesignCards() {
  const el = $('designGrid');
  if (!el) return;
  const cards = SHOP.designs.map(d => {
    const groups = pricedGroups(SHOP.groups.filter(g => g.design === d.id));
    const image = d.thumbnail || firstImage(groups[0]);
    if (!groups.length) return '';
    return `<button class="category-card" type="button" data-design="${d.id}">
      <img src="${image}" alt="${d.name}" loading="lazy">
      <span>${d.name}</span>
    </button>`;
  }).join('');
  el.innerHTML = cards;
  el.querySelectorAll('[data-design]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.design;
    const list = pricedGroups(SHOP.groups.filter(g => g.design === id));
    renderProducts(list, `${btn.textContent.trim()} Products`);
    $('productSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderItemTypeCards() {
  const el = $('itemTypeGrid');
  if (!el) return;
  const types = [...new Set(SHOP.styles.map(s => s.itemType))];
  el.innerHTML = types.map(type => {
    const groups = pricedGroups(SHOP.groups.filter(g => styleFor(g.styleId)?.itemType === type));
    if (!groups.length) return '';
    return `<button class="category-card" type="button" data-type="${type}">
      <img src="${firstImage(groups[0])}" alt="${type}" loading="lazy"><span>${type}</span>
    </button>`;
  }).join('');
  el.querySelectorAll('[data-type]').forEach(btn => btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    renderProducts(pricedGroups(SHOP.groups.filter(g => styleFor(g.styleId)?.itemType === type)), type);
    $('productSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderFitCards() {
  const el = $('fitGrid');
  if (!el) return;
  const fits = [...new Set(SHOP.styles.map(s => `${s.fit}|${s.sizeRange}`))];
  el.innerHTML = fits.map(key => {
    const [fit, range] = key.split('|');
    const groups = pricedGroups(SHOP.groups.filter(g => {
      const s = styleFor(g.styleId); return s && s.fit === fit && s.sizeRange === range;
    }));
    if (!groups.length) return '';
    return `<button class="category-card" type="button" data-fit="${key}">
      <img src="${firstImage(groups[0])}" alt="${fit}" loading="lazy"><span>${fit}</span>
    </button>`;
  }).join('');
  el.querySelectorAll('[data-fit]').forEach(btn => btn.addEventListener('click', () => {
    const [fit, range] = btn.dataset.fit.split('|');
    renderProducts(pricedGroups(SHOP.groups.filter(g => {
      const s = styleFor(g.styleId); return s && s.fit === fit && s.sizeRange === range;
    })), `${fit} · ${range}`);
    $('productSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderProducts(groups, heading = 'All Products') {
  activeProducts = groups;
  if ($('productSectionTitle')) $('productSectionTitle').textContent = heading;
  if ($('productSectionSubtitle')) $('productSectionSubtitle').textContent = `${groups.length} product style${groups.length === 1 ? '' : 's'} currently available`;
  const el = $('productGrid');
  if (!el) return;
  el.innerHTML = groups.map(g => {
    const s = styleFor(g.styleId);
    const image = firstImage(g);
    return `<article class="product-card">
      <div class="product-card-image"><img src="${image}" alt="${groupLabel(g)}" loading="lazy"></div>
      <div class="product-card-body">
        <div class="product-meta">${s.itemType} · ${s.fit}</div>
        <h3>${groupLabel(g)}</h3>
        <p>${s.brand || g.styleId.toUpperCase()} · ${g.mockups.length} mockup${g.mockups.length === 1 ? '' : 's'}</p>
        <strong>From ${money(s.basePrice)}</strong>
        <button class="btn btn-primary" type="button" data-product="${g.id}">Choose Options</button>
      </div>
    </article>`;
  }).join('');
  el.querySelectorAll('[data-product]').forEach(btn => btn.addEventListener('click', () => openProduct(btn.dataset.product)));
}

function openProduct(id) {
  const group = SHOP.groups.find(g => g.id === id);
  const style = styleFor(group.styleId);
  if (!group || !style) return;
  const modal = $('productModal');
  const image = $('modalImage');
  image.src = firstImage(group);
  image.alt = groupLabel(group);

  const colors = [...new Set(group.mockups.map(m => m.color))];
  const placements = [...new Set(group.mockups.map(m => m.placement))];
  const sizes = style.sizeRange === 'Youth' ? ['XS','S','M','L','XL'] : ['S','M','L','XL','2XL','3XL'];
  const select = (label, values, id) => `<label class="field-label">${label}<select id="${id}">${values.map(v => `<option value="${v}">${v}</option>`).join('')}</select></label>`;

  $('modalPanel').innerHTML = `
    <div class="product-meta">${style.itemType} · ${style.fit}</div>
    <h2 id="modalTitle">${groupLabel(group)}</h2>
    <p>${style.brand || group.styleId.toUpperCase()}</p>
    <div class="product-options">
      ${select('Color', colors, 'productColor')}
      ${select('Logo Placement', placements, 'productPlacement')}
      ${select('Size', sizes, 'productSize')}
      <label class="field-label">Quantity<input id="productQty" type="number" min="1" value="1"></label>
    </div>
    <div class="modal-price" id="modalPrice">${money(style.basePrice)}</div>
    <button class="btn btn-primary btn-block" id="addProductBtn" type="button">Add to Family Order</button>`;

  const colorSelect = $('productColor');
  const placementSelect = $('productPlacement');
  const sizeSelect = $('productSize');
  const update = () => {
    const match = group.mockups.find(m => m.color === colorSelect.value && m.placement === placementSelect.value)
      || group.mockups.find(m => m.color === colorSelect.value)
      || group.mockups[0];
    image.src = match.image;
    const up = style.sizeUpcharges?.[sizeSelect.value] || 0;
    $('modalPrice').textContent = money(Number(style.basePrice) + Number(up));
  };
  colorSelect.addEventListener('change', update);
  placementSelect.addEventListener('change', update);
  sizeSelect.addEventListener('change', update);
  $('addProductBtn').addEventListener('click', () => {
    const qty = Math.max(1, Number($('productQty').value || 1));
    const match = group.mockups.find(m => m.color === colorSelect.value && m.placement === placementSelect.value)
      || group.mockups.find(m => m.color === colorSelect.value)
      || group.mockups[0];
    const unitPrice = Number(style.basePrice) + Number(style.sizeUpcharges?.[sizeSelect.value] || 0);
    const item = { id: `${group.id}-${colorSelect.value}-${placementSelect.value}-${sizeSelect.value}`, name: groupLabel(group), styleId: group.styleId, design: group.design, color: colorSelect.value, placement: placementSelect.value, size: sizeSelect.value, qty, unitPrice, image: match.image };
    window.dispatchEvent(new CustomEvent('coastalghost:add-to-cart', { detail: item }));
    modal.classList.remove('open');
    modal.style.display = 'none';
  });
  modal.classList.add('open');
  modal.style.display = 'flex';
}

function renderDTF() {
  const el = $('dtfGrid');
  if (!el) return;
  el.innerHTML = SHOP.dtf.map((d, i) => `<article class="product-card">
    <div class="product-card-image"><img src="${d.image}" alt="${d.name}" loading="lazy"></div>
    <div class="product-card-body"><h3>${d.name}</h3><p>DTF iron-on transfer</p><button class="btn btn-primary" type="button" data-dtf="${i}">Choose Size</button></div>
  </article>`).join('');
  el.querySelectorAll('[data-dtf]').forEach(btn => btn.addEventListener('click', () => openDTF(Number(btn.dataset.dtf))));
}

function openDTF(index) {
  const d = SHOP.dtf[index];
  const modal = $('productModal');
  $('modalImage').src = d.image;
  $('modalImage').alt = d.name;
  $('modalPanel').innerHTML = `<h2 id="modalTitle">${d.name}</h2>
    <label class="field-label">Transfer Size<select id="dtfOption">${d.options.map((o,i)=>`<option value="${i}">${o.label} — ${o.dimensions || ''} — ${money(o.price)}</option>`).join('')}</select></label>
    <label class="field-label">Quantity<input id="dtfQty" type="number" min="1" value="1"></label>
    <button class="btn btn-primary btn-block" id="addDTFBtn" type="button">Add to Family Order</button>`;
  $('addDTFBtn').addEventListener('click', () => {
    const opt = d.options[Number($('dtfOption').value)];
    const qty = Math.max(1, Number($('dtfQty').value || 1));
    window.dispatchEvent(new CustomEvent('coastalghost:add-to-cart', { detail: { id:`${d.id}-${opt.label}`, name:d.name, type:'DTF Transfer', option:opt.label, dimensions:opt.dimensions, qty, unitPrice:opt.price, image:d.image } }));
    modal.classList.remove('open'); modal.style.display = 'none';
  });
  modal.classList.add('open'); modal.style.display = 'flex';
}

function bindNav() {
  document.querySelectorAll('.shop-nav-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.shop-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.dataset.filterType;
    if (type === 'all') renderProducts(pricedGroups(SHOP.groups));
    else if (type === 'dtf') $('dtfSection')?.scrollIntoView({ behavior:'smooth' });
    else if (type === 'design-menu') $('designSection')?.scrollIntoView({ behavior:'smooth' });
    else if (type === 'item-menu') $('itemTypeSection')?.scrollIntoView({ behavior:'smooth' });
    else if (type === 'fit-menu') $('fitSection')?.scrollIntoView({ behavior:'smooth' });
  }));
  $('closeModalBtn')?.addEventListener('click', () => { $('productModal').classList.remove('open'); $('productModal').style.display='none'; });
}

document.addEventListener('DOMContentLoaded', () => loadShopData().catch(err => {
  console.error(err);
  const grid = $('productGrid');
  if (grid) grid.innerHTML = '<p>Unable to load product data. Check the data folder and file names.</p>';
}));
