import { sequelize } from './config/database';
import { app } from './app';

async function start() {
  try {
    await sequelize.sync(); // Use { force: true } during dev to reset
    app.listen(3000, () => console.log('Server running on port 3000'));
  } catch (err) {
    console.error('Failed to start:', err);
  }
}

start();
