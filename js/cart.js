/* Coastal Ghost Team Shop — Family Order cart
   Cart lives in localStorage so a family can build one order across
   multiple products before checkout is wired up to real payments. */

const CART_STORAGE_KEY = "coastalGhostFamilyOrder";

const Cart = {
  items: [],

  load() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      this.items = raw ? JSON.parse(raw) : [];
    } catch (err) {
      this.items = [];
    }
    return this.items;
  },

  save() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
  },

  // A cart line is unique per product + color + size + placement combo.
  lineKey(item) {
    return [item.productId, item.color, item.size, item.placement].join("::");
  },

  add(item) {
    const key = this.lineKey(item);
    const existing = this.items.find((i) => this.lineKey(i) === key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push(item);
    }
    this.save();
  },

  updateQuantity(key, quantity) {
    const line = this.items.find((i) => this.lineKey(i) === key);
    if (!line) return;
    if (quantity <= 0) {
      this.remove(key);
      return;
    }
    line.quantity = quantity;
    this.save();
  },

  remove(key) {
    this.items = this.items.filter((i) => this.lineKey(i) !== key);
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  lineTotal(item) {
    return item.unitPrice * item.quantity;
  },

  grandTotal() {
    return this.items.reduce((sum, item) => sum + this.lineTotal(item), 0);
  },

  itemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },
};

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderCart() {
  const listEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");

  const items = Cart.items;
  countEl.textContent = Cart.itemCount();

  if (items.length === 0) {
    listEl.innerHTML = `<p class="cart-empty">Your family order is empty.<br>Add a product to get started.</p>`;
    totalEl.textContent = formatCurrency(0);
    return;
  }

  listEl.innerHTML = items
    .map((item) => {
      const key = Cart.lineKey(item);
      const metaBits = [item.design, item.color, item.size, item.placement]
        .filter(Boolean)
        .join(" · ");
      // DTF artwork is fitted inside the square thumb; garment photos still fill it.
      const imgClass = (item.image || "").startsWith("assets/dtf/") ? ' class="is-art"' : "";
      return `
        <div class="cart-item" data-key="${encodeURIComponent(key)}">
          <img${imgClass} src="${item.image || ""}" alt="${item.name}" />
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>${metaBits}</p>
            <p>Qty ${item.quantity} &times; ${formatCurrency(item.unitPrice)}</p>
          </div>
          <div class="cart-item-actions">
            <span class="line-total">${formatCurrency(Cart.lineTotal(item))}</span>
            <button class="remove-btn" data-action="remove">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");

  totalEl.textContent = formatCurrency(Cart.grandTotal());
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

function openCartDrawer() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("drawerBackdrop").classList.add("open");
}

function closeCartDrawer() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("drawerBackdrop").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  Cart.load();
  renderCart();

  document.getElementById("openCartBtn").addEventListener("click", openCartDrawer);
  document.getElementById("closeCartBtn").addEventListener("click", closeCartDrawer);
  document.getElementById("drawerBackdrop").addEventListener("click", closeCartDrawer);

  document.getElementById("cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="remove"]');
    if (!btn) return;
    const row = btn.closest(".cart-item");
    const key = decodeURIComponent(row.dataset.key);
    Cart.remove(key);
    renderCart();
  });
});
