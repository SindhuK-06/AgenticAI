import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useWorkflowStore } from '../../store/workflowStore';
import TriggerNode from './TriggerNode';
import AgentNode from './AgentNode';
import IntegrationNode from './IntegrationNode';
import ConditionNode from './ConditionNode';

function CanvasInternal({ readOnly = false }) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    addNode,
  } = useWorkflowStore();

  const reactFlowInstance = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      triggerNode: TriggerNode,
      trigger: TriggerNode,
      agentNode: AgentNode,
      agent: AgentNode,
      integrationNode: IntegrationNode,
      integration: IntegrationNode,
      conditionNode: ConditionNode,
      condition: ConditionNode,
    }),
    []
  );

  const onNodeClick = useCallback(
    (_, node) => {
      selectNode(node);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeTypeData = event.dataTransfer.getData('application/agentflow-node');
      if (!nodeTypeData) return;

      try {
        const item = JSON.parse(nodeTypeData);
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNode(item.type, position, item.data);
      } catch (e) {
        console.error('Failed to drop node:', e);
      }
    },
    [reactFlowInstance, addNode]
  );

  return (
    <div className="w-full h-full relative" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        defaultEdgeOptions={{
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#334155"
        />
        <Controls className="!bottom-4 !left-4" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'triggerNode' || node.type === 'trigger') return '#6366f1';
            if (node.type === 'agentNode' || node.type === 'agent') return '#a855f7';
            if (node.type === 'integrationNode' || node.type === 'integration') return '#10b981';
            return '#f59e0b';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="!bottom-4 !right-4"
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInternal {...props} />
    </ReactFlowProvider>
  );
}
