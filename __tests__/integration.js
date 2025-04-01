/**
 * These tests currently only work if you have a local MongoDB database
 */
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app/app");
const { Order } = require("../app/models");

const exampleOrder = {
  name: "Example",
  number: 5,
  stuff: ["cats", "dogs"],
  url: "https://google.com",
};

beforeEach(async () => {
  const testOrder = new Order(exampleOrder);
  await testOrder.save();
});

afterEach(async () => {
  await mongoose.connection.dropCollection("orders");
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("GET /orders", () => {
  test("Get a list of orders", async () => {
    let response = await request(app).get("/orders");
    expect(response.body).toEqual([exampleOrder]);
  });
});

describe("POST /orders", () => {
  test("Create a mini new Order", async () => {
    let response = await request(app).post("/orders").send({ name: "A Order" });
    expect(response.body).toEqual({ name: "A Order", stuff: [] });
  });
  test("Create a full new Order", async () => {
    const fullOrder = {
      name: "Other Order",
      stuff: ["cats", "dogs"],
      number: 5,
      url: "http://google.com",
    };
    let response = await request(app).post("/orders").send(fullOrder);
    expect(response.body).toEqual(fullOrder);

    let duplicateResponse = await request(app)
      .post("/orders")
      .send({ name: "Other Order" });
    expect(duplicateResponse.status).toEqual(409);
  });
});

describe("PATCH /orders/:name", () => {
  test("Update a order's name", async () => {
    let response = await request(app)
      .patch("/orders/Example")
      .send({ name: "New Name" });
    expect(response.body).toEqual({ ...exampleOrder, name: "New Name" });
  });
});

describe("DELETE /orders/:name", () => {
  test("Delete a order name", async () => {
    let response = await request(app).delete("/orders/Example");
    expect(response.body).toEqual(exampleOrder);
  });
});
