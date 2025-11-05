'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useBoardStore } from '@/lib/store';
import { saveBoard, loadBoard, syncWithAPI } from '@/lib/pouchdb';
import TaskNode, { TaskNodeData } from './TaskNode';
import NoteNode, { NoteNodeData } from './NoteNode';
import MilestoneNode, { MilestoneNodeData } from './MilestoneNode';
import DecisionNode, { DecisionNodeData } from './DecisionNode';
import ActionNode, { ActionNodeData } from './ActionNode';
import { Plus, Download, ChevronDown, CheckCircle2, StickyNote, Flag, HelpCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';

type NodeType = 'task' | 'note' | 'milestone' | 'decision' | 'action';

const nodeTypes = {
  task: TaskNode,
  note: NoteNode,
  milestone: MilestoneNode,
  decision: DecisionNode,
  action: ActionNode,
};

const nodeTypeConfig: Record<NodeType, { label: string; icon: React.ReactNode }> = {
  task: {
    label: 'Tarefa',
    icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
  },
  note: {
    label: 'Nota',
    icon: <StickyNote className="h-4 w-4 text-[#3B82F6]" />,
  },
  milestone: {
    label: 'Marco',
    icon: <Flag className="h-4 w-4 text-[#7B61FF]" />,
  },
  decision: {
    label: 'Decisão',
    icon: <HelpCircle className="h-4 w-4 text-[#F59E0B]" />,
  },
  action: {
    label: 'Ação',
    icon: <Zap className="h-4 w-4 text-primary" />,
  },
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export function FlowBoard() {
  const {
    boardId,
    isOnline,
    setIsSaving,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
  } = useBoardStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('task');
  const [showNodeTypeMenu, setShowNodeTypeMenu] = useState(false);

  // Load board on mount or when boardId changes
  useEffect(() => {
    const loadData = async () => {
      const saved = await loadBoard(boardId);
      if (saved && saved.nodes && saved.edges) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
        setStoreNodes(saved.nodes);
        setStoreEdges(saved.edges);
      } else {
        // New board or empty board - reset to empty
        setNodes([]);
        setEdges([]);
        setStoreNodes([]);
        setStoreEdges([]);
      }
    };
    loadData();
  }, [boardId, setNodes, setEdges, setStoreNodes, setStoreEdges]);

  // Sync with store
  useEffect(() => {
    setStoreNodes(nodes);
  }, [nodes, setStoreNodes]);

  useEffect(() => {
    setStoreEdges(edges);
  }, [edges, setStoreEdges]);

  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(async (nodes: Node[], edges: Edge[]) => {
    setIsSaving(true);
    try {
      await saveBoard(boardId, { nodes, edges });
      if (isOnline) {
        await syncWithAPI(boardId, { nodes, edges });
      }
    } catch (error) {
      console.error('Error saving board:', error);
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      debouncedSave(nodes, edges);
    }
  }, [nodes, edges, debouncedSave, isOnline]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Determine edge type based on handle positions
      let edgeType = 'default'; // bezier works well for all directions
      
      // If we have sourceHandle and targetHandle info, we can use smoothstep for vertical connections
      // and default (bezier) for horizontal/angled connections
      if (params.sourceHandle && params.targetHandle) {
        const sourcePos = params.sourceHandle.includes('left') || params.sourceHandle.includes('right') ? 'horizontal' : 'vertical';
        const targetPos = params.targetHandle.includes('left') || params.targetHandle.includes('right') ? 'horizontal' : 'vertical';
        
        // Use smoothstep only for vertical connections, bezier for others
        if (sourcePos === 'vertical' && targetPos === 'vertical') {
          edgeType = 'smoothstep';
        }
      }
      
      const edge = {
        ...params,
        id: `${params.source}-${params.sourceHandle || 'default'}-${params.target}-${params.targetHandle || 'default'}`,
        type: edgeType,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#00E091',
        },
        style: {
          stroke: '#00E091',
          strokeWidth: 2,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNewNode = useCallback((nodeType: NodeType = selectedNodeType) => {
    const baseNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
    };

    let newNode: Node;
    
    switch (nodeType) {
      case 'note':
        newNode = {
          ...baseNode,
          data: {
            label: 'Nova Nota',
            content: '',
          } as NoteNodeData,
        };
        break;
      case 'milestone':
        newNode = {
          ...baseNode,
          data: {
            label: 'Novo Marco',
            date: '',
          } as MilestoneNodeData,
        };
        break;
      case 'decision':
        newNode = {
          ...baseNode,
          data: {
            label: 'Nova Decisão',
            question: '',
          } as DecisionNodeData,
        };
        break;
      case 'action':
        newNode = {
          ...baseNode,
          data: {
            label: 'Nova Ação',
            priority: 'medium',
          } as ActionNodeData,
        };
        break;
      default:
        newNode = {
          ...baseNode,
          data: {
            label: 'Nova Tarefa',
            completed: false,
          } as TaskNodeData,
        };
    }
    
    setNodes((nds) => [...nds, newNode]);
    setShowNodeTypeMenu(false);
  }, [setNodes, selectedNodeType]);

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<TaskNodeData>) => {
      // Handle node editing if needed
    },
    []
  );

  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) return;

    const nodeIds = selectedNodes.map((node) => node.id);
    
    // Remove nodes
    setNodes((nds) => nds.filter((node) => !node.selected));
    
    // Remove connected edges
    setEdges((eds) =>
      eds.filter(
        (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
      )
    );
  }, [nodes, setNodes, setEdges]);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && !event.defaultPrevented) {
        // Check if input/textarea is focused
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            (activeElement as HTMLElement).isContentEditable)
        ) {
          return;
        }
        
        deleteSelectedNodes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteSelectedNodes]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNodeTypeMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.node-type-menu')) {
          setShowNodeTypeMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNodeTypeMenu]);

  const exportFlow = useCallback(() => {
    const data = {
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarefy-flow-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const flowTheme = useMemo(
    () => ({
      background: '#0F0F10',
      text: '#EDEDED',
      primary: '#00E091',
    }),
    []
  );

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        defaultEdgeOptions={{
          type: 'default',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#00E091',
          },
          style: {
            stroke: '#00E091',
            strokeWidth: 2,
          },
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Background color="#252526" gap={16} />
        <Controls className="bg-card border-border" />
        <MiniMap
          className="bg-card border-border"
          nodeColor={(node) => {
            switch (node.type) {
              case 'task':
                return node.data?.completed ? '#00E091' : '#7B61FF';
              case 'note':
                return '#3B82F6';
              case 'milestone':
                return '#7B61FF';
              case 'decision':
                return '#F59E0B';
              case 'action':
                return '#00E091';
              default:
                return '#3B82F6';
            }
          }}
          maskColor="rgba(15, 15, 16, 0.6)"
        />
        <Panel position="top-center" className="mt-4">
          <div className="flex gap-2 items-center">
            <div className="relative node-type-menu">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNodeTypeMenu(!showNodeTypeMenu)}
                className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent"
              >
                <span>{nodeTypeConfig[selectedNodeType].icon}</span>
                <span>{nodeTypeConfig[selectedNodeType].label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showNodeTypeMenu ? 'rotate-180' : ''}`} />
              </motion.button>
              
              <AnimatePresence>
                {showNodeTypeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-lg overflow-hidden z-50"
                  >
                    {Object.entries(nodeTypeConfig).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedNodeType(type as NodeType);
                          setShowNodeTypeMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all hover:bg-accent ${
                          selectedNodeType === type ? 'bg-accent' : ''
                        }`}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addNewNode()}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportFlow}
              className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/90"
            >
              <Download className="h-4 w-4" />
              Exportar Fluxo
            </motion.button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

