const mongoose = require('mongoose');
const { isInMemoryDB, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const ExecutionLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'Execution',
    },
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'Workflow',
    },
    nodeId: {
      type: String,
      default: null,
    },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseExecutionLog =
  mongoose.models.ExecutionLog || mongoose.model('ExecutionLog', ExecutionLogSchema);

class ExecutionLogModel {
  static async create(data) {
    if (!isInMemoryDB()) {
      return await MongooseExecutionLog.create(data);
    }
    const store = getInMemoryStore();
    const doc = {
      _id: uuidv4(),
      id: uuidv4(),
      executionId: data.executionId,
      workflowId: data.workflowId,
      nodeId: data.nodeId || null,
      agent: data.agent,
      level: data.level || 'info',
      message: data.message,
      metadata: data.metadata || {},
      timestamp: data.timestamp || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.executionLogs.push(doc);
    return doc;
  }

  static async find(query = {}, sort = { timestamp: 1 }) {
    if (!isInMemoryDB()) {
      return await MongooseExecutionLog.find(query).sort(sort).exec();
    }
    const store = getInMemoryStore();
    return store.executionLogs
      .filter((l) => {
        let match = true;
        if (query.executionId && String(l.executionId) !== String(query.executionId)) match = false;
        if (query.workflowId && String(l.workflowId) !== String(query.workflowId)) match = false;
        if (query.agent && l.agent !== query.agent) match = false;
        if (query.level && l.level !== query.level) match = false;
        return match;
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  static async deleteMany(query = {}) {
    if (!isInMemoryDB()) {
      return await MongooseExecutionLog.deleteMany(query);
    }
    const store = getInMemoryStore();
    store.executionLogs = store.executionLogs.filter((l) => {
      if (query.executionId && String(l.executionId) === String(query.executionId)) return false;
      return true;
    });
    return { acknowledged: true };
  }
}

module.exports = ExecutionLogModel;
