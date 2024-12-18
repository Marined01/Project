const socket = io(); 
const form = document.getElementById('factorial-form'); 
const taskList = document.getElementById('task-list');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const number = document.getElementById('number').value;

    if (number > 10000) {
        alert('Number is too large. Please enter a smaller number.');
        return;
    }

    const response = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'test_user', number })
    });

    const task = await response.json();
    addTaskToUI(task); 
    socket.emit('startTask', task._id); 
});

// Додавання задачі в інтерфейс
function addTaskToUI(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.id = `task-${task._id}`;
    taskItem.innerHTML = `
        <h3>Task #${task.taskNumber}</h3> <!-- Використовуємо taskNumber -->
        <p>Number: ${task.number}</p>
        <p>Status: <span id="status-${task._id}">${task.status}</span></p>
        <div class="progress-bar">
            <div id="progress-${task._id}" class="progress"></div>
        </div>
        <p>Result: <span id="result-${task._id}">N/A</span></p>
    `;
    taskList.appendChild(taskItem);
}

// Оновлення статистики в інтерфейсі
function updateStatistics(stats) {
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-in-progress').textContent = stats.inProgress;
    document.getElementById('stat-queued').textContent = stats.queued;
    document.getElementById('stat-total').textContent = stats.total;
}

// Оновлення статистики при завантаженні
(async function fetchStatistics() {
    const response = await fetch('/statistics');
    const stats = await response.json();
    updateStatistics(stats);
})();

// Оновлення статистики в реальному часі
socket.on('updateStatistics', (stats) => {
    updateStatistics(stats);
});

// Оновлення прогресу в реальному часі
socket.on('taskUpdate', (task) => {
    const taskElement = document.getElementById(`task-${task._id}`);
    if (taskElement) {
        taskElement.querySelector(`#status-${task._id}`).textContent = task.status;
        taskElement.querySelector(`#progress-${task._id}`).style.width = `${task.progress}%`;
        if (task.status === 'completed') {
            taskElement.querySelector(`#result-${task._id}`).textContent = task.result;
        }
    }
});

