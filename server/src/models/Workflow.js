const mongoose = require('mongoose');
const { isInMemoryDB, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const WorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a workflow name'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'active',
    },
    triggerConfig: {
      type: {
        type: String,
        enum: ['manual', 'webhook', 'schedule', 'event'],
        default: 'manual',
      },
      config: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    edges: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const MongooseWorkflow = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

class WorkflowModel {
  static async create(data) {
    if (!isInMemoryDB()) {
      return await MongooseWorkflow.create(data);
    }
    const store = getInMemoryStore();
    const doc = {
      _id: uuidv4(),
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      owner: data.owner,
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual', config: {} },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: data.version || 1,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.workflows.unshift(doc);
    return doc;
  }

  static async find(query = {}) {
    if (!isInMemoryDB()) {
      return await MongooseWorkflow.find(query).sort({ updatedAt: -1 }).exec();
    }
    const store = getInMemoryStore();
    return store.workflows
      .filter((w) => {
        let match = true;
        if (query.owner && String(w.owner) !== String(query.owner)) match = false;
        if (query.status && w.status !== query.status) match = false;
        if (query.name && query.name.$regex) {
          const regex = new RegExp(query.name.$regex, query.name.$options || 'i');
          if (!regex.test(w.name)) match = false;
        }
        return match;
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  static async findById(id) {
    if (!isInMemoryDB()) {
      return await MongooseWorkflow.findById(id).exec();
    }
    const store = getInMemoryStore();
    return store.workflows.find((w) => w._id === id || w.id === id) || null;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (!isInMemoryDB()) {
      return await MongooseWorkflow.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const store = getInMemoryStore();
    const index = store.workflows.findIndex((w) => w._id === id || w.id === id);
    if (index === -1) return null;
    const current = store.workflows[index];
    const updated = {
      ...current,
      ...update,
      updatedAt: new Date(),
    };
    store.workflows[index] = updated;
    return updated;
  }

  static async findByIdAndDelete(id) {
    if (!isInMemoryDB()) {
      return await MongooseWorkflow.findByIdAndDelete(id);
    }
    const store = getInMemoryStore();
    const index = store.workflows.findIndex((w) => w._id === id || w.id === id);
    if (index === -1) return null;
    const [deleted] = store.workflows.splice(index, 1);
    return deleted;
  }

  static async countDocuments(query = {}) {
    if (!isInMemoryDB()) {
      return await MongooseWorkflow.countDocuments(query);
    }
    const workflows = await this.find(query);
    return workflows.length;
  }
}

module.exports = WorkflowModel;
