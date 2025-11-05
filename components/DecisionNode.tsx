'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { motion } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

export interface DecisionNodeData {
  label: string;
  question?: string;
}

const DecisionNode = ({ id, data, selected }: NodeProps<DecisionNodeData>) => {
  const { setNodes, setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || 'Nova Decisão');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    setLabel(data.label || 'Nova Decisão');
  }, [data.label]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const updateNodeLabel = useCallback(
    (newLabel: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: newLabel } }
            : node
        )
      );
    },
    [id, setNodes]
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeLabel(label);
  }, [label, updateNodeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
        updateNodeLabel(label);
      }
    },
    [label, updateNodeLabel]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== id && edge.target !== id)
      );
    },
    [id, setNodes, setEdges]
  );

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`floating-card group relative min-w-[200px] p-4 border-2 border-[#F59E0B] bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 ${
        selected ? 'ring-2 ring-[#F59E0B]' : ''
      }`}
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      }}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !bg-[#F59E0B] !border-2 !border-background"
      />
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !bg-[#F59E0B] !border-2 !border-background"
      />
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        className="!h-2 !w-2 !bg-[#F59E0B] !border-2 !border-background"
      />
      
      {showDelete && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-all hover:bg-destructive/90"
          title="Excluir decisão"
        >
          <X className="h-3 w-3" />
        </motion.button>
      )}
      
      <div className="flex flex-col items-center gap-2">
        <HelpCircle className="h-6 w-6 text-[#F59E0B]" />
        <div className="flex-1 w-full">
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-foreground outline-none border-b-2 border-[#F59E0B] focus:border-[#F59E0B] text-center"
              autoFocus
            />
          ) : (
            <p className="text-sm font-medium text-foreground break-words text-center">
              {label}
            </p>
          )}
        </div>
      </div>

      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !bg-[#F59E0B] !border-2 !border-background"
      />
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !bg-[#F59E0B] !border-2 !border-background"
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        className="!h-2 !w-2 !bg-[#F59E0B] !border-2 !border-background"
      />
    </motion.div>
  );
};

export default memo(DecisionNode);

