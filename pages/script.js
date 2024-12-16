const socket = io(); 
const form = document.getElementById('factorial-form'); 
const taskList = document.getElementById('task-list');

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch tasks for the logged-in user (session-based authentication)
        const response = await fetch('/tasks'); // No user ID needed in the URL

        if (!response.ok) {
            window.location.href = 'login.html';
        }

        const tasks = await response.json(); // Parse the JSON response

        tasks.forEach((task) => {
            addTaskToUI(task); // Function to add task to the UI
        });
    } catch (error) {
        console.error("Failed to load tasks:", error);
    }
});


form.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const number = document.getElementById('number').value;

    if (number > 10000) {
        alert('Number is too large. Please enter a smaller number.');
        return;
    }

    const create_response = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number })
    });

    const task = await create_response.json();
    addTaskToUI(task);
});

// Додавання задачі в інтерфейс
function addTaskToUI(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.id = `task-${task._id}`;
    taskItem.innerHTML = `
        <h3>Task #${task._id.slice(-6, -1)}</h3>
        <p>Number: ${task.number}</p>
        <p>Status: <span id="status-${task._id}">${task.status}</span></p>
        <div class="progress-bar">
            <div id="progress-${task._id}" class="progress"></div>
        </div>
        <p>Result: <span id="result-${task._id}">${task.result || 'N/A'}</span></p>
    `;
    taskList.prepend(taskItem);
    updateTask(task);
}

function updateTask(task) {
    const taskElement = document.getElementById(`task-${task._id}`);
    if (taskElement) {
        taskElement.querySelector(`#status-${task._id}`).textContent = task.status;
        taskElement.querySelector(`#progress-${task._id}`).style.width = `${task.progress}%`;
        if (task.status === 'completed') {
            taskElement.querySelector(`#result-${task._id}`).textContent = task.result;
        }
    }
}

// Оновлення статистики в інтерфейсі
function updateStatistics(stats) {
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-in-progress').textContent = stats.inProgress;
    document.getElementById('stat-queued').textContent = stats.queued;
    document.getElementById('stat-total').textContent = stats.total;
}

// Оновлення статистики в реальному часі
socket.on('updateStatistics', (stats) => {
    updateStatistics(stats);
});

// Оновлення прогресу в реальному часі
socket.on('taskUpdate', updateTask);

