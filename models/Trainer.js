const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    experience: { type: Number, required: true },
    currentOccupation: { type: String, required: true },
    city: { type: String, required: true },
    bio: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    rating: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    image: { type: String }, // Profile image URL
    availableTimings: { type: [String], required: true }, // Array of available time slots
    tagline: { type: String },
    verified: { type: Boolean, default: false }, // Admin verification
}, { timestamps: true });

module.exports = mongoose.model('Trainer', TrainerSchema);
