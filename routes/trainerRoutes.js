const express = require('express');
const bcrypt = require('bcryptjs');
const Trainer = require('../models/Trainer');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Trainer Registration
router.post('/register', async (req, res) => {
    const { name, email, password, experience, currentOccupation, city, bio, image, availableTimings, tagline } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const trainer = new Trainer({
            name,
            email,
            password: hashedPassword,
            experience,
            currentOccupation,
            city,
            bio,
            image,
            availableTimings,
            tagline,
            verified: false, // Admin needs to verify
        });

        await trainer.save();
        res.status(201).json({ message: 'Trainer registered successfully, pending admin verification.' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering trainer', error });
    }
});

// Get All Trainers with Filters
router.get('/', async (req, res) => {
    const { name, expertise, city, rating, verified, gender } = req.query;
    let query = {};
    
    if (name) query.name = new RegExp(name, 'i');
    if (expertise) query.expertise = expertise;
    if (city) query.city = new RegExp(city, 'i');
    if (rating) query.rating = { $gte: rating };
    if (verified !== undefined) query.verified = verified === 'true';

    try {
        const trainers = await Trainer.find(query);
        res.json(trainers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trainers' });
    }
});

// Admin Verify Trainer
router.put('/verify/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    try {
        const trainer = await Trainer.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
        res.json({ message: 'Trainer verified successfully', trainer });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying trainer' });
    }
});

module.exports = router;
