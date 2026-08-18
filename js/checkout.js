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
      showCheckoutToast("Your Family Order is empty.");
      return;
    }

    openCustomerInformation(cart);
  });
});


// ============================================
// GET CART
// ============================================

function getCartForCheckout() {
  // Try cart.js helper first
  if (typeof getCart === "function") {
    return getCart();
  }

  // Try window.Cart
  if (
    window.Cart &&
    typeof window.Cart.getItems === "function"
  ) {
    return window.Cart.getItems();
  }

  // Fall back to localStorage
  try {
    return JSON.parse(
      localStorage.getItem("coastalGhostCart")
    ) || [];
  } catch (error) {
    return [];
  }
}


// ============================================
// CALCULATE ORDER TOTAL
// ============================================

function getCheckoutTotal(cart) {
  return cart.reduce((total, item) => {
    const quantity = Number(item.quantity || 1);

    const price = Number(
      item.price ||
      item.unitPrice ||
      0
    );

    return total + price * quantity;
  }, 0);
}


// ============================================
// GENERATE ORDER NUMBER
// ============================================

function generateOrderNumber() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `CG-${year}${month}${day}-${random}`;
}


// ============================================
// OPEN CUSTOMER INFORMATION
// ============================================

function openCustomerInformation(cart) {
  const existingModal =
    document.getElementById("orderReviewModal");

  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");

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

          <h2>
            Your Information
          </h2>

          <p>
            Tell us who this Family Order belongs to.
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
              />
            </div>

            <div class="checkout-form-group">
              <label for="customerLastName">
                Last Name
              </label>

              <input
                type="text"
                id="customerLastName"
                required
              />
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
            />

          </div>

          <div class="checkout-form-group">

            <label for="customerPhone">
              Phone Number
            </label>

            <input
              type="tel"
              id="customerPhone"
              required
            />

          </div>

          <div class="checkout-form-group">

            <label for="playerName">
              Player Name
              <span>(Optional)</span>
            </label>

            <input
              type="text"
              id="playerName"
            />

          </div>

          <div class="checkout-form-group">

            <label for="orderNotes">
              Order Notes
              <span>(Optional)</span>
            </label>

            <textarea
              id="orderNotes"
              rows="4"
              placeholder="Anything we should know about this order?"
            ></textarea>

          </div>

          <div class="checkout-actions">

            <button
              class="btn btn-secondary"
              id="customerBackToCartBtn"
              type="button"
            >
              Back to Order
            </button>

            <button
              class="btn btn-primary"
              type="submit"
            >
              Review Family Order
            </button>

          </div>

        </form>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  document
    .getElementById("closeOrderReview")
    .addEventListener(
      "click",
      closeOrderReview
    );

  // Click outside modal
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeOrderReview();
    }
  });

  // Back to cart
  document
    .getElementById("customerBackToCartBtn")
    .addEventListener("click", () => {

      closeOrderReview();
      reopenCartDrawer();

    });

  // Submit customer information
  document
    .getElementById("customerInfoForm")
    .addEventListener("submit", (event) => {

      event.preventDefault();

      const customer = {
        firstName:
          document
            .getElementById("customerFirstName")
            .value
            .trim(),

        lastName:
          document
            .getElementById("customerLastName")
            .value
            .trim(),

        email:
          document
            .getElementById("customerEmail")
            .value
            .trim(),

        phone:
          document
            .getElementById("customerPhone")
            .value
            .trim(),

        playerName:
          document
            .getElementById("playerName")
            .value
            .trim(),

        notes:
          document
            .getElementById("orderNotes")
            .value
            .trim()
      };

      openOrderReview(
        cart,
        customer
      );

    });
}


// ============================================
// OPEN ORDER REVIEW
// ============================================

function openOrderReview(
  cart,
  customer = {}
) {

  const existingModal =
    document.getElementById("orderReviewModal");

  if (existingModal) {
    existingModal.remove();
  }

  const total =
    getCheckoutTotal(cart);

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

          <h2>
            Review Your Family Order
          </h2>

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
              ${customer.firstName || ""}
              ${customer.lastName || ""}
            </strong>
            <br>

            ${customer.email || ""}
            <br>

            ${customer.phone || ""}

            ${
              customer.playerName
                ? `<br>Player: ${customer.playerName}`
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
              ${cart.reduce(
                (total, item) =>
                  total +
                  Number(
                    item.quantity || 1
                  ),
                0
              )}
            </strong>

          </div>


          <div
            class="checkout-total-row checkout-grand-total"
          >

            <span>
              Family Order Total
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
            Submit Family Order
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  // Close button
  document
    .getElementById("closeOrderReview")
    .addEventListener(
      "click",
      closeOrderReview
    );


  // Click outside modal
  modal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === modal
      ) {
        closeOrderReview();
      }

    }
  );


  // Back to customer information
  document
    .getElementById("backToCustomerInfoBtn")
    .addEventListener(
      "click",
      () => {

        openCustomerInformation(
          cart
        );

      }
    );


  // Submit order
  document
    .getElementById("submitOrderBtn")
    .addEventListener(
      "click",
      () => {

        submitFamilyOrder(
          cart,
          customer
        );

      }
    );

}


// ============================================
// SUBMIT FAMILY ORDER
// ============================================

function submitFamilyOrder(
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


  // Temporary local storage backup.
  // We will replace this with Google Sheets
  // submission in the next step.

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
      "Unable to save order locally:",
      error
    );

  }


  // Open confirmation
  openOrderConfirmation(
    order
  );

}


// ============================================
// ORDER CONFIRMATION
// ============================================

function openOrderConfirmation(
  order
) {

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
        class="checkout-review checkout-confirmation"
      >

        <div
          class="checkout-review-header"
        >

          <div
            class="order-confirmation-ghost"
          >
            👻
          </div>


          <span
            class="eyebrow"
          >
            Coastal Ghost Baseball
          </span>


          <h2>
            Order Received!
          </h2>


          <p>
            Your Family Order has been submitted
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
            class="checkout-total-row checkout-grand-total"
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


  document.body.appendChild(
    modal
  );


  // Close
  document
    .getElementById(
      "closeOrderReview"
    )
    .addEventListener(
      "click",
      () => {

        closeOrderReview();

      }
    );


  // Copy order number
  document
    .getElementById(
      "copyConfirmationBtn"
    )
    .addEventListener(
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

            if (button) {

              const originalText =
                button.textContent;

              button.textContent =
                "Order Number Copied!";

              setTimeout(() => {

                button.textContent =
                  originalText;

              }, 2000);

            }

          });

      }
    );


  // Venmo button
  document
    .getElementById(
      "venmoPaymentBtn"
    )
    .addEventListener(
      "click",
      () => {

        /*
        NEXT STEP:

        We will replace this with your actual
        Venmo payment link.

        Example:

        window.open(
          "YOUR VENMO PAYMENT LINK",
          "_blank"
        );
        */

        showCheckoutToast(
          "Venmo payment setup is coming next."
        );

      }
    );


  // Finish order
  document
    .getElementById(
      "finishOrderBtn"
    )
    .addEventListener(
      "click",
      () => {

        closeOrderReview();

        // Clear cart after order
        clearCompletedOrderCart();

      }
    );

}


// ============================================
// CLEAR COMPLETED CART
// ============================================

function clearCompletedOrderCart() {

  try {

    localStorage.removeItem(
      "coastalGhostCart"
    );

  } catch (error) {

    console.error(
      "Unable to clear cart:",
      error
    );

  }


  // Try cart.js clear functions

  if (
    typeof clearCart === "function"
  ) {

    try {

      clearCart();

    } catch (error) {

      console.error(error);

    }

  }


  // Refresh cart display if available

  if (
    typeof renderCart === "function"
  ) {

    try {

      renderCart();

    } catch (error) {

      console.error(error);

    }

  }

}


// ============================================
// REOPEN CART
// ============================================

function reopenCartDrawer() {

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

}


// ============================================
// RENDER ORDER ITEM
// ============================================

function renderCheckoutItem(
  item
) {

  const quantity =
    Number(
      item.quantity || 1
    );

  const price =
    Number(
      item.price ||
      item.unitPrice ||
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
    <div
      class="checkout-item"
    >

      ${
        image
          ? `
            <div
              class="checkout-item-image"
            >

              <img
                src="${image}"
                alt="${productName}"
              />

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

function showCheckoutToast(
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) {

    alert(message);

    return;

  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 3000);

}
