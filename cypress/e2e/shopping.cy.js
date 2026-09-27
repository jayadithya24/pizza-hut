const cartItem = {
  id: "pizza-1",
  name: "Margherita",
  price: 199,
  image: "images/pizza-margherita.jpg",
  quantity: 1,
};

describe("Menu, cart, and checkout", () => {
  it("loads the menu from the API and adds a pizza to the cart", () => {
    cy.stubMenuApi();
    cy.visitAsUser("/menu.html");
    cy.wait("@getPizzas");

    cy.get("#menu-cards .card").should("have.length", 3);
    cy.contains(".card", "Margherita").should("be.visible");
    cy.contains(".card", "Veggie Supreme").should("be.visible");

    cy.contains(".add-to-cart-btn", "Add to Cart").first().click();
    cy.seeToast("Margherita added to cart!");
    cy.get("#cart-count").should("have.text", "1");
  });

  it("shows an empty cart and keeps checkout disabled", () => {
    cy.visitAsUser("/cart.html");
    cy.contains("Your cart is empty.").should("be.visible");
    cy.get("#checkout-btn").should("be.disabled");
  });

  it("updates quantity, total, and can remove an item", () => {
    cy.visitAsUser("/cart.html", { cart: [cartItem] });

    cy.contains("h3", "Margherita").should("be.visible");
    cy.get("#total-price").should("contain", "199");
    cy.get("#checkout-btn").should("not.be.disabled");

    cy.contains(".card", "Margherita").find(".qty-btn").last().click();
    cy.contains(".card", "Margherita").find(".qty-num").should("have.text", "2");
    cy.get("#total-price").should("contain", "398");
    cy.get("#cart-count").should("have.text", "2");

    cy.contains(".card", "Margherita").find(".remove-btn").click();
    cy.contains("Your cart is empty.").should("be.visible");
    cy.get("#checkout-btn").should("be.disabled");
  });

  it("places an order and lands on the success page", () => {
    cy.visitAsUser("/checkout.html", { cart: [cartItem] });

    cy.get("#checkout-summary").should("contain", "Margherita");
    cy.get("#checkout-total").should("contain", "199");

    cy.get(".place-order-btn").click();
    cy.seeToast("Please fill in all delivery details");

    cy.get("#name").type("Jay Tester");
    cy.get("#phone").type("9876543210");
    cy.get("#address").type("123 Pizza Street, Udupi");
    cy.get("#pincode").type("576101");
    cy.get('input[name="payment"][value="UPI"]').check({ force: true });

    cy.get(".place-order-btn").click();
    cy.seeToast("Order Placed Successfully");
    cy.location("pathname", { timeout: 8000 }).should("match", /success\.html$/);
    cy.contains("h1", "Order Confirmed!").should("be.visible");
  });
});
