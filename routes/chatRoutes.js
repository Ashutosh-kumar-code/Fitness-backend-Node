const express = require('express');
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Start Chat
router.post('/initiate', authMiddleware, async (req, res) => {
    const { trainerId } = req.body;
    try {
        const chat = new Chat({ users: [req.user.id, trainerId], messages: [] });
        await chat.save();
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Error starting chat' });
    }
});

module.exports = router;
