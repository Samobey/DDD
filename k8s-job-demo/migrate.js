const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'migration-result.txt');
fs.writeFileSync(filePath, 'Migration completed at ' + new Date().toISOString());
console.log('Fake migration script ran, file created:', filePath);
