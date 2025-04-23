const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sendSMS = require('../utils/sendSMS'); // This will be your SMS sending utility

// ✅ Send OTP to user’s phoneNumber
router.post('/send-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const user = await User.findById(userId);
    if (!user || !user.phoneNumber) {
      return res.status(404).json({ message: 'User or phone number not found' });
    }

    // Generate 6-digit OTP and expiry (5 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // Save to user
    user.phoneVerificationCode = otp;
    user.phoneVerificationExpires = expires;
    user.phoneVerified = false; // reset if re-sent
    await user.save();

    // Send SMS (with the OTP code)
    await sendSMS(user.phoneNumber, `Your verification code is ${otp}`);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending OTP', error: err });
  }
});

// ✅ Verify the OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ message: 'userId and code required' });

    const user = await User.findById(userId);
    if (!user || !user.phoneVerificationCode) {
      return res.status(404).json({ message: 'No pending verification for this user' });
    }

    // Check code & expiry
    if (user.phoneVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid code' });
    }
    if (user.phoneVerificationExpires < new Date()) {
      return res.status(400).json({ message: 'Code expired' });
    }

    // Mark verified, clear OTP fields
    user.phoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Phone number verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying OTP', error: err });
  }
});

module.exports = router;
