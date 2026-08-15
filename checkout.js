/* Coastal Ghost Team Shop — Order review
   Checkout is intentionally lightweight for now: no payment provider is
   wired in yet. This renders a review of the Family Order so it can be
   confirmed with the team, and is the natural place to plug in Venmo,
   Apple Pay, or a hosted checkout later without changing the cart model. */

function buildOrderSummaryText() {
  const items = Cart.items;
  const lines = items.map((item) => {
    const bits = [item.design, item.color, item.size, item.placement].filter(Boolean).join(" / ");
    return `${item.quantity}x ${item.name} (${bits}) — ${formatCurrency(Cart.lineTotal(item))}`;
  });
  lines.push("", `Family Order Total: ${formatCurrency(Cart.grandTotal())}`);
  return lines.join("\n");
}

function renderOrderReview() {
  const items = Cart.items;

  if (items.length === 0) {
    document.getElementById("modalPanel").innerHTML = `
      <h2 id="modalTitle">Family Order</h2>
      <p class="subtitle">Your family order is empty. Add a product or DTF transfer to get started.</p>
    `;
    document.getElementById("modalImage").parentElement.style.display = "none";
    document.getElementById("productModal").classList.add("open");
    return;
  }

  const rows = items
    .map((item) => {
      const bits = [item.design, item.color, item.size, item.placement].filter(Boolean).join(" · ");
      return `<li><span>${item.quantity}x ${item.name} — ${bits}</span><span>${formatCurrency(
        Cart.lineTotal(item)
      )}</span></li>`;
    })
    .join("");

  document.getElementById("modalImage").parentElement.style.display = "none";
  document.getElementById("modalPanel").innerHTML = `
    <h2 id="modalTitle">Review Family Order</h2>
    <p class="subtitle">Confirm everything below before checkout opens.</p>
    <div class="checkout-panel">
      <ul>${rows}</ul>
      <div class="cart-total-row">
        <span>Total</span>
        <span>${formatCurrency(Cart.grandTotal())}</span>
      </div>
    </div>
    <p class="note">Online checkout (Venmo, Apple Pay, or a hosted payment page) is coming soon. For now this order can be copied and sent to the team.</p>
    <button class="btn btn-secondary btn-block" id="copyOrderBtn">Copy Order Summary</button>
    <button class="btn btn-primary btn-block" id="backToShopBtn">Continue Shopping</button>
  `;

  document.getElementById("copyOrderBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(buildOrderSummaryText());
      showToast("Order summary copied to clipboard.");
    } catch (err) {
      showToast("Could not copy automatically — please select the text manually.");
    }
  });

  document.getElementById("backToShopBtn").addEventListener("click", () => {
    document.getElementById("productModal").classList.remove("open");
    document.getElementById("modalImage").parentElement.style.display = "";
  });

  document.getElementById("productModal").classList.add("open");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    closeCartDrawer();
    renderOrderReview();
  });
});
