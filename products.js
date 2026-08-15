// Coastal Ghost Team Shop
// Product browsing, color selection, size selection, and product rendering

const money = (value) => Number(value || 0).toFixed(2);

const uniqueValues = (array) => [...new Set(array)];

let products = [];
let designs = [];
let itemTypes = [];
let sizePricing = [];

async function loadShopData() {
  try {
    const [
      productsResponse,
      designsResponse,
      itemTypesResponse,
      sizePricingResponse
    ] = await Promise.all([
      fetch("data/products.json"),
      fetch("data/designs.json"),
      fetch("data/itemTypes.json"),
      fetch("data/sizePricing.json")
    ]);

    products = await productsResponse.json();
    designs = await designsResponse.json();
    itemTypes = await itemTypesResponse.json();
    sizePricing = await sizePricingResponse.json();

    renderProducts(products);

  } catch (error) {
    console.error("Unable to load shop data:", error);

    const content = document.getElementById("content");

    if (content) {
      content.innerHTML = `
        <div class="note">
          <h2>We're loading the shop...</h2>
          <p>
            Product data could not be loaded yet. Check that the
            data files are in the <strong>data</strong> folder.
          </p>
        </div>
      `;
    }
  }
}


// --------------------------------------------------
// SHOP BY DESIGN
// --------------------------------------------------

function browseByDesign() {

  const values = uniqueValues(
    products
      .map(product => product.design)
      .filter(Boolean)
  );

  renderCategoryThumbnails(
    values,
    "design",
    "Shop by Design"
  );
}


// --------------------------------------------------
// SHOP BY ITEM TYPE
// --------------------------------------------------

function browseByItemType() {

  const values = uniqueValues(
    products
      .map(product => product.item)
      .filter(Boolean)
  );

  renderCategoryThumbnails(
    values,
    "item",
    "Shop by Item Type"
  );
}


// --------------------------------------------------
// SHOP BY FIT & SIZE RANGE
// --------------------------------------------------

function browseByFit() {

  const values = uniqueValues(
    products
      .map(product => product.fit)
      .filter(Boolean)
  );

  renderCategoryThumbnails(
    values,
    "fit",
    "Shop by Fit & Size Range"
  );
}


// --------------------------------------------------
// CATEGORY THUMBNAILS
// --------------------------------------------------

function renderCategoryThumbnails(values, key, title) {

  const content = document.getElementById("content");

  if (!content) return;

  content.innerHTML = `
    <button class="back" onclick="showAllProducts()">
      ← Back to All Products
    </button>

    <h1>${title}</h1>

    <div class="thumbgrid">
      ${values.map(value => {

        const product = products.find(
          item => item[key] === value
        );

        const image =
          product?.colors?.[0]?.image ||
          product?.image ||
          "";

        return `
          <button
            class="thumb"
            onclick="filterProducts('${key}', ${JSON.stringify(value)})"
          >

            ${
              image
                ? `<img src="${image}" alt="${value}">`
                : ""
            }

            <div>
              ${value}

              <small>
                View products
              </small>
            </div>

          </button>
        `;

      }).join("")}
    </div>
  `;
}


// --------------------------------------------------
// FILTER PRODUCTS
// --------------------------------------------------

function filterProducts(key, value) {

  const filteredProducts = products.filter(
    product => product[key] === value
  );

  renderProducts(filteredProducts);
}


// --------------------------------------------------
// SHOW ALL PRODUCTS
// --------------------------------------------------

function showAllProducts() {
  renderProducts(products);
}


// --------------------------------------------------
// RENDER PRODUCTS
// --------------------------------------------------

function renderProducts(productList) {

  const content = document.getElementById("content");

  if (!content) return;

  content.innerHTML = `
    <div class="grid">

      ${productList.map(product => {

        if (!product.selectedColor && product.colors?.length) {
          product.selectedColor = product.colors[0];
        }

        if (!product.selectedSize && product.sizes?.length) {
          product.selectedSize = product.sizes[0];
        }

        const image =
          product.selectedColor?.image ||
          product.colors?.[0]?.image ||
          product.image ||
          "";

        const price = getProductPrice(
          product,
          product.selectedSize
        );

        return `
          <article class="card">

            ${
              image
                ? `
                  <img
                    class="productimg"
                    id="img-${product.id}"
                    src="${image}"
                    alt="${product.design} ${product.item}"
                  >
                `
                : ""
            }

            <div class="body">

              <div class="eyebrow">
                ${product.design || ""}
                ·
                ${product.item || ""}
              </div>

              <h2>
                ${product.brand || product.name || product.item}
              </h2>

              <div class="meta">

                ${
                  product.placement
                    ? product.placement
                    : ""
                }

                ${
                  product.fit
                    ? ` · ${product.fit}`
                    : ""
                }

              </div>


              <div
                class="price"
                id="price-${product.id}"
              >
                $${money(price)}
              </div>


              ${
                product.colors?.length
                  ? `
                    <span class="label">
                      Select Color
                    </span>

                    <div
                      class="choices"
                      id="colors-${product.id}"
                    >

                      ${product.colors.map((color, index) => `

                        <button
                          class="choice ${
                            index === 0
                              ? "selected"
                              : ""
                          }"

                          onclick="selectColor(
                            '${product.id}',
                            ${JSON.stringify(color.name)}
                          )"
                        >

                          ${color.name}

                        </button>

                      `).join("")}

                    </div>
                  `
                  : ""
              }


              ${
                product.sizes?.length
                  ? `
                    <span class="label">
                      Select Size
                    </span>

                    <div
                      class="choices"
                      id="sizes-${product.id}"
                    >

                      ${product.sizes.map((size, index) => `

                        <button
                          class="choice ${
                            index === 0
                              ? "selected"
                              : ""
                          }"

                          onclick="selectSize(
                            '${product.id}',
                            '${size}'
                          )"
                        >

                          ${size}

                        </button>

                      `).join("")}

                    </div>
                  `
                  : ""
              }


              <span class="label">
                Quantity
              </span>

              <input
                class="qty"
                id="qty-${product.id}"
                type="number"
                min="1"
                value="1"
              >


              <button
                class="add"
                onclick="addProductToCart('${product.id}')"
              >

                Add to Family Order

              </button>

            </div>

          </article>
        `;

      }).join("")}

    </div>
  `;
}


// --------------------------------------------------
// SELECT COLOR
// --------------------------------------------------

function selectColor(productId, colorName) {

  const product = products.find(
    item => item.id === productId
  );

  if (!product) return;

  const selectedColor =
    product.colors.find(
      color => color.name === colorName
    );

  if (!selectedColor) return;

  product.selectedColor = selectedColor;


  const image = document.getElementById(
    `img-${productId}`
  );

  if (image && selectedColor.image) {
    image.src = selectedColor.image;
  }


  document
    .querySelectorAll(
      `#colors-${productId} .choice`
    )
    .forEach(button => {

      button.classList.remove("selected");

      if (
        button.textContent.trim() === colorName
      ) {
        button.classList.add("selected");
      }

    });
}


// --------------------------------------------------
// SELECT SIZE
// --------------------------------------------------

function selectSize(productId, size) {

  const product = products.find(
    item => item.id === productId
  );

  if (!product) return;

  product.selectedSize = size;


  document
    .querySelectorAll(
      `#sizes-${productId} .choice`
    )
    .forEach(button => {

      button.classList.remove("selected");

      if (
        button.textContent.trim() === size
      ) {
        button.classList.add("selected");
      }

    });


  const price = getProductPrice(
    product,
    size
  );

  const priceElement = document.getElementById(
    `price-${productId}`
  );

  if (priceElement) {
    priceElement.textContent =
      `$${money(price)}`;
  }
}


// --------------------------------------------------
// CALCULATE PRODUCT PRICE
// --------------------------------------------------

function getProductPrice(product, size) {

  let basePrice =
    Number(product.base || product.price || 0);


  if (product.sizePrices) {

    const matchingPrice =
      product.sizePrices.find(
        item => item.size === size
      );

    if (matchingPrice) {
      return Number(
        matchingPrice.price
      );
    }

  }


  if (
    size === "2XL" &&
    product.u2
  ) {
    basePrice += Number(product.u2);
  }


  if (
    size === "3XL" &&
    product.u3
  ) {
    basePrice += Number(product.u3);
  }


  if (
    size === "4XL" &&
    product.u4
  ) {
    basePrice += Number(product.u4);
  }


  return basePrice;
}


// --------------------------------------------------
// INITIALIZE SHOP
// --------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  loadShopData
);
