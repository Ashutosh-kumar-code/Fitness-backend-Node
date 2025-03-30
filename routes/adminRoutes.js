const express = require('express');
const Admin = require('../models/Admin');
const Blog = require('../models/Blog');
const Brand = require('../models/Brand'); // Assuming Brand Model Exists
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

        res.json({ message: 'Login successful', token });
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

// ✅ **Verify Brand**
router.put('/verify-brand/:id', async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) return res.status(404).json({ message: 'Brand not found' });

        brand.isVerified = true;
        await brand.save();

        res.json({ message: 'Brand verified successfully', brand });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying brand', error });
    }
});

// ✅ **Get All Unverified Brands**
router.get('/unverified-brands', async (req, res) => {
    try {
        const brands = await Brand.find({ isVerified: false });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unverified brands', error });
    }
});

module.exports = router;
