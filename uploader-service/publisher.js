const amqp = require('amqplib');

async function publishMessage(message) {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();
  await channel.assertQueue('file-queue');
  channel.sendToQueue('file-queue', Buffer.from(JSON.stringify(message)));
  setTimeout(() => conn.close(), 500);
}

module.exports = { publishMessage };