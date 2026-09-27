describe("Site pages", () => {
  it("shows the home hero and order CTA", () => {
    cy.visitAsUser("/index.html");
    cy.contains("h1", "Craving the Perfect Pizza?").should("be.visible");
    cy.contains("a", "Order Now").should("have.attr", "href", "menu.html");
    cy.contains("h2", "How It Works").should("be.visible");
  });

  it("navigates through the main header links", () => {
    cy.visitAsUser("/index.html");

    cy.contains(".nav-links a", "Offers").click();
    cy.location("pathname").should("match", /offers\.html$/);
    cy.contains("h2", "Special Offers").should("be.visible");

    cy.contains(".nav-links a", "Locations").click();
    cy.location("pathname").should("match", /locations\.html$/);
    cy.contains("h2", "Find a Pizza Hut Near You").should("be.visible");

    cy.contains(".nav-links a", "Contact").click();
    cy.location("pathname").should("match", /contact\.html$/);
    cy.contains("h2", "Contact Us").should("be.visible");

    cy.contains(".nav-links a", "Menu").click();
    cy.location("pathname").should("match", /menu\.html$/);
  });

  it("lists special offers that link to the menu", () => {
    cy.visitAsUser("/offers.html");
    cy.contains("h3", "Buy 1 Get 1 Free").should("be.visible");
    cy.contains("h3", "Family Feast").should("be.visible");
    cy.get(".offer-btn").first().should("have.attr", "href", "menu.html");
  });

  it("lists nearby store locations", () => {
    cy.visitAsUser("/locations.html");
    cy.contains("Pizza Hut Downtown").should("be.visible");
    cy.contains("Pizza Hut Uptown").should("be.visible");
    cy.get(".map iframe").should("exist");
  });
});
