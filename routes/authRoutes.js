const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// **User/Trainer Registration**
router.post('/register', async (req, res) => {
    const { name, email, password, role, bio, age, gender, city, profileImage, interests, experience, currentOccupation, availableTimings, tagline } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            bio,
            age,
            gender,
            city,
            profileImage,
            interests,
            followers: 0,
            following: 0
        });

        // If user is a trainer, add trainer-specific fields
        if (role === 'trainer') {
            user.experience = experience;
            user.currentOccupation = currentOccupation;
            user.availableTimings = availableTimings;
            user.tagline = tagline;
            user.verified = false;
            user.rating = 0;
        }

        await user.save();
        res.status(201).json({ message: `${role} registered successfully` });

    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
});

// **Login API**
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

// **Get Profile (User or Trainer)**
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// **Update Profile**
router.put('/profile/update', async (req, res) => {
    try {
        const { userId, ...updateData } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID is required' });

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        res.json({ message: 'Profile updated successfully', user: updatedUser });

    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// **Get All Trainers with Filters**
router.get('/trainers', async (req, res) => {
    try {
        const { name, rating, experience } = req.query;
        let filters = { role: 'trainer' };

        if (name) filters.name = new RegExp(name, 'i');
        if (rating) filters.rating = { $gte: rating };
        if (experience) filters.experience = { $gte: experience };

        const trainers = await User.find(filters).select('-password');
        res.json(trainers);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching trainers' });
    }
});

// Verify the brand
router.put('/verify-brand', async (req, res) => {
    try {
        const { adminId, brandId } = req.body;

        // Check if the admin exists (Assumption: Only specific admins have permission)
        const admin = await User.findById(adminId);
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Only admins can verify brands' });
        }

        // Verify the brand
        const brand = await User.findByIdAndUpdate(
            brandId,
            { verified: true },
            { new: true }
        );

        if (!brand || brand.role !== 'brand') {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.json({ message: 'Brand verified successfully', brand });

    } catch (error) {
        res.status(500).json({ message: 'Error verifying brand', error });
    }
});


// get all verified brand list
router.get('/brands', async (req, res) => {
    try {
        const brands = await User.find({ role: 'brand', verified: true }).select('-password');
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brands', error });
    }
});


module.exports = router;
