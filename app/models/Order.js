// npm packages
import mongoose from "mongoose";

// app imports
import { APIError } from "../services";

// globals
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  name: String,
  number: Number,
  stuff: [String],
  url: String
});

orderSchema.statics = {
  /**
   * Create a Single New Order
   * @param {object} newOrder - an instance of Order
   * @returns {Promise<Order, APIError>}
   */
  async createOrder(newOrder) {
    const duplicate = await this.findOne({ name: newOrder.name });
    if (duplicate) {
      throw new APIError(
        409,
        "Order Already Exists",
        `There is already a order with name '${newOrder.name}'.`
      );
    }
    const order = await newOrder.save();
    return order.toObject();
  },
  /**
   * Delete a single Order
   * @param {String} name - the Order's name
   * @returns {Promise<Order, APIError>}
   */
  async deleteOrder(name) {
    const deleted = await this.findOneAndRemove({ name });
    if (!deleted) {
      throw new APIError(404, "Order Not Found", `No order '${name}' found.`);
    }
    return deleted.toObject();
  },
  /**
   * Get a single Order by name
   * @param {String} name - the Order's name
   * @returns {Promise<Order, APIError>}
   */
  async readOrder(name) {
    const order = await this.findOne({ name });

    if (!order) {
      throw new APIError(404, "Order Not Found", `No order '${name}' found.`);
    }
    return order.toObject();
  },
  /**
   * Get a list of Orders
   * @param {Object} query - pre-formatted query to retrieve orders.
   * @param {Object} fields - a list of fields to select or not in object form
   * @param {String} skip - number of docs to skip (for pagination)
   * @param {String} limit - number of docs to limit by (for pagination)
   * @returns {Promise<Orders, APIError>}
   */
  async readOrders(query, fields, skip, limit) {
    const orders = await this.find(query, fields)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .exec();
    if (!orders.length) {
      return [];
    }
    return orders.map(order => order.toObject());
  },
  /**
   * Patch/Update a single Order
   * @param {String} name - the Order's name
   * @param {Object} orderUpdate - the json containing the Order attributes
   * @returns {Promise<Order, APIError>}
   */
  async updateOrder(name, orderUpdate) {
    const order = await this.findOneAndUpdate({ name }, orderUpdate, {
      new: true
    });
    if (!order) {
      throw new APIError(404, "Order Not Found", `No order '${name}' found.`);
    }
    return order.toObject();
  }
};

/* Transform with .toObject to remove __v and _id from response */
if (!orderSchema.options.toObject) orderSchema.options.toObject = {};
orderSchema.options.toObject.transform = (doc, ret) => {
  const transformed = ret;
  delete transformed._id;
  delete transformed.__v;
  return transformed;
};

/** Ensure MongoDB Indices **/
orderSchema.index({ name: 1, number: 1 }, { unique: true }); // example compound idx

module.exports = mongoose.model("Order", orderSchema);
