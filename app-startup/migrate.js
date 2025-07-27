
const fs = require('fs');
const path = require('path');

const lockPath = path.join(__dirname, 'migration.lock');
const filePath = path.join(__dirname, 'migration-result.txt');

try {
  // Try to create lock file exclusively
  const fd = fs.openSync(lockPath, 'wx');
  fs.writeSync(fd, 'locked');
  fs.closeSync(fd);
  console.log('Lock acquired, running migration...');

  fs.writeFileSync(filePath, 'Migration completed at ' + new Date().toISOString());
  console.log('Fake migration script ran, file created:', filePath);

  // Remove lock file after migration
  fs.unlinkSync(lockPath);
  console.log('Lock released.');
} catch (err) {
  if (err.code === 'EEXIST') {
    console.error('Another migration is already running. Exiting.');
    process.exit(1);
  } else {
    throw err;
  }
}
