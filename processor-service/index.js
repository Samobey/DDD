const amqp = require('amqplib');
const { downloadFile } = require('./s3Client');

(async () => {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();
  await channel.assertQueue('file-queue');
  console.log('Processor listening for messages...');

  channel.consume('file-queue', async (msg) => {
    console.log(`Claim check "${key}" received`)
    const { bucket, key } = JSON.parse(msg.content.toString());
    const fileBuffer = await downloadFile(bucket, key);
    console.log(`Processed file: ${key}, size: ${fileBuffer.length} bytes`);
    channel.ack(msg);
  });
})();