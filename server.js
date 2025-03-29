const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

// WebRTC Signaling for Video & Audio Calls
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);
    socket.emit('me', socket.id);

    socket.on('callUser', ({ from, to, signalData, audioOnly }) => {
        io.to(to).emit('incomingCall', { from, signalData, audioOnly });
    });

    socket.on('acceptCall', ({ to, signal }) => {
        io.to(to).emit('callAccepted', { signal });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
        io.emit('callEnded');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
