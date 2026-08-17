// Coastal Ghost Team Shop
// Family Order cart functionality

let cart = [];

// Load an existing cart if one is saved
try {
  const savedCart = localStorage.getItem("coastalGhostCart");

  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
} catch (error) {
  console.warn("Could not load saved cart:", error);
}


// --------------------------------------------------
// ADD PRODUCT TO CART
// --------------------------------------------------

function addProductToCart(productId) {

  const product = products.find(
    item => item.id === productId
  );

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }


  const quantityInput = document.getElementById(
    `qty-${productId}`
  );

  const quantity = Math.max(
    1,
    Number(quantityInput?.value || 1)
  );


  const selectedColor =
    product.selectedColor ||
    product.colors?.[0] ||
    { name: "Default" };


  const selectedSize =
    product.selectedSize ||
    product.sizes?.[0] ||
    "";


  const price = getProductPrice(
    product,
    selectedSize
  );


  const cartItem = {
    id: `${product.id}-${selectedColor.name}-${selectedSize}`,
    productId: product.id,

    design: product.design || "",
    item: product.item || "",
    brand: product.brand || product.name || "",

    placement: product.placement || "",
    fit: product.fit || "",

    color: selectedColor.name || "",
    colorImage: selectedColor.image || "",

    size: selectedSize,

    quantity: quantity,

    price: Number(price)
  };


  // Check whether this exact item is already in the cart
  const existingItem = cart.find(
    item => item.id === cartItem.id
  );


  if (existingItem) {

    existingItem.quantity += quantity;

  } else {

    cart.push(cartItem);

  }


  saveCart();
  updateCartUI();

  showAddedMessage(
    `${cartItem.design} added to your Family Order`
  );
}


// --------------------------------------------------
// SAVE CART
// --------------------------------------------------

function saveCart() {

  try {

    localStorage.setItem(
      "coastalGhostCart",
      JSON.stringify(cart)
    );

  } catch (error) {

    console.warn(
      "Could not save Family Order:",
      error
    );

  }

}


// --------------------------------------------------
// CART TOTALS
// --------------------------------------------------

function getCartItemCount() {

  return cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

}


function getCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      (
        Number(item.price || 0) *
        Number(item.quantity || 0)
      ),
    0
  );

}


// --------------------------------------------------
// UPDATE CART DISPLAY
// --------------------------------------------------

function updateCartUI() {

  const count = getCartItemCount();

  const total = getCartTotal();


  // Update cart count anywhere it appears
  document
    .querySelectorAll("[data-cart-count]")
    .forEach(element => {

      element.textContent = count;

    });


  // Update cart total anywhere it appears
  document
    .querySelectorAll("[data-cart-total]")
    .forEach(element => {

      element.textContent =
        `$${total.toFixed(2)}`;

    });


  // Update the main cart container
  renderCart();
}


// --------------------------------------------------
// RENDER FAMILY ORDER
// --------------------------------------------------

function renderCart() {

  const cartContainer =
    document.getElementById("cart");

  if (!cartContainer) return;


  if (!cart.length) {

    cartContainer.innerHTML = `
      <div class="cart-empty">

        <h2>Your Family Order is Empty</h2>

        <p>
          Select products, colors, sizes,
          and quantities to begin your order.
        </p>

      </div>
    `;

    return;

  }


  cartContainer.innerHTML = `

    <div class="cart-header">

      <h2>
        Family Order
      </h2>

      <div class="cart-summary">

        <span>
          ${getCartItemCount()} item${
            getCartItemCount() === 1
              ? ""
              : "s"
          }
        </span>

        <strong>
          $${getCartTotal().toFixed(2)}
        </strong>

      </div>

    </div>


    <div class="cart-items">

      ${cart.map((item, index) => `

        <div class="cart-item">

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


          <div class="cart-item-info">

            <strong>
              ${item.design}
            </strong>

            <div>
              ${item.item}
            </div>

            <small>

              ${item.brand}

              ${
                item.color
                  ? ` · ${item.color}`
                  : ""
              }

              ${
                item.size
                  ? ` · Size ${item.size}`
                  : ""
              }

            </small>

          </div>


          <div class="cart-item-quantity">

            <button
              onclick="changeCartQuantity(
                ${index},
                -1
              )"
            >
              −
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              onclick="changeCartQuantity(
                ${index},
                1
              )"
            >
              +
            </button>

          </div>


          <div class="cart-item-price">

            $${(
              Number(item.price) *
              Number(item.quantity)
            ).toFixed(2)}

          </div>


          <button
            class="remove"
            onclick="removeFromCart(${index})"
          >

            Remove

          </button>

        </div>

      `).join("")}

    </div>


    <div class="cart-footer">

      <div>

        <span>
          Order Total
        </span>

        <strong>
          $${getCartTotal().toFixed(2)}
        </strong>

      </div>


      <button
        class="checkout-button"
        onclick="beginCheckout()"
      >

        Continue to Checkout

      </button>

    </div>

  `;
}


// --------------------------------------------------
// CHANGE QUANTITY
// --------------------------------------------------

function changeCartQuantity(index, amount) {

  if (!cart[index]) return;


  cart[index].quantity += amount;


  if (cart[index].quantity <= 0) {

    cart.splice(index, 1);

  }


  saveCart();
  updateCartUI();

}


// --------------------------------------------------
// REMOVE FROM CART
// --------------------------------------------------

function removeFromCart(index) {

  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart();
  updateCartUI();

}


// --------------------------------------------------
// CLEAR CART
// --------------------------------------------------

function clearCart() {

  cart = [];

  saveCart();

  updateCartUI();

}


// --------------------------------------------------
// ADDED MESSAGE
// --------------------------------------------------

function showAddedMessage(message) {

  let messageElement =
    document.getElementById("cart-message");


  if (!messageElement) {

    messageElement =
      document.createElement("div");

    messageElement.id =
      "cart-message";

    messageElement.className =
      "cart-message";

    document.body.appendChild(
      messageElement
    );

  }


  messageElement.textContent = message;

  messageElement.classList.add("show");


  setTimeout(() => {

    messageElement.classList.remove("show");

  }, 2500);

}


// --------------------------------------------------
// INITIALIZE CART
// --------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  updateCartUI
);
