const crypto = require('crypto');
const User = require('../models/User');
const razorpay = require('../config/razorpay');

exports.createOrder = async (req, res) => {
    const { amount } = req.body;

    try {
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error creating Razorpay order', error });
    }
};

exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid signature" });
    }

    try {
        const user = await User.findById(req.user.id);
        user.wallet += amount;
        await user.save();

        res.json({ message: 'Payment verified and wallet updated', walletBalance: user.wallet });
    } catch (error) {
        res.status(500).json({ message: "Error updating wallet", error });
    }
};

exports.getWalletBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ walletBalance: user.wallet });
    } catch (error) {
        res.status(500).json({ message: "Error getting balance", error });
    }
};
