// npm packages
import { validate } from "jsonschema";

// app imports
import { Order } from "../../models";
import { APIError } from "../shared";
import { orderNewSchema, orderUpdateSchema } from "../../schemas";

/**
 * Validate the POST request body and create a new Order
 */
async function createOrder(request, response, next) {
  const validation = validate(request.body, orderNewSchema);
  if (!validation.valid) {
    return next(
      new APIError(
        400,
        "Bad Request",
        validation.errors.map(e => e.stack).join(". ")
      )
    );
  }

  try {
    const newOrder = await Order.createOrder(new Order(request.body));
    return response.status(201).json(newOrder);
  } catch (err) {
    return next(err);
  }
}

/**
 * Get a single order
 * @param {String} name - the name of the Order to retrieve
 */
async function readOrder(request, response, next) {
  const { name } = request.params;
  try {
    const order = await Order.readOrder(name);
    return response.json(order);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update a single order
 * @param {String} name - the name of the Order to update
 */
async function updateOrder(request, response, next) {
  const { name } = request.params;

  const validation = validate(request.body, orderUpdateSchema);
  if (!validation.valid) {
    return next(
      new APIError(
        400,
        "Bad Request",
        validation.errors.map(e => e.stack).join(". ")
      )
    );
  }

  try {
    const order = await Order.updateOrder(name, request.body);
    return response.json(order);
  } catch (err) {
    return next(err);
  }
}

/**
 * Remove a single order
 * @param {String} name - the name of the Order to remove
 */
async function deleteOrder(request, response, next) {
  const { name } = request.params;
  try {
    const deleteMsg = await Order.deleteOrder(name);
    return response.json(deleteMsg);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createOrder,
  readOrder,
  updateOrder,
  deleteOrder
};
