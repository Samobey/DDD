const fs = require('fs');

const readable = fs.createReadStream('source.txt', {
  highWaterMark: 16 * 1024, // 16KB chunks
});

const writable = fs.createWriteStream('destination.txt', {
  highWaterMark: 8 * 1024, // 8KB chunks (smaller, to trigger backpressure)
});

readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  console.log(`Chunk size: ${chunk.length}, canContinue: ${canContinue}`);

  if (!canContinue) {
    console.log('↳ Backpressure detected. Pausing readable stream.');
    readable.pause();

    writable.once('drain', () => {
      console.log('↳ Drain event fired. Resuming readable stream.');
      readable.resume();
    });
  }
});

readable.on('end', () => {
  writable.end();
  console.log('✅ Done copying with backpressure management.');
});
