const defaultUser = {
  name: "Test User",
  email: "e2e@example.com",
  password: "password123",
};

function seedWindow(win, { user, cart } = {}) {
  win.localStorage.clear();

  if (user) {
    win.localStorage.setItem(
      "activeUser",
      JSON.stringify({ name: user.name, email: user.email })
    );
    win.localStorage.setItem("users", JSON.stringify([user]));
  }

  if (cart) {
    win.localStorage.setItem("cart", JSON.stringify(cart));
  }
}

Cypress.Commands.add("waitForApp", () => {
  cy.get("#header-placeholder header", { timeout: 10000 }).should("exist");
});

Cypress.Commands.add("seeToast", (text) => {
  cy.get(".toast-message", { timeout: 8000 }).should("contain.text", text);
});

Cypress.Commands.add("visitAsGuest", (path = "/login.html", options = {}) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      seedWindow(win);
    },
  });
  if (options.waitForApp !== false) {
    cy.waitForApp();
  }
});

Cypress.Commands.add("visitAsUser", (path = "/index.html", options = {}) => {
  const user = { ...defaultUser, ...options.user };
  const cart = options.cart || [];

  cy.visit(path, {
    onBeforeLoad(win) {
      seedWindow(win, { user, cart });
    },
  });
  cy.waitForApp();
});

Cypress.Commands.add("stubMenuApi", () => {
  cy.intercept("GET", "**/api/pizzas", { fixture: "pizzas.json" }).as("getPizzas");
});
