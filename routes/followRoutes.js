const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Follow = require('../models/Follow');

// Follow a user
router.post('/follow', async (req, res) => {
    try {
        const { userId, targetId } = req.body;

        // Prevent self-follow or duplicate
        if (userId === targetId || await Follow.findOne({ follower: userId, following: targetId })) {
            return res.status(400).json({ message: 'Already following or invalid request' });
        }

        await Follow.create({ follower: userId, following: targetId });
        await User.findByIdAndUpdate(userId, { $inc: { following: 1 } });
        await User.findByIdAndUpdate(targetId, { $inc: { followers: 1 } });

        res.json({ message: 'Followed successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Follow error', error: err });
    }
});

// Unfollow a user
router.post('/unfollow', async (req, res) => {
    try {
        const { userId, targetId } = req.body;

        const followDoc = await Follow.findOneAndDelete({ follower: userId, following: targetId });
        if (!followDoc) return res.status(400).json({ message: 'Not following' });

        await User.findByIdAndUpdate(userId, { $inc: { following: -1 } });
        await User.findByIdAndUpdate(targetId, { $inc: { followers: -1 } });

        res.json({ message: 'Unfollowed successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Unfollow error', error: err });
    }
});

// get followers list
router.get('/followers/:userId', async (req, res) => {
    try {
        const followers = await Follow.find({ following: req.params.userId })
            .populate('follower', 'name email profileImage');
        res.json({ followers: followers.map(f => f.follower) });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching followers' });
    }
});


// get following list 
router.get('/following/:userId', async (req, res) => {
    try {
        const followings = await Follow.find({ follower: req.params.userId })
            .populate('following', 'name email profileImage');
        res.json({ following: followings.map(f => f.following) });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching following list' });
    }
});


// get follow and following count
router.get('/follow-count/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ followersCount: user.followers, followingCount: user.following });
    } catch (err) {
        res.status(500).json({ message: 'Error getting follow count' });
    }
});


// Check if a user is following another
router.get('/is-following', async (req, res) => {
    const { userId, targetId } = req.body;
    const isFollowing = await Follow.exists({ follower: userId, following: targetId });
    res.json({ isFollowing: !!isFollowing });
});


module.exports = router;
