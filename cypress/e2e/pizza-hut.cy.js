// Combined Pizza Hut E2E Test Suite
// Authentication + Contact + Pages + Shopping/Checkout

const cartItem = {
  id: "pizza-1",
  name: "Margherita",
  price: 199,
  image: "images/pizza-margherita.jpg",
  quantity: 1,
};

describe("Pizza Hut - Complete E2E Testing", () => {

  // =========================================================
  // AUTHENTICATION TESTS
  // =========================================================

  describe("Authentication", () => {

    it("redirects guests away from protected pages", () => {
      cy.visitAsGuest("/index.html", { waitForApp: false });

      cy.location("pathname").should("match", /login\.html$/);

      cy.url().should("include", "/login.html");
    });

    it("registers a new user and switches back to login", () => {
      const email = `e2e-${Date.now()}@example.com`;

      cy.visitAsGuest("/login.html#register");

      cy.get('[data-auth-panel="register"]')
        .should("be.visible");

      cy.get("#register-name")
        .type("E2E Tester");

      cy.get("#register-email")
        .type(email);

      cy.get("#register-password")
        .type("password123");

      cy.get("#register-confirm-password")
        .type("password123");

      cy.get("#register-form")
        .contains("button", "Register")
        .click();

      cy.seeToast("Registration successful");

      cy.get("#login-form")
        .should("be.visible");
    });

    it("shows an error for invalid login details", () => {
      cy.visitAsGuest("/login.html");

      cy.get("#login-email")
        .type("unknown@example.com");

      cy.get("#login-password")
        .type("wrongpass");

      cy.get("#login-form")
        .contains("button", "Sign In")
        .click();

      cy.seeToast("Invalid email or password.");

      cy.location("pathname")
        .should("match", /login\.html$/);
    });

    it("logs in a registered user and reaches home", () => {
      cy.visit("/login.html", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "users",
            JSON.stringify([
              {
                name: "Test User",
                email: "e2e@example.com",
                password: "password123",
              },
            ])
          );

          win.localStorage.removeItem("activeUser");
        },
      });

      cy.waitForApp();

      cy.get("#login-email")
        .type("e2e@example.com");

      cy.get("#login-password")
        .type("password123");

      cy.get("#login-form")
        .contains("button", "Sign In")
        .click();

      cy.seeToast("Login successful.");

      cy.location("pathname", {
        timeout: 8000,
      }).should("match", /index\.html$/);

      cy.contains("h1", "Craving the Perfect Pizza?")
        .should("be.visible");
    });

    it("logs out and returns to the login page", () => {
      cy.visitAsUser("/index.html");

      cy.get("#logout-btn")
        .should("be.visible")
        .click();

      cy.location("pathname", {
        timeout: 8000,
      }).should("match", /login\.html$/);
    });

  });


  // =========================================================
  // CONTACT FORM TESTS
  // =========================================================

  describe("Contact Form", () => {

    beforeEach(() => {
      cy.visitAsUser("/contact.html");
    });

    it("requires all fields before sending", () => {
      cy.get("#contact-send")
        .click();

      cy.get("#contact-name")
        .then(($input) => {
          expect($input[0].checkValidity()).to.be.false;
        });
    });

    it("rejects an invalid email", () => {
      cy.get("#contact-name")
        .type("Jay");

      cy.get("#contact-email")
        .type("not-an-email");

      cy.get("#contact-message")
        .type("Please add more paneer pizzas.");

      cy.get("#contact-send")
        .click();

      cy.seeToast("Invalid email entered");
    });

    it("sends a valid message", () => {
      cy.get("#contact-name")
        .type("Jay");

      cy.get("#contact-email")
        .type("jay@example.com");

      cy.get("#contact-message")
        .type("Great pizza, keep it up!");

      cy.get("#contact-send")
        .click();

      cy.seeToast("Message sent successfully!");

      cy.get("#contact-name")
        .should("have.value", "");

      cy.get("#contact-email")
        .should("have.value", "");

      cy.get("#contact-message")
        .should("have.value", "");
    });

  });


  // =========================================================
  // WEBSITE PAGES TESTS
  // =========================================================

  describe("Site Pages", () => {

    it("shows the home hero and order CTA", () => {
      cy.visitAsUser("/index.html");

      cy.contains("h1", "Craving the Perfect Pizza?")
        .should("be.visible");

      cy.contains("a", "Order Now")
        .should("have.attr", "href", "menu.html");

      cy.contains("h2", "How It Works")
        .should("be.visible");
    });

    it("navigates through the main header links", () => {
      cy.visitAsUser("/index.html");

      // Offers
      cy.contains(".nav-links a", "Offers")
        .click();

      cy.location("pathname")
        .should("match", /offers\.html$/);

      cy.contains("h2", "Special Offers")
        .should("be.visible");


      // Locations
      cy.contains(".nav-links a", "Locations")
        .click();

      cy.location("pathname")
        .should("match", /locations\.html$/);

      cy.contains("h2", "Find a Pizza Hut Near You")
        .should("be.visible");


      // Contact
      cy.contains(".nav-links a", "Contact")
        .click();

      cy.location("pathname")
        .should("match", /contact\.html$/);

      cy.contains("h2", "Contact Us")
        .should("be.visible");


      // Menu
      cy.contains(".nav-links a", "Menu")
        .click();

      cy.location("pathname")
        .should("match", /menu\.html$/);
    });

    it("lists special offers that link to the menu", () => {
      cy.visitAsUser("/offers.html");

      cy.contains("h3", "Buy 1 Get 1 Free")
        .should("be.visible");

      cy.contains("h3", "Family Feast")
        .should("be.visible");

      cy.get(".offer-btn")
        .first()
        .should("have.attr", "href", "menu.html");
    });

    it("lists nearby store locations", () => {
      cy.visitAsUser("/locations.html");

      cy.contains("Pizza Hut Downtown")
        .should("be.visible");

      cy.contains("Pizza Hut Uptown")
        .should("be.visible");

      cy.get(".map iframe")
        .should("exist");
    });

  });


  // =========================================================
  // MENU, CART AND CHECKOUT TESTS
  // =========================================================

  describe("Menu, Cart, and Checkout", () => {

    it("loads the menu from the API and adds a pizza to the cart", () => {
      cy.stubMenuApi();

      cy.visitAsUser("/menu.html");

      cy.wait("@getPizzas");

      cy.get("#menu-cards .card")
        .should("have.length", 3);

      cy.contains(".card", "Margherita")
        .should("be.visible");

      cy.contains(".card", "Veggie Supreme")
        .should("be.visible");

      cy.contains(".add-to-cart-btn", "Add to Cart")
        .first()
        .click();

      cy.seeToast("Margherita added to cart!");

      cy.get("#cart-count")
        .should("have.text", "1");
    });

    it("shows an empty cart and keeps checkout disabled", () => {
      cy.visitAsUser("/cart.html");

      cy.contains("Your cart is empty.")
        .should("be.visible");

      cy.get("#checkout-btn")
        .should("be.disabled");
    });

    it("updates quantity, total, and can remove an item", () => {
      cy.visitAsUser("/cart.html", {
        cart: [cartItem],
      });

      cy.contains("h3", "Margherita")
        .should("be.visible");

      cy.get("#total-price")
        .should("contain", "199");

      cy.get("#checkout-btn")
        .should("not.be.disabled");


      // Increase quantity
      cy.contains(".card", "Margherita")
        .find(".qty-btn")
        .last()
        .click();

      cy.contains(".card", "Margherita")
        .find(".qty-num")
        .should("have.text", "2");

      cy.get("#total-price")
        .should("contain", "398");

      cy.get("#cart-count")
        .should("have.text", "2");


      // Remove item
      cy.contains(".card", "Margherita")
        .find(".remove-btn")
        .click();

      cy.contains("Your cart is empty.")
        .should("be.visible");

      cy.get("#checkout-btn")
        .should("be.disabled");
    });

    it("places an order and lands on the success page", () => {
      cy.visitAsUser("/checkout.html", {
        cart: [cartItem],
      });

      cy.get("#checkout-summary")
        .should("contain", "Margherita");

      cy.get("#checkout-total")
        .should("contain", "199");


      // Try placing order without delivery details
      cy.get(".place-order-btn")
        .click();

      cy.seeToast("Please fill in all delivery details");


      // Enter delivery details
      cy.get("#name")
        .type("Jay Tester");

      cy.get("#phone")
        .type("9876543210");

      cy.get("#address")
        .type("123 Pizza Street, Udupi");

      cy.get("#pincode")
        .type("576101");

      cy.get('input[name="payment"][value="UPI"]')
        .check({ force: true });


      // Place order
      cy.get(".place-order-btn")
        .click();

      cy.seeToast("Order Placed Successfully");

      cy.location("pathname", {
        timeout: 8000,
      }).should("match", /success\.html$/);

      cy.contains("h1", "Order Confirmed!")
        .should("be.visible");
    });

  });

});