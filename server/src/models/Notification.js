const mongoose = require('mongoose');
const { isInMemoryDB, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const NotificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'User',
    },
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      ref: 'Workflow',
    },
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      ref: 'Execution',
    },
    type: {
      type: String,
      enum: ['success', 'failure', 'recovery', 'info', 'warning'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseNotification =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

class NotificationModel {
  static async create(data) {
    if (!isInMemoryDB()) {
      return await MongooseNotification.create(data);
    }
    const store = getInMemoryStore();
    const doc = {
      _id: uuidv4(),
      id: uuidv4(),
      owner: data.owner,
      workflowId: data.workflowId || null,
      executionId: data.executionId || null,
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      metadata: data.metadata || {},
      isRead: data.isRead !== undefined ? data.isRead : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.notifications.unshift(doc);
    return doc;
  }

  static async find(query = {}, sort = { createdAt: -1 }, limit = 50) {
    if (!isInMemoryDB()) {
      return await MongooseNotification.find(query).sort(sort).limit(limit).exec();
    }
    const store = getInMemoryStore();
    return store.notifications
      .filter((n) => {
        let match = true;
        if (query.owner && String(n.owner) !== String(query.owner)) match = false;
        if (query.isRead !== undefined && n.isRead !== query.isRead) match = false;
        return match;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (!isInMemoryDB()) {
      return await MongooseNotification.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const store = getInMemoryStore();
    const index = store.notifications.findIndex((n) => n._id === id || n.id === id);
    if (index === -1) return null;
    const updated = {
      ...store.notifications[index],
      ...update,
      updatedAt: new Date(),
    };
    store.notifications[index] = updated;
    return updated;
  }

  static async updateMany(query = {}, update = {}) {
    if (!isInMemoryDB()) {
      return await MongooseNotification.updateMany(query, update);
    }
    const store = getInMemoryStore();
    let modified = 0;
    store.notifications.forEach((n) => {
      let match = true;
      if (query.owner && String(n.owner) !== String(query.owner)) match = false;
      if (query.isRead !== undefined && n.isRead !== query.isRead) match = false;
      if (match) {
        Object.assign(n, update, { updatedAt: new Date() });
        modified++;
      }
    });
    return { modifiedCount: modified };
  }
}

module.exports = NotificationModel;
