const express = require('express');
const router = express.Router();
const Call = require('../models/Calls');
const User = require('../models/User');

// ✅ API 1: Start a call (deduct user wallet & pay trainer & save call)
router.post('/start', async (req, res) => {
  const { userId, trainerId } = req.body;

  if (!userId || !trainerId) {
    return res.status(400).json({ message: 'Missing user or trainer ID' });
  }

  try {
    const user = await User.findById(userId);
    const trainer = await User.findById(trainerId);

    if (!user || !trainer || trainer.role !== 'trainer') {
      return res.status(404).json({ message: 'User or trainer not found' });
    }

    if (user.wallet < trainer.feesCall) {
      return res.status(403).json({ message: 'Insufficient balance' });
    }

    // Deduct from user
    user.wallet -= trainer.feesCall;
    await user.save();

    // Add to trainer
    trainer.wallet += trainer.feesCall;
    await trainer.save();

    // Create call entry
    const call = await Call.create({
      caller: userId,
      receiver: trainerId,
      status: 'ongoing',
    });

    res.status(200).json({
      message: 'Call started successfully',
      userWallet: user.wallet,
      trainerWallet: trainer.wallet,
      callId: call._id,
    });
  } catch (error) {
    console.error('Start call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ API 2: End a call
router.post('/end', async (req, res) => {
  const { callId } = req.body;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { endedAt: new Date(), status: 'completed' },
      { new: true }
    );
    res.status(200).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Error ending call', error: error.message });
  }
});

// ✅ API 3: Mark a call as missed
router.post('/missed', async (req, res) => {
  const { callId } = req.body;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { endedAt: new Date(), status: 'missed' },
      { new: true }
    );
    res.status(200).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Error marking call as missed', error: error.message });
  }
});

// ✅ API 4: Get call history for a user (calls made)
router.get('/user/:userId', async (req, res) => {
  try {
    const calls = await Call.find({ caller: req.params.userId })
      .populate('receiver', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching call history', error: error.message });
  }
});

// ✅ API 5: Get call history for a trainer (calls received)
router.get('/trainer/:trainerId', async (req, res) => {
  try {
    const calls = await Call.find({ receiver: req.params.trainerId })
      .populate('caller', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trainer call history', error: error.message });
  }
});

// ✅ API 6: Check if user has enough balance for a call
router.get('/check/:userId/:trainerId', async (req, res) => {
  const { userId, trainerId } = req.params;

  try {
    const user = await User.findById(userId);
    const trainer = await User.findById(trainerId);

    if (!user || !trainer) {
      return res.status(404).json({ message: 'User or trainer not found' });
    }

    const canCall = user.wallet >= trainer.feesCall;

    res.status(200).json({
      canCall,
      userWallet: user.wallet,
      trainerFee: trainer.feesCall,
    });
  } catch (error) {
    console.error('Check call eligibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
