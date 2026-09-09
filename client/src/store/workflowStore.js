import { create } from 'zustand';
import api from '../services/api';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

export const useWorkflowStore = create((set, get) => ({
  workflows: [],
  activeWorkflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isLoading: false,
  isSaving: false,
  isGenerating: false,
  error: null,

  // React Flow state handlers
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const newEdge = {
      ...connection,
      id: `e_${connection.source}_${connection.target}_${Date.now()}`,
      animated: true,
      type: 'smoothstep',
      style: { stroke: '#6366f1', strokeWidth: 2 },
    };
    set({
      edges: addEdge(newEdge, get().edges),
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  selectNode: (node) => set({ selectedNode: node }),

  updateNodeData: (nodeId, updatedData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const mergedData = { ...node.data, ...updatedData };
          const updatedNode = { ...node, data: mergedData };
          // If this is currently selected, update selectedNode as well
          if (get().selectedNode?.id === nodeId) {
            set({ selectedNode: updatedNode });
          }
          return updatedNode;
        }
        return node;
      }),
    });
  },

  addNode: (nodeType, position = { x: 250, y: 200 }, initialData = {}) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newNode = {
      id,
      type: nodeType,
      position,
      data: {
        label: initialData.label || 'New Node',
        nodeType: initialData.nodeType || nodeType,
        icon: initialData.icon || 'Bot',
        config: initialData.config || {},
        ...initialData,
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
    });
    return newNode;
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
    });
  },

  // API Actions
  fetchWorkflows: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/workflows', { params });
      set({ workflows: res.data || [], isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  fetchWorkflowById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/workflows/${id}`);
      const wf = res.data;
      set({
        activeWorkflow: wf,
        nodes: wf.nodes || [],
        edges: (wf.edges || []).map((e) => ({ ...e, animated: true, type: 'smoothstep' })),
        selectedNode: null,
        isLoading: false,
      });
      return wf;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  saveWorkflow: async (id, data = {}) => {
    set({ isSaving: true });
    try {
      const current = get().activeWorkflow || {};
      const payload = {
        name: data.name || current.name,
        description: data.description !== undefined ? data.description : current.description,
        status: data.status || current.status || 'active',
        triggerConfig: data.triggerConfig || current.triggerConfig,
        tags: data.tags || current.tags,
        nodes: get().nodes,
        edges: get().edges,
      };

      let res;
      if (id) {
        res = await api.put(`/workflows/${id}`, payload);
      } else {
        res = await api.post('/workflows', payload);
      }

      set({ activeWorkflow: res.data, isSaving: false });
      return res.data;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },

  generateWorkflowFromPrompt: async (prompt, model) => {
    set({ isGenerating: true, error: null });
    try {
      const res = await api.post('/workflows/generate', { prompt, model });
      const generated = res.data;

      // Load generated graph into canvas state
      set({
        nodes: generated.nodes || [],
        edges: (generated.edges || []).map((e) => ({ ...e, animated: true, type: 'smoothstep' })),
        activeWorkflow: {
          name: generated.name,
          description: generated.description,
          tags: generated.tags || ['AI Generated'],
          triggerConfig: generated.triggerConfig || { type: 'manual' },
          version: 1,
        },
        selectedNode: generated.nodes?.[0] || null,
        isGenerating: false,
      });
      return generated;
    } catch (err) {
      set({ isGenerating: false, error: err.message });
      throw err;
    }
  },

  executeWorkflow: async (id, inputs = {}) => {
    try {
      const res = await api.post(`/workflows/${id}/execute`, { inputs });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  duplicateWorkflow: async (id) => {
    try {
      const res = await api.post(`/workflows/${id}/duplicate`);
      await get().fetchWorkflows();
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  deleteWorkflow: async (id) => {
    try {
      await api.delete(`/workflows/${id}`);
      set({
        workflows: get().workflows.filter((w) => (w._id || w.id) !== id),
      });
      return true;
    } catch (err) {
      throw err;
    }
  },
}));
