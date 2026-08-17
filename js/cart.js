/* Coastal Ghost Team Shop
   Family Order Cart
   Works with:
   - index.html
   - products.js via the "coastalghost:add-to-cart" event
*/

(function () {
  "use strict";

  const STORAGE_KEY = "coastalGhostFamilyOrder";

  const els = {
    open: document.getElementById("openCartBtn"),
    close: document.getElementById("closeCartBtn"),
    drawer: document.getElementById("cartDrawer"),
    backdrop: document.getElementById("drawerBackdrop"),
    count: document.getElementById("cartCount"),
    items: document.getElementById("cartItems"),
    total: document.getElementById("cartTotal"),
    checkout: document.getElementById("checkoutBtn"),
    toast: document.getElementById("toast")
  };

  let cart = loadCart();

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn("Could not save Family Order.", error);
    }

    document.dispatchEvent(
      new CustomEvent("coastalghost:cart-updated", {
        detail: getCartSummary()
      })
    );
  }

  function money(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function lineTotal(item) {
    return Number(item.price || 0) * Number(item.qty || 0);
  }

  function getCartSummary() {
    return {
      items: cart,
      count: cart.reduce((sum, item) => sum + Number(item.qty || 0), 0),
      total: cart.reduce((sum, item) => sum + lineTotal(item), 0)
    };
  }

  function openCart() {
    if (!els.drawer) return;

    els.drawer.classList.add("open");
    els.backdrop?.classList.add("open");
    document.body.classList.add("cart-open");
  }

  function closeCart() {
    els.drawer?.classList.remove("open");
    els.backdrop?.classList.remove("open");
    document.body.classList.remove("cart-open");
  }

  function renderCart() {
    const summary = getCartSummary();

    if (els.count) els.count.textContent = summary.count;
    if (els.total) els.total.textContent = money(summary.total);

    if (!els.items) return;

    if (!cart.length) {
      els.items.innerHTML = `
        <div class="cart-empty">
          <strong>Your Family Order is empty.</strong>
          <span>Add gear from anywhere in the shop and it will all appear here.</span>
        </div>
      `;
      return;
    }

    els.items.innerHTML = cart.map((item, index) => {
      const title = item.name ||
        [item.design, item.productName || item.itemType || item.item]
          .filter(Boolean)
          .join(" — ") ||
        "Coastal Ghost Item";

      const details = [
        item.color,
        item.size,
        item.placement,
        item.fit
      ].filter(Boolean).join(" · ");

      return `
        <article class="cart-item" data-cart-index="${index}">
          ${item.image ? `
            <img
              class="cart-item-image"
              src="${escapeHTML(item.image)}"
              alt="${escapeHTML(title)}"
            />
          ` : ""}

          <div class="cart-item-info">
            <strong>${escapeHTML(title)}</strong>
            ${details ? `<span class="cart-item-details">${escapeHTML(details)}</span>` : ""}
            <span class="cart-item-price">${money(item.price)} each</span>

            <div class="cart-item-controls">
              <label class="cart-qty-control">
                <span class="sr-only">Quantity</span>
                <button type="button" data-cart-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value="${Math.max(1, Number(item.qty || 1))}"
                  data-cart-action="quantity"
                  data-index="${index}"
                  aria-label="Quantity for ${escapeHTML(title)}"
                />
                <button type="button" data-cart-action="increase" data-index="${index}" aria-label="Increase quantity">+</button>
              </label>

              <strong class="cart-line-total">${money(lineTotal(item))}</strong>

              <button
                class="cart-remove"
                type="button"
                data-cart-action="remove"
                data-index="${index}"
              >
                Remove
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function updateCart() {
    renderCart();
    saveCart();
  }

  function normalizeItem(item) {
    const quantity = Math.max(1, Number(item.qty ?? item.quantity ?? 1));

    return {
      id: item.id || cryptoSafeId(),
      productId: item.productId || item.styleId || item.groupId || "",
      name: item.name || "",
      design: item.design || "",
      productName: item.productName || item.itemType || item.item || "",
      itemType: item.itemType || item.item || "",
      styleId: item.styleId || "",
      color: item.color || "",
      size: item.size || "",
      placement: item.placement || "",
      fit: item.fit || "",
      image: item.image || "",
      price: Number(item.price || 0),
      qty: quantity,
      isDTF: Boolean(item.isDTF)
    };
  }

  function cryptoSafeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "cg-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function sameSelection(a, b) {
    return (
      a.productId === b.productId &&
      a.name === b.name &&
      a.design === b.design &&
      a.productName === b.productName &&
      a.color === b.color &&
      a.size === b.size &&
      a.placement === b.placement &&
      a.price === b.price &&
      a.isDTF === b.isDTF
    );
  }

  function addItem(item) {
    if (!item) return;

    const newItem = normalizeItem(item);

    // Identical selections combine into one line.
    const existing = cart.find(existingItem =>
      sameSelection(existingItem, newItem)
    );

    if (existing) {
      existing.qty += newItem.qty;
    } else {
      cart.push(newItem);
    }

    updateCart();
    showToast(`${newItem.qty} item${newItem.qty === 1 ? "" : "s"} added to Family Order`);
  }

  function removeItem(index) {
    if (!cart[index]) return;

    cart.splice(index, 1);
    updateCart();
  }

  function setQuantity(index, quantity) {
    if (!cart[index]) return;

    const qty = Math.floor(Number(quantity));

    if (!Number.isFinite(qty) || qty < 1) {
      removeItem(index);
      return;
    }

    cart[index].qty = qty;
    updateCart();
  }

  function changeQuantity(index, amount) {
    if (!cart[index]) return;
    setQuantity(index, Number(cart[index].qty || 1) + amount);
  }

  function clearCart() {
    cart = [];
    updateCart();
  }

  function showToast(message) {
    if (!els.toast) return;

    els.toast.textContent = message;
    els.toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2600);
  }

  // PRODUCTS.JS SENDS ITEMS HERE
  document.addEventListener("coastalghost:add-to-cart", event => {
    const detail = event.detail;

    if (Array.isArray(detail)) {
      detail.forEach(addItem);
    } else if (detail && Array.isArray(detail.items)) {
      detail.items.forEach(addItem);
    } else if (detail) {
      addItem(detail);
    }
  });

  // CART BUTTONS
  els.open?.addEventListener("click", openCart);
  els.close?.addEventListener("click", closeCart);
  els.backdrop?.addEventListener("click", closeCart);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCart();
  });

  els.items?.addEventListener("click", event => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;

    const index = Number(button.dataset.index);
    const action = button.dataset.cartAction;

    if (action === "increase") {
      changeQuantity(index, 1);
    }

    if (action === "decrease") {
      changeQuantity(index, -1);
    }

    if (action === "remove") {
      removeItem(index);
    }
  });

  els.items?.addEventListener("change", event => {
    const input = event.target.closest('input[data-cart-action="quantity"]');
    if (!input) return;

    setQuantity(Number(input.dataset.index), input.value);
  });

  // OPTIONAL GLOBAL API FOR checkout.js AND FUTURE CODE
  window.CoastalGhostCart = {
    getItems: () => [...cart],
    getSummary: getCartSummary,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    open: openCart,
    close: closeCart
  };

  // INITIAL RENDER
  renderCart();
})();
