const mongoose = require('mongoose');

/**
 * Execute operations within a MongoDB transaction
 * Ensures atomicity of multiple document writes
 *
 * @param {Function} callback - Async function that performs operations
 * @returns {Promise} - Result of callback execution
 */
async function withTransaction(callback) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = { withTransaction };
