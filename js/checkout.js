// ============================================
// Coastal Ghost Team Shop
// checkout.js
// ============================================

// ============================================
// INITIALIZE CHECKOUT
// ============================================

function initializeCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!checkoutBtn) {
    console.warn("Checkout button not found.");
    return;
  }

  // Prevent duplicate checkout handlers
  checkoutBtn.onclick = handleCheckout;
}

// ============================================
// HANDLE CHECKOUT
// ============================================

function handleCheckout(event) {
  if (event) {
    event.preventDefault();
  }

  const cart = getCartForCheckout();

  if (!cart || !cart.length) {
    showCheckoutToast("Your Cart is Empty");
    return;
  }

  // Close cart drawer
  if (
    window.CoastalGhostCart &&
    typeof window.CoastalGhostCart.close === "function"
  ) {
    window.CoastalGhostCart.close();
  }

  // Small delay allows the drawer to close cleanly
  setTimeout(() => {
    openCustomerInformation(cart);
  }, 150);
}


// ============================================
// STARTUP
// ============================================

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
  if (
    window.CoastalGhostCart &&
    typeof window.CoastalGhostCart.getItems === "function"
  ) {
    return window.CoastalGhostCart.getItems();
  }

  try {
    return JSON.parse(
      localStorage.getItem("coastalGhostFamilyOrder")
    ) || [];
  } catch (error) {
    console.error("Unable to retrieve cart:", error);
    return [];
  }
}


// ============================================
// CALCULATE ORDER TOTAL
// ============================================

function getCheckoutTotal(cart) {
  return cart.reduce((total, item) => {
    const quantity = Number(
      item.qty ||
      item.quantity ||
      1
    );

    const price = Number(
      item.unitPrice ||
      item.price ||
      0
    );

    return total + (price * quantity);
  }, 0);
}

// ============================================
// DISCOUNT CODES
// ============================================

function getItemQuantity(item) {

  return Number(
    item.qty ||
    item.quantity ||
    1
  );

}


function getItemPrice(item) {

  return Number(
    item.unitPrice ||
    item.price ||
    item.basePrice ||
    0
  );

}


function getItemLineTotal(item) {

  return (
    getItemPrice(item) *
    getItemQuantity(item)
  );

}


function isDiscountExcludedItem(item) {

  const searchableText = [

    item.name,
    item.productName,
    item.product,
    item.itemType,
    item.option,
    item.category,
    item.type

  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();


  return (

    searchableText.includes("dtf") ||

    searchableText.includes(
      "personalization"
    ) ||

    searchableText.includes(
      "personalisation"
    )

  );

}


function getDiscountDetails(
  cart,
  discountCode
) {

  const subtotal =
    getCheckoutTotal(cart);

  const normalizedCode =
    String(
      discountCode || ""
    )
      .trim()
      .toLowerCase();


  let code = "";
  let percent = 0;
  let eligibleTotal = 0;


  if (
    normalizedCode ===
    "myboo20"
  ) {

    code = "MyBoo20";
    percent = 20;

  } else if (

    normalizedCode ===
    "terrifying10"

  ) {

    code = "Terrifying10";
    percent = 10;

  } else if (

    normalizedCode ===
    "onthehauntedhouse"

  ) {

    code = "OnTheHauntedHouse";
    percent = 100;

  } else {

    return {
      valid: false,
      code: "",
      percent: 0,
      subtotal,
      eligibleTotal: 0,
      discountAmount: 0,
      total: subtotal
    };

  }


  if (percent === 100) {

    eligibleTotal =
      subtotal;

  } else {

    eligibleTotal =
      cart.reduce(
        (total, item) => {

          if (
            isDiscountExcludedItem(item)
          ) {

            return total;

          }

          return (
            total +
            getItemLineTotal(item)
          );

        },
        0
      );

  }


  const discountAmount =

    eligibleTotal *
    (percent / 100);


  return {

    valid: true,

    code,

    percent,

    subtotal,

    eligibleTotal,

    discountAmount,

    total: Math.max(
      0,
      subtotal - discountAmount
    )

  };

}
// ============================================
// OPEN CUSTOMER INFORMATION
// ============================================

function openCustomerInformation(cart) {
  console.log("OPENING CUSTOMER INFORMATION", cart);

  closeOrderReview();

  const modal = document.createElement("div");

  modal.id = "orderReviewModal";
  modal.className = "modal-overlay checkout-modal";
modal.style.display = "flex";
modal.style.position = "fixed";
modal.style.inset = "0";
modal.style.zIndex = "99999";
modal.style.background = "rgba(0, 0, 0, 0.75)";

  modal.innerHTML = `
    <div class="modal checkout-review-modal" style="
  display: block;
  position: relative;
  z-index: 100000;
  background: #21152e;
  color: #f5f1e8;
  max-width: 650px;
  width: calc(100% - 32px);
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
  padding: 32px;
  border-radius: 20px;
">

      <button
        class="modal-close"
        id="closeOrderReview"
        aria-label="Close"
        type="button"
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

<div class="checkout-form-group">

  <label for="discountCode">
    Discount Code
    <span>(Optional)</span>
  </label>

  <input
    type="text"
    id="discountCode"
    placeholder="Enter discount code"
    autocomplete="off"
  >

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

  document
    .getElementById("closeOrderReview")
    ?.addEventListener("click", closeOrderReview);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeOrderReview();
    }
  });

  document
    .getElementById("backToCartBtn")
    ?.addEventListener("click", () => {
      closeOrderReview();

      if (
        window.CoastalGhostCart &&
        typeof window.CoastalGhostCart.open === "function"
      ) {
        window.CoastalGhostCart.open();
      }
    });

  document
    .getElementById("customerInfoForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const customer = {
        firstName: document
          .getElementById("customerFirstName")
          .value
          .trim(),

        lastName: document
          .getElementById("customerLastName")
          .value
          .trim(),

        email: document
          .getElementById("customerEmail")
          .value
          .trim(),

        phone: document
          .getElementById("customerPhone")
          .value
          .trim(),

        notes: "",

discountCode: document
  .getElementById("discountCode")
  .value
  .trim()
      };
const discount =
  getDiscountDetails(
    cart,
    customer.discountCode
  );


if (

  customer.discountCode &&

  !discount.valid

) {

  showCheckoutToast(
    "That discount code is not valid."
  );

  return;

}


customer.discount =
  discount;
      openOrderReview(cart, customer);
    });
}


// ============================================
// OPEN ORDER REVIEW
// ============================================

function openOrderReview(cart, customer) {
  closeOrderReview();

  const subtotal =
  getCheckoutTotal(cart);


const discount =
  customer.discount ||
  getDiscountDetails(
    cart,
    customer.discountCode
  );


const total =
  discount.total;

  const totalItems = cart.reduce((total, item) => {
    return total + Number(
      item.qty ||
      item.quantity ||
      1
    );
  }, 0);

  const modal = document.createElement("div");

  modal.id = "orderReviewModal";

  modal.className =
    "modal-overlay checkout-modal";

  // Match the working Customer Information modal
  modal.style.display = "flex";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.zIndex = "99999";
  modal.style.background =
    "rgba(0, 0, 0, 0.75)";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";

  modal.innerHTML = `
    <div
      class="modal checkout-review-modal"
      style="
        display: block;
        position: relative;
        z-index: 100000;
        background: #21152e;
        color: #f5f1e8;
        max-width: 650px;
        width: calc(100% - 32px);
        max-height: 90vh;
        overflow-y: auto;
        margin: auto;
        padding: 32px;
        border-radius: 20px;
      "
    >

      <button
        class="modal-close"
        id="closeOrderReview"
        aria-label="Close"
        type="button"
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

          <h3>Customer Information</h3>

          <p>

            <strong>
              ${customer.firstName} ${customer.lastName}
            </strong>

            <br>

            ${customer.email}

            <br>

            ${customer.phone}

            ${
              customer.notes
                ? `<br><br>Notes: ${customer.notes}`
                : ""
            }

          </p>

        </div>

        <div class="checkout-order-items">
          ${cart.map(renderCheckoutItem).join("")}
        </div>

        <div class="checkout-total-row">

  <span>Subtotal</span>

  <strong>
    $${subtotal.toFixed(2)}
  </strong>

</div>


${
  discount.valid
    ? `
      <div class="checkout-total-row checkout-discount-row">

        <span>
          Discount (${discount.code})
        </span>

        <strong>
          -$${discount.discountAmount.toFixed(2)}
        </strong>

      </div>
    `
    : ""
}


<div
  class="
    checkout-total-row
    checkout-grand-total
  "
>

  <span>Amount Due</span>

  <strong>
    $${total.toFixed(2)}
  </strong>

</div>

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
        customer,
        discount
      );
    }
  );
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
// SUBMIT ORDER
// ============================================

function submitOrder(
  cart,
  customer,
  discount
) {

  const orderNumber =
    generateOrderNumber();


 const subtotal =
  getCheckoutTotal(cart);


const finalDiscount =
  discount ||
  getDiscountDetails(
    cart,
    customer?.discountCode
  );


const total =
  finalDiscount.total;


  const order = {
  orderNumber,
  orderDate: new Date().toISOString(),
  customer,
  items: cart,

  subtotal,

  discountCode:
    finalDiscount.valid
      ? finalDiscount.code
      : "",

  discountPercent:
    finalDiscount.percent,

  discountAmount:
    finalDiscount.discountAmount,

  total,

  paymentStatus: "Pending",
  productionStatus: "New"
};

  // ==========================================
  // SEND ORDER TO GOOGLE SHEETS
  // ==========================================

  sendOrderToSpreadsheet(
    order
  );


  // ==========================================
  // SAVE LOCAL COPY
  // ==========================================

  try {

    const existingOrders =
      JSON.parse(
        localStorage.getItem(
          "coastalGhostOrders"
        )
      ) || [];


    existingOrders.push(
      order
    );


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


  // ==========================================
  // SHOW CONFIRMATION
  // ==========================================

  openOrderConfirmation(
    order
  );

}


// ============================================
// ORDER CONFIRMATION
// ============================================

function openOrderConfirmation(order) {
  // Close the Review Order modal first
  closeOrderReview();

  const modal = document.createElement("div");

  modal.id = "orderConfirmationModal";

  modal.className =
    "modal-overlay checkout-modal";

  // Match the working modal display setup
  modal.style.display = "flex";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.zIndex = "99999";
  modal.style.background =
    "rgba(0, 0, 0, 0.75)";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";

  modal.innerHTML = `
    <div
      class="modal checkout-review-modal"
      style="
        display: block;
        position: relative;
        z-index: 100000;
        background: #21152e;
        color: #f5f1e8;
        max-width: 650px;
        width: calc(100% - 32px);
        max-height: 90vh;
        overflow-y: auto;
        margin: auto;
        padding: 32px;
        border-radius: 20px;
      "
    >

      <button
        class="modal-close"
        id="closeOrderConfirmation"
        aria-label="Close"
        type="button"
      >
        &times;
      </button>

      <div class="checkout-review checkout-confirmation">

        <div class="checkout-review-header">

          <div class="order-confirmation-ghost">
            👻
          </div>

          <span class="eyebrow">
            Coastal Ghost Baseball
          </span>

          <h2>Order Received!</h2>

          <p>
            Your order has been submitted
            and is awaiting payment.
          </p>

        </div>

        <div class="order-number-box">

          <span>Order Number</span>

          <strong>
            ${order.orderNumber}
          </strong>

        </div>

        <div class="checkout-summary">

          <div class="checkout-total-row checkout-grand-total">

            <span>Amount Due</span>

            <strong>
              $${order.total.toFixed(2)}
            </strong>

          </div>

        </div>

        <div class="venmo-payment-section">

  <h3>Pay with Venmo</h3>

  <p class="venmo-order-instructions">
    Include this Order Number in your Venmo comments:
  </p>

  <div class="venmo-order-number">

    <strong id="venmoOrderNumber">
      ${order.orderNumber}
    </strong>

    <button
      type="button"
      class="copy-order-number-btn"
      id="copyVenmoOrderBtn"
    >
      Copy
    </button>

  </div>

  <button
    class="btn btn-primary"
    id="venmoPaymentBtn"
    type="button"
  >
    Pay $${order.total.toFixed(2)} with Venmo
  </button>

</div>

        <div class="checkout-actions">

          <button
            class="btn btn-secondary"
            id="finishOrderBtn"
            type="button"
          >
            I've paid. Close my cart.
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);


  // CLOSE CONFIRMATION
  document
    .getElementById("closeOrderConfirmation")
    ?.addEventListener(
      "click",
      () => {
        modal.remove();
      }
    );


  // COPY ORDER NUMBER
  document
    .getElementById("copyConfirmationBtn")
    ?.addEventListener(
      "click",
      () => {

        navigator.clipboard
          .writeText(order.orderNumber)
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

          })
          .catch(() => {
            showCheckoutToast(
              "Unable to copy automatically."
            );
          });

      }
    );


  // VENMO
  document
  .getElementById("copyVenmoOrderBtn")
  ?.addEventListener("click", () => {

    navigator.clipboard
      .writeText(order.orderNumber)
      .then(() => {

        const button =
          document.getElementById(
            "copyVenmoOrderBtn"
          );

        if (!button) return;

        const originalText =
          button.textContent;

        button.textContent =
          "Copied!";

        setTimeout(() => {
          button.textContent =
            originalText;
        }, 2000);

      })
      .catch(() => {
        showCheckoutToast(
          "Unable to copy automatically."
        );
      });

  });
  
 document
  .getElementById("venmoPaymentBtn")
  ?.addEventListener("click", () => {

    window.open(
      "https://venmo.com/u/Zachary-Coffren",
      "_blank"
    );

  });


  // DONE
  document
    .getElementById("finishOrderBtn")
    ?.addEventListener(
      "click",
      () => {

        modal.remove();

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
  const quantity = Number(
    item.qty ||
    item.quantity ||
    1
  );

  const price = Number(
    item.unitPrice ||
    item.price ||
    0
  );

  const lineTotal = price * quantity;

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

      <div class="checkout-item-details">

        <h3>${productName}</h3>

        ${
          details.length
            ? `<p>${details.join(" · ")}</p>`
            : ""
        }

        <div class="checkout-item-bottom">

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
  const modal = document.getElementById(
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

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ============================================
// SEND ORDER TO GOOGLE SHEETS
// ============================================

function sendOrderToSpreadsheet(order) {

  const spreadsheetURL =
  "https://script.google.com/macros/s/AKfycbzwKOyZIJOqY3P_VOZQ61oo0vpCpBmmfHqjSmMf98l6GckDEl_dzspNJb-1BG4AEoBWmw/exec";


  fetch(
    spreadsheetURL,
    {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body:
        JSON.stringify(order)
    }
  )

    .then(() => {

      console.log(
        "Order sent to Google Sheets."
      );

    })

    .catch((error) => {

      console.error(
        "Could not send order to Google Sheets:",
        error
      );

    });

}
