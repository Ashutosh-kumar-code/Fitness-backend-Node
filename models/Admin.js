const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    commissionPercentage: { type: Number, required: true, default: 10 }, // Example commission percentage (10%)
    minWithdrawAmount: { type: Number, required: true, default: 100 }, // Minimum withdrawal amount
}, { timestamps: true });

// Hash password before saving
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('Admin', AdminSchema);
