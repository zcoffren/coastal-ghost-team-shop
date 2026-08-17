// Coastal Ghost Team Shop
// Checkout and order review functionality

function beginCheckout() {

  if (!cart || cart.length === 0) {

    alert(
      "Your Family Order is empty. Please add items before checking out."
    );

    return;

  }

  const content = document.getElementById("content");

  if (!content) return;


  content.innerHTML = `

    <button
      class="back"
      onclick="showAllProducts()"
    >
      ← Continue Shopping
    </button>


    <section class="checkout">

      <h1>Review Your Family Order</h1>

      <p>
        Please review the items below before submitting your order.
      </p>


      <div class="checkout-items">

        ${cart.map((item, index) => `

          <div class="checkout-item">

            ${
              item.colorImage
                ? `
                  <img
                    src="${item.colorImage}"
                    alt="${item.design}"
                  >
                `
                : ""
            }


            <div class="checkout-item-details">

              <h3>
                ${item.design}
              </h3>

              <p>
                ${item.item}
              </p>

              <p>

                ${item.color
                  ? `Color: ${item.color}`
                  : ""
                }

                ${item.size
                  ? ` · Size: ${item.size}`
                  : ""
                }

              </p>

              <p>
                Quantity: ${item.quantity}
              </p>

            </div>


            <div class="checkout-item-total">

              $${(
                Number(item.price) *
                Number(item.quantity)
              ).toFixed(2)}

            </div>


            <button
              class="remove"
              onclick="removeFromCart(${index}); beginCheckout();"
            >
              Remove
            </button>

          </div>

        `).join("")}

      </div>


      <div class="checkout-total">

        <span>
          Order Total
        </span>

        <strong>
          $${getCartTotal().toFixed(2)}
        </strong>

      </div>


      <form
        id="checkout-form"
        class="checkout-form"
        onsubmit="submitOrder(event)"
      >

        <h2>Order Information</h2>


        <label>

          Name

          <input
            type="text"
            id="customer-name"
            required
          >

        </label>


        <label>

          Email

          <input
            type="email"
            id="customer-email"
            required
          >

        </label>


        <label>

          Phone Number

          <input
            type="tel"
            id="customer-phone"
          >

        </label>


        <label>

          Additional Notes

          <textarea
            id="customer-notes"
            rows="4"
            placeholder="Anything we should know about your order?"
          ></textarea>

        </label>


        <button
          type="submit"
          class="checkout-button"
        >

          Submit Order

        </button>

      </form>

    </section>

  `;
}


// --------------------------------------------------
// SUBMIT ORDER
// --------------------------------------------------

function submitOrder(event) {

  event.preventDefault();


  const order = {

    customer: {

      name:
        document.getElementById(
          "customer-name"
        ).value,

      email:
        document.getElementById(
          "customer-email"
        ).value,

      phone:
        document.getElementById(
          "customer-phone"
        ).value,

      notes:
        document.getElementById(
          "customer-notes"
        ).value

    },


    items: cart,


    total: getCartTotal(),


    submittedAt:
      new Date().toISOString()

  };


  console.log(
    "Coastal Ghost Team Shop Order:",
    order
  );


  showOrderConfirmation(order);

}


// --------------------------------------------------
// ORDER CONFIRMATION
// --------------------------------------------------

function showOrderConfirmation(order) {

  const content =
    document.getElementById("content");

  if (!content) return;


  content.innerHTML = `

    <section class="order-confirmation">

      <h1>
        👻 Order Submitted!
      </h1>


      <p>
        Thank you, ${order.customer.name}.
      </p>


      <p>
        Your Coastal Ghost Family Order has been prepared for submission.
      </p>


      <div class="confirmation-total">

        <span>
          Order Total
        </span>

        <strong>
          $${Number(order.total).toFixed(2)}
        </strong>

      </div>


      <p class="confirmation-note">

        Payment instructions will be provided after the order is reviewed.

      </p>


      <button
        class="checkout-button"
        onclick="finishOrder()"
      >

        Finish

      </button>

    </section>

  `;
}


// --------------------------------------------------
// FINISH ORDER
// --------------------------------------------------

function finishOrder() {

  clearCart();

  showAllProducts();

}
