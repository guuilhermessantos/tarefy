import { create } from 'zustand';
import { Node, Edge } from 'reactflow';

export interface BoardState {
  nodes: Node[];
  edges: Edge[];
  boardId: string;
  isOnline: boolean;
  isSaving: boolean;
}

interface BoardStore extends BoardState {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNode: (id: string, data: Partial<Node['data']>) => void;
  addNode: (node: Node) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  setBoardId: (id: string) => void;
  setIsOnline: (isOnline: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  reset: () => void;
}

const defaultNodes: Node[] = [];
const defaultEdges: Edge[] = [];

export const useBoardStore = create<BoardStore>((set) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  boardId: 'default',
  isOnline: false, // Will be set on client mount to avoid hydration mismatch
  isSaving: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),
  
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),
  
  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    })),
  
  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),
  
  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    })),
  
  setBoardId: (id) => set({ boardId: id }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setIsSaving: (isSaving) => set({ isSaving }),
  
  reset: () =>
    set({
      nodes: defaultNodes,
      edges: defaultEdges,
      boardId: 'default',
    }),
}));

