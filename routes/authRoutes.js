const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const cloudinary = require('../config/cloudinory');
const multer = require('multer');
const streamifier = require('streamifier'); // ✅ required for memory buffer upload
const router = express.Router();

// ✅ Multer setup with memoryStorage (for Vercel compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to generate unique numeric uId
async function generateUniqueUId() {
  let isUnique = false;
  let uId;
  while (!isUnique) {
    uId = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const existing = await User.findOne({ uId });
    if (!existing) isUnique = true;
  }
  return uId;
}

// ✅ Helper to upload buffer to Cloudinary
const streamUpload = (req) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'users' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  });
};

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

    // ✅ Upload image from memory buffer to Cloudinary
    let profileImageUrl = '';
    if (req.file) {
      const result = await streamUpload(req);
      profileImageUrl = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uId = await generateUniqueUId(); // 🔑 Generate unique numeric uId

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
      feesCall,
      uId
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
  router.put('/profile/update', async (req, res) => {
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
        profileImage, // 👈 now we only receive Cloudinary URL here
      } = req.body;
  
      const updateData = {
        name,
        email,
        phoneNumber,
        age,
        gender,
        city,
        bio,
        languages: typeof languages === 'string' ? JSON.parse(languages) : languages, // parse if needed
        profileImage, // 👈 directly save Cloudinary URL or existing URL
      };
  
      if (trainerType) {
        updateData.trainerType = trainerType;
        updateData.experience = experience;
        updateData.currentOccupation = currentOccupation;
        updateData.availableTimings = availableTimings;
        updateData.tagline = tagline;
        updateData.feesChat = feesChat;
        updateData.feesCall = feesCall;
      }
  
      await User.findByIdAndUpdate(userId, updateData, { new: true });
  
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



// Route to get all users
router.get('/allusers', async (req, res) => {
  try {
    const usersWithUId = await User.find({ uId: { $exists: true, $ne: null } })
      .select('-password -phoneVerificationCode'); // exclude sensitive fields

    res.status(200).json(usersWithUId);
  } catch (error) {
    console.error('Error fetching users with uId:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});


module.exports = router;
