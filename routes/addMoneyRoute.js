const express = require('express');
const router = express.Router();
const razorpay = require('../utils/razorpayInstance'); // your Razorpay setup file
const crypto = require('crypto');
const User = require('../models/User');

// ✅ API 1: Create Razorpay Order
router.post('/create-order', async (req, res) => {
  const { amount } = req.body;

  if (!amount) return res.status(400).json({ message: 'Amount is required' });

  try {
    const options = {
      amount: amount * 100, // Razorpay accepts amount in paise
      currency: 'INR',
      receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Error creating Razorpay order' });
  }
});

// ✅ API 2: Verify Razorpay Payment and Update User Wallet
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !amount) {
    return res.status(400).json({ message: 'Missing required payment details' });
  }

  try {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Payment verified: update user wallet
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wallet += amount;
    await user.save();

    res.status(200).json({ message: 'Payment verified and wallet updated', wallet: user.wallet });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});

module.exports = router;
