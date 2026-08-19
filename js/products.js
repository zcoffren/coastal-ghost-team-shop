/* =========================================================
   COASTAL GHOST TEAM SHOP — PRODUCTS
   ========================================================= */

let SHOP = {
  designs: [],
  styles: [],
  groups: [],
  dtf: []
};

let activeProducts = [];

const $ = (id) => document.getElementById(id);


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const money = (value) => {
  const number = Number(value);

  if (
    Number.isNaN(number) ||
    value === null ||
    value === undefined
  ) {
    return 'Price TBD';
  }

  return `$${number.toFixed(2)}`;
};


const titleCase = (value) =>
  String(value || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );


/* =========================================================
   LOAD DATA
   ========================================================= */

async function getJSON(path) {

  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(
      `Could not load ${path}`
    );
  }

  return response.json();
}


async function loadShopData() {

  try {

    const [
      designs,
      styles,
      groups,
      dtf
    ] = await Promise.all([

      getJSON('data/designs.json'),

      getJSON('data/styles.json'),

      getJSON('data/product-groups.json'),

      getJSON('data/dtf-products.json')

    ]);


    SHOP.designs =
      Array.isArray(designs)
        ? designs
        : designs.designs || [];


    SHOP.styles =
      Array.isArray(styles)
        ? styles
        : styles.styles || [];


    SHOP.groups =
      Array.isArray(groups)
        ? groups
        : groups.groups ||
          groups.products ||
          [];


    SHOP.dtf =
      Array.isArray(dtf)
        ? dtf
        : dtf.products ||
          dtf.dtf ||
          [];


    console.log(
      'SHOP DATA LOADED:',
      SHOP
    );


    buildCatalog();

  }

  catch (error) {

    console.error(
      'SHOP DATA ERROR:',
      error
    );


    const grids = [

      $('designGrid'),

      $('itemTypeGrid'),

      $('fitGrid'),

      $('productGrid'),

      $('dtfGrid')

    ];


    grids.forEach((grid) => {

      if (grid) {

        grid.innerHTML =
          `
          <p class="empty-message">
            Unable to load shop data.
          </p>
          `;

      }

    });

  }

}


/* =========================================================
   DATA HELPERS
   ========================================================= */

function styleFor(styleId) {

  return SHOP.styles.find(
    (style) =>
      style.styleId === styleId ||
      style.id === styleId
  );

}


function groupsWithStyles(groups) {

  return groups.filter(
    (group) =>
      styleFor(group.styleId)
  );

}


function getBasePrice(style) {

  if (!style) {
    return null;
  }

  return (

    style.basePrice ??

    style.price ??

    style.base_price ??

    null

  );

}


function getSizeUpcharge(
  style,
  size
) {

  if (!style) {
    return 0;
  }


  if (

    style.sizeUpcharges &&

    style.sizeUpcharges[size] !== undefined

  ) {

    return Number(
      style.sizeUpcharges[size]
    ) || 0;

  }


  if (

    style.upcharges &&

    style.upcharges[size] !== undefined

  ) {

    return Number(
      style.upcharges[size]
    ) || 0;

  }


  return 0;

}


function getSizes(style) {

  if (!style) {

    return [
      'S',
      'M',
      'L',
      'XL',
      '2XL',
      '3XL'
    ];

  }


  if (

    Array.isArray(style.sizes) &&

    style.sizes.length

  ) {

    return style.sizes;

  }


  if (

    style.fit === 'Youth' ||

    style.sizeRange === 'Youth'

  ) {

    return [
      'XS',
      'S',
      'M',
      'L',
      'XL'
    ];

  }


  return [
    'S',
    'M',
    'L',
    'XL',
    '2XL',
    '3XL'
  ];

}


function firstImage(group) {

  if (!group) {
    return '';
  }


  if (group.thumbnail) {
    return group.thumbnail;
  }


  if (

    Array.isArray(group.mockups) &&

    group.mockups.length

  ) {

    return (
      group.mockups[0].image ||
      ''
    );

  }


  return '';

}


function getMockups(group) {

  if (
    Array.isArray(group.mockups)
  ) {

    return group.mockups;

  }


  return [];

}


function groupLabel(group) {

  const style =
    styleFor(
      group.styleId
    ) || {};


  const designName =

    SHOP.designs.find(

      (design) =>

        design.id === group.design ||

        design.designId === group.design

    )?.name ||

    titleCase(
      group.design
    );


  return `${designName} — ${
    style.productName ||
    style.name ||
    group.styleId ||
    'Product'
  }`;

}


/* =========================================================
   BUILD CATALOG
   ========================================================= */

function buildCatalog() {

  renderDesignCards();

  renderItemTypeCards();

  renderFitCards();


  renderProducts(

    groupsWithStyles(
      SHOP.groups
    )

  );


  renderDTF();


  bindNav();

}


/* =========================================================
   SHOP BY DESIGN
   ========================================================= */

function renderDesignCards() {

  const el =
    $('designGrid');


  if (!el) {
    return;
  }


  const cards =
    SHOP.designs

      .map((design) => {


        const groups =
          groupsWithStyles(

            SHOP.groups.filter(

              (group) =>

                group.design ===
                  design.id ||

                group.design ===
                  design.designId

            )

          );


        if (!groups.length) {
          return '';
        }


        const image =

          design.thumbnail ||

          design.image ||

          firstImage(
            groups[0]
          );


        return `

          <button
            class="category-card"
            type="button"
            data-design="${
              design.id ||
              design.designId
            }"
          >

            <img
              src="${image}"
              alt="${design.name}"
              loading="lazy"
            >

            <span>
              ${design.name}
            </span>

          </button>

        `;

      })

      .join('');


  el.innerHTML =
    cards;


  el
    .querySelectorAll(
      '[data-design]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {


            const designId =
              button.dataset.design;


            const products =
              groupsWithStyles(

                SHOP.groups.filter(

                  (group) =>

                    group.design ===
                    designId

                )

              );


            renderProducts(

              products,

              `${
                button.textContent.trim()
              } Products`

            );


            $('productSection')
              ?.scrollIntoView({

                behavior:
                  'smooth',

                block:
                  'start'

              });

          }

        );

      }
    );

}


/* =========================================================
   SHOP BY ITEM TYPE
   ========================================================= */

function renderItemTypeCards() {

  const el =
    $('itemTypeGrid');


  if (!el) {
    return;
  }


  const types = [

    ...new Set(

      SHOP.styles

        .map(

          (style) =>

            style.itemType ||

            style.productType

        )

        .filter(Boolean)

    )

  ];


  el.innerHTML =

    types

      .map((type) => {


        const groups =

          groupsWithStyles(

            SHOP.groups.filter(
              (group) => {


                const style =
                  styleFor(
                    group.styleId
                  );


                return (

                  style &&

                  (

                    style.itemType ===
                    type ||

                    style.productType ===
                    type

                  )

                );

              }
            )

          );


        if (!groups.length) {
          return '';
        }


        return `

          <button
            class="category-card"
            type="button"
            data-type="${type}"
          >

            <img
              src="${
                firstImage(
                  groups[0]
                )
              }"
              alt="${type}"
              loading="lazy"
            >

            <span>
              ${type}
            </span>

          </button>

        `;

      })

      .join('');


  el
    .querySelectorAll(
      '[data-type]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {


            const type =
              button.dataset.type;


            const products =

              groupsWithStyles(

                SHOP.groups.filter(
                  (group) => {


                    const style =
                      styleFor(
                        group.styleId
                      );


                    return (

                      style &&

                      (

                        style.itemType ===
                        type ||

                        style.productType ===
                        type

                      )

                    );

                  }
                )

              );


            renderProducts(
              products,
              type
            );


            $('productSection')
              ?.scrollIntoView({

                behavior:
                  'smooth',

                block:
                  'start'

              });

          }

        );

      }
    );

}


/* =========================================================
   SHOP BY FIT
   ========================================================= */

function renderFitCards() {

  const el =
    $('fitGrid');


  if (!el) {
    return;
  }


  const fitGroups = [

    ...new Set(

      SHOP.styles

        .map((style) => {


          const fit =

            style.fit ||

            style.fitType ||

            '';


          const range =

            style.sizeRange ||

            style.size_range ||

            '';


          return `${fit}|${range}`;

        })

        .filter(
          (value) =>
            value !== '|'
        )

    )

  ];


  el.innerHTML =

    fitGroups

      .map((key) => {


        const [
          fit,
          range
        ] =
          key.split('|');


        const groups =

          groupsWithStyles(

            SHOP.groups.filter(
              (group) => {


                const style =
                  styleFor(
                    group.styleId
                  );


                if (!style) {
                  return false;
                }


                const styleFit =

                  style.fit ||

                  style.fitType ||

                  '';


                const styleRange =

                  style.sizeRange ||

                  style.size_range ||

                  '';


                return (

                  styleFit ===
                  fit &&

                  styleRange ===
                  range

                );

              }
            )

          );


        if (!groups.length) {
          return '';
        }


        const label =

          range

            ? `${fit} / ${range}`

            : fit;


        return `

          <button
            class="category-card"
            type="button"
            data-fit="${key}"
          >

            <img
              src="${
                firstImage(
                  groups[0]
                )
              }"
              alt="${label}"
              loading="lazy"
            >

            <span>
              ${label}
            </span>

          </button>

        `;

      })

      .join('');


  el
    .querySelectorAll(
      '[data-fit]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {


            const [
              fit,
              range
            ] =
              button.dataset.fit
                .split('|');


            const products =

              groupsWithStyles(

                SHOP.groups.filter(
                  (group) => {


                    const style =
                      styleFor(
                        group.styleId
                      );


                    if (!style) {
                      return false;
                    }


                    const styleFit =

                      style.fit ||

                      style.fitType ||

                      '';


                    const styleRange =

                      style.sizeRange ||

                      style.size_range ||

                      '';


                    return (

                      styleFit ===
                      fit &&

                      styleRange ===
                      range

                    );

                  }
                )

              );


            renderProducts(

              products,

              range

                ? `${fit} / ${range}`

                : fit

            );


            $('productSection')
              ?.scrollIntoView({

                behavior:
                  'smooth',

                block:
                  'start'

              });

          }

        );

      }
    );

}


/* =========================================================
   PRODUCT GRID
   ========================================================= */

function renderProducts(
  groups,
  heading = 'All Products'
) {

  activeProducts =
    groups;


  const title =
    $('productSectionTitle');


  const subtitle =
    $('productSectionSubtitle');


  const el =
    $('productGrid');


  if (title) {

    title.textContent =
      heading;

  }


  if (subtitle) {

    subtitle.textContent =

      `${
        groups.length
      } product style${
        groups.length === 1
          ? ''
          : 's'
      } currently available`;

  }


  if (!el) {
    return;
  }


  if (!groups.length) {

    el.innerHTML = `

      <p class="empty-message">

        No products are currently available
        in this category.

      </p>

    `;

    return;

  }


  el.innerHTML =

    groups

      .map((group) => {


        const style =
          styleFor(
            group.styleId
          );


        const mockups =
          getMockups(
            group
          );

const availableColors = [

  ...new Set(

    mockups.map(
      (mockup) =>
        mockup.color
    )

  )

];


const availablePlacements = [

  ...new Set(

    mockups.map(
      (mockup) =>
        mockup.placement
    )

  )

];
         
        const image =
          firstImage(
            group
          );


        const price =
          getBasePrice(
            style
          );


        const itemType =

          style.itemType ||

          style.productType ||

          '';


        const fit =

          style.fit ||

          style.fitType ||

          '';


        return `

          <article
            class="product-card"
          >

            <div
              class="product-card-image"
            >

              <img
                src="${image}"
                alt="${groupLabel(group)}"
                loading="lazy"
              >

            </div>


            <div
              class="product-card-body"
            >

              <div
                class="product-meta"
              >

                ${itemType}

                ${
                  fit
                    ? ` · ${fit}`
                    : ''
                }

              </div>


              <h3>

                ${groupLabel(group)}

              </h3>


              <p>

                ${
                  style.brand ||

                  group.styleId ||

                  ''
                }

                ·

                ${
                  mockups.length
                }

                design option${
                  mockups.length === 1
                    ? ''
                    : 's'
                }

              </p>


              <strong>

                ${
                  price === null

                    ? 'Price TBD'

                    : `From ${
                        money(
                          price
                        )
                      }`
                }

              </strong>


              <button
                class="btn btn-primary"
                type="button"
                data-product="${
                  group.id
                }"
              >

                Choose Options

              </button>

            </div>

          </article>

        `;

      })

      .join('');


  el
    .querySelectorAll(
      '[data-product]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () =>

            openProduct(
              button.dataset.product
            )

        );

      }
    );

}


/* =========================================================
   PRODUCT OPTION BUTTON HELPER
   ========================================================= */

function createOptionButtons(
  label,
  values,
  selectedValue,
  optionType
) {

  if (!values.length) {
    return '';
  }


  return `

    <div
      class="option-field"
    >

      <div
        class="field-label"
      >

        ${label}

      </div>


      <div
        class="option-buttons"
        data-option-group="${optionType}"
      >

        ${
          values
            .map(
              (value) => `

                <button
                  type="button"
                  class="option-btn ${
                    value === selectedValue
                      ? 'active'
                      : ''
                  }"
                  data-option-type="${optionType}"
                  data-option-value="${value}"
                >

                  ${value}

                </button>

              `
            )
            .join('')
        }

      </div>

    </div>

  `;

}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProduct(id) {

  const group =

    SHOP.groups.find(
      (product) =>
        product.id === id
    );


  if (!group) {
    return;
  }


  const style =
    styleFor(
      group.styleId
    );


  if (!style) {
    return;
  }


  const modal =
    $('productModal');


  const image =
    $('modalImage');


  const mockups =
    getMockups(
      group
    );


  if (!mockups.length) {
    return;
  }


  /*
     IMPORTANT:

     Start with the first ACTUAL mockup.

     This prevents the site from independently
     choosing the first color and first placement,
     which was causing mismatched logo images.
  */

  let selectedColor =
    mockups[0].color || '';


  let selectedPlacement =
    mockups[0].placement || '';


  let selectedSize =
    getSizes(style)[0];


  image.src =
    mockups[0].image ||
    '';


  image.alt =
    groupLabel(group);


  const colors = [

    ...new Set(

      mockups

        .map(
          (mockup) =>
            mockup.color
        )

        .filter(Boolean)

    )

  ];


  const placements = [

    ...new Set(

      mockups

        .map(
          (mockup) =>
            mockup.placement
        )

        .filter(Boolean)

    )

  ];


  const sizes =
    getSizes(style);

const personalization = {

  name: {
    enabled: true,
    price: 5
  },

  number: {
    enabled: true,
    price: 8
  }

};
   
  $('modalPanel').innerHTML = `

    <div
      class="product-meta"
    >

      ${
        style.itemType ||

        style.productType ||

        ''
      }

      ${
        style.fit
          ? ` · ${style.fit}`
          : ''
      }

    </div>


    <h2 id="modalTitle">

      ${groupLabel(group)}

    </h2>


    <p>

      ${
        style.brand ||

        group.styleId ||

        ''
      }

    </p>


    <div
      class="product-options"
    >

      ${
        createOptionButtons(

          'Color',

          colors,

          selectedColor,

          'color'

        )
      }


      ${
        createOptionButtons(

          'Logo Placement',

          placements,

          selectedPlacement,

          'placement'

        )
      }


      ${
        createOptionButtons(

          'Size',

          sizes,

          selectedSize,

          'size'

        )
      }


      <div
        class="option-field quantity-field"
      >

        <div
          class="field-label"
        >

          Quantity

        </div>


        <div
          class="quantity-control"
        >

          <button
            type="button"
            class="quantity-btn"
            id="qtyMinus"
            aria-label="Decrease quantity"
          >
            −
          </button>


          <span
            class="quantity-value"
            id="productQty"
            aria-live="polite"
          >
            1
          </span>


          <button
            type="button"
            class="quantity-btn"
            id="qtyPlus"
            aria-label="Increase quantity"
          >
            +
          </button>

        </div>

      </div>

    </div>


    <div
      class="modal-price"
      id="modalPrice"
    ></div>


    <button
      class="btn btn-primary btn-block"
      id="addProductBtn"
      type="button"
    >

      Add to Cart

    </button>

`;
/* =========================================================
   QUANTITY CONTROL
========================================================= */

let selectedQuantity = 1;

const modalPanel =
  $('modalPanel');


modalPanel.addEventListener(
  'click',
  (event) => {

    const button =
      event.target.closest(
        '#qtyMinus, #qtyPlus'
      );

    if (!button) {
      return;
    }

    event.preventDefault();


    if (button.id === 'qtyMinus') {

      selectedQuantity =
        Math.max(
          1,
          selectedQuantity - 1
        );

    }


    if (button.id === 'qtyPlus') {

      selectedQuantity++;

    }


    const quantityValue =
      modalPanel.querySelector(
        '#productQty'
      );


    if (quantityValue) {

      quantityValue.textContent =
        selectedQuantity;

    }

  }
);
  /*
     Returns ONLY a mockup that matches the
     selected color + placement combination.

     It no longer falls back to an unrelated
     placement from another logo.
  */

  function getSelectedMockup() {

    let match =
      mockups.find(
        (mockup) =>

          mockup.color ===
            selectedColor &&

          mockup.placement ===
            selectedPlacement
      );


    if (match) {
      return match;
    }


    /*
       If a placement does not exist for the
       selected color, use the first available
       placement for that color.
    */

    match =
      mockups.find(
        (mockup) =>

          mockup.color ===
            selectedColor
      );


    if (match) {

      selectedPlacement =
        match.placement || '';

      return match;

    }


    return mockups[0];

  }


  /*
     Update placement buttons based on
     what actually exists for the color.
  */

  function updatePlacementAvailability() {

    const availablePlacements =
      new Set(

        mockups

          .filter(
            (mockup) =>
              mockup.color ===
              selectedColor
          )

          .map(
            (mockup) =>
              mockup.placement
          )

          .filter(Boolean)

      );


    document

      .querySelectorAll(
        '[data-option-type="placement"]'
      )

      .forEach(
        (button) => {


          const placement =
            button.dataset.optionValue;


          const available =
            availablePlacements.has(
              placement
            );


          button.disabled =
            !available;


          button.classList.toggle(
            'disabled',
            !available
          );


          /*
             If the currently selected
             placement isn't available,
             select the first valid one.
          */

          if (

            placement ===
              selectedPlacement &&

            !available

          ) {

            selectedPlacement =
              [...availablePlacements][0] ||
              '';

          }

        }
      );

  }


  function updateActiveButtons() {

    document

      .querySelectorAll(
        '[data-option-type="color"]'
      )

      .forEach(
        (button) => {

          button.classList.toggle(

            'active',

            button.dataset.optionValue ===
              selectedColor

          );

        }
      );


    document

      .querySelectorAll(
        '[data-option-type="placement"]'
      )

      .forEach(
        (button) => {

          button.classList.toggle(

            'active',

            button.dataset.optionValue ===
              selectedPlacement

          );

        }
      );


    document

      .querySelectorAll(
        '[data-option-type="size"]'
      )

      .forEach(
        (button) => {

          button.classList.toggle(

            'active',

            button.dataset.optionValue ===
              selectedSize

          );

        }
      );

  }


  function updateProduct() {

    updatePlacementAvailability();


    const match =
      getSelectedMockup();


    if (
      match?.image
    ) {

      image.src =
        match.image;

    }


    updateActiveButtons();


    const basePrice =
      getBasePrice(
        style
      );


    const upcharge =
      getSizeUpcharge(

        style,

        selectedSize

      );


    const finalPrice =

      basePrice === null

        ? null

        : Number(
            basePrice
          ) +

          Number(
            upcharge
          );


    $('modalPrice').textContent =

      finalPrice === null

        ? 'Price TBD'

        : money(
            finalPrice
          );

  }


  /*
     COLOR BUTTONS
  */

  document

    .querySelectorAll(
      '[data-option-type="color"]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            selectedColor =
              button.dataset.optionValue;


            /*
               When changing colors,
               automatically select
               a placement that really
               exists for that color.
            */

            const validMockup =
              mockups.find(
                (mockup) =>

                  mockup.color ===
                  selectedColor
              );


            if (validMockup) {

              selectedPlacement =
                validMockup.placement ||
                '';

            }


            updateProduct();

          }

        );

      }
    );


  /*
     LOGO PLACEMENT BUTTONS
  */

  document

    .querySelectorAll(
      '[data-option-type="placement"]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {


            if (button.disabled) {
              return;
            }


            selectedPlacement =
              button.dataset.optionValue;


            updateProduct();

          }

        );

      }
    );


  /*
     SIZE BUTTONS
  */

  document

    .querySelectorAll(
      '[data-option-type="size"]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            selectedSize =
              button.dataset.optionValue;


            updateProduct();

          }

        );

      }
    );


  updateProduct();


  $('addProductBtn')

    .addEventListener(
      'click',
      () => {


        const qty =

          selectedQuantity;


        const match =
          getSelectedMockup();


        const basePrice =
          getBasePrice(
            style
          );


        const unitPrice =

          basePrice === null

            ? 0

            : Number(
                basePrice
              ) +

              getSizeUpcharge(

                style,

                selectedSize

              );


        const item = {

          id:

            `${group.id}-` +

            `${selectedColor || 'default'}-` +

            `${selectedPlacement || 'default'}-` +

            `${selectedSize}`,


          name:
            groupLabel(
              group
            ),


          styleId:
            group.styleId,


          design:
            group.design,


          color:
            selectedColor,


          placement:
            selectedPlacement,


          size:
            selectedSize,


          qty,


          unitPrice,


          image:
            match?.image || ''

        };


        window.dispatchEvent(

          new CustomEvent(

            'coastalghost:add-to-cart',

            {
              detail:
                item
            }

          )

        );


        modal.classList.remove(
          'open'
        );


        modal.style.display =
          'none';

      }
    );


  modal.classList.add(
    'open'
  );


  modal.style.display =
    'flex';

}


/* =========================================================
   DTF PRODUCTS
   ========================================================= */

function renderDTF() {

  const el =
    $('dtfGrid');


  if (!el) {
    return;
  }


  if (!SHOP.dtf.length) {

    el.innerHTML =
      '';

    return;

  }


  el.innerHTML =

    SHOP.dtf

      .map(
        (product, index) => `

          <article
            class="product-card"
          >

            <div
              class="product-card-image"
            >

              <img
                src="${
                  product.image ||
                  ''
                }"
                alt="${
                  product.name ||
                  'DTF Transfer'
                }"
                loading="lazy"
              >

            </div>


            <div
              class="product-card-body"
            >

              <h3>

                ${product.name}

              </h3>


              <p>

                DTF transfer

              </p>


              <button
                class="btn btn-primary"
                type="button"
                data-dtf="${index}"
              >

                Choose Size

              </button>

            </div>

          </article>

        `
      )

      .join('');


  el

    .querySelectorAll(
      '[data-dtf]'
    )

    .forEach(
      (button) => {

        button.addEventListener(

          'click',

          () =>

            openDTF(

              Number(
                button.dataset.dtf
              )

            )

        );

      }
    );

}


function openDTF(index) {

  const product =
    SHOP.dtf[index];


  if (!product) {
    return;
  }


  const modal =
    $('productModal');


  $('modalImage').src =
    product.image ||
    '';


  $('modalImage').alt =
    product.name ||
    'DTF Transfer';


  const options =

    Array.isArray(
      product.options
    )

      ? product.options

      : [];


  let selectedOption =
    0;


  $('modalPanel').innerHTML = `

    <div
      class="product-meta"
    >

      DTF Transfer

    </div>


    <h2 id="modalTitle">

      ${product.name}

    </h2>


    <div
      class="option-field"
    >

      <div
        class="field-label"
      >

        Transfer Size

      </div>


      <div
        class="option-buttons"
      >

        ${
          options

            .map(
              (
                option,
                optionIndex
              ) => `

                <button
                  type="button"
                  class="option-btn ${
                    optionIndex === 0
                      ? 'active'
                      : ''
                  }"
                  data-dtf-option="${optionIndex}"
                >

                  ${option.label}

                </button>

              `
            )

            .join('')
        }

      </div>

    </div>


    <div
      class="option-field"
    >

      <div
  class="option-field quantity-field"
>

  <div
    class="field-label"
  >

    Quantity

  </div>


  <div
    class="quantity-control"
  >

    <button
      type="button"
      class="quantity-btn"
      id="dtfQtyMinus"
      aria-label="Decrease quantity"
    >
      −
    </button>


    <span
      class="quantity-value"
      id="dtfQty"
      aria-live="polite"
    >
      1
    </span>


    <button
      type="button"
      class="quantity-btn"
      id="dtfQtyPlus"
      aria-label="Increase quantity"
    >
      +
    </button>

  </div>

</div>

    <div
      class="modal-price"
      id="dtfPrice"
    >

      ${
        options[selectedOption]
          ? money(
              options[selectedOption].price
            )
          : 'Price TBD'
      }

    </div>


    <button
      class="btn btn-primary btn-block"
      id="addDTFBtn"
      type="button"
    >

      Add to Cart

    </button>

  `;
let selectedDTFQuantity = 1;

const dtfQuantityValue =
  $('dtfQty');

const dtfMinusButton =
  $('dtfQtyMinus');

const dtfPlusButton =
  $('dtfQtyPlus');


function updateDTFQuantity() {

  if (!dtfQuantityValue) {
    return;
  }

  dtfQuantityValue.textContent =
    selectedDTFQuantity;

}


dtfMinusButton?.addEventListener(
  'click',
  () => {

    selectedDTFQuantity =
      Math.max(
        1,
        selectedDTFQuantity - 1
      );

    updateDTFQuantity();

  }
);


dtfPlusButton?.addEventListener(
  'click',
  () => {

    selectedDTFQuantity++;

    updateDTFQuantity();

  }
);

  document

    .querySelectorAll(
      '[data-dtf-option]'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {


            selectedOption =
              Number(
                button.dataset.dtfOption
              );


            document

              .querySelectorAll(
                '[data-dtf-option]'
              )

              .forEach(
                (optionButton) => {

                  optionButton.classList.toggle(

                    'active',

                    Number(
                      optionButton.dataset
                        .dtfOption
                    ) === selectedOption

                  );

                }
              );


            const option =
              options[
                selectedOption
              ];


            $('dtfPrice').textContent =

              option

                ? money(
                    option.price
                  )

                : 'Price TBD';

          }

        );

      }
    );


  $('addDTFBtn')

    .addEventListener(
      'click',
      () => {


        const option =
          options[
            selectedOption
          ];


        if (!option) {
          return;
        }


        const qty =
  selectedDTFQuantity;

        const item = {

          id:
            `${product.id}-${option.label}`,


          name:
            product.name,


          type:
            'DTF Transfer',


          option:
            option.label,


          dimensions:
            option.dimensions ||
            '',


          qty,


          unitPrice:
            Number(
              option.price || 0
            ),


          image:
            product.image ||
            ''

        };


        window.dispatchEvent(

          new CustomEvent(

            'coastalghost:add-to-cart',

            {
              detail:
                item
            }

          )

        );


        modal.classList.remove(
          'open'
        );


        modal.style.display =
          'none';

      }
    );


  modal.classList.add(
    'open'
  );


  modal.style.display =
    'flex';

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function bindNav() {

  document

    .querySelectorAll(
      '.shop-nav-btn'
    )

    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {


            document

              .querySelectorAll(
                '.shop-nav-btn'
              )

              .forEach(
                (navButton) =>

                  navButton.classList.remove(
                    'active'
                  )
              );


            button.classList.add(
              'active'
            );


            const type =
              button.dataset.filterType;


            if (type === 'all') {

              renderProducts(

                groupsWithStyles(
                  SHOP.groups
                )

              );

            }


            else if (
              type === 'dtf'
            ) {

              $('dtfSection')
                ?.scrollIntoView({

                  behavior:
                    'smooth'

                });

            }


            else if (
              type === 'design-menu'
            ) {

              $('designSection')
                ?.scrollIntoView({

                  behavior:
                    'smooth'

                });

            }


            else if (
              type === 'item-menu'
            ) {

              $('itemTypeSection')
                ?.scrollIntoView({

                  behavior:
                    'smooth'

                });

            }


            else if (
              type === 'fit-menu'
            ) {

              $('fitSection')
                ?.scrollIntoView({

                  behavior:
                    'smooth'

                });

            }

          }

        );

      }
    );


  $('closeModalBtn')

    ?.addEventListener(
      'click',
      () => {

        $('productModal')
          .classList.remove(
            'open'
          );


        $('productModal').style.display =
          'none';

      }
    );

}


/* =========================================================
   START SHOP
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  loadShopData
);
