const fs = require('fs');

const stream = fs.createWriteStream('source.txt');
for (let i = 0; i < 1e6; i++) {
  const ok = stream.write('This is a line of text that will be repeated.\n');
  if (!ok) {
    stream.once('drain', () => {}); // wait for buffer to drain
  }
}
stream.end(() => console.log('Large file created.'));
