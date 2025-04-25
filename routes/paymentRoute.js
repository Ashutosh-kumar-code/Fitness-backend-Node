const express = require('express');
const razorpay = require('../config/razorpay'); 
// const Razorpay = require('razorpay');// your razorpayInstance
const crypto = require('crypto');
const User = require('../models/User');
const Admin = require('../models/Admin');


const router = express.Router();

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
//   });

// Razorpay API - Create Order
router.post('/order', async (req, res) => {
    try {
        const { userId, trainerId, amount } = req.body;

        console.log('KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET, "====",userId, trainerId, amount);


        if (!userId || !trainerId || !amount)
            return res.status(400).json({ message: 'userId, trainerId, and amount are required' });

        const options = {
            amount: amount * 100, // amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId,
                trainerId
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Payment initiation failed' });
    }
});

// Razorpay API - Verify Payment + Save Subscription
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, trainerId, amount } = req.body;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Retrieve Admin info for commission
        const admin = await Admin.findOne({});
        if (!admin) return res.status(500).json({ message: 'Admin data not found' });

        const commissionAmount = (admin.commissionPercentage / 100) * amount;
        const trainerAmount = amount - commissionAmount;

        // ✅ Add 1-day subscription to user
        const user = await User.findById(userId);
        const now = new Date();
        const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day

        // Check if already exists for trainer
        const existing = user.subscriptions.find(sub => sub.trainer.toString() === trainerId);
        if (existing) {
            existing.subscribedAt = now;
            existing.expiresAt = expires;
        } else {
            user.subscriptions.push({ trainer: trainerId, subscribedAt: now, expiresAt: expires });
        }

        // Add earnings to trainer wallet
        const trainer = await User.findById(trainerId);
        trainer.wallet += trainerAmount; // Add trainer's share to wallet
        await trainer.save();

        // Log the commission earned
        console.log(`Admin earned commission: ₹${commissionAmount}`);

        await user.save();
        res.status(200).json({ message: 'Payment successful and subscription updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

// Get Subscriptions for a User
router.get('/subscriptions/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('subscriptions.trainer', 'name profileImage');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const now = new Date();
        const active = [];
        const expired = [];

        for (const sub of user.subscriptions) {
            if (new Date(sub.expiresAt) > now) {
                active.push(sub.trainer);
            } else {
                expired.push(sub.trainer);
            }
        }

        res.json({ active, expired });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch subscriptions', err });
    }
});

// Trainer Withdraw API (Trainer can only withdraw if wallet amount >= minWithdrawAmount)
router.post('/withdraw', async (req, res) => {
    try {
        const { trainerId } = req.body;
        
        const trainer = await User.findById(trainerId);
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

        const admin = await Admin.findOne({});
        if (!admin) return res.status(500).json({ message: 'Admin data not found' });

        if (trainer.wallet < admin.minWithdrawAmount) {
            return res.status(400).json({ message: `Wallet balance must be at least ₹${admin.minWithdrawAmount} to withdraw` });
        }

        // Create withdrawal request
        trainer.withdrawals.push({
            amount: trainer.wallet,
            status: 'pending'
        });
        trainer.wallet = 0; // Reset wallet after withdrawal request

        await trainer.save();
        res.status(200).json({ message: 'Withdrawal request submitted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Withdrawal request failed' });
    }
});

// Admin Approves Withdrawal Request (Admin action to approve)
router.post('/approve-withdrawal', async (req, res) => {
    try {
        const { trainerId, withdrawalId } = req.body;

        const trainer = await User.findById(trainerId);
        if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

        const withdrawal = trainer.withdrawals.id(withdrawalId);
        if (!withdrawal) return res.status(404).json({ message: 'Withdrawal request not found' });

        // Approve the withdrawal
        withdrawal.status = 'approved';
        await trainer.save();

        res.status(200).json({ message: 'Withdrawal approved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to approve withdrawal' });
    }
});

module.exports = router;
