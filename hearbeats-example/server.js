const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const server = app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
const wss = new WebSocketServer({ server });

app.use(express.static("public"));

app.get("/health-check", (req, res) => res.sendStatus(200));

wss.on("connection", (ws) => {
    console.log("✅ Client connected");

    ws.on("message", (message) => {
        ws.send("pongoo");
    });

    ws.on("close", () => console.log("❌ Client disconnected"));
});
