// Updated User model
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'trainer'], required: true },

    // Common fields
    bio: { type: String },
    phoneNumber: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    city: { type: String },
    profileImage: { type: String },
    languages: { type: [String] },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },

    // Trainer-specific fields
    trainerType: { type: String },
    experience: { type: String },
    currentOccupation: { type: String },
    rating: { type: Number, default: 0 },
    availableTimings: { type: String },
    tagline: { type: String },
    feesChat: { type: Number },
    feesCall: { type: Number },
    verified: { type: Boolean, default: false },

    wallet: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
