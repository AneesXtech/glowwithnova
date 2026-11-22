(() => {
  "use strict";

  const products = window.GLOW_PRODUCTS || [];
  const state = {
    cart: JSON.parse(localStorage.getItem("glowCart") || "[]"),
    wishlist: JSON.parse(localStorage.getItem("glowWishlist") || "[]")
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const money = (n) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
  const icon = (name) => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

  function saveState() {
    localStorage.setItem("glowCart", JSON.stringify(state.cart));
    localStorage.setItem("glowWishlist", JSON.stringify(state.wishlist));
  }

  function productCard(product, showRating = false) {
    const wished = state.wishlist.includes(product.id);
    return `
      <article class="product-card reveal" data-id="${product.id}" data-category="${product.category}">
        <div class="product-media">
          <img src="${product.image}" alt="${product.alt}" width="900" height="1125" loading="lazy">
          <span class="product-badge">${product.badge}</span>
          <button class="icon-button wishlist-button${wished ? " active" : ""}" type="button" data-wishlist="${product.id}" aria-label="${wished ? "Remove from" : "Add to"} wishlist" aria-pressed="${wished}">
            ${icon("heart")}
          </button>
          <button class="quick-add" type="button" data-add="${product.id}">Add to cart</button>
        </div>
        <div class="product-info">
          <p class="product-category">${product.category}</p>
          <h3>${product.name}</h3>
          <p class="product-price">${money(product.price)}</p>
          ${showRating ? `<div class="rating" aria-label="${product.rating} out of 5 stars">★★★★★ <span>${product.rating} · ${product.reviews} reviews</span></div>` : ""}
        </div>
      </article>`;
  }

  function renderProducts() {
    $("#new-products").innerHTML = products.filter((p) => p.featured === "new").map((p) => productCard(p)).join("");
    $("#best-products").innerHTML = products.filter((p) => p.featured === "best").map((p) => productCard(p, true)).join("");
    observeReveals();
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("active");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("active"), 2600);
  }

  function updateCounts() {
    const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    $$(".cart-count").forEach((el) => { el.textContent = cartCount; });
    $$(".wishlist-count").forEach((el) => {
      el.textContent = state.wishlist.length;
      el.hidden = state.wishlist.length === 0;
    });
  }

  function addToCart(id) {
    const existing = state.cart.find((item) => item.id === id);
    if (existing) existing.quantity += 1;
    else state.cart.push({ id, quantity: 1 });
    saveState();
    updateCounts();
    renderCart();
    const product = products.find((p) => p.id === id);
    toast(`${product.name} added to your bag`);
    openCart();
  }

  function updateCart(id, amount) {
    const item = state.cart.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) state.cart = state.cart.filter((entry) => entry.id !== id);
    saveState();
    updateCounts();
    renderCart();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter((item) => item.id !== id);
    saveState();
    updateCounts();
    renderCart();
  }

  function renderCart() {
    const container = $("#cart-items");
    const empty = $("#cart-empty");
    const footer = $("#cart-footer");
    const cartProducts = state.cart.map((item) => ({ ...products.find((p) => p.id === item.id), quantity: item.quantity })).filter((p) => p.id);

    container.innerHTML = cartProducts.map((product) => `
      <article class="cart-item">
        <img src="${product.image}" alt="${product.alt}">
        <div>
          <p>${product.category}</p>
          <h3>${product.name}</h3>
          <span class="cart-price">${money(product.price * product.quantity)}</span>
          <div class="quantity" aria-label="Quantity">
            <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Decrease quantity">${icon("minus")}</button>
            <span>${product.quantity}</span>
            <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Increase quantity">${icon("plus")}</button>
          </div>
        </div>
        <button class="remove-item" type="button" data-remove="${product.id}" aria-label="Remove ${product.name}">${icon("close")}</button>
      </article>`).join("");

    $("#cart-subtotal").textContent = money(cartProducts.reduce((sum, p) => sum + p.price * p.quantity, 0));
    empty.hidden = cartProducts.length > 0;
    footer.hidden = cartProducts.length === 0;
  }

  function toggleWishlist(id) {
    const isWished = state.wishlist.includes(id);
    state.wishlist = isWished ? state.wishlist.filter((item) => item !== id) : [...state.wishlist, id];
    saveState();
    updateCounts();
    $$(`[data-wishlist="${id}"]`).forEach((button) => {
      button.classList.toggle("active", !isWished);
      button.setAttribute("aria-pressed", String(!isWished));
      button.setAttribute("aria-label", `${!isWished ? "Remove from" : "Add to"} wishlist`);
    });
    const product = products.find((p) => p.id === id);
    toast(`${product.name} ${isWished ? "removed from" : "saved to"} your wishlist`);
  }

  const cart = $("#cart-drawer");
  const mobileNav = $("#mobile-nav");
  const backdrop = $(".drawer-backdrop");

  function lockPage(locked) {
    document.body.classList.toggle("no-scroll", locked);
  }

  function openCart() {
    closeMobileNav();
    cart.classList.add("active");
    cart.setAttribute("aria-hidden", "false");
    backdrop.classList.add("active");
    lockPage(true);
    $(".cart-close").focus();
  }

  function closeCart() {
    cart.classList.remove("active");
    cart.setAttribute("aria-hidden", "true");
    backdrop.classList.remove("active");
    lockPage(false);
  }

  function openMobileNav() {
    mobileNav.classList.add("active");
    backdrop.classList.add("active");
    $(".mobile-menu-toggle").setAttribute("aria-expanded", "true");
    lockPage(true);
  }

  function closeMobileNav() {
    mobileNav.classList.remove("active");
    $(".mobile-menu-toggle").setAttribute("aria-expanded", "false");
    if (!cart.classList.contains("active")) backdrop.classList.remove("active");
    if (!cart.classList.contains("active")) lockPage(false);
  }

  function handleCategory(category) {
    const grid = $("#new-products");
    const cards = $$(".product-card");
    cards.forEach((card) => { card.style.display = ""; });
    let matches = 0;
    $$(".product-card", grid).forEach((card) => {
      const visible = category === "All" || card.dataset.category === category;
      card.style.display = visible ? "" : "none";
      if (visible) matches += 1;
    });
    $$(".chip").forEach((chip) => {
      const active = chip.dataset.chip === category;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    let empty = $("#filter-empty");
    if (!empty) {
      empty = document.createElement("p");
      empty.id = "filter-empty";
      empty.className = "filter-empty";
      grid.after(empty);
    }
    empty.hidden = matches > 0;
    empty.textContent = matches > 0 ? "" : `${category} are being photographed and will be here soon. Browse earrings and bracelets in the meantime.`;
  }

  function openSearch() {
    const dialog = $("#search-dialog");
    dialog.showModal();
    setTimeout(() => $("#search-input").focus(), 50);
  }

  function closeSearch() {
    const dialog = $("#search-dialog");
    if (dialog.open) dialog.close();
  }

  function renderSearch(query) {
    const results = $("#search-results");
    const term = query.trim().toLowerCase();
    if (!term) {
      results.innerHTML = "";
      return;
    }
    const matches = products.filter((product) => `${product.name} ${product.category} ${product.badge}`.toLowerCase().includes(term));
    results.innerHTML = matches.length ? matches.map((product) => `
      <button class="search-result" type="button" data-search-add="${product.id}">
        <img src="${product.image}" alt="">
        <span><h3>${product.name}</h3><p>${product.category} · ${money(product.price)}</p></span>
      </button>`).join("") : `<p>No pieces found for “${query}”. Try earrings or bracelets.</p>`;
  }

  function observeReveals() {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: .1, rootMargin: "0px 0px -40px" });
    $$(".reveal:not(.visible)").forEach((el) => observer.observe(el));
  }

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    const wish = event.target.closest("[data-wishlist]");
    const quantity = event.target.closest("[data-quantity]");
    const remove = event.target.closest("[data-remove]");
    const filter = event.target.closest("[data-filter]");
    const chip = event.target.closest("[data-chip]");
    const searchAdd = event.target.closest("[data-search-add]");

    if (add) addToCart(add.dataset.add);
    if (wish) toggleWishlist(wish.dataset.wishlist);
    if (quantity) updateCart(quantity.dataset.quantity, Number(quantity.dataset.change));
    if (remove) removeFromCart(remove.dataset.remove);
    if (filter) setTimeout(() => handleCategory(filter.dataset.filter), 100);
    if (chip) handleCategory(chip.dataset.chip);
    if (searchAdd) {
      addToCart(searchAdd.dataset.searchAdd);
      closeSearch();
    }
  });

  $(".cart-toggle").addEventListener("click", openCart);
  $(".cart-close").addEventListener("click", closeCart);
  $(".cart-shop").addEventListener("click", () => {
    closeCart();
    $("#new-arrivals").scrollIntoView();
  });
  backdrop.addEventListener("click", () => { closeCart(); closeMobileNav(); });
  $(".mobile-menu-toggle").addEventListener("click", openMobileNav);
  $(".mobile-menu-close").addEventListener("click", closeMobileNav);
  $$("#mobile-nav a").forEach((link) => link.addEventListener("click", closeMobileNav));
  $$(".search-toggle").forEach((button) => button.addEventListener("click", openSearch));
  $(".search-close").addEventListener("click", closeSearch);
  $("#search-dialog").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeSearch();
  });
  $("#search-input").addEventListener("input", (event) => renderSearch(event.target.value));
  $("#search-form").addEventListener("submit", (event) => event.preventDefault());

  $(".wishlist-header").addEventListener("click", () => {
    if (!state.wishlist.length) {
      toast("Your wishlist is ready for a little glow");
      return;
    }
    $$(".chip").forEach((chip) => chip.classList.remove("is-active"));
    $$(".product-card").forEach((card) => { card.style.display = state.wishlist.includes(card.dataset.id) ? "" : "none"; });
    $("#new-arrivals").scrollIntoView();
    toast(`Showing ${state.wishlist.length} saved ${state.wishlist.length === 1 ? "piece" : "pieces"}`);
  });

  $("#newsletter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    $("#newsletter-message").textContent = "Thank you — you're officially on the glow list.";
    event.currentTarget.reset();
  });

  $(".footer-form").addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    toast("Thank you — you're on the glow list");
  });

  $$(".info-link").forEach((button) => button.addEventListener("click", () => toast(button.dataset.message)));
  $(".checkout-button").addEventListener("click", () => {
    const items = state.cart.map((item) => `${item.quantity} × ${products.find((p) => p.id === item.id)?.name}`).join(", ");
    window.location.href = `mailto:glowwithnova11@gmail.com?subject=${encodeURIComponent("Glow With Nova product enquiry")}&body=${encodeURIComponent(`Hello Glow With Nova,\n\nI'm interested in: ${items}\n\nPlease confirm availability and pricing.\n`)}`;
  });

  window.addEventListener("scroll", () => $("#site-header").classList.toggle("scrolled", window.scrollY > 10), { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeCart(); closeMobileNav(); closeSearch(); }
  });

  // hero slider
  const slides = $$(".slide"), dots = $$(".slider-dot");
  let slideIndex = 0, slideTimer;
  function showSlide(i) {
    slideIndex = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === slideIndex));
    dots.forEach((d, n) => { d.classList.toggle("is-active", n === slideIndex); d.setAttribute("aria-current", String(n === slideIndex)); });
  }
  function playSlides() {
    clearInterval(slideTimer);
    if (slides.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) slideTimer = setInterval(() => showSlide(slideIndex + 1), 6500);
  }
  if (slides.length) {
    dots.forEach((d, n) => d.addEventListener("click", () => { showSlide(n); playSlides(); }));
    $(".slider-prev")?.addEventListener("click", () => { showSlide(slideIndex - 1); playSlides(); });
    $(".slider-next")?.addEventListener("click", () => { showSlide(slideIndex + 1); playSlides(); });
    $(".hero-slider")?.addEventListener("mouseenter", () => clearInterval(slideTimer));
    $(".hero-slider")?.addEventListener("mouseleave", playSlides);
    playSlides();
  }

  // product carousel arrows
  const track = $(".carousel-track");
  if (track) {
    const step = () => (track.querySelector(".product-card")?.offsetWidth || 260) + 18;
    $(".carousel-prev").addEventListener("click", () => track.scrollBy({ left: -step() * 2, behavior: "smooth" }));
    $(".carousel-next").addEventListener("click", () => track.scrollBy({ left: step() * 2, behavior: "smooth" }));
  }

  // shop-the-look hotspots
  $$(".hotspot-dot").forEach((dot) => dot.addEventListener("click", (event) => {
    event.stopPropagation();
    const spot = dot.parentElement, open = !spot.classList.contains("open");
    $$(".hotspot").forEach((s) => { s.classList.remove("open"); $(".hotspot-dot", s).setAttribute("aria-expanded", "false"); });
    spot.classList.toggle("open", open);
    dot.setAttribute("aria-expanded", String(open));
  }));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".hotspot")) $$(".hotspot").forEach((s) => { s.classList.remove("open"); $(".hotspot-dot", s).setAttribute("aria-expanded", "false"); });
  });

  // footer accordion (mobile)
  $$(".footer-accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      if (window.innerWidth > 900) return;
      const accordion = header.closest(".footer-accordion");
      const isOpen = accordion.classList.toggle("is-open");
      header.setAttribute("aria-expanded", String(isOpen));
    });
  });

  $("#year").textContent = new Date().getFullYear();
  renderProducts();
  renderCart();
  updateCounts();
  observeReveals();
})();
