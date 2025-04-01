// app imports
import { Order } from "../../models";
import { APIError, parseSkipLimit } from "../shared";

/**
 * List all the orders. Query params ?skip=0&limit=1000 by default
 */
async function readOrders(request, response, next) {
  /* pagination validation */
  let skip = parseSkipLimit(request.query.skip) || 0;
  let limit = parseSkipLimit(request.query.limit, 1000) || 1000;
  if (skip instanceof APIError) {
    return next(skip);
  } else if (limit instanceof APIError) {
    return next(limit);
  }

  try {
    const orders = await Order.readOrders({}, {}, skip, limit);
    return response.json(orders);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  readOrders
};
