const express = require('express');
const app = express();
const postRoutes = require('./src/routes/postRoutes');
const dbConfig = require('./src/config/dbConfig');

// Database connection
dbConfig.connect();

// Middleware to parse JSON
app.use(express.json());

// Use routes
app.use('/posts', postRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
