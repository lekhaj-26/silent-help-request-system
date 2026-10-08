const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getUsers, saveUsers } = require('../utils/storage');

const generateToken = (id, name, email, role) => {
  return jwt.sign(
    { id: id.toString(), name, email, role },
    process.env.JWT_SECRET || 'silent_help_request_system_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user & save to database and persistent storage
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Please provide full name, email, password, and role.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role.toLowerCase().trim();

    if (!['student', 'faculty'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be student or faculty.' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let user;

    if (isDbConnected) {
      // Primary MongoDB Atlas check & creation
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          message: 'An account with this email already exists. Please log in.'
        });
      }

      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: normalizedRole
      });
    } else {
      // Fallback: local storage when MongoDB is not connected
      const persistentUsers = getUsers();
      if (persistentUsers.some((u) => u.email === normalizedEmail)) {
        return res.status(400).json({
          message: 'An account with this email already exists. Please log in.'
        });
      }

      user = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: normalizedRole,
        createdAt: new Date().toISOString()
      };
    }

    // Optional local cache backup (fails gracefully in cloud environments)
    try {
      const persistentUsers = getUsers();
      if (!persistentUsers.some((u) => u.email === normalizedEmail)) {
        persistentUsers.push({
          _id: (user._id || user.id).toString(),
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash || (await bcrypt.hash(password, 10)),
          role: user.role,
          createdAt: user.createdAt || new Date().toISOString()
        });
        saveUsers(persistentUsers);
      }
    } catch (e) {}

    const token = generateToken(user._id, user.name, user.email, user.role);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      message: 'Account created successfully and stored in backend.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Please provide email, password, and role.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role.toLowerCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    let user;

    if (isDbConnected) {
      user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        // Fallback check in users.json
        const persistentUsers = getUsers();
        const diskUser = persistentUsers.find((u) => u.email === normalizedEmail);
        if (diskUser) {
          user = diskUser;
        } else {
          return res.status(404).json({
            message: 'Account not found. Please create an account first.'
          });
        }
      }

      if (user.role !== normalizedRole) {
        return res.status(400).json({
          message: `This account is registered as a ${user.role}. Please select the ${user.role} role.`
        });
      }

      const isMatch = user.comparePassword
        ? await user.comparePassword(password)
        : await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password. Please check your credentials.' });
      }
    } else {
      const persistentUsers = getUsers();
      user = persistentUsers.find((u) => u.email === normalizedEmail);

      if (!user) {
        return res.status(404).json({
          message: 'Account not found. Please create an account first.'
        });
      }

      if (user.role !== normalizedRole) {
        return res.status(400).json({
          message: `This account is registered as a ${user.role}. Please select the ${user.role} role.`
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password. Please check your credentials.' });
      }
    }

    const token = generateToken(user._id, user.name, user.email, user.role);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login: ' + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser
};
