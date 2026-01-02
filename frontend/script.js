// =======================================================
// Reusable Header/Footer Loader
// =======================================================
async function includeHTML(selectorId, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load " + url);

    const html = await res.text();
    const container = document.getElementById(selectorId);
    if (!container) throw new Error("Missing placeholder: " + selectorId);

    container.innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

// =======================================================
// Sticky Header Height Fix
// =======================================================
function setHeaderHeightVar() {
  const header =
    document.querySelector("#header-placeholder header") ||
    document.querySelector("header");

  const height = header ? header.offsetHeight : 0;
  document.documentElement.style.setProperty("--header-height", height + "px");

  if (height > 0) document.body.classList.add("loaded");
}

window.addEventListener("resize", () => requestAnimationFrame(setHeaderHeightVar));
window.addEventListener("load", () => requestAnimationFrame(setHeaderHeightVar));

// =======================================================
// Load Header + Footer
// =======================================================
async function loadIncludes() {
  await includeHTML("header-placeholder", "includes/header.html");
  await includeHTML("footer-placeholder", "includes/footer.html");

  const header =
    document.querySelector("#header-placeholder header") ||
    document.querySelector("header");

  if (header) {
    const hamburger = header.querySelector("#hamburger");
    const navLinks = header.querySelector(".nav-links");

    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        requestAnimationFrame(setHeaderHeightVar);
      });
    }
  }

  updateCartCount();
  requestAnimationFrame(setHeaderHeightVar);
}

// =======================================================
// Escape HTML (Security)
// =======================================================
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =======================================================
// Menu Loader
// =======================================================
async function loadMenu() {
  const container = document.getElementById("menu-cards");
  if (!container) return;

  container.innerHTML = "";

  try {
    const res = await fetch("http://localhost:5000/api/pizzas");
    if (!res.ok) throw new Error("Failed to fetch pizzas");

    const pizzas = await res.json();

    pizzas.forEach((pizza) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${pizza.image}" alt="${escapeHtml(pizza.name)}">
        <h3>${escapeHtml(pizza.name)}</h3>
        <p>${escapeHtml(pizza.description)}</p>

        <button 
          class="menu-btn add-to-cart-btn"
          data-id="${pizza._id}"
          data-name="${pizza.name}"
          data-price="${pizza.price}"
          data-image="${pizza.image}"
        >
          ₹ ${pizza.price} | Add to Cart
        </button>
      `;

      container.appendChild(card);
    });

    setupAddToCartButtons();
  } catch {
    container.innerHTML =
      "<p style='color:white;'>Failed to load menu. Please try again later.</p>";
  }
}

// =======================================================
// Cart System
// =======================================================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + item.quantity, 0);

  const span = document.getElementById("cart-count");
  if (span) span.textContent = count;
}

// Toast Message
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Add to Cart Buttons
function setupAddToCartButtons() {
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price);
      const image = btn.dataset.image;

      let cart = getCart();
      let item = cart.find((i) => i.id === id);

      if (item) item.quantity++;
      else cart.push({ id, name, price, image, quantity: 1 });

      saveCart(cart);
      updateCartCount();
      updateCheckoutButton();
      showToast(`${name} added to cart!`);
    });
  });
}

// =======================================================
// Cart Page Loader
// =======================================================
function loadCartPage() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const cart = getCart();
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    updateCheckoutButton();
    return;
  }

  cart.forEach((item) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${item.image}">
      
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="price">₹ ${item.price}</p>
      </div>

      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty('${item.id}', 'dec')">−</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 'inc')">+</button>
      </div>

      <div class="cart-item-total">₹ ${item.price * item.quantity}</div>

      <button class="remove-btn" onclick="removeItem('${item.id}')">Delete</button>
    `;

    container.appendChild(div);
  });

  updateTotal();
  updateCheckoutButton();
}

function changeQty(id, type) {
  let cart = getCart();
  let item = cart.find((i) => i.id === id);

  if (!item) return;

  if (type === "inc") item.quantity++;
  if (type === "dec") item.quantity--;

  if (item.quantity <= 0)
    cart = cart.filter((i) => i.id !== id);

  saveCart(cart);
  loadCartPage();
  updateCartCount();
}

function removeItem(id) {
  let cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);

  loadCartPage();
  updateCartCount();
}

function updateTotal() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const tp = document.getElementById("total-price");
  if (tp) tp.textContent = "Total: ₹ " + total;
}

// =======================================================
// Checkout Button Protection
// =======================================================
function updateCheckoutButton() {
  const btn = document.getElementById("checkout-btn");
  if (!btn) return;

  const cart = getCart();

  if (cart.length === 0) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  } else {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  }
}

function goToCheckout() {
  const cart = getCart();

  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }

  window.location.href = "checkout.html";
}

// =======================================================
// CONTACT FORM HANDLER
// =======================================================
function initContactForm() {
  const name = document.getElementById("contact-name");
  const email = document.getElementById("contact-email");
  const message = document.getElementById("contact-message");
  const btn = document.getElementById("contact-send");

  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!name.value || !email.value || !message.value) {
      showToast("⚠️ Please fill in all fields");
      return;
    }

    if (!email.value.includes("@")) {
      showToast("❌ Invalid email entered");
      return;
    }

    showToast("✅ Message sent successfully!");
    name.value = "";
    email.value = "";
    message.value = "";
  });
}

// =======================================================
// Page Initializer
// =======================================================
async function initPage() {
  await loadIncludes();

  if (document.getElementById("menu-cards")) loadMenu();
  if (document.getElementById("cart-items")) loadCartPage();
  if (document.getElementById("contact-send")) initContactForm();

  updateCheckoutButton();
  requestAnimationFrame(setHeaderHeightVar);
}

document.addEventListener("DOMContentLoaded", initPage);
