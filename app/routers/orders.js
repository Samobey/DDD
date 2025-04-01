// npm packages
import express from "express";

// app imports
import { orderHandler, ordersHandler } from "../handlers";

// globals
const router = new express.Router();
const { readOrders } = ordersHandler;
const { createOrder, readOrder, updateOrder, deleteOrder } = orderHandler;

/* All the Orders Route */
router
  .route("")
  .get(readOrders)
  .post(createOrder);

/* Single Order by Name Route */
router
  .route("/:name")
  .get(readOrder)
  .patch(updateOrder)
  .delete(deleteOrder);

module.exports = router;
