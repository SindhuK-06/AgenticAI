const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  async register({ name, email, password, role = 'operator' }) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: ['admin', 'operator'].includes(role) ? role : 'operator',
    });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() }, '+password');
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update lastLogin
    await User.findByIdAndUpdate(user._id || user.id, { lastLogin: new Date() });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: new Date(),
      },
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      const error = new Error('Invalid or expired authentication token');
      error.statusCode = 401;
      throw error;
    }
  }
}

module.exports = new AuthService();
