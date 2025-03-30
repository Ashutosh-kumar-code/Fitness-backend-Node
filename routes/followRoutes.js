const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Follow User
router.post('/follow', async (req, res) => {
    const { userId, targetId } = req.body;
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user || !target || user.following.includes(targetId)) {
        return res.status(400).json({ message: 'Cannot follow' });
    }
    user.following.push(targetId);
    target.followers.push(userId);
    await user.save();
    await target.save();
    res.json({ message: 'Followed successfully' });
});

// Unfollow User
router.post('/unfollow', async (req, res) => {
    const { userId, targetId } = req.body;
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user || !target || !user.following.includes(targetId)) {
        return res.status(400).json({ message: 'Cannot unfollow' });
    }
    user.following = user.following.filter(id => id.toString() !== targetId);
    target.followers = target.followers.filter(id => id.toString() !== userId);
    await user.save();
    await target.save();
    res.json({ message: 'Unfollowed successfully' });
});

// Get Followers List
router.get('/followers/:userId', async (req, res) => {
    const user = await User.findById(req.params.userId).populate('followers', 'name email profileImage');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ followers: user.followers });
});

// Get Following List
router.get('/following/:userId', async (req, res) => {
    const user = await User.findById(req.params.userId).populate('following', 'name email profileImage');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ following: user.following });
});

// Get Followers and Following Count
router.get('/follow-count/:userId', async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ followersCount: user.followers.length, followingCount: user.following.length });
});

module.exports = router;
