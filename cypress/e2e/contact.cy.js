describe("Contact form", () => {
  beforeEach(() => {
    cy.visitAsUser("/contact.html");
  });

  it("requires all fields before sending", () => {
    cy.get("#contact-send").click();
    cy.seeToast("Please fill in all fields");
  });

  it("rejects an invalid email", () => {
    cy.get("#contact-name").type("Jay");
    cy.get("#contact-email").type("not-an-email");
    cy.get("#contact-message").type("Please add more paneer pizzas.");
    cy.get("#contact-send").click();

    cy.seeToast("Invalid email entered");
  });

  it("sends a valid message", () => {
    cy.get("#contact-name").type("Jay");
    cy.get("#contact-email").type("jay@example.com");
    cy.get("#contact-message").type("Great pizza, keep it up!");
    cy.get("#contact-send").click();

    cy.seeToast("Message sent successfully!");
    cy.get("#contact-name").should("have.value", "");
    cy.get("#contact-email").should("have.value", "");
    cy.get("#contact-message").should("have.value", "");
  });
});
