
// =======================================================
// Early Login Check to Prevent FOUC
// =======================================================

(function() {
  // Simple login check (customize as needed)
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
  const isLoginPage = window.location.pathname.endsWith('/login.html');
  if (!isLoggedIn && !isLoginPage) {
    window.location.replace('/login.html');
    return;
  }
  // Only reveal body if NOT on login page (login page handles its own FOUC)
  if (!isLoginPage) {
    document.body.style.display = '';
  }
})();

// =======================================================
// Reusable Header/Footer Loader
// =======================================================
const API_BASE_URL = "https://pizza-hut-1.onrender.com";

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

  setupAuthUI();

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
    const res = await fetch(`${API_BASE_URL}/api/pizzas`);


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
// AUTH HANDLERS (LocalStorage)
// =======================================================
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function setActiveUser(user) {
  localStorage.setItem("activeUser", JSON.stringify(user));
}

function clearActiveUser() {
  localStorage.removeItem("activeUser");
}

function getActiveUser() {
  return JSON.parse(localStorage.getItem("activeUser") || "null");
}

function getCurrentPageName() {
  const path = window.location.pathname || "";
  const page = path.split("/").pop();
  return (page || "index.html").toLowerCase();
}

function enforceAuthRouting() {
  const currentPage = getCurrentPageName();
  const activeUser = getActiveUser();
  const isAuthPage = currentPage === "login.html" || currentPage === "register.html";

  if (!activeUser && !isAuthPage) {
    window.location.replace("login.html");
    return true;
  }

  if (activeUser && isAuthPage) {
    window.location.replace("index.html");
    return true;
  }

  return false;
}

function setupAuthUI() {
  const activeUser = getActiveUser();
  const currentPage = getCurrentPageName();
  const isAuthPage = currentPage === "login.html" || currentPage === "register.html";
  const logoutBtn = document.getElementById("logout-btn");
  const navLinksContainer = document.querySelector(".nav-links");
  const headerActions = document.querySelector(".header-actions");
  const hamburger = document.getElementById("hamburger");

  if (isAuthPage) {
    if (navLinksContainer) navLinksContainer.style.display = "none";
    if (headerActions) headerActions.style.display = "none";
    if (hamburger) hamburger.style.display = "none";
    return;
  }

  if (activeUser) {
    if (logoutBtn) {
      logoutBtn.style.display = "inline-flex";
      logoutBtn.addEventListener("click", () => {
        clearActiveUser();
        showToast("Logged out successfully.");

        setTimeout(() => {
          window.location.href = "login.html";
        }, 400);
      });
    }

    return;
  }

  if (logoutBtn) logoutBtn.style.display = "none";
}

function setupAuthTabs() {
  const panels = document.querySelectorAll("[data-auth-panel]");
  const tabs = document.querySelectorAll("[data-auth-tab]");
  const authTitle = document.getElementById("auth-title");
  if (!panels.length || !tabs.length) return;

  const showPanel = (mode) => {
    const activeMode = mode === "register" ? "register" : "login";

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== activeMode;
    });

    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.authTab === activeMode);
    });

    if (authTitle) {
      authTitle.textContent = activeMode === "register"
        ? "Create your Pizza Hut account"
        : "Welcome back, pizza lover";
    }
  };

  showPanel(window.location.hash === "#register" ? "register" : "login");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.authTab === "register" ? "register" : "login";
      window.location.hash = mode === "register" ? "#register" : "#login";
      showPanel(mode);
    });
  });

  window.addEventListener("hashchange", () => {
    showPanel(window.location.hash === "#register" ? "register" : "login");
  });
}

function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim().toLowerCase();
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm-password").value;

    if (!name || !email || !password || !confirmPassword) {
      showToast("Please fill all fields.");
      return;
    }

    if (!email.includes("@")) {
      showToast("Enter a valid email.");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.email === email);

    if (exists) {
      showToast("This email is already registered.");
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    showToast("Registration successful. Please login.");

    setTimeout(() => {
      window.location.hash = "#login";
    }, 1200);
  });
}

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showToast("Please enter email and password.");
      return;
    }

    const users = getUsers();
    const matchedUser = users.find((user) => user.email === email && user.password === password);

    if (!matchedUser) {
      showToast("Invalid email or password.");
      return;
    }

    setActiveUser({ name: matchedUser.name, email: matchedUser.email });
    // Debug: Log active user and localStorage
    console.log("[DEBUG] Login successful. activeUser:", getActiveUser());
    console.log("[DEBUG] localStorage:", JSON.stringify(localStorage));
    showToast("Login successful.");

    // Robust redirect: try both setTimeout and immediate redirect
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
    // Fallback: also try immediate redirect
    setTimeout(() => {
      if (window.location.pathname.endsWith("login.html")) {
        window.location.replace("index.html");
      }
    }, 1500);
  });
}

// =======================================================
// Page Initializer
// =======================================================
async function initPage() {
  if (enforceAuthRouting()) return;

  await loadIncludes();

  if (document.getElementById("menu-cards")) loadMenu();
  if (document.getElementById("cart-items")) loadCartPage();
  if (document.getElementById("contact-send")) initContactForm();
  if (document.getElementById("login-form")) initLoginForm();
  if (document.getElementById("register-form")) initRegisterForm();
  if (getCurrentPageName() === "login.html") setupAuthTabs();

  updateCheckoutButton();
  requestAnimationFrame(setHeaderHeightVar);
}

document.addEventListener("DOMContentLoaded", initPage);
