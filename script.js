document.getElementById('startTaskBtn').addEventListener('click', () => {
    fetch('http://localhost:3000/start-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const taskId = data.taskId;
        document.getElementById('status').innerText = 'Task started. Task ID: ' + taskId;
        checkStatus(taskId);
    })
    .catch(error => console.error('Error:', error));
});

function checkStatus(taskId) {
    fetch('http://localhost:3000/task-status/' + taskId)
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url; // Redirect to the resource URL
        } else {
            return response.json();
        }
    })
    .then(data => {
        if (data) {
            const status = data.status;
            document.getElementById('status').innerText = 'Task Status: ' + status;
            if (status !== 'Complete') {
                setTimeout(() => checkStatus(taskId), 2000); // Poll every 2 seconds
            }
        }
    })
    .catch(error => console.error('Error:', error));
}
