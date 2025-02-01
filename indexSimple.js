const express = require("express");
const axios = require("axios");

const app = express();

app.get("/crypto", async (req, res) => {
  try {
    console.log('Crypto endpoint has been requested.')

    const response = await axios.get(
      "https://api2.binance.com/api/v3/ticker/24hr"
    );

    const tickerPrice = response.data;

    res.json(tickerPrice);
  } catch (err) {
    logger.error(err);
    res.status(500).send("Internal server error");
  }
});

app.listen("4000", () => {
  console.log("Server is running on port 4000");
});
