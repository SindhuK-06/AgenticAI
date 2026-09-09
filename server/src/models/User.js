const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isInMemoryDB, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'operator'],
      default: 'operator',
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);

// Hybrid proxy to support both Mongoose and in-memory store
class UserModel {
  static async create(data) {
    if (!isInMemoryDB()) {
      return await MongooseUser.create(data);
    }
    const store = getInMemoryStore();
    const existing = store.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      const err = new Error('Email already registered');
      err.code = 11000;
      throw err;
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const newUser = {
      _id: uuidv4(),
      id: uuidv4(),
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      role: data.role || 'operator',
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async function (candidate) {
        return await bcrypt.compare(candidate, this.password);
      },
    };
    store.users.push(newUser);
    return newUser;
  }

  static async findOne(query, select = '') {
    if (!isInMemoryDB()) {
      let q = MongooseUser.findOne(query);
      if (select) q = q.select(select);
      return await q.exec();
    }
    const store = getInMemoryStore();
    const user = store.users.find((u) => {
      let match = true;
      if (query.email) match = match && u.email.toLowerCase() === query.email.toLowerCase();
      if (query._id) match = match && (u._id === query._id || u.id === query._id);
      return match;
    });
    if (!user) return null;
    return {
      ...user,
      comparePassword: async (candidate) => await bcrypt.compare(candidate, user.password),
    };
  }

  static async findById(id, select = '') {
    if (!isInMemoryDB()) {
      let q = MongooseUser.findById(id);
      if (select) q = q.select(select);
      return await q.exec();
    }
    const store = getInMemoryStore();
    const user = store.users.find((u) => u._id === id || u.id === id);
    if (!user) return null;
    return {
      ...user,
      comparePassword: async (candidate) => await bcrypt.compare(candidate, user.password),
    };
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (!isInMemoryDB()) {
      return await MongooseUser.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const store = getInMemoryStore();
    const userIndex = store.users.findIndex((u) => u._id === id || u.id === id);
    if (userIndex === -1) return null;
    const updated = {
      ...store.users[userIndex],
      ...update,
      updatedAt: new Date(),
    };
    store.users[userIndex] = updated;
    return updated;
  }

  static async countDocuments(query = {}) {
    if (!isInMemoryDB()) {
      return await MongooseUser.countDocuments(query);
    }
    return getInMemoryStore().users.length;
  }
}

module.exports = UserModel;
