const mongoose = require('mongoose');

const connect = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error', error);
    process.exit(1);
  }
};

module.exports = { connect };
