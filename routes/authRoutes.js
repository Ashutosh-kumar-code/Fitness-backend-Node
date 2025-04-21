const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cloudinary = require('../config/cloudinory');
const multer = require('multer');
const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  });
  const upload = multer({ storage });

// **User/Trainer Registration**
router.post('/register', upload.single('profileImage'), async (req, res) => {
    const {
      name,
      email,
      password,
      role,
      bio,
      phoneNumber,
      age,
      gender,
      city,
      languages,
      trainerType,
      experience,
      currentOccupation,
      availableTimings,
      tagline,
      feesChat,
      feesCall
    } = req.body;
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
  
      // Upload image to Cloudinary
      let profileImageUrl = '';
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'users'
        });
        profileImageUrl = result.secure_url;
  
        // Clean up uploaded file from local storage
        fs.unlinkSync(req.file.path);
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        bio,
        phoneNumber,
        age,
        gender,
        city,
        profileImage: profileImageUrl,
        languages,
        trainerType,
        experience,
        currentOccupation,
        availableTimings,
        tagline,
        feesChat,
        feesCall
      });
  
      await user.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Something went wrong' });
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

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // exclude password from response
        const { password: _, ...userData } = user.toObject();

        res.json({ token, user: userData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });
    }
});


// ===== Get Profile =====
router.get('/profile/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password\n');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error) {
      console.error('Fetch profile error:', error);
      res.status(500).json({ message: 'Error fetching user profile' });
    }
  });
  
  // ===== Update Profile =====
  router.put('/profile/update', upload.single('profileImage'), async (req, res) => {
    try {
      const { userId, password, ...updateData } = req.body;
      if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
      // Handle new profile image upload
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'users' });
        updateData.profileImage = result.secure_url;
        fs.unlinkSync(req.file.path);
      }
  
      // If password is being updated, hash it
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
  
      res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Update profile error:', error);
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
