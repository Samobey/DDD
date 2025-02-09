/*app.ts*/
import express, { Express } from 'express';
import { console } from 'inspector';

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

app.get('/rolldice', async (req, res) => {
    try {
        // Wait for both fetch requests to complete
        await Promise.all([
            fetch('http://localhost:8081/api'),
            fetch('http://localhost:8082/api')
        ]);

        // Send the response after both fetches complete
        res.send([getRandomNumber(1, 6).toString()]);
    } catch (error) {
        // Handle any errors from the fetch requests
        res.status(500).send('Error fetching from APIs');
    }
});


app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
