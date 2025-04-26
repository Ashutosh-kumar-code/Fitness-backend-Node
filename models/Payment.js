// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    trainerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming Trainer is also stored in User collection
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['paid', 'failed'],
        required: true,
    },
});

module.exports = mongoose.model('Payment', PaymentSchema);
