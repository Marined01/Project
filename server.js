const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const process = require('process');

const Task = require('./models/task');
const User = require('./models/user');
const db = require('./config/db');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '1h';

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:8010", // Allow requests from your client origin
        methods: ["GET", "POST"], // Allowed HTTP methods
    }
});

// Middleware
app.use(cors({
    origin: true,  // Adjust this to your frontend's origin
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
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

// JWT Authentication Middleware
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
};

let runningTasks = 0;
const maxRunningTasks = 5;
const taskQueue = [];


const runTask = async (task) => {
    runningTasks++;
    task.status = "in-progress";
    await task.save();
    io.emit('taskUpdate', task);

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
    } catch (error) {
        task.status = "failed";
        task.progress = 0;
        await task.save();
        io.emit('taskUpdate', task);
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
    }
};
// Authentication Routes
app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const user = new User({ email, username, password });
        await user.save();

        // Generate JWT
        const token = generateToken(user);

        // Set HTTP-only cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });

        res.json({ message: 'Registration successful' });
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

    // Generate JWT
    const token = generateToken(user);

    // Set HTTP-only cookie
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    });

    res.json({ message: 'Login successful' });
});

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "login.html"));
});

app.post('/logout', (req, res) => {
    // Clear the JWT cookie
    res.clearCookie('jwt');
    res.json({ message: 'Logout successful' });
});

// Modify existing routes to use req.user instead of req.session.user
app.post('/tasks', authMiddleware, async (req, res) => {
    console.log("Received task")
    const { number } = req.body;
    const user = req.user;

    if (number > 10000) return res.status(400).json({ error: 'Число занадто велике!' });

    try {
        const task = await Task.create({
            user: user.id,
            number,
            status: "pending",
            progress: 0
        });
        res.json(task);

        taskQueue.push(task);
        processQueue();
    } catch (err) {
        console.error('Error while creating task:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/tasks', authMiddleware, async (req, res) => {
    const { id } = req.user;
    const tasks = await Task.find({ user: id }).sort({ createdAt: 1 });
    res.json(tasks);
});

const port = process.env.PORT || 3000;

server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
});

module.exports = { app, server };