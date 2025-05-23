
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const callRoutes = require('./routes/callRoutes');
const blogRoutes = require('./routes/blogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const bankDetailsRoute = require('./routes/bankDetails');
const followRoutes = require('./routes/followRoutes');
const paymentRoute = require('./routes/paymentRoute');

const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send(`<h1>Welcome! to Fitness Project</h1>`);
});

// APIs
app.use('/api/user', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/call', callRoutes); // Only /call no /friend
app.use('/api/verification', verificationRoutes);
app.use('/api/bank', bankDetailsRoute);
app.use('/api/follow', followRoutes);
app.use('/api/payment', paymentRoute);

// Socket Handling
let users = {};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('register', ({ userId }) => {
        users[userId] = socket.id;
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    socket.on('callUser', ({ from, to, signalData }) => {
        console.log('Active users map:', users);
        console.log(`Incoming call request from ${from} to ${to}`);
        if (users[to]) {
            io.to(users[to]).emit('incomingCall', { from, signalData });
        }
    });
    

    socket.on('acceptCall', ({ to, signal }) => {
        if (users[to]) {
            io.to(users[to]).emit('callAccepted', { signal });
        }
    });

    socket.on('sendMessage', ({ sender, receiver, message }) => {
        if (users[receiver]) {
            io.to(users[receiver]).emit('receiveMessage', { sender, message });
        }
    });

    socket.on('disconnect', () => {
        const userId = Object.keys(users).find(key => users[key] === socket.id);
        if (userId) {
            console.log(`User ${userId} disconnected`);
            delete users[userId];
        }
    });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
