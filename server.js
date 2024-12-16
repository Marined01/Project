const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const process = require('process');
const path = require('path');

const Task = require('./models/task');
const User = require('./models/user');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'pages'), {
    setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.css') {
            res.setHeader('Content-Type', 'text/css');
        }
        if (path.extname(filePath) === '.js') {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 3600000 } // 1 hour
}));

const authMiddleware = async (req, res, next) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    next();
};

let runningTasks = 0;
const maxRunningTasks = 5;
const taskQueue = [];

const updateStatistics = async () => {
    const completedCount = await Task.countDocuments({ status: "completed" });
    const inProgressCount = await Task.countDocuments({ status: "in-progress" });
    const queuedCount = await Task.countDocuments({ status: "queued" });
    const totalCount = await Task.countDocuments({});
    
    const statistics = {
        completed: completedCount,
        inProgress: inProgressCount,
        queued: queuedCount,
        total: totalCount
    };
    
    io.emit('updateStatistics', statistics);
};


app.get('/', (req, res) => {
    res.redirect('/login.html');
});


const runTask = async (task) => {
    runningTasks++;
    task.status = "in-progress";
    await task.save();
    io.emit('taskUpdate', task);
    updateStatistics();

    // Обчислення факторіала
    let result = 1;
    let startTime = Date.now();
    try {
        for (let i = 1; i <= task.number; i++) {
            if (Date.now() - startTime > 70000) {  
                throw new Error('Task timeout exceeded');
            }
            result *= i;
            task.progress = Math.floor((i / task.number) * 100);
            await task.save();
            io.emit('taskUpdate', task);

            await new Promise(res => setTimeout(res, 50));
        }

        task.result = result.toString();
        task.status = "completed";
        task.progress = 100;
        await task.save();
        io.emit('taskUpdate', task);
        updateStatistics();
    } catch (error) {
        task.status = "failed";
        task.progress = 0;
        await task.save();
        io.emit('taskUpdate', task);
        updateStatistics();
    }

    runningTasks--;
    processQueue();
};

// Функція для обробки черги
const processQueue = async () => {
    if (runningTasks < maxRunningTasks && taskQueue.length > 0) {
        const nextTask = taskQueue.shift();
        nextTask.status = "queued";
        await nextTask.save();
        runTask(nextTask);
        updateStatistics();
    }
};

// API endpoints
app.post('/tasks', authMiddleware, async (req, res) => {
    const { number } = req.body;
    const user = req.session.user;

    if (number > 10000) return res.status(400).json({ error: 'Число занадто велике!' });

    try {

        // Створюємо нове завдання
        const task = await Task.create({
            user: user.id,
            number,
            status: "pending",
            progress: 0
        });
        res.json(task);

        // Додавання завдання до черги
        taskQueue.push(task);
        processQueue();
        updateStatistics();
    } catch (err) {
        console.error('Error while creating task:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/tasks', authMiddleware, async (req, res) => {
    const { id } = req.session.user; // Extract user ID from the session
    const tasks = await Task.find({ user: id }).sort({ createdAt: 1 });
    res.json(tasks);
    updateStatistics();
});

app.post('/tasks/:taskId/cancelTask', authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (task) {
        // ??
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
    return res.json(task)
});


app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const user = new User({ email, username, password });
        await user.save();

        req.session.user = user;
        res.json({ message: 'Registration successful'});
    } catch (error) {
        res.status(500).send('Error registering new user');
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !await user.comparePassword(password)) {
        return res.status(401).send('Invalid credentials');
    }
    req.session.user = {
        id: user._id,
        username: user.username
    };
    res.json({message: 'Login successful'});
});

// WebSocket
io.on('connection', (socket) => {
    updateStatistics();
    socket.on('disconnect', () => {
    });
});

const port = process.env.PORT || 3000; // Use the PORT environment variable or default to 3000

server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
});