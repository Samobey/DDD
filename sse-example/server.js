const express = require("express");
var cors = require('cors')
const { WebSocketServer } = require("ws");

const app = express();
app.use(cors())
const server = app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
const wss = new WebSocketServer({ server });

app.use(express.static("public"));

app.get("/health-check", (req, res) => res.sendStatus(200));

wss.on("connection", (ws) => {
    console.log("✅ WebSocket Client connected");

    ws.on("message", (message) => {
        if (message.toString() === "ping") {
            ws.send("pongo");
        } else {
            console.log("📩 WebSocket Received:", message.toString());
        }
    });

    ws.on("close", () => console.log("❌ WebSocket Client disconnected"));
});

// SSE (Fallback)
app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("🔄 SSE Client connected");

    const interval = setInterval(() => {
        res.write(`data: ${JSON.stringify({ message: "SSE update from server" })}\n\n`);
    }, 5000);

    req.on("close", () => {
        console.log("❌ SSE Client disconnected");
        clearInterval(interval);
    });
});
