const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const chatRoutes = require('./routes/chatRoutes');
const callRoutes = require('./routes/callRoutes');
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

app.use('/api/auth', authRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/call', callRoutes);

// Store connected users
let users = {};

// Handle socket connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join', ({ userId }) => {
        users[userId] = socket.id;
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    // Call API (Send Call Request)
    socket.on('callUser', ({ from, to, signalData }) => {
        if (users[to]) {
            io.to(users[to]).emit('incomingCall', { from, signalData });
        }
    });

    // Accept Call
    socket.on('acceptCall', ({ to, signal }) => {
        io.to(users[to]).emit('callAccepted', { signal });
    });

    // Handle Chat Message
    socket.on('sendMessage', ({ sender, receiver, message }) => {
        if (users[receiver]) {
            io.to(users[receiver]).emit('receiveMessage', { sender, message });
        }
    });

    socket.on('disconnect', () => {
        Object.keys(users).forEach((key) => {
            if (users[key] === socket.id) {
                delete users[key];
            }
        });
        console.log('User disconnected:', socket.id);
    });
});

const PORT =  5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
