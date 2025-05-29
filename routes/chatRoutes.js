const express = require('express');
const Chat = require('../models/Chat');
const router = express.Router();

/**
 * @route POST /api/chat/initiate
 * @desc Start or return existing chat
 * @body { userId, trainerId }
 */
router.post('/initiate', async (req, res) => {
    const { userId, trainerId } = req.body;

    if (!userId || !trainerId) {
        return res.status(400).json({ message: 'userId and trainerId are required' });
    }

    try {
        let chat = await Chat.findOne({
            users: { $all: [userId, trainerId] }
        });

        if (!chat) {
            chat = new Chat({ users: [userId, trainerId], messages: [] });
            await chat.save();
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Error initiating chat' });
    }
});

/**
 * @route POST /api/chat/message/:chatId
 * @desc Send a message
 * @body { userId, message }
 */
router.post('/message/:chatId', async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ message: 'userId and message are required' });
    }

    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        chat.messages.push({
            sender: userId,
            message,
            timestamp: new Date(),
        });

        await chat.save();
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

/**
 * @route GET /api/chat/:chatId
 * @desc Get messages for a chat
 */
router.get('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        res.json(chat.messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

/**
 * @route POST /api/chat/user
 * @desc Get all chats for a user
 * @body { userId }
 */
router.post('/user', async (req, res) => {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    try {
        const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chats' });
    }
});

module.exports = router;
