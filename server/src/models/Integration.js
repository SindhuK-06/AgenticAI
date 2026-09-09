const mongoose = require('mongoose');
const { isInMemoryDB, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const IntegrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'User',
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedTokens: {
      type: String,
      default: null,
    },
    authDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastTestedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['healthy', 'warning', 'error', 'disconnected'],
      default: 'disconnected',
    },
  },
  {
    timestamps: true,
  }
);

IntegrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

const MongooseIntegration =
  mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);

class IntegrationModel {
  static async create(data) {
    if (!isInMemoryDB()) {
      return await MongooseIntegration.create(data);
    }
    const store = getInMemoryStore();
    const existingIndex = store.integrations.findIndex(
      (i) => String(i.owner) === String(data.owner) && i.provider === data.provider
    );
    const doc = {
      _id: uuidv4(),
      id: uuidv4(),
      owner: data.owner,
      provider: data.provider,
      isConnected: data.isConnected !== undefined ? data.isConnected : false,
      scopes: data.scopes || [],
      encryptedTokens: data.encryptedTokens || null,
      authDetails: data.authDetails || {},
      expiresAt: data.expiresAt || null,
      lastTestedAt: data.lastTestedAt || null,
      status: data.status || 'disconnected',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (existingIndex !== -1) {
      store.integrations[existingIndex] = { ...store.integrations[existingIndex], ...doc };
      return store.integrations[existingIndex];
    }
    store.integrations.push(doc);
    return doc;
  }

  static async findOne(query) {
    if (!isInMemoryDB()) {
      return await MongooseIntegration.findOne(query).exec();
    }
    const store = getInMemoryStore();
    return (
      store.integrations.find((i) => {
        let match = true;
        if (query.owner && String(i.owner) !== String(query.owner)) match = false;
        if (query.provider && i.provider !== query.provider) match = false;
        return match;
      }) || null
    );
  }

  static async find(query = {}) {
    if (!isInMemoryDB()) {
      return await MongooseIntegration.find(query).exec();
    }
    const store = getInMemoryStore();
    return store.integrations.filter((i) => {
      let match = true;
      if (query.owner && String(i.owner) !== String(query.owner)) match = false;
      if (query.provider && i.provider !== query.provider) match = false;
      return match;
    });
  }

  static async findOneAndUpdate(query, update, options = {}) {
    if (!isInMemoryDB()) {
      return await MongooseIntegration.findOneAndUpdate(query, update, {
        new: true,
        upsert: options.upsert || false,
        ...options,
      });
    }
    const store = getInMemoryStore();
    const index = store.integrations.findIndex(
      (i) => String(i.owner) === String(query.owner) && i.provider === query.provider
    );
    if (index === -1) {
      if (options.upsert) {
        const newDoc = {
          _id: uuidv4(),
          id: uuidv4(),
          owner: query.owner,
          provider: query.provider,
          ...update,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.integrations.push(newDoc);
        return newDoc;
      }
      return null;
    }
    const updated = {
      ...store.integrations[index],
      ...update,
      updatedAt: new Date(),
    };
    store.integrations[index] = updated;
    return updated;
  }

  static async deleteOne(query) {
    if (!isInMemoryDB()) {
      return await MongooseIntegration.deleteOne(query);
    }
    const store = getInMemoryStore();
    const index = store.integrations.findIndex(
      (i) => String(i.owner) === String(query.owner) && i.provider === query.provider
    );
    if (index !== -1) {
      store.integrations.splice(index, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
}

module.exports = IntegrationModel;
