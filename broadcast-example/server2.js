const express = require("express");
const WebSocket = require("ws");
const amqp = require("amqplib/callback_api");

const app = express();
const PORT = 3002;
const server = app.listen(PORT, () => console.log(`🚀 Server 2 running on port ${PORT}`));

// WebSocket server
const wss = new WebSocket.Server({ server });

// Set up RabbitMQ connection
let channel;
amqp.connect("amqp://localhost", (error, connection) => {
    if (error) {
        console.error("Failed to connect to RabbitMQ", error);
        return;
    }
    connection.createChannel((error, ch) => {
        if (error) {
            console.error("Failed to create channel", error);
            return;
        }
        channel = ch;
        const queue = "broadcast_queue";
        channel.assertQueue(queue, { durable: false });

        // Listen for broadcast messages from RabbitMQ
        channel.consume(queue, (msg) => {
            if (msg.content) {
                const message = msg.content.toString();
                console.log(`Broadcasting to clients: ${message}`);
                // Send message to all connected clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            }
        }, { noAck: true });
    });
});

// WebSocket connection
wss.on("connection", (ws) => {
    console.log("Client connected to Server 2");

    // Listen for messages from WebSocket clients
    ws.on("message", (message) => {
        console.log(`Received from client: ${message}`);
    });

    ws.on("close", () => {
        console.log("Client disconnected from Server 2");
    });
});
