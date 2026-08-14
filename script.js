/* =========================================================
   FLORA VILLAGE
   Main application JavaScript
   ========================================================= */


/* =========================================================
   1. PRODUCTS
   ========================================================= */

const defaultProducts = [
  {
    id: 1,
    title: 'Большой букет',
    desc: 'Гладиолусы, георгины, малина',
    price: 3850,
    img: 'Изображение jpg-41B1-95EA-5F-0.jpg',
    category: 'large',
    tag: 'Хит'
  },
  {
    id: 2,
    title: 'Маленький букет',
    desc: 'Львиный зев, георгины',
    price: 1250,
    img: 'Изображение jpg-41B1-95EA-5F-1.jpg',
    category: 'small',
    tag: 'Нежный'
  },
  {
    id: 3,
    title: 'Средний букет',
    desc: 'Георгины, гладиолусы',
    price: 2250,
    img: 'Изображение jpg-41B1-95EA-5F-2.jpg',
    category: 'medium',
    tag: 'Популярный'
  },
  {
    id: 4,
    title: 'Охапка',
    desc: 'Объёмная сезонная композиция',
    price: 2250,
    img: 'Изображение jpg-41B1-95EA-5F-3.jpg',
    category: 'large',
    tag: 'Wow'
  },
  {
    id: 5,
    title: 'Охапка «Львиный зев»',
    desc: 'Свежий львиный зев',
    price: 1800,
    img: 'Изображение jpg-41B1-95EA-5F-4.jpg',
    category: 'medium',
    tag: 'Fresh'
  },
  {
    id: 6,
    title: 'Охапка «Георгины»',
    desc: 'Георгины · 300 ₽ / шт.',
    price: 300,
    img: 'Изображение jpg-41B1-95EA-5F-5.jpg',
    category: 'small',
    tag: 'Выгодно'
  }
];


/* =========================================================
   2. SAFE STORAGE
   ========================================================= */

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.warn(`Ошибка чтения localStorage: ${key}`, error);
    return fallback;
  }
}


function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Ошибка записи localStorage: ${key}`, error);
  }
}


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

let customProducts = loadStorage('floraCustomProducts', []);

let products = [
  ...defaultProducts,
  ...customProducts
];

let cart = loadStorage('cart', []);

let favorites = loadStorage('favorites', []);

let users = loadStorage('floraUsers', []);

let currentUser = loadStorage('floraCurrentUser', null);

let orders = loadStorage('floraOrders', []);

let addresses = loadStorage('floraAddresses', []);

let reminders = loadStorage('floraReminders', []);


/* =========================================================
   4. HELPERS
   ========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => [
  ...document.querySelectorAll(selector)
];


function money(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat('ru-RU').format(
    Math.max(0, number)
  );
}


function findProduct(id) {
  return products.find(
    product => Number(product.id) === Number(id)
  );
}


function normalizeIds(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map(Number)
    .filter(id => Number.isFinite(id));
}


function persist() {
  saveStorage('cart', cart);
  saveStorage('favorites', favorites);
  saveStorage('floraUsers', users);
  saveStorage('floraCurrentUser', currentUser);
  saveStorage('floraOrders', orders);
  saveStorage('floraAddresses', addresses);
  saveStorage('floraReminders', reminders);
  saveStorage('floraCustomProducts', customProducts);

  updateCounters();
}


function cleanupData() {
  cart = Array.isArray(cart)
    ? cart.filter(item => findProduct(item.id))
    : [];

  favorites = normalizeIds(favorites)
    .filter(id => findProduct(id));

  customProducts = Array.isArray(customProducts)
    ? customProducts.filter(product =>
        product &&
        product.id &&
        product.title &&
        Number.isFinite(Number(product.price))
      )
    : [];

  products = [
    ...defaultProducts,
    ...customProducts
  ];
}


/* =========================================================
   5. COUNTERS
   ========================================================= */

function updateCounters() {
  const quantity = cart.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  const elements = {
    cartCount: $('#cartCount'),
    favCount: $('#favCount'),
    mobileFav: $('#mobileFav'),
    accountFavCount: $('#accountFavCount'),
    accountCartCount: $('#accountCartCount'),
    accountOrderCount: $('#accountOrderCount')
  };

  if (elements.cartCount) {
    elements.cartCount.textContent = quantity;
  }

  if (elements.favCount) {
    elements.favCount.textContent = favorites.length;
  }

  if (elements.mobileFav) {
    elements.mobileFav.textContent = favorites.length;
  }

  if (elements.accountFavCount) {
    elements.accountFavCount.textContent = favorites.length;
  }

  if (elements.accountCartCount) {
    elements.accountCartCount.textContent = quantity;
  }

  if (elements.accountOrderCount) {
    elements.accountOrderCount.textContent = orders.length;
  }
}


/* =========================================================
   6. TOAST
   ========================================================= */

let toastTimer = null;


function toast(message) {
  const toastElement = $('#toast');

  if (!toastElement) {
    return;
  }

  const text = toastElement.querySelector('span');

  if (text) {
    text.textContent = message;
  }

  toastElement.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastElement.classList.remove('show');
  }, 2400);
}


/* =========================================================
   7. PANELS
   ========================================================= */

function panel(selector) {
  const target = $(selector);

  if (!target) {
    return;
  }

  $('#favPanel')?.classList.remove('active');
  $('#cartPanel')?.classList.remove('active');

  target.classList.add('active');

  $('#overlay')?.classList.add('active');

  document.body.classList.add('no-scroll');

  renderCart();
  renderFav();
}


function closePanels() {
  $('#favPanel')?.classList.remove('active');
  $('#cartPanel')?.classList.remove('active');

  $('#overlay')?.classList.remove('active');

  if (!$('.modal.active')) {
    document.body.classList.remove('no-scroll');
  }
}


/* =========================================================
   8. MODALS
   ========================================================= */

/* =========================================================
   8. MODALS
   ========================================================= */

function modal(element, open = true) {
  if (!element) {
    return;
  }

  const previouslyFocused = document.activeElement;

  element.classList.toggle('active', open);
  element.setAttribute('aria-hidden', String(!open));

  if (open) {
    document.body.classList.add('no-scroll');
  } else if (!$('.side-panel.active') && !$('.modal.active')) {
    document.body.classList.remove('no-scroll');
    
    // Снимаем фокус с кнопок внутри закрытых окон, чтобы убрать предупреждения
    if (previouslyFocused && previouslyFocused.closest(element.tagName)) {
        previouslyFocused.blur();
    }
  }
}

/* =========================================================
   9. CATALOG
   ========================================================= */

function renderCatalog() {
  const grid = $('#catalogGrid');

  if (!grid) {
    return;
  }

  let list = [...products];

  const activeCategory =
    $('.category.active')?.dataset.category || 'all';

  const searchQuery =
    $('#searchInput')?.value
      ?.trim()
      .toLowerCase() || '';

  const sort =
    $('#sortSelect')?.value || 'default';


  /* Category */

  if (activeCategory !== 'all') {
    list = list.filter(
      product => product.category === activeCategory
    );
  }


  /* Search */

  if (searchQuery) {
    list = list.filter(product => {
      const searchableText = [
        product.title,
        product.desc,
        product.tag
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(searchQuery);
    });
  }


  /* Sort */

  if (sort === 'priceAsc') {
    list.sort(
      (a, b) => a.price - b.price
    );
  }

  if (sort === 'priceDesc') {
    list.sort(
      (a, b) => b.price - a.price
    );
  }

  if (sort === 'name') {
    list.sort(
      (a, b) =>
        a.title.localeCompare(
          b.title,
          'ru'
        )
    );
  }


  /* Empty state */

  const emptyResults = $('#emptyResults');

  if (emptyResults) {
    emptyResults.hidden = list.length > 0;
  }


  /* Render */

  grid.innerHTML = list
    .map(product => {
      const isFavorite =
        favorites.includes(Number(product.id));

      const cartItem =
        cart.find(
          item =>
            Number(item.id) === Number(product.id)
        );

      return `
        <article
          class="card"
          data-product="${product.id}"
        >

          <div class="card__image-wrap">

            <img
              src="${product.img}"
              alt="${product.title}"
              loading="lazy"
              onerror="this.style.opacity='.15'"
            >

            <span class="card__tag">
              ${product.tag}
            </span>

            <button
              class="card__fav ${isFavorite ? 'active' : ''}"
              type="button"
              data-fav="${product.id}"
              aria-label="${
                isFavorite
                  ? 'Убрать из избранного'
                  : 'Добавить в избранное'
              }"
              aria-pressed="${isFavorite}"
            >

              <i
                class="fa-${
                  isFavorite
                    ? 'solid'
                    : 'regular'
                } fa-heart"
                aria-hidden="true"
              ></i>

            </button>

            <button
              class="card__quick"
              type="button"
              data-quick="${product.id}"
            >
              Быстрый просмотр
            </button>

          </div>


          <div class="card__body">

            <h3 class="card__title">
              ${product.title}
            </h3>

            <p class="card__desc">
              ${product.desc}
            </p>

            <div class="card__bottom">

              <strong class="card__price">
                ${money(product.price)} ₽
              </strong>

              <button
                class="card__add ${
                  cartItem ? 'added' : ''
                }"
                type="button"
                data-add="${product.id}"
              >
                ${
                  cartItem
                    ? 'Добавлено ✓'
                    : 'В корзину'
                }
              </button>

            </div>

          </div>

        </article>
      `;
    })
    .join('');
}


/* =========================================================
   10. CART
   ========================================================= */

function getCartTotal() {
  return cart.reduce((total, item) => {
    const product = findProduct(item.id);

    if (!product) {
      return total;
    }

    return total +
      Number(product.price) *
      Number(item.qty || 0);
  }, 0);
}


function renderCart() {
  const body = $('#cartBody');
  const footer = $('#cartFooter');

  if (!body) {
    return;
  }

  if (!cart.length) {
    body.innerHTML = `
      <div class="empty-panel">

        <i
          class="fa-solid fa-bag-shopping"
          aria-hidden="true"
        ></i>

        <p>
          Корзина пока пуста
        </p>

        <small>
          Добавьте букет, который понравился.
        </small>

      </div>
    `;

    if (footer) {
      footer.hidden = true;
    }

    return;
  }


  body.innerHTML = cart
    .map(item => {
      const product = findProduct(item.id);

      if (!product) {
        return '';
      }

      return `
        <div class="panel-item">

          <img
            src="${product.img}"
            alt="${product.title}"
            loading="lazy"
          >

          <div>

            <h4>
              ${product.title}
            </h4>

            <p>
              ${money(product.price)} ₽
            </p>

            <div class="qty">

              <button
                type="button"
                data-minus="${product.id}"
                aria-label="Уменьшить количество"
              >
                −
              </button>

              <span>
                ${item.qty}
              </span>

              <button
                type="button"
                data-plus="${product.id}"
                aria-label="Увеличить количество"
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove"
            type="button"
            data-remove="${product.id}"
            aria-label="Удалить ${product.title}"
          >

            <i
              class="fa-solid fa-trash"
              aria-hidden="true"
            ></i>

          </button>

        </div>
      `;
    })
    .join('');


  const total = getCartTotal();

  if ($('#cartTotal')) {
    $('#cartTotal').textContent = money(total);
  }

  if (footer) {
    footer.hidden = false;
  }
}


/* =========================================================
   11. FAVORITES
   ========================================================= */

function renderFav() {
  const body = $('#favBody');

  if (!body) {
    return;
  }

  if (!favorites.length) {
    body.innerHTML = `
      <div class="empty-panel">

        <i
          class="fa-regular fa-heart"
          aria-hidden="true"
        ></i>

        <p>
          Пока ничего нет
        </p>

        <small>
          Нажмите ♥ на понравившемся букете.
        </small>

      </div>
    `;

    return;
  }


  body.innerHTML = favorites
    .map(id => {
      const product = findProduct(id);

      if (!product) {
        return '';
      }

      return `
        <div class="panel-item">

          <img
            src="${product.img}"
            alt="${product.title}"
            loading="lazy"
          >

          <div>

            <h4>
              ${product.title}
            </h4>

            <p>
              ${money(product.price)} ₽
            </p>

            <button
              class="mini-link"
              type="button"
              data-fav-view="${product.id}"
            >
              Посмотреть
            </button>

          </div>

          <button
            class="remove"
            type="button"
            data-fav-remove="${product.id}"
            aria-label="Удалить ${product.title}"
          >

            <i
              class="fa-solid fa-trash"
              aria-hidden="true"
            ></i>

          </button>

        </div>
      `;
    })
    .join('');
}


/* =========================================================
   12. CART ACTIONS
   ========================================================= */

function addToCart(id) {
  const product = findProduct(id);

  if (!product) {
    toast('Товар больше недоступен');
    return;
  }

  const existingItem = cart.find(
    item => Number(item.id) === Number(id)
  );

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: Number(id),
      qty: 1
    });
  }

  persist();

  renderCatalog();
  renderCart();
  renderFav();

  toast('Букет добавлен в корзину');
}


function removeFromCart(id) {
  cart = cart.filter(
    item => Number(item.id) !== Number(id)
  );

  persist();

  renderCart();
  renderCatalog();
}


function changeCartQuantity(id, change) {
  const item = cart.find(
    cartItem =>
      Number(cartItem.id) === Number(id)
  );

  if (!item) {
    return;
  }

  item.qty += change;

  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }

  persist();

  renderCart();
  renderCatalog();
}


/* =========================================================
   13. FAVORITE ACTION
   ========================================================= */

function toggleFav(id) {
  const product = findProduct(id);

  if (!product) {
    return;
  }

  const numericId = Number(id);

  if (favorites.includes(numericId)) {
    favorites = favorites.filter(
      favoriteId =>
        favoriteId !== numericId
    );

    toast('Удалено из избранного');
  } else {
    favorites.push(numericId);

    toast('Добавлено в избранное');
  }

  persist();

  renderCatalog();
  renderFav();
}


/* =========================================================
   14. PRODUCT MODAL
   ========================================================= */

function openProduct(id) {
  const product = findProduct(id);

  if (!product) {
    toast('Товар не найден');
    return;
  }

  const body = $('#productModalBody');

  if (!body) {
    return;
  }

  const isFavorite =
    favorites.includes(Number(product.id));


  body.innerHTML = `
    <div class="product-modal__grid">

      <img
        src="${product.img}"
        alt="${product.title}"
      >

      <div>

        <span class="eyebrow">
          ${product.tag}
        </span>

        <h2>
          ${product.title}
        </h2>

        <p class="product-modal__desc">
          ${product.desc}.
          Соберём букет вручную,
          добавим открытку и бережно
          подготовим к доставке.
        </p>

        <div class="product-rating">
          ★★★★★
          <span>
            4.9 · 27 отзывов
          </span>
        </div>

        <strong class="product-modal__price">
          ${money(product.price)} ₽
        </strong>


        <div class="product-modal__options">

          <b>
            Размер
          </b>

          <div class="choice-grid">

            <button
              class="choice active"
              type="button"
            >
              Стандарт
            </button>

            <button
              class="choice"
              type="button"
            >
              Премиум +700 ₽
            </button>

          </div>

        </div>


        <button
          class="btn btn--dark full"
          type="button"
          data-modal-add="${product.id}"
        >

          Добавить в корзину

          <i
            class="fa-solid fa-bag-shopping"
            aria-hidden="true"
          ></i>

        </button>


        <button
          class="btn btn--light full"
          type="button"
          data-modal-fav="${product.id}"
        >

          ${
            isFavorite
              ? '♥ В избранном'
              : '♡ В избранное'
          }

        </button>

      </div>

    </div>
  `;

  modal($('#productModal'));
  // Внутри функции openProduct(id), после modal($('#productModal'));
setTimeout(() => {
  const focusable = $('#productModal').querySelector('button, input, a');
  if (focusable) focusable.focus();
}, 100);
}


/* =========================================================
   15. CHECKOUT
   ========================================================= */

function openCheckout() {
  if (!cart.length) {
    toast('Сначала добавьте букет в корзину');
    return;
  }

  const total = getCartTotal();

  if ($('#checkoutTotal')) {
    $('#checkoutTotal').textContent =
      money(total);
  }

  if ($('#checkoutMessage')) {
    $('#checkoutMessage').textContent = '';
  }

  if ($('#promoHint')) {
    $('#promoHint').textContent =
      'Можно применить промокод';
  }

  modal($('#checkoutModal'));
}


/* =========================================================
   16. ACCOUNT
   ========================================================= */

function updateAccount() {
  const auth = $('#accountAuth');
  const dashboard = $('#accountDashboard');

  if (!auth || !dashboard) {
    return;
  }

  if (currentUser) {
    auth.hidden = true;
    dashboard.hidden = false;

    $('#accountName').textContent =
      currentUser.name || 'Пользователь';

    $('#accountEmail').textContent =
      currentUser.email || '';

    $('#avatar').textContent =
      (currentUser.name || 'A')
        .charAt(0)
        .toUpperCase();

  } else {
    auth.hidden = false;
    dashboard.hidden = true;
  }
}


/* =========================================================
   17. ACCOUNT SERVICES
   ========================================================= */

function openService(type) {
  let title = '';
  let body = '';


  /* Orders */

  if (type === 'orders') {
    title = 'Мои заказы';

    body = orders.length
      ? orders
          .slice()
          .reverse()
          .map(order => `
            <div class="service-row">

              <div>

                <b>
                  ${order.orderId}
                </b>

                <small>
                  ${order.dateText}
                  ·
                  ${order.delivery}
                </small>

              </div>

              <strong>
                ${money(order.total)} ₽
              </strong>

            </div>
          `)
          .join('')
      : `
        <div class="empty-panel">

          <i
            class="fa-solid fa-box"
            aria-hidden="true"
          ></i>

          <p>
            Заказов пока нет
          </p>

          <small>
            Ваши будущие заказы появятся здесь.
          </small>

        </div>
      `;
  }


  /* Addresses */

  if (type === 'addresses') {
    title = 'Адреса доставки';

    body = `
      <div class="saved-list">

        ${
          addresses.length
            ? addresses
                .map((address, index) => `
                  <div class="service-row">

                    <div>

                      <b>
                        ${address.title}
                      </b>

                      <small>
                        ${address.address}
                      </small>

                    </div>

                    <button
                      class="mini-link"
                      type="button"
                      data-address-remove="${index}"
                    >
                      Удалить
                    </button>

                  </div>
                `)
                .join('')
            : `
              <div class="empty-panel">
                <p>
                  Адресов пока нет.
                </p>
              </div>
            `
        }

      </div>


      <form
        id="addressForm"
        class="mini-form"
      >

        <input
          id="newAddressTitle"
          name="title"
          required
          placeholder="Название: Дом, Работа"
        >

        <input
          id="newAddress"
          name="address"
          required
          placeholder="Улица, дом, квартира"
        >

        <button
          class="btn btn--dark full"
          type="submit"
        >
          Сохранить адрес
        </button>

      </form>
    `;
  }


  /* Bonuses */

  if (type === 'bonuses') {
    title = 'Бонусная программа';

    body = `
      <div class="bonus-card">

        <span>
          Ваш баланс
        </span>

        <b>
          250
        </b>

        <small>
          бонусов · 1 бонус = 1 ₽ при оплате
        </small>

      </div>

      <p>
        Бонусы начисляются после подтверждённых заказов.
        В этой версии расчёт работает в демо-режиме.
      </p>
    `;
  }


  /* Reminders */

  if (type === 'reminders') {
    title = 'Важные даты';

    body = `
      <form
        id="reminderForm"
        class="mini-form"
      >

        <input
          id="reminderName"
          name="name"
          required
          placeholder="Например, день рождения Анны"
        >

        <input
          id="reminderDate"
          name="date"
          type="date"
          required
        >

        <button
          class="btn btn--dark full"
          type="submit"
        >
          Сохранить напоминание
        </button>

      </form>

      <div id="reminderList"></div>
    `;
  }


  $('#serviceTitle').textContent = title;
  $('#serviceBody').innerHTML = body;

  modal($('#serviceModal'));


  if (type === 'reminders') {
    renderReminders();
  }
}


/* =========================================================
   18. REMINDERS
   ========================================================= */

function renderReminders() {
  const list = $('#reminderList');

  if (!list) {
    return;
  }

  list.innerHTML = reminders.length
    ? reminders
        .map((reminder, index) => `
          <div class="service-row">

            <div>

              <b>
                ${reminder.name}
              </b>

              <small>
                ${reminder.date}
              </small>

            </div>

            <button
              class="mini-link"
              type="button"
              data-reminder-remove="${index}"
            >
              Удалить
            </button>

          </div>
        `)
        .join('')
    : `
      <p class="muted">
        Напоминаний пока нет.
      </p>
    `;
}


/* =========================================================
   19. BUILDER
   ========================================================= */

function builderUpdate() {
  const flower =
    $('#flowerChoices .choice.active');

  const size =
    $('.builder-step:nth-child(2) .choice.active');

  const wrap =
    $('.builder-step:nth-child(3) .choice.active');

  const extras =
    $$('.builder-step:nth-child(4) .choice.active');


  let total = 1500;

  total += Number(
    flower?.dataset.builderPrice || 0
  );

  total += Number(
    size?.dataset.sizePrice || 0
  );

  total += Number(
    wrap?.dataset.wrapPrice || 0
  );

  total += extras.reduce(
    (sum, element) =>
      sum +
      Number(element.dataset.extraPrice || 0),
    0
  );


  const flowerName =
    flower?.dataset.builderName ||
    'Авторская композиция';

  const sizeName =
    size?.dataset.size ||
    'S';


  if ($('#builderTotal')) {
    $('#builderTotal').textContent =
      money(total);
  }


  if ($('#builderPreview')) {
    $('#builderPreview').textContent =
      `${flowerName} · размер ${sizeName}`;
  }


  if ($('#builderFlowers')) {
    if (flowerName.includes('Роз')) {
      $('#builderFlowers').textContent = '🌹';
    } else if (flowerName.includes('Тюль')) {
      $('#builderFlowers').textContent = '🌷';
    } else if (flowerName.includes('Прем')) {
      $('#builderFlowers').textContent = '💐';
    } else {
      $('#builderFlowers').textContent = '✿';
    }
  }


  return total;
}


/* =========================================================
   20. ADD CUSTOM BOUQUET
   ========================================================= */

function addCustomBouquet() {
  const total = builderUpdate();

  const flower =
    $('#flowerChoices .choice.active');

  const size =
    $('.builder-step:nth-child(2) .choice.active');

  const wrap =
    $('.builder-step:nth-child(3) .choice.active');

  const extras =
    $$('.builder-step:nth-child(4) .choice.active');


  const flowerName =
    flower?.dataset.builderName ||
    'Авторская композиция';

  const sizeName =
    size?.dataset.size ||
    'S';

  const wrapPrice =
    Number(wrap?.dataset.wrapPrice || 0);

  const extraNames =
    extras
      .map(item => item.textContent.trim())
      .join(', ');


  const customProduct = {
    id: Date.now(),
    title: 'Собранный букет',
    desc: [
      flowerName,
      `размер ${sizeName}`,
      wrapPrice
        ? 'премиальная упаковка'
        : 'крафтовая упаковка',
      extraNames
        ? `дополнения: ${extraNames}`
        : ''
    ]
      .filter(Boolean)
      .join(' · '),
    price: total,
    img: defaultProducts[1].img,
    category: 'medium',
    tag: 'Ваш дизайн',
    custom: true
  };


  customProducts.push(customProduct);

  products.push(customProduct);

  cart.push({
    id: customProduct.id,
    qty: 1
  });


  persist();

  renderCatalog();
  renderCart();

  toast('Ваш букет добавлен в корзину');
}


/* =========================================================
   21. GALLERY
   ========================================================= */

function renderGallery() {
  const gallery = $('#galleryGrid');

  if (!gallery) {
    return;
  }

  const galleryProducts = products.slice(0, 6);

  gallery.innerHTML = galleryProducts
    .map((product, index) => `
      <button
        class="gallery-item"
        type="button"
        data-product="${product.id}"
        aria-label="Открыть ${product.title}"
      >

        <img
          src="${product.img}"
          alt="${product.title}"
          loading="lazy"
          onerror="this.style.opacity='.15'"
        >

        <span>

          <span>
            ${product.title}
          </span>

          <strong>
            ${money(product.price)} ₽
          </strong>

        </span>

      </button>
    `)
    .join('');
}


/* =========================================================
   22. THEME
   ========================================================= */

function initTheme() {
  const dark =
    localStorage.getItem('floraTheme') === 'dark';

  document.body.classList.toggle(
    'dark',
    dark
  );

  const button = $('#themeBtn');

  if (!button) {
    return;
  }

  button.innerHTML = dark
    ? `
      <i
        class="fa-regular fa-sun"
        aria-hidden="true"
      ></i>
    `
    : `
      <i
        class="fa-regular fa-moon"
        aria-hidden="true"
      ></i>
    `;

  button.setAttribute(
    'aria-pressed',
    String(dark)
  );

  button.setAttribute(
    'aria-label',
    dark
      ? 'Включить светлую тему'
      : 'Включить тёмную тему'
  );
}


/* =========================================================
   23. LANGUAGE
   ========================================================= */

function initLanguage() {
  const english =
    localStorage.getItem('floraLang') === 'en';

  if (english) {
    document.documentElement.lang = 'en';

    if ($('#langBtn')) {
      $('#langBtn').textContent = 'RU';
    }

    document.title =
      'Flora Village — flowers delivered';

  } else {
    document.documentElement.lang = 'ru';

    if ($('#langBtn')) {
      $('#langBtn').textContent = 'EN';
    }

    document.title =
      'Flora Village — доставка свежих цветов и авторских букетов';
  }
}


/* =========================================================
   24. CHECKOUT FORM
   ========================================================= */

/* =========================================================
   24. CHECKOUT FORM
   ========================================================= */

function handleCheckoutSubmit(event) {
  event.preventDefault();

  if (!cart.length) {
    toast('Корзина пуста');
    return;
  }

  const name = $('#orderName')?.value.trim();
  const phone = $('#orderPhone')?.value.trim();
  const address = $('#orderAddress')?.value.trim();

  if (!name || !phone || !address) {
    $('#checkoutMessage').textContent = 'Заполните обязательные поля.';
    return;
  }

  let total = getCartTotal();
  const promo = $('#orderPromo')?.value.trim().toUpperCase();
  if (promo === 'FLOWER10') {
    total = Math.round(total * 0.9);
    $('#promoHint').textContent = 'Скидка 10% применена';
  }

  // Формируем данные заказа
  const orderData = {
    items: cart.map(item => {
      const product = findProduct(item.id);
      return {
        id: item.id,
        title: product?.title || 'Товар',
        price: product?.price || 0,
        qty: item.qty
      };
    }),
    total: total,
    name: name,
    phone: phone,
    address: address,
    delivery: `${$('#orderDate').value}, ${$('#orderTime').value}`,
    comment: $('#orderComment')?.value.trim() || ''
  };

  // Отправляем на Python-сервер
  console.log("Отправляем заказ на сервер...");
    fetch('http://127.0.0.1:5000/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  .then(response => {
    console.log("Сервер ответил, статус:", response.status);
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    return response.json();
  })
  .then(result => {
    console.log("Результат от сервера:", result);
    if (result.success) {
      cart = [];
      persist();
      renderCart();
      renderCatalog();
      renderFav();
      
      $('#checkoutTotal').textContent = money(total);
      $('#checkoutMessage').textContent = `Заказ №${result.orderId} принят! Мы скоро с вами свяжемся.`;
      toast('Заказ оформлен!');
      event.target.reset();
      
      setTimeout(() => {
        modal($('#checkoutModal'), false);
      }, 2600);
    } else {
      throw new Error(result.message || 'Неизвестная ошибка на сервере');
    }
  })
  .catch(error => {
    console.error('КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    $('#checkoutMessage').textContent = `Ошибка: ${error.message}. Проверьте, запущен ли Python-сервер.`;
    toast('Ошибка отправки заказа!');
  });
}

  


/* =========================================================
   25. INITIALIZATION
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    /* Clean old/broken localStorage data */

    cleanupData();

    persist();


    /* Initial render */

    renderCatalog();

    renderCart();

    renderFav();

    renderGallery();

    updateCounters();

    updateAccount();

    initTheme();

    initLanguage();

    builderUpdate();
      /* =====================================================
     PWA Service Worker Registration
     ===================================================== */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[SW] Зарегистрирован успешно:', registration.scope);
        })
        .catch(error => {
          console.log('[SW] Ошибка регистрации:', error);
        });
    });
  }


    /* =====================================================
       HEADER
       ===================================================== */


    $('#burgerBtn')?.addEventListener(
      'click',
      () => {
        const nav = $('#nav');

        if (!nav) {
          return;
        }

        const isOpen =
          nav.classList.toggle('open');

        $('#burgerBtn').setAttribute(
          'aria-expanded',
          String(isOpen)
        );
      }
    );


    $('#themeBtn')?.addEventListener(
      'click',
      () => {
        const dark =
          !document.body.classList.contains('dark');

        document.body.classList.toggle(
          'dark',
          dark
        );

        localStorage.setItem(
          'floraTheme',
          dark ? 'dark' : 'light'
        );

        initTheme();
      }
    );


    $('#langBtn')?.addEventListener(
      'click',
      () => {
        const english =
          localStorage.getItem('floraLang') !== 'en';

        localStorage.setItem(
          'floraLang',
          english ? 'en' : 'ru'
        );

        initLanguage();

        toast(
          english
            ? 'English mode enabled'
            : 'Русский режим включён'
        );
      }
    );


    /* =====================================================
       SEARCH
       ===================================================== */


    $('#searchBtn')?.addEventListener(
      'click',
      () => {

        const searchbar =
          $('#searchbar');

        if (!searchbar) {
          return;
        }

        const active =
          searchbar.classList.toggle('active');

        $('#searchBtn').setAttribute(
          'aria-expanded',
          String(active)
        );

        if (active) {
          $('#searchInput')?.focus();
        }
      }
    );


    $('#searchClear')?.addEventListener(
      'click',
      () => {

        const input =
          $('#searchInput');

        if (!input) {
          return;
        }

        input.value = '';

        renderCatalog();

        input.focus();
      }
    );


    $('#searchForm')?.addEventListener(
      'submit',
      event => {
        event.preventDefault();

        renderCatalog();

        $('#catalog')?.scrollIntoView({
          behavior: 'smooth'
        });
      }
    );


    $('#searchInput')?.addEventListener(
      'input',
      renderCatalog
    );


    /* =====================================================
       CATEGORIES / SORT
       ===================================================== */


    $('#categories')?.addEventListener(
      'click',
      event => {

        const button =
          event.target.closest(
            '[data-category]'
          );

        if (!button) {
          return;
        }

        $$('.category').forEach(
          item =>
            item.classList.remove('active')
        );

        button.classList.add('active');

        renderCatalog();
      }
    );


    $('#sortSelect')?.addEventListener(
      'change',
      renderCatalog
    );


    /* =====================================================
       CATALOG DELEGATION
       ===================================================== */


    $('#catalogGrid')?.addEventListener(
      'click',
      event => {

        const addButton =
          event.target.closest('[data-add]');

        const favoriteButton =
          event.target.closest('[data-fav]');

        const quickButton =
          event.target.closest('[data-quick]');

        const card =
          event.target.closest('.card');


        if (addButton) {
          event.stopPropagation();

          addToCart(
            Number(addButton.dataset.add)
          );

          return;
        }


        if (favoriteButton) {
          event.stopPropagation();

          toggleFav(
            Number(
              favoriteButton.dataset.fav
            )
          );

          return;
        }


        if (quickButton) {
          event.stopPropagation();

          openProduct(
            Number(
              quickButton.dataset.quick
            )
          );

          return;
        }


        if (card) {
          openProduct(
            Number(
              card.dataset.product
            )
          );
        }
      }
    );


    /* =====================================================
       FAVORITES
       ===================================================== */


    $('#favBody')?.addEventListener(
      'click',
      event => {

        const removeButton =
          event.target.closest(
            '[data-fav-remove]'
          );

        const viewButton =
          event.target.closest(
            '[data-fav-view]'
          );


        if (removeButton) {
          toggleFav(
            Number(
              removeButton.dataset.favRemove
            )
          );
        }


        if (viewButton) {
          openProduct(
            Number(
              viewButton.dataset.favView
            )
          );
        }
      }
    );


    /* =====================================================
       CART
       ===================================================== */


    $('#cartBody')?.addEventListener(
      'click',
      event => {

        const plus =
          event.target.closest('[data-plus]');

        const minus =
          event.target.closest('[data-minus]');

        const remove =
          event.target.closest('[data-remove]');


        if (plus) {
          changeCartQuantity(
            Number(plus.dataset.plus),
            1
          );
        }


        if (minus) {
          changeCartQuantity(
            Number(minus.dataset.minus),
            -1
          );
        }


        if (remove) {
          removeFromCart(
            Number(remove.dataset.remove)
          );
        }
      }
    );


    /* =====================================================
       PANELS
       ===================================================== */


    $('#favBtn')?.addEventListener(
      'click',
      () => panel('#favPanel')
    );


    $('#cartBtn')?.addEventListener(
      'click',
      () => panel('#cartPanel')
    );


    $('#favClose')?.addEventListener(
      'click',
      closePanels
    );


    $('#cartClose')?.addEventListener(
      'click',
      closePanels
    );


    $('#overlay')?.addEventListener(
      'click',
      closePanels
    );


    /* =====================================================
       NAVIGATION
       ===================================================== */


    $$('#nav a').forEach(
      link => {

        link.addEventListener(
          'click',
          () => {

            $('#nav')
              ?.classList
              .remove('open');

            $('#burgerBtn')?.setAttribute(
              'aria-expanded',
              'false'
            );
          }
        );
      }
    );


    /* =====================================================
       MODALS
       ===================================================== */


    $$('.modal-close').forEach(
      button => {

        button.addEventListener(
          'click',
          () => {
            modal(
              button.closest('.modal'),
              false
            );
          }
        );
      }
    );


    $('#accountBtn')?.addEventListener(
      'click',
      () => {
        updateAccount();
        modal($('#accountModal'));
      }
    );


    $('#quickAccount')?.addEventListener(
      'click',
      () => {
        updateAccount();
        modal($('#accountModal'));
      }
    );


    /* =====================================================
       ACCOUNT TABS
       ===================================================== */


    $$('.tab').forEach(
      tab => {

        tab.addEventListener(
          'click',
          () => {

            $$('.tab').forEach(
              item =>
                item.classList.remove('active')
            );

            $$('.account-form').forEach(
              form =>
                form.classList.remove('active')
            );


            tab.classList.add('active');


            const form =
              $(`#${tab.dataset.tab}Form`);

            form?.classList.add('active');
          }
        );
      }
    );


    /* =====================================================
       REGISTER
       ===================================================== */


    $('#registerForm')?.addEventListener(
      'submit',
      event => {

        event.preventDefault();


        const name =
          $('#registerName')
            .value
            .trim();

        const email =
          $('#registerEmail')
            .value
            .trim()
            .toLowerCase();

        const password =
          $('#registerPassword')
            .value;


        if (password.length < 8) {
          $('#registerMessage').textContent =
            'Пароль должен содержать минимум 8 символов.';

          return;
        }


        if (
          users.some(
            user => user.email === email
          )
        ) {
          $('#registerMessage').textContent =
            'Этот email уже зарегистрирован.';

          return;
        }


                // Отправляем данные на сервер для регистрации
        fetch('http://127.0.0.1:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            currentUser = { name, email };
            persist();
            event.target.reset();
            updateAccount();
            $('#registerMessage').textContent = '';
            toast('Аккаунт создан!');
          } else {
            $('#registerMessage').textContent = result.message || 'Ошибка регистрации';
          }
        })
        .catch(error => {
          console.error('Ошибка:', error);
          $('#registerMessage').textContent = 'Не удалось подключиться к серверу.';
        });
      }
    );


    /* =====================================================
       LOGIN
       ===================================================== */


    $('#loginForm')?.addEventListener(
      'submit',
      event => {

        event.preventDefault();


        const email =
          $('#loginEmail')
            .value
            .trim()
            .toLowerCase();

        const password =
          $('#loginPassword')
            .value;


                fetch('http://127.0.0.1:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            currentUser = result.user;
            persist();
            event.target.reset();
            $('#loginMessage').textContent = '';
            updateAccount();
            toast('С возвращением!');
          } else {
            $('#loginMessage').textContent = result.message || 'Неверный email или пароль.';
          }
        })
        .catch(error => {
          console.error('Ошибка:', error);
          $('#loginMessage').textContent = 'Не удалось подключиться к серверу.';
        });
      }
    );


    /* =====================================================
       LOGOUT
       ===================================================== */


    $('#logoutBtn')?.addEventListener(
      'click',
      () => {

        currentUser = null;

        persist();

        updateAccount();

        toast('Вы вышли из аккаунта');
      }
    );


    /* =====================================================
       ACCOUNT SERVICES
       ===================================================== */


    $$('[data-account-service]').forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const type =
              button.dataset.accountService;


            if (
              type === 'favorites' ||
              type === 'cart'
            ) {

              modal(
                $('#accountModal'),
                false
              );

              panel(
                type === 'favorites'
                  ? '#favPanel'
                  : '#cartPanel'
              );

              return;
            }


            openService(type);
          }
        );
      }
    );


    /* =====================================================
       CHECKOUT
       ===================================================== */


    $('#checkoutBtn')?.addEventListener(
      'click',
      openCheckout
    );


    $('#checkoutForm')?.addEventListener(
      'submit',
      handleCheckoutSubmit
    );


    /* =====================================================
       PROMO
       ===================================================== */


    $('#promoBtn')?.addEventListener(
      'click',
      () => {

        toast(
          'Открытка добавлена к следующему заказу'
        );

        $('#builder')?.scrollIntoView({
          behavior: 'smooth'
        });
      }
    );


    /* =====================================================
       BUILDER
       ===================================================== */


    $('#builder')?.addEventListener(
      'click',
      event => {

        const choice =
          event.target.closest('.choice');

        if (!choice) {
          return;
        }


        const step =
          choice.closest('.builder-step');

        if (!step) {
          return;
        }


        /*
          Extras can be selected simultaneously.
        */

        if (choice.dataset.extraPrice) {

          choice.classList.toggle(
            'active'
          );

        } else {

          step
            .querySelectorAll('.choice')
            .forEach(
              item =>
                item.classList.remove('active')
            );

          choice.classList.add('active');
        }


        builderUpdate();
      }
    );


    $('#builderAdd')?.addEventListener(
      'click',
      addCustomBouquet
    );


    /* =====================================================
       GALLERY
       ===================================================== */


    $('#galleryGrid')?.addEventListener(
      'click',
      event => {

        const item =
          event.target.closest(
            '[data-product]'
          );

        if (!item) {
          return;
        }

        openProduct(
          Number(item.dataset.product)
        );
      }
    );


    /* =====================================================
       PRODUCT MODAL
       ===================================================== */


    $('#productModal')?.addEventListener(
      'click',
      event => {

        const addButton =
          event.target.closest(
            '[data-modal-add]'
          );

        const favoriteButton =
          event.target.closest(
            '[data-modal-fav]'
          );


        if (addButton) {

          addToCart(
            Number(
              addButton.dataset.modalAdd
            )
          );

          modal(
            $('#productModal'),
            false
          );
        }


        if (favoriteButton) {

          toggleFav(
            Number(
              favoriteButton.dataset.modalFav
            )
          );

          openProduct(
            Number(
              favoriteButton.dataset.modalFav
            )
          );
        }
      }
    );


    /* =====================================================
       SERVICE MODAL
       ===================================================== */


    $('#serviceBody')?.addEventListener(
      'click',
      event => {

        const addressRemove =
          event.target.closest(
            '[data-address-remove]'
          );

        const reminderRemove =
          event.target.closest(
            '[data-reminder-remove]'
          );


        if (addressRemove) {

          addresses.splice(
            Number(
              addressRemove.dataset.addressRemove
            ),
            1
          );

          persist();

          openService('addresses');

          toast('Адрес удалён');
        }


        if (reminderRemove) {

          reminders.splice(
            Number(
              reminderRemove.dataset.reminderRemove
            ),
            1
          );

          persist();

          renderReminders();

          toast('Напоминание удалено');
        }
      }
    );


    $('#serviceBody')?.addEventListener(
      'submit',
      event => {

        /* Address */

        if (
          event.target.id ===
          'addressForm'
        ) {

          event.preventDefault();


          const title =
            $('#newAddressTitle')
              .value
              .trim();

          const address =
            $('#newAddress')
              .value
              .trim();


          if (!title || !address) {
            return;
          }


          addresses.push({
            title,
            address
          });


          persist();

          openService('addresses');

          toast('Адрес сохранён');
        }


        /* Reminder */

        if (
          event.target.id ===
          'reminderForm'
        ) {

          event.preventDefault();


          const name =
            $('#reminderName')
              .value
              .trim();

          const date =
            $('#reminderDate')
              .value;


          if (!name || !date) {
            return;
          }


          reminders.push({
            name,
            date
          });


          persist();

          renderReminders();

          event.target.reset();

          toast('Напоминание сохранено');
        }
      }
    );


    /* =====================================================
       MOBILE NAV
       ===================================================== */


    $$('[data-mobile]').forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const target =
              button.dataset.mobile;


            if (target === 'top') {
              window.location.hash = 'top';
            }


            if (target === 'catalog') {
              $('#catalog')?.scrollIntoView({
                behavior: 'smooth'
              });
            }


            if (target === 'favorites') {
              panel('#favPanel');
            }


            if (target === 'account') {
              updateAccount();

              modal(
                $('#accountModal')
              );
            }
          }
        );
      }
    );


    /* =====================================================
       KEYBOARD
       ===================================================== */


    document.addEventListener(
      'keydown',
      event => {

        if (event.key !== 'Escape') {
          return;
        }

        closePanels();

        $$('.modal.active').forEach(
          activeModal =>
            modal(
              activeModal,
              false
            )
        );
      }
    );


    /* =====================================================
       CLOSE MODAL ON BACKDROP
       ===================================================== */

    $$('.modal').forEach(
      modalElement => {

        modalElement.addEventListener(
          'click',
          event => {

            if (
              event.target ===
              modalElement
            ) {
              modal(
                modalElement,
                false
              );
            }
          }
        );
      }
    );

  }
);