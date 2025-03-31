
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'trainer'], required: true }, // Role-based access

    // Common fields
    bio: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    city: { type: String },
    profileImage: { type: String },
    interests: { type: [String] },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },

    // Trainer-specific fields
    experience: { type: Number },
    currentOccupation: { type: String },
    rating: { type: Number, default: 0 },
    availableTimings: { type: [String] },
    tagline: { type: String },
    verified: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
