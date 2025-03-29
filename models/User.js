const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String }, // Short bio
    age: { type: Number }, // User's age
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    city: { type: String },
    profileImage: { type: String }, // Profile picture URL
    interests: { type: [String] }, // Array of interests
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
