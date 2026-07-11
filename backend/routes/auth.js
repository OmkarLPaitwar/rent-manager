const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const sendResetEmail = require('../utils/emailService');

// Helpers
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, propertyName, pin } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      propertyName: propertyName || 'My Property',
      ...(pin ? { pin } : {})
    });
    await user.save();

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, propertyName: user.propertyName } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, propertyName: user.propertyName } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, propertyName: req.user.propertyName } });
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, propertyName } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, propertyName }, { new: true }).select('-password');
    res.json({ user: { id: user._id, name: user.name, email: user.email, propertyName: user.propertyName } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both fields required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    try {
      await sendResetEmail(user.email, token);
      res.json({ msg: 'Reset link sent to email' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ msg: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const token = req.params.token;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Verify PIN
router.post('/verify-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin))
      return res.status(400).json({ message: 'PIN must be 4 digits' });

    const user = await User.findById(req.user._id);

    // Existing user with no PIN set → default is "1234"
    if (!user.pin) {
      if (pin === '1234') {
        user.pin = '1234'; // will be hashed by pre-save hook
        await user.save();
        return res.json({ success: true });
      }
      return res.json({ success: false, message: 'Incorrect PIN' });
    }

    const isMatch = await user.comparePin(pin);
    res.json({ success: isMatch, ...(isMatch ? {} : { message: 'Incorrect PIN' }) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change PIN
router.put('/change-pin', auth, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) return res.status(400).json({ message: 'Both fields required' });
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin))
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });

    const user = await User.findById(req.user._id);

    // If no PIN set yet, check against default "1234"
    let isMatch;
    if (!user.pin) {
      isMatch = currentPin === '1234';
    } else {
      isMatch = await user.comparePin(currentPin);
    }
    if (!isMatch) return res.status(400).json({ message: 'Current PIN is incorrect' });

    user.pin = newPin;
    await user.save();
    res.json({ message: 'PIN updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset PIN (back to default 1234)
router.post('/reset-pin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.pin = '1234';
    await user.save();
    res.json({ message: 'PIN has been reset to default (1234)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
