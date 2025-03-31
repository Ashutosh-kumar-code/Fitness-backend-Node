const express = require('express');
const Admin = require('../models/Admin');
const Blog = require('../models/Blog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET_KEY = 'your_secret_key'; // Change this to an environment variable

// ✅ **Admin Registration**
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

        const admin = new Admin({ name, email, password });
        await admin.save();

        res.status(201).json({ message: 'Admin registered successfully', admin });
    } catch (error) {
        res.status(500).json({ message: 'Error registering admin', error });
    }
});

// ✅ **Admin Login**
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ adminId: admin._id }, SECRET_KEY, { expiresIn: '24h' });

        res.json({ message: 'Login successful', token,  admin: {
            id: admin._id,
            name: admin.name
        } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

// ✅ **Get All Blogs (Admin)**
router.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name profileImage role');
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error });
    }
});

// ✅ **Delete Any Blog (Admin)**
router.delete('/blog/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });

        await blog.deleteOne();
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog', error });
    }
});


// Get all users
router.get('/users-list', async (req, res) => {
    try {
        const users = await User.find({ role: 'user'});
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all verified trainers
router.get('/trainers/verified', async (req, res) => {
    try {
        const trainers = await User.find({ role: 'trainer', verified: true });
        res.status(200).json(trainers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all unverified trainers
router.get('/trainers/unverified', async (req, res) => {
    try {
        const trainers = await User.find({ role: 'trainer', verified: false });
        res.status(200).json(trainers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// delete api of users 
// ✅ **Delete a User or Trainer (Admin)**
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
});




module.exports = router;
