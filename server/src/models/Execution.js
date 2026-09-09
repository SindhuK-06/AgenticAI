const mongoose = require('mongoose');
const { isInMemoryDB, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ExecutionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'Workflow',
    },
    workflowSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    outputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    triggerSource: {
      type: String,
      default: 'manual',
    },
    langGraphStatus: {
      type: String,
      default: 'available',
    },
    confidenceScore: {
      type: Number,
      default: 0.95,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseExecution = mongoose.models.Execution || mongoose.model('Execution', ExecutionSchema);

class ExecutionModel {
  static async create(data) {
    if (!isInMemoryDB()) {
      return await MongooseExecution.create(data);
    }
    const store = getInMemoryStore();
    const doc = {
      _id: uuidv4(),
      id: uuidv4(),
      workflowId: data.workflowId,
      workflowSnapshot: data.workflowSnapshot,
      status: data.status || 'PENDING',
      currentNode: data.currentNode || null,
      startTime: data.startTime || new Date(),
      endTime: data.endTime || null,
      duration: data.duration || 0,
      inputs: data.inputs || {},
      outputs: data.outputs || {},
      error: data.error || null,
      retryCount: data.retryCount || 0,
      triggerSource: data.triggerSource || 'manual',
      langGraphStatus: data.langGraphStatus || 'available',
      confidenceScore: data.confidenceScore || 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.executions.unshift(doc);
    return doc;
  }

  static async find(query = {}, sort = { createdAt: -1 }, limit = 50, skip = 0) {
    if (!isInMemoryDB()) {
      return await MongooseExecution.find(query).sort(sort).skip(skip).limit(limit).exec();
    }
    const store = getInMemoryStore();
    return store.executions
      .filter((e) => {
        let match = true;
        if (query.workflowId && String(e.workflowId) !== String(query.workflowId)) match = false;
        if (query.status && e.status !== query.status) match = false;
        return match;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);
  }

  static async findById(id) {
    if (!isInMemoryDB()) {
      return await MongooseExecution.findById(id).exec();
    }
    const store = getInMemoryStore();
    return store.executions.find((e) => e._id === id || e.id === id) || null;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (!isInMemoryDB()) {
      return await MongooseExecution.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const store = getInMemoryStore();
    const index = store.executions.findIndex((e) => e._id === id || e.id === id);
    if (index === -1) return null;
    const current = store.executions[index];
    const updated = {
      ...current,
      ...update,
      updatedAt: new Date(),
    };
    store.executions[index] = updated;
    return updated;
  }

  static async countDocuments(query = {}) {
    if (!isInMemoryDB()) {
      return await MongooseExecution.countDocuments(query);
    }
    const list = await this.find(query, { createdAt: -1 }, 100000, 0);
    return list.length;
  }
}

module.exports = ExecutionModel;
