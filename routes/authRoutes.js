const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
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
  router.put('/profile/update', upload.single('profileImageFile'), async (req, res) => {
    try {
      const {
        userId,
        name,
        email,
        phoneNumber,
        age,
        gender,
        city,
        bio,
        languages,
        trainerType,
        experience,
        currentOccupation,
        availableTimings,
        tagline,
        feesChat,
        feesCall,
        profileImage,
      } = req.body;
  
      const updateData = {
        name,
        email,
        phoneNumber,
        age,
        gender,
        city,
        bio,
        languages: JSON.parse(languages),  // 👈 remember to parse JSON string to array
      };
  
      if (req.file) {
        updateData.profileImage = req.file.path;  // 👈 uploaded new image
      } else if (profileImage) {
        updateData.profileImage = profileImage;  // 👈 use old image if no new upload
      }
  
      if (trainerType) {
        updateData.trainerType = trainerType;
        updateData.experience = experience;
        updateData.currentOccupation = currentOccupation;
        updateData.availableTimings = availableTimings;
        updateData.tagline = tagline;
        updateData.feesChat = feesChat;
        updateData.feesCall = feesCall;
      }
  
      await User.findByIdAndUpdate(userId, updateData);
  
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  });

// Get all verified trainers filtered by trainerType
router.post('/verified-trainers', async (req, res) => {
  try {
    const { trainerType } = req.body;

    let filters = { role: 'trainer', verified: true };

    if (trainerType && trainerType.trim() !== "") {
      filters.trainerType = { $regex: trainerType, $options: 'i' }; // correct regex format
    }

    const trainers = await User.find(filters).select('-password');
    console.log("Filters:", filters);
    console.log("Found trainers:", trainers.length);
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verified trainers', error });
  }
});


// Get all unverified trainers
router.get('/unverified-trainers', async (req, res) => {
  try {
      const trainers = await User.find({ role: 'trainer', verified: false }).select('-password');
      res.json(trainers);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching unverified trainers', error });
  }
});


// Verify a trainer
router.put('/verify-trainer', async (req, res) => {
    try {
        const { adminId, trainerId } = req.body;

        // Check if the admin exists in the Admin model
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(403).json({ message: 'Unauthorized: Only admins can verify trainers' });
        }

        // Update the trainer's verified status
        const trainer = await User.findByIdAndUpdate(
            trainerId,
            { verified: true },
            { new: true }
        );

        if (!trainer || trainer.role !== 'trainer') {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        res.json({ message: 'Trainer verified successfully', trainer });

    } catch (error) {
        res.status(500).json({ message: 'Error verifying trainer', error });
    }
});



module.exports = router;
