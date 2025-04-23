const mongoose = require('mongoose');

const TrainerBankDetailsSchema = new mongoose.Schema({
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    upiId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TrainerBankDetails', TrainerBankDetailsSchema);
