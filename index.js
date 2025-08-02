import amqp from 'amqplib';

async function startRabbitMQ() {
    const conn = await amqp.connect('amqp://localhost');
    const ch = await conn.createChannel();

    const dlx = 'order.created.exchange.dlx';
    const dlq = 'payment.order.created.queue.dlx';
    const mainQueue = 'payment.order.created.queue';

    // 1. Create DLX and DLQ
    await ch.assertExchange(dlx, 'direct', { durable: true });
    await ch.assertQueue(dlq, { durable: true });
    await ch.bindQueue(dlq, dlx, 'dlx-routing-key');

    // 2. Create main queue with DLQ settings
    await ch.assertQueue(mainQueue, {
    durable: true,
    arguments: {
        'x-dead-letter-exchange': dlx,
        'x-dead-letter-routing-key': 'dlx-routing-key',
        'x-message-ttl': 5000  // Optional: TTL for auto-dead-lettering
    }
    });

    // 3. Send some test messages
    ch.sendToQueue(mainQueue, Buffer.from('ok-message'));
    ch.sendToQueue(mainQueue, Buffer.from('fail-message'));

    // 4. Consumer for main queue
    await ch.consume(mainQueue, (msg) => {
    const content = msg.content.toString();
    console.log('Received:', content);
    if (content.includes('fail')) {
        console.log('Rejecting:', content);
        ch.reject(msg, false);
    } else {
        console.log('Acknowledging:', content);
        ch.ack(msg);
    }
    });
}

console.log('Consumer running. Check RabbitMQ UI at http://localhost:15672');
startRabbitMQ().catch(console.error);