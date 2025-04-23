const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, },
    content: { type: String, required: true },
    image: { type: String }, // 🖼️ Blog Image URL
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorRole: { type: String, enum: ['user', 'trainer'], required: true },
    tags: { type: [String] },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
