// ============================================
// Coastal Ghost Team Shop
// checkout.js
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", () => {
    const cart = getCartForCheckout();

    if (!cart.length) {
      showCheckoutToast("Your Cart is empty.");
      return;
    }

    openOrderReview(cart);
  });
});


// ============================================
// GET CART
// ============================================

function getCartForCheckout() {
  let possibleCarts = [];

  // --------------------------------------------
  // Try window.Cart first
  // --------------------------------------------
  if (
    window.Cart &&
    typeof window.Cart.getItems === "function"
  ) {
    try {
      const cartItems = window.Cart.getItems();

      if (Array.isArray(cartItems)) {
        possibleCarts.push(cartItems);
      }
    } catch (error) {
      console.warn("Could not get cart from window.Cart", error);
    }
  }


  // --------------------------------------------
  // Try getCart helper
  // --------------------------------------------
  if (typeof getCart === "function") {
    try {
      const cartItems = getCart();

      if (Array.isArray(cartItems)) {
        possibleCarts.push(cartItems);
      }
    } catch (error) {
      console.warn("Could not get cart from getCart()", error);
    }
  }


  // --------------------------------------------
  // Try common localStorage cart keys
  // --------------------------------------------
  const cartKeys = [
    "coastalGhostCart",
    "cart",
    "coastal-ghost-cart",
    "coastalGhostOrder",
    "order"
  ];

  cartKeys.forEach((key) => {
    try {
      const storedCart =
        JSON.parse(localStorage.getItem(key));

      if (Array.isArray(storedCart)) {
        possibleCarts.push(storedCart);
      }
    } catch (error) {
      // Ignore invalid localStorage data
    }
  });


  // --------------------------------------------
  // Return the first cart that actually has items
  // --------------------------------------------
  const populatedCart =
    possibleCarts.find(
      (cart) =>
        Array.isArray(cart) &&
        cart.length > 0
    );

  return populatedCart || [];
}


// ============================================
// CALCULATE ORDER TOTAL
// ============================================

function getCheckoutTotal(cart) {
  return cart.reduce((total, item) => {
    const quantity =
      Number(item.quantity || 1);

    const price =
      Number(
        item.price ||
        item.unitPrice ||
        item.basePrice ||
        0
      );

    return total + (price * quantity);
  }, 0);
}


// ============================================
// OPEN ORDER REVIEW
// ============================================

function openOrderReview(cart) {
  const existingModal =
    document.getElementById("orderReviewModal");

  if (existingModal) {
    existingModal.remove();
  }

  const total =
    getCheckoutTotal(cart);

  const modal =
    document.createElement("div");

  modal.id = "orderReviewModal";

  modal.className =
    "modal-overlay checkout-modal";

  modal.innerHTML = `
    <div class="modal checkout-review-modal">

      <button
        class="modal-close"
        id="closeOrderReview"
        aria-label="Close"
      >
        &times;
      </button>

      <div class="checkout-review">

        <div class="checkout-review-header">

          <span class="eyebrow">
            Coastal Ghost Baseball
          </span>

          <h2>Review Your Order</h2>

          <p>
            Check your selections before checking out.
          </p>

        </div>


        <div class="checkout-order-items">

          ${cart
            .map(renderCheckoutItem)
            .join("")}

        </div>


        <div class="checkout-summary">

          <div class="checkout-total-row">

            <span>Total Items</span>

            <strong>
              ${cart.reduce(
                (total, item) =>
                  total +
                  Number(item.quantity || 1),
                0
              )}
            </strong>

          </div>


          <div
            class="
              checkout-total-row
              checkout-grand-total
            "
          >

            <span>Order Total</span>

            <strong>
              $${total.toFixed(2)}
            </strong>

          </div>

        </div>


        <div class="checkout-actions">

          <button
            class="btn btn-secondary"
            id="backToCartBtn"
            type="button"
          >
            Back to Order
          </button>


          <button
            class="btn btn-primary"
            id="copyOrderBtn"
            type="button"
          >
            Check Out
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  // ============================================
  // CLOSE BUTTON
  // ============================================

  document
    .getElementById("closeOrderReview")
    .addEventListener(
      "click",
      closeOrderReview
    );


  // ============================================
  // CLICK OUTSIDE MODAL
  // ============================================

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        closeOrderReview();
      }
    }
  );


  // ============================================
  // BACK TO ORDER
  // ============================================

  document
    .getElementById("backToCartBtn")
    .addEventListener("click", () => {

      closeOrderReview();

      const cartDrawer =
        document.getElementById(
          "cartDrawer"
        );

      const drawerBackdrop =
        document.getElementById(
          "drawerBackdrop"
        );

      if (cartDrawer) {
        cartDrawer.classList.add(
          "open"
        );
      }

      if (drawerBackdrop) {
        drawerBackdrop.classList.add(
          "active"
        );
      }

    });


  // ============================================
  // CHECK OUT
  // ============================================

  document
    .getElementById("copyOrderBtn")
    .addEventListener("click", () => {

      copyOrderDetails(cart);

    });

}


// ============================================
// RENDER ORDER ITEM
// ============================================

function renderCheckoutItem(item) {

  const quantity =
    Number(item.quantity || 1);

  const price =
    Number(
      item.price ||
      item.unitPrice ||
      item.basePrice ||
      0
    );

  const lineTotal =
    price * quantity;

  const image =
    item.image ||
    item.imagePath ||
    "";

  const productName =
    item.productName ||
    item.name ||
    item.product ||
    "Coastal Ghost Item";


  const details = [

    item.design,

    item.itemType ||
    item.item,

    item.fit,

    item.brand,

    item.color,

    item.size,

    item.option

  ]
    .filter(Boolean)
    .join(" · ");


  return `

    <div class="checkout-item">

      ${
        image
          ? `
            <div class="checkout-item-image">

              <img
                src="${image}"
                alt="${productName}"
              />

            </div>
          `
          : ""
      }


      <div class="checkout-item-details">

        <h3>
          ${productName}
        </h3>


        ${
          details
            ? `
              <p>
                ${details}
              </p>
            `
            : ""
        }


        <div
          class="checkout-item-bottom"
        >

          <span>
            Qty: ${quantity}
          </span>


          <strong>
            $${lineTotal.toFixed(2)}
          </strong>

        </div>

      </div>

    </div>

  `;
}


// ============================================
// CHECK OUT / COPY ORDER DETAILS
// ============================================

function copyOrderDetails(cart) {

  const total =
    getCheckoutTotal(cart);


  let orderText =
    "COASTAL GHOST BASEBALL – ORDER\n";


  orderText +=
    "====================================\n\n";


  cart.forEach(
    (item, index) => {

      const quantity =
        Number(item.quantity || 1);


      const price =
        Number(
          item.price ||
          item.unitPrice ||
          item.basePrice ||
          0
        );


      const lineTotal =
        quantity * price;


      const productName =
        item.productName ||
        item.name ||
        item.product ||
        "Coastal Ghost Item";


      const details = [

        item.design,

        item.itemType ||
        item.item,

        item.fit,

        item.brand,

        item.color,

        item.size,

        item.option

      ]
        .filter(Boolean)
        .join(" | ");


      orderText +=
        `${index + 1}. ${productName}\n`;


      if (details) {

        orderText +=
          `   ${details}\n`;

      }


      orderText +=
        `   Quantity: ${quantity} × $${price.toFixed(2)} = $${lineTotal.toFixed(2)}\n\n`;

    }
  );


  orderText +=
    "====================================\n";


  orderText +=
    `ORDER TOTAL: $${total.toFixed(2)}\n`;


  navigator.clipboard
    .writeText(orderText)

    .then(() => {

      showCheckoutToast(
        "Order details copied to your clipboard!"
      );


      const checkoutBtn =
        document.getElementById(
          "copyOrderBtn"
        );


      if (checkoutBtn) {

        const originalText =
          checkoutBtn.textContent;


        checkoutBtn.textContent =
          "Order Copied!";


        setTimeout(() => {

          checkoutBtn.textContent =
            originalText;

        }, 2000);

      }

    })

    .catch(() => {

      showCheckoutToast(
        "Unable to copy automatically."
      );

    });

}


// ============================================
// CLOSE REVIEW
// ============================================

function closeOrderReview() {

  const modal =
    document.getElementById(
      "orderReviewModal"
    );


  if (modal) {
    modal.remove();
  }

}


// ============================================
// TOAST
// ============================================

function showCheckoutToast(message) {

  const toast =
    document.getElementById("toast");


  if (!toast) {

    alert(message);

    return;

  }


  toast.textContent =
    message;


  toast.classList.add("show");


  setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);

}
