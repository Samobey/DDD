import express, { Express } from 'express';

const PORT: number = parseInt(process.env.PORT || '8082');
const app: Express = express();

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

app.get('/api', (req, res) => {
  res.send(getRandomNumber(1, 6).toString());
});

app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
