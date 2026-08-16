// ==================================================
// COASTAL GHOST TEAM SHOP
// PRODUCTS + ASSET MANIFEST LOADER
// ==================================================

let assets = [];
let productGroups = [];
let activeProducts = [];


// ==================================================
// LOAD ALL MANIFEST CHUNKS
// ==================================================

async function loadShopData() {

  try {

    // Load the manifest index first
    const indexResponse = await fetch(
      "data/manifest-index.json"
    );

    if (!indexResponse.ok) {
      throw new Error(
        "Could not load manifest-index.json"
      );
    }

    const manifestIndex =
      await indexResponse.json();


    // ----------------------------------------------
    // LOAD ALL ASSET CHUNKS
    // ----------------------------------------------

    const assetResponses =
      await Promise.all(

        manifestIndex.assetChunks.map(
          async (file) => {

            const response =
              await fetch(`data/${file}`);

            if (!response.ok) {
              throw new Error(
                `Could not load ${file}`
              );
            }

            return response.json();

          }
        )
      );


    // Combine all asset chunks
    assets =
      assetResponses.flat();


    // ----------------------------------------------
    // LOAD ALL PRODUCT GROUP CHUNKS
    // ----------------------------------------------

    const groupResponses =
      await Promise.all(

        manifestIndex.productGroupChunks.map(
          async (file) => {

            const response =
              await fetch(`data/${file}`);

            if (!response.ok) {
              throw new Error(
                `Could not load ${file}`
              );
            }

            return response.json();

          }
        )
      );


    // Combine all product groups
    productGroups =
      groupResponses.flat();


    console.log(
      "Coastal Ghost assets loaded:",
      assets.length
    );

    console.log(
      "Product groups loaded:",
      productGroups.length
    );


    // Build products from the manifest
    activeProducts =
      buildProductsFromManifest();


    // Show the main product view
    showAllProducts();


  } catch (error) {

    console.error(
      "Unable to load Coastal Ghost shop data:",
      error
    );

    showLoadError(error);

  }

}


// ==================================================
// BUILD PRODUCTS FROM MANIFEST
// ==================================================

function buildProductsFromManifest() {

  return productGroups.map(
    (group, index) => {

      // Find all assets belonging to this group
      const groupAssets =
        assets.filter(
          asset =>
            asset.collection ===
              group.collection &&
            asset.category ===
              group.category &&
            asset.product ===
              group.product &&
            asset.placement ===
              group.placement
        );


      // Convert the assets into color options
      const colors =
        groupAssets.map(
          asset => ({

            name:
              asset.color ||
              "Default",

            image:
              asset.webPath ||
              asset.path ||
              asset.image ||
              ""

          })
        );


      // Remove duplicate colors
      const uniqueColors =
        colors.filter(
          (color, colorIndex, array) =>
            colorIndex ===
            array.findIndex(
              item =>
                item.name === color.name
            )
        );


      return {

        id:
          group.id ||
          `product-${index + 1}`,

        collection:
          group.collection || "",

        design:
          group.collection || "",

        category:
          group.category || "",

        item:
          group.category || "",

        product:
          group.product || "",

        brand:
          group.product || "",

        placement:
          group.placement || "",

        fit:
          getFitFromCategory(
            group.category || ""
          ),

        colors:
          uniqueColors,

        selectedColor:
          uniqueColors[0] || null,

        sizes:
          getSizesForCategory(
            group.category || ""
          ),

        selectedSize:
          getSizesForCategory(
            group.category || ""
          )[0] || "",

        base:
          0

      };

    }
  );

}


// ==================================================
// DETERMINE FIT / SIZE RANGE
// ==================================================

function getFitFromCategory(category) {

  const value =
    category.toLowerCase();


  if (value.includes("youth")) {
    return "Youth";
  }


  if (value.includes("women")) {
    return "Women's";
  }


  if (value.includes("unisex")) {
    return "Adult / Unisex";
  }


  return "All";

}


// ==================================================
// DETERMINE AVAILABLE SIZES
// ==================================================

function getSizesForCategory(category) {

  const value =
    category.toLowerCase();


  if (value.includes("youth")) {

    return [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ];

  }


  if (value.includes("women")) {

    return [
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL"
    ];

  }


  return [
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
    "4XL"
  ];

}


// ==================================================
// SHOW ALL PRODUCTS
// ==================================================

function showAllProducts() {

  renderProducts(
    activeProducts
  );

}


// ==================================================
// SHOP BY DESIGN
// ==================================================

function browseByDesign() {

  const collections =
    [
      ...new Set(
        activeProducts.map(
          product =>
            product.collection
        )
      )
    ];


  renderCategoryThumbnails(
    collections,
    "collection",
    "Shop by Design"
  );

}


// ==================================================
// SHOP BY ITEM TYPE
// ==================================================

function browseByItemType() {

  const categories =
    [
      ...new Set(
        activeProducts.map(
          product =>
            product.category
        )
      )
    ];


  renderCategoryThumbnails(
    categories,
    "category",
    "Shop by Item Type"
  );

}


// ==================================================
// SHOP BY FIT & SIZE RANGE
// ==================================================

function browseByFit() {

  const fits =
    [
      ...new Set(
        activeProducts.map(
          product =>
            product.fit
        )
      )
    ];


  renderCategoryThumbnails(
    fits,
    "fit",
    "Shop by Fit & Size Range"
  );

}


// ==================================================
// RENDER CATEGORY THUMBNAILS
// ==================================================

function renderCategoryThumbnails(
  values,
  key,
  title
) {

  const content =
    document.getElementById(
      "content"
    );

  if (!content) return;


  content.innerHTML = `

    <button
      class="back"
      onclick="showAllProducts()"
    >
      ← Back to All Products
    </button>

    <h1>${title}</h1>

    <div class="thumbgrid">

      ${values.map(value => {

        const product =
          activeProducts.find(
            item =>
              item[key] === value
          );


        const image =
          product?.colors?.[0]?.image ||
          "";


        return `

          <button
            class="thumb"
            onclick='filterProducts(
              "${key}",
              ${JSON.stringify(value)}
            )'
          >

            ${
              image
                ? `
                  <img
                    src="${image}"
                    alt="${value}"
                  >
                `
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


// ==================================================
// FILTER PRODUCTS
// ==================================================

function filterProducts(
  key,
  value
) {

  const filtered =
    activeProducts.filter(
      product =>
        product[key] === value
    );


  renderProducts(filtered);

}


// ==================================================
// RENDER PRODUCTS
// ==================================================

function renderProducts(productList) {

  const content =
    document.getElementById(
      "content"
    );

  if (!content) return;


  if (!productList.length) {

    content.innerHTML = `

      <div class="note">

        <h2>
          No products found
        </h2>

        <p>
          We're still adding products
          to this section.
        </p>

      </div>

    `;

    return;

  }


  content.innerHTML = `

    <div class="grid">

      ${productList.map(
        product => {

          const image =
            product.selectedColor?.image ||
            product.colors?.[0]?.image ||
            "";


          const price =
            getProductPrice(
              product,
              product.selectedSize
            );


          return `

            <article
              class="card"
            >

              ${
                image
                  ? `

                    <img
                      class="productimg"
                      id="img-${product.id}"
                      src="${image}"
                      alt="${product.design}"
                    >

                  `
                  : ""
              }


              <div class="body">

                <div class="eyebrow">

                  ${product.design}

                  ·

                  ${product.item}

                </div>


                <h2>

                  ${product.product}

                </h2>


                ${
                  product.placement
                    ? `

                      <div class="meta">

                        ${product.placement}

                      </div>

                    `
                    : ""
                }


                <div
                  class="price"
                  id="price-${product.id}"
                >

                  ${
                    price > 0
                      ? `$${price.toFixed(2)}`
                      : "Price TBD"
                  }

                </div>


                ${
                  product.colors?.length > 1
                    ? `

                      <span class="label">
                        Select Color
                      </span>

                      <div
                        class="choices"
                        id="colors-${product.id}"
                      >

                        ${product.colors.map(
                          color => `

                            <button
                              class="choice ${
                                product.selectedColor?.name ===
                                color.name
                                  ? "selected"
                                  : ""
                              }"

                              onclick='selectColor(
                                "${product.id}",
                                ${JSON.stringify(color.name)}
                              )'
                            >

                              ${color.name}

                            </button>

                          `
                        ).join("")}

                      </div>

                    `
                    : ""
                }


                <span class="label">
                  Select Size
                </span>


                <div
                  class="choices"
                  id="sizes-${product.id}"
                >

                  ${product.sizes.map(
                    size => `

                      <button
                        class="choice ${
                          product.selectedSize ===
                          size
                            ? "selected"
                            : ""
                        }"

                        onclick='selectSize(
                          "${product.id}",
                          "${size}"
                        )'
                      >

                        ${size}

                      </button>

                    `
                  ).join("")}

                </div>


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
                  onclick="addProductToCart(
                    '${product.id}'
                  )"
                >

                  Add to Family Order

                </button>

              </div>

            </article>

          `;

        }
      ).join("")}

    </div>

  `;

}


// ==================================================
// SELECT COLOR
// ==================================================

function selectColor(
  productId,
  colorName
) {

  const product =
    activeProducts.find(
      item =>
        item.id === productId
    );

  if (!product) return;


  const color =
    product.colors.find(
      item =>
        item.name === colorName
    );

  if (!color) return;


  product.selectedColor =
    color;


  const image =
    document.getElementById(
      `img-${productId}`
    );


  if (
    image &&
    color.image
  ) {

    image.src =
      color.image;

  }


  document
    .querySelectorAll(
      `#colors-${productId} .choice`
    )
    .forEach(button => {

      button.classList.remove(
        "selected"
      );

      if (
        button.textContent.trim() ===
        colorName
      ) {

        button.classList.add(
          "selected"
        );

      }

    });

}


// ==================================================
// SELECT SIZE
// ==================================================

function selectSize(
  productId,
  size
) {

  const product =
    activeProducts.find(
      item =>
        item.id === productId
    );

  if (!product) return;


  product.selectedSize =
    size;


  document
    .querySelectorAll(
      `#sizes-${productId} .choice`
    )
    .forEach(button => {

      button.classList.remove(
        "selected"
      );

      if (
        button.textContent.trim() ===
        size
      ) {

        button.classList.add(
          "selected"
        );

      }

    });


  const price =
    getProductPrice(
      product,
      size
    );


  const priceElement =
    document.getElementById(
      `price-${productId}`
    );


  if (priceElement) {

    priceElement.textContent =
      price > 0
        ? `$${price.toFixed(2)}`
        : "Price TBD";

  }

}


// ==================================================
// PRODUCT PRICE
// ==================================================

function getProductPrice(
  product,
  size
) {

  // Pricing will be connected
  // to your final pricing data later.

  return Number(
    product.base || 0
  );

}


// ==================================================
// LOAD ERROR
// ==================================================

function showLoadError(error) {

  const content =
    document.getElementById(
      "content"
    );

  if (!content) return;


  content.innerHTML = `

    <div class="note">

      <h2>
        Shop data could not load
      </h2>

      <p>
        ${error.message}
      </p>

    </div>

  `;

}


// ==================================================
// INITIALIZE
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  loadShopData
);
