// ============================================
// Coastal Ghost Team Shop
// checkout.js
// ============================================


// ============================================
// INITIALIZE CHECKOUT
// ============================================

function initializeCheckout() {
  const checkoutBtn =
    document.getElementById("checkoutBtn");

  if (!checkoutBtn) {
    console.warn(
      "Checkout button not found."
    );
    return;
  }

  // Prevent duplicate listeners
  checkoutBtn.onclick = null;

  checkoutBtn.addEventListener(
    "click",
    handleCheckout
  );
}


function handleCheckout() {
  const cart =
    getCartForCheckout();

  if (!cart || !cart.length) {
    showCheckoutToast(
      "Your Cart is Empty"
    );
    return;
  }

  // Close the cart drawer before
  // opening checkout
  if (
    window.CoastalGhostCart &&
    typeof window.CoastalGhostCart.close === "function"
  ) {
    window.CoastalGhostCart.close();
  }

  openCustomerInformation(cart);
}


// Initialize whether the script loads
// before or after the page DOM is ready
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeCheckout
  );
} else {
  initializeCheckout();
}


// ============================================
// GET CART
// ============================================

function getCartForCheckout() {

  // Primary connection to cart.js
  if (
    window.CoastalGhostCart &&
    typeof window.CoastalGhostCart.getItems === "function"
  ) {
    return window.CoastalGhostCart.getItems();
  }

  // Backup: direct localStorage access
  try {
    return JSON.parse(
      localStorage.getItem("coastalGhostFamilyOrder")
    ) || [];
  } catch (error) {
    console.error(
      "Unable to retrieve cart:",
      error
    );

    return [];
  }
}


// ============================================
// CALCULATE ORDER TOTAL
// ============================================

function getCheckoutTotal(cart) {

  return cart.reduce(
    (total, item) => {

      const quantity =
        Number(
          item.qty ||
          item.quantity ||
          1
        );

      const price =
        Number(
          item.unitPrice ||
          item.price ||
          0
        );

      return total + (
        price * quantity
      );

    },
    0
  );
}


// ============================================
// OPEN CUSTOMER INFORMATION
// ============================================

function openCustomerInformation(cart) {

  const existingModal =
    document.getElementById(
      "orderReviewModal"
    );

  if (existingModal) {
    existingModal.remove();
  }

  const modal =
    document.createElement("div");

  modal.id =
    "orderReviewModal";

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

          <h2>Checkout</h2>

          <p>
            Enter your information to complete your order.
          </p>

        </div>

        <form
          id="customerInfoForm"
          class="checkout-customer-form"
        >

          <div class="checkout-form-row">

            <div class="checkout-form-group">

              <label for="customerFirstName">
                First Name
              </label>

              <input
                type="text"
                id="customerFirstName"
                required
              >

            </div>

            <div class="checkout-form-group">

              <label for="customerLastName">
                Last Name
              </label>

              <input
                type="text"
                id="customerLastName"
                required
              >

            </div>

          </div>


          <div class="checkout-form-group">

            <label for="customerEmail">
              Email
            </label>

            <input
              type="email"
              id="customerEmail"
              required
            >

          </div>


          <div class="checkout-form-group">

            <label for="customerPhone">
              Phone Number
            </label>

            <input
              type="tel"
              id="customerPhone"
              required
            >

          </div>


          <div class="checkout-form-group">

            <label for="playerName">
              Player Name
              <span>(Optional)</span>
            </label>

            <input
              type="text"
              id="playerName"
            >

          </div>


          <div class="checkout-form-group">

            <label for="orderNotes">
              Order Notes
              <span>(Optional)</span>
            </label>

            <textarea
              id="orderNotes"
              rows="4"
              placeholder="Anything we should know about your order?"
            ></textarea>

          </div>


          <div class="checkout-actions">

            <button
              class="btn btn-secondary"
              id="backToCartBtn"
              type="button"
            >
              Back to Cart
            </button>


            <button
              class="btn btn-primary"
              type="submit"
            >
              Review Order
            </button>

          </div>

        </form>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  // Close
  document
    .getElementById("closeOrderReview")
    ?.addEventListener(
      "click",
      closeOrderReview
    );


  // Click outside
  modal.addEventListener(
    "click",
    (event) => {

      if (event.target === modal) {
        closeOrderReview();
      }

    }
  );


  // Back to cart
  document
    .getElementById("backToCartBtn")
    ?.addEventListener(
      "click",
      () => {

        closeOrderReview();

        if (
          window.CoastalGhostCart &&
          typeof window.CoastalGhostCart.open === "function"
        ) {
          window.CoastalGhostCart.open();
        }

      }
    );


  // Submit customer information
  document
    .getElementById("customerInfoForm")
    ?.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const customer = {

          firstName:
            document
              .getElementById(
                "customerFirstName"
              )
              .value
              .trim(),

          lastName:
            document
              .getElementById(
                "customerLastName"
              )
              .value
              .trim(),

          email:
            document
              .getElementById(
                "customerEmail"
              )
              .value
              .trim(),

          phone:
            document
              .getElementById(
                "customerPhone"
              )
              .value
              .trim(),

          playerName:
            document
              .getElementById(
                "playerName"
              )
              .value
              .trim(),

          notes:
            document
              .getElementById(
                "orderNotes"
              )
              .value
              .trim()

        };

        openOrderReview(
          cart,
          customer
        );

      }
    );

}


// ============================================
// OPEN ORDER REVIEW
// ============================================

function openOrderReview(
  cart,
  customer
) {

  const existingModal =
    document.getElementById(
      "orderReviewModal"
    );

  if (existingModal) {
    existingModal.remove();
  }

  const total =
    getCheckoutTotal(cart);

  const totalItems =
    cart.reduce(
      (total, item) => {

        return total +
          Number(
            item.qty ||
            item.quantity ||
            1
          );

      },
      0
    );

  const modal =
    document.createElement("div");

  modal.id =
    "orderReviewModal";

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
            Check your selections before submitting your order.
          </p>

        </div>


        <div class="checkout-customer-summary">

          <h3>
            Customer Information
          </h3>

          <p>

            <strong>
              ${customer.firstName}
              ${customer.lastName}
            </strong>

            <br>

            ${customer.email}

            <br>

            ${customer.phone}

            ${
              customer.playerName
                ? `
                  <br>
                  Player:
                  ${customer.playerName}
                `
                : ""
            }

          </p>

        </div>


        <div class="checkout-order-items">

          ${cart
            .map(renderCheckoutItem)
            .join("")}

        </div>


        <div class="checkout-summary">

          <div class="checkout-total-row">

            <span>
              Total Items
            </span>

            <strong>
              ${totalItems}
            </strong>

          </div>


          <div
            class="
              checkout-total-row
              checkout-grand-total
            "
          >

            <span>
              Order Total
            </span>

            <strong>
              $${total.toFixed(2)}
            </strong>

          </div>

        </div>


        <div class="checkout-actions">

          <button
            class="btn btn-secondary"
            id="backToCustomerInfoBtn"
            type="button"
          >
            Back
          </button>


          <button
            class="btn btn-primary"
            id="submitOrderBtn"
            type="button"
          >
            Submit Order
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  document
    .getElementById("closeOrderReview")
    ?.addEventListener(
      "click",
      closeOrderReview
    );


  document
    .getElementById("backToCustomerInfoBtn")
    ?.addEventListener(
      "click",
      () => {

        openCustomerInformation(cart);

      }
    );


  document
    .getElementById("submitOrderBtn")
    ?.addEventListener(
      "click",
      () => {

        submitOrder(
          cart,
          customer
        );

      }
    );

}


// ============================================
// GENERATE ORDER NUMBER
// ============================================

function generateOrderNumber() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );

  return `CG-${year}${month}${day}-${random}`;
}


// ============================================
// SUBMIT ORDER
// ============================================

function submitOrder(
  cart,
  customer
) {

  const orderNumber =
    generateOrderNumber();

  const total =
    getCheckoutTotal(cart);

  const order = {

    orderNumber,

    orderDate:
      new Date().toISOString(),

    customer,

    items: cart,

    total,

    paymentStatus:
      "Pending",

    productionStatus:
      "New"

  };


  // Temporary local browser storage.
  // This will later be replaced by
  // Google Sheets submission.

  try {

    const existingOrders =
      JSON.parse(
        localStorage.getItem(
          "coastalGhostOrders"
        )
      ) || [];

    existingOrders.push(order);

    localStorage.setItem(
      "coastalGhostOrders",
      JSON.stringify(
        existingOrders
      )
    );

  } catch (error) {

    console.error(
      "Unable to save order:",
      error
    );

  }


  openOrderConfirmation(order);

}


// ============================================
// ORDER CONFIRMATION
// ============================================

function openOrderConfirmation(order) {

  const existingModal =
    document.getElementById(
      "orderReviewModal"
    );

  if (existingModal) {
    existingModal.remove();
  }

  const modal =
    document.createElement("div");

  modal.id =
    "orderReviewModal";

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


      <div
        class="
          checkout-review
          checkout-confirmation
        "
      >

        <div
          class="checkout-review-header"
        >

          <div
            class="order-confirmation-ghost"
          >
            👻
          </div>


          <span class="eyebrow">
            Coastal Ghost Baseball
          </span>


          <h2>
            Order Received!
          </h2>


          <p>
            Your order has been submitted
            and is awaiting payment.
          </p>

        </div>


        <div
          class="order-number-box"
        >

          <span>
            Order Number
          </span>

          <strong>
            ${order.orderNumber}
          </strong>

        </div>


        <div
          class="checkout-summary"
        >

          <div
            class="
              checkout-total-row
              checkout-grand-total
            "
          >

            <span>
              Amount Due
            </span>

            <strong>
              $${order.total.toFixed(2)}
            </strong>

          </div>

        </div>


        <div
          class="venmo-payment-section"
        >

          <h3>
            Pay with Venmo
          </h3>

          <p>
            Include Order Number in Venmo comments.
          </p>


          <button
            class="btn btn-primary"
            id="venmoPaymentBtn"
            type="button"
          >
            Pay $${order.total.toFixed(2)} with Venmo
          </button>

        </div>


        <div
          class="checkout-actions"
        >

          <button
            class="btn btn-secondary"
            id="copyConfirmationBtn"
            type="button"
          >
            Copy Order Number
          </button>


          <button
            class="btn btn-secondary"
            id="finishOrderBtn"
            type="button"
          >
            Done
          </button>

        </div>

      </div>

    </div>
  `;


  document.body.appendChild(modal);


  document
    .getElementById("closeOrderReview")
    ?.addEventListener(
      "click",
      closeOrderReview
    );


  document
    .getElementById("copyConfirmationBtn")
    ?.addEventListener(
      "click",
      () => {

        navigator.clipboard
          .writeText(
            order.orderNumber
          )
          .then(() => {

            const button =
              document.getElementById(
                "copyConfirmationBtn"
              );

            if (!button) return;

            const originalText =
              button.textContent;

            button.textContent =
              "Order Number Copied!";

            setTimeout(() => {

              button.textContent =
                originalText;

            }, 2000);

          });

      }
    );


  // Venmo will be connected next
  document
    .getElementById("venmoPaymentBtn")
    ?.addEventListener(
      "click",
      () => {

        showCheckoutToast(
          "Venmo payment setup is coming next."
        );

      }
    );


  document
    .getElementById("finishOrderBtn")
    ?.addEventListener(
      "click",
      () => {

        closeOrderReview();

        if (
          window.CoastalGhostCart &&
          typeof window.CoastalGhostCart.clear === "function"
        ) {
          window.CoastalGhostCart.clear();
        }

      }
    );

}


// ============================================
// RENDER ORDER ITEM
// ============================================

function renderCheckoutItem(item) {

  const quantity =
    Number(
      item.qty ||
      item.quantity ||
      1
    );

  const price =
    Number(
      item.unitPrice ||
      item.price ||
      0
    );

  const lineTotal =
    price * quantity;

  const image =
    item.image ||
    item.imagePath ||
    "";

  const productName =
    item.name ||
    item.productName ||
    item.product ||
    "Coastal Ghost Item";


  const details = [];

  if (item.color) {
    details.push(item.color);
  }

  if (item.size) {
    details.push(item.size);
  }

  if (item.placement) {
    details.push(item.placement);
  }

  if (item.option) {
    details.push(item.option);
  }

  if (item.dimensions) {
    details.push(item.dimensions);
  }


  return `
    <div class="checkout-item">

      ${
        image
          ? `
            <div class="checkout-item-image">

              <img
                src="${image}"
                alt="${productName}"
              >

            </div>
          `
          : ""
      }


      <div
        class="checkout-item-details"
      >

        <h3>
          ${productName}
        </h3>


        ${
          details.length
            ? `
              <p>
                ${details.join(" · ")}
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
