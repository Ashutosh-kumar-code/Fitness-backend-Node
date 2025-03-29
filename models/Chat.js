const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ sender: String, message: String, timestamp: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
