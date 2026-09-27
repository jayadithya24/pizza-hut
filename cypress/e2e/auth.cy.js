describe("Authentication", () => {
  it("redirects guests away from protected pages", () => {
    cy.visitAsGuest("/index.html", { waitForApp: false });
    cy.location("pathname").should("match", /login\.html$/);
    cy.contains("h2", "Welcome back, pizza lover").should("be.visible");
  });

  it("registers a new user and switches back to login", () => {
    const email = `e2e-${Date.now()}@example.com`;

    cy.visitAsGuest("/login.html#register");
    cy.get('[data-auth-panel="register"]').should("be.visible");

    cy.get("#register-name").type("E2E Tester");
    cy.get("#register-email").type(email);
    cy.get("#register-password").type("password123");
    cy.get("#register-confirm-password").type("password123");
    cy.get("#register-form").contains("button", "Register").click();

    cy.seeToast("Registration successful");
    cy.get("#login-form").should("be.visible");
  });

  it("shows an error for invalid login details", () => {
    cy.visitAsGuest("/login.html");
    cy.get("#login-email").type("unknown@example.com");
    cy.get("#login-password").type("wrongpass");
    cy.get("#login-form").contains("button", "Sign In").click();

    cy.seeToast("Invalid email or password.");
    cy.location("pathname").should("match", /login\.html$/);
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

    cy.get("#login-email").type("e2e@example.com");
    cy.get("#login-password").type("password123");
    cy.get("#login-form").contains("button", "Sign In").click();

    cy.seeToast("Login successful.");
    cy.location("pathname", { timeout: 8000 }).should("match", /index\.html$/);
    cy.contains("h1", "Craving the Perfect Pizza?").should("be.visible");
  });

  it("logs out and returns to the login page", () => {
    cy.visitAsUser("/index.html");
    cy.get("#logout-btn").should("be.visible").click();
    cy.location("pathname", { timeout: 8000 }).should("match", /login\.html$/);
  });
});
