/* Coastal Ghost Team Shop — cart controller */

(() => {
  const STORAGE_KEY = 'coastalGhostFamilyOrder';

  let cart = [];

  const $ = (id) => document.getElementById(id);

  function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  function loadCart() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      cart = saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Could not load cart:', error);
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Could not save cart:', error);
    }
  }

  function getCartCount() {
    return cart.reduce((total, item) => {
      return total + Number(item.qty || 0);
    }, 0);
  }

  function getCartTotal() {
    return cart.reduce((total, item) => {
      return total + (
        Number(item.qty || 0) *
        Number(item.unitPrice || 0)
      );
    }, 0);
  }

  function updateCartCount() {
    const count = $('cartCount');

    if (count) {
      count.textContent = getCartCount();
    }
  }

  function renderCart() {
    const cartItems = $('cartItems');
    const cartTotal = $('cartTotal');

    updateCartCount();

    if (cartTotal) {
      cartTotal.textContent = money(getCartTotal());
    }

    if (!cartItems) return;

    if (!cart.length) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <p>Your Cart is empty.</p>
          <p>Choose an item to get started.</p>
        </div>
      `;
      return;
    }

    cartItems.innerHTML = cart.map((item, index) => {
      const details = [];

if (item.color) details.push(item.color);
if (item.size) details.push(item.size);
if (item.placement) details.push(item.placement);
if (item.option) details.push(item.option);
if (item.dimensions) details.push(item.dimensions);

if (item.playerName) {
  details.push(`Name: ${item.playerName}`);
}

if (item.playerNumber) {
  details.push(`Number: ${item.playerNumber}`);
},
      
      return `
        <article class="cart-item">
          <div class="cart-item-image">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name || 'Product'}">`
                : ''
            }
          </div>

          <div class="cart-item-details">
            <strong>${item.name || 'Product'}</strong>

            ${
              details.length
                ? `<div class="cart-item-meta">${details.join(' · ')}</div>`
                : ''
            }

            <div class="cart-item-price">
              ${money(item.unitPrice)} each
            </div>

            <div class="cart-item-controls">

              <div class="quantity-control">
                <button
                  type="button"
                  class="cart-qty-btn"
                  data-action="decrease"
                  data-index="${index}"
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <span>${item.qty}</span>

                <button
                  type="button"
                  class="cart-qty-btn"
                  data-action="increase"
                  data-index="${index}"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                class="cart-remove"
                data-action="remove"
                data-index="${index}"
              >
                Remove
              </button>

            </div>

            <div class="cart-line-total">
              ${money(Number(item.unitPrice) * Number(item.qty))}
            </div>

          </div>
        </article>
      `;
    }).join('');

    cartItems.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === 'increase') {
          cart[index].qty += 1;
        }

        if (action === 'decrease') {
          cart[index].qty -= 1;

          if (cart[index].qty <= 0) {
            cart.splice(index, 1);
          }
        }

        if (action === 'remove') {
          cart.splice(index, 1);
        }

        saveCart();
        renderCart();
      });
    });
  }

  function addToCart(item) {
    if (!item) return;

    const quantity = Math.max(
      1,
      Number(item.qty || 1)
    );

    const existingItem = cart.find(
      cartItem => cartItem.id === item.id
    );

    if (existingItem) {
      existingItem.qty += quantity;
    } else {
      cart.push({
        ...item,
        qty: quantity,
        unitPrice: Number(item.unitPrice || 0)
      });
    }

    saveCart();
    renderCart();
    openCart();

    showToast(`${item.name || 'Item'} added to Cart`);
  }

  function openCart() {
    const drawer = $('cartDrawer');
    const backdrop = $('drawerBackdrop');

    if (drawer) {
      drawer.classList.add('open');
    }

    if (backdrop) {
      backdrop.classList.add('open');
    }
  }

  function closeCart() {
    const drawer = $('cartDrawer');
    const backdrop = $('drawerBackdrop');

    if (drawer) {
      drawer.classList.remove('open');
    }

    if (backdrop) {
      backdrop.classList.remove('open');
    }
  }

  function showToast(message) {
    const toast = $('toast');

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(window.coastalGhostToastTimer);

    window.coastalGhostToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  /*
    This is the important connection.

    products.js dispatches:

    coastalghost:add-to-cart

    cart.js listens for that exact event.
  */

  window.addEventListener(
    'coastalghost:add-to-cart',
    (event) => {
      addToCart(event.detail);
    }
  );

  /*
    Allow checkout.js or other scripts
    to access the current cart.
  */

  window.CoastalGhostCart = {
    getItems: () => [...cart],

    getTotal: () => getCartTotal(),

    getCount: () => getCartCount(),

    clear: () => {
      cart = [];
      saveCart();
      renderCart();
    },

    add: addToCart,

    open: openCart,

    close: closeCart
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();

    $('openCartBtn')?.addEventListener('click', openCart);

    $('closeCartBtn')?.addEventListener('click', closeCart);

    $('drawerBackdrop')?.addEventListener('click', closeCart);
  });

})();
