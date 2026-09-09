const mongoose = require('mongoose');
const { isInMemoryDB, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const AgentMemorySchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'Workflow',
    },
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'Execution',
    },
    agentId: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseAgentMemory =
  mongoose.models.AgentMemory || mongoose.model('AgentMemory', AgentMemorySchema);

class AgentMemoryModel {
  static async create(data) {
    if (!isInMemoryDB()) {
      return await MongooseAgentMemory.create(data);
    }
    const store = getInMemoryStore();
    const doc = {
      _id: uuidv4(),
      id: uuidv4(),
      workflowId: data.workflowId,
      executionId: data.executionId,
      agentId: data.agentId,
      key: data.key,
      value: data.value,
      confidenceScore: data.confidenceScore !== undefined ? data.confidenceScore : 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.agentMemories.push(doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemoryDB()) {
      return await MongooseAgentMemory.find(query).exec();
    }
    const store = getInMemoryStore();
    return store.agentMemories.filter((m) => {
      let match = true;
      if (query.executionId && String(m.executionId) !== String(query.executionId)) match = false;
      if (query.agentId && m.agentId !== query.agentId) match = false;
      if (query.key && m.key !== query.key) match = false;
      return match;
    });
  }

  static async findOne(query = {}) {
    const list = await this.find(query);
    return list[0] || null;
  }
}

module.exports = AgentMemoryModel;
