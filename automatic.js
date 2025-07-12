const fs = require('fs');

const readable = fs.createReadStream('source.txt');
const writable = fs.createWriteStream('destination.txt');

readable.pipe(writable); // Handles backpressure automatically

writable.on('finish', () => {
  console.log('✅ Done copying with automatic backpressure.');
});
