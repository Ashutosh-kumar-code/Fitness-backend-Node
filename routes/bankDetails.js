const express = require('express');
const jwt = require('jsonwebtoken');
const TrainerBankDetail = require('../models/TrainerBankDetails');
const router = express.Router();

// Save or update trainer bank details
router.post('/save', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const trainerId = decoded.id;
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    let detail = await TrainerBankDetail.findOne({ trainer: trainerId });

    if (detail) {
        detail.accountHolderName = accountHolderName;
        detail.accountNumber = accountNumber;
        detail.ifscCode = ifscCode;
        detail.bankName = bankName;
        await detail.save();
        return res.json({ message: 'Bank details updated', detail });
    } else {
        const newDetail = await TrainerBankDetail.create({
            trainer: trainerId,
            accountHolderName,
            accountNumber,
            ifscCode,
            bankName
        });
        return res.json({ message: 'Bank details saved', detail: newDetail });
    }
});

// Get trainer bank details
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const trainerId = decoded.id;

    const detail = await TrainerBankDetail.findOne({ trainer: trainerId });
    if (!detail) return res.status(404).json({ message: 'Bank details not found' });

    res.json(detail);
});

module.exports = router;
