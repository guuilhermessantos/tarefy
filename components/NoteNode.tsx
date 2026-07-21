'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { motion } from 'framer-motion';
import { StickyNote, X } from 'lucide-react';

export interface NoteNodeData {
  label: string;
  content?: string;
}

const NoteNode = ({ id, data, selected }: NodeProps<NoteNodeData>) => {
  const { setNodes, setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const displayLabel = data.label || 'Nova Nota';

  const handleDoubleClick = useCallback(() => {
    setDraftLabel(displayLabel);
    setIsEditing(true);
  }, [displayLabel]);

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
    updateNodeLabel(draftLabel);
  }, [draftLabel, updateNodeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
        updateNodeLabel(draftLabel);
      }
    },
    [draftLabel, updateNodeLabel]
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
      className={`floating-card group relative min-w-[200px] p-4 border-l-4 border-l-[#3B82F6] ${
        selected ? 'ring-2 ring-[#3B82F6]' : ''
      }`}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !bg-[#3B82F6] !border-2 !border-background"
      />
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !bg-[#3B82F6] !border-2 !border-background"
      />
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        className="!h-2 !w-2 !bg-[#3B82F6] !border-2 !border-background"
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
          title="Excluir nota"
        >
          <X className="h-3 w-3" />
        </motion.button>
      )}
      
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <StickyNote className="h-5 w-5 text-[#3B82F6]" />
        </div>
        
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-foreground outline-none border-b-2 border-[#3B82F6] focus:border-[#3B82F6]"
              autoFocus
            />
          ) : (
            <p className="text-sm font-medium text-foreground break-words">
              {displayLabel}
            </p>
          )}
        </div>
      </div>

      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !bg-[#3B82F6] !border-2 !border-background"
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        className="!h-2 !w-2 !bg-[#3B82F6] !border-2 !border-background"
      />
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !bg-[#3B82F6] !border-2 !border-background"
      />
    </motion.div>
  );
};

export default memo(NoteNode);

