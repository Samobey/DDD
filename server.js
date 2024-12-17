const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

let requestStatus = {};

app.post('/start-task', (req, res) => {
    const taskId = new Date().getTime();
    const resourceURL = req.body.resourceURL || 'http://localhost:3001/resource42.html'; // Get resource URL from request body or use a default
    requestStatus[taskId] = { status: 'Processing', resourceURL };
    res.status(202).json({ taskId });
    // Simulate async task
    setTimeout(() => {
        requestStatus[taskId].status = 'Complete';
    }, 30000); // 30 seconds delay
});

app.get('/task-status/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const task = requestStatus[taskId];
    if (task && task.status === 'Complete') {
        res.redirect(task.resourceURL);
    } else {
        res.json({ taskId, status: task ? task.status : 'Not Found' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
