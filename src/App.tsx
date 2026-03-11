import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassScene } from './components/GlassScene';
import { 
  Palette, 
  Layers, 
  Layout, 
  Send, 
  Github, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Facebook,
  MessageCircle,
  ExternalLink, 
  Menu, 
  X, 
  ChevronRight,
  Monitor,
  Smartphone,
  PenTool,
  Award,
  Mail,
  Quote,
  Plus,
  Minus,
  RotateCcw,
  Trash2,
  Edit2,
  FolderPlus,
  Image as ImageIcon,
  LogOut,
  LogIn,
  ChevronLeft,
  Eye,
  Upload,
  FileText,
  Folder,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2
} from 'lucide-react';
import { 
  db, 
  auth, 
  storage,
  signInWithGoogle, 
  logOut, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { 
  Stage, 
  Layer, 
  Image as KonvaImage, 
  Transformer,
  Rect,
  Group,
  Line
} from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- Types ---
interface CanvasItem {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface Project {
  id: string;
  name: string;
  categoryId: string;
  coverImage: string;
  images: string[];
  description: string;
  createdAt: Timestamp;
  canvasData?: CanvasItem[];
  canvasBackgroundColor?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  coverImage?: string;
}

interface Skill {
  name: string;
  level: number;
  icon: React.ReactNode;
  color: string;
}

interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// --- Data ---
const SKILLS: Skill[] = [
  { name: "Adobe Illustrator", level: 95, icon: <PenTool className="w-5 h-5" />, color: "orange-accent" },
  { name: "Adobe Photoshop", level: 90, icon: <Palette className="w-5 h-5" />, color: "blue-accent" },
  { name: "Typography", level: 85, icon: <Layout className="w-5 h-5" />, color: "orange-accent" },
  { name: "Color Theory", level: 92, icon: <Layers className="w-5 h-5" />, color: "blue-accent" },
  { name: "Branding", level: 88, icon: <Award className="w-5 h-5" />, color: "orange-accent" },
];

const SERVICES: Service[] = [
  { 
    title: "Logo Design", 
    description: "Unique and modern logos designed to represent your brand identity.",
    icon: <PenTool className="w-10 h-10" />,
    color: "orange-accent"
  },
  { 
    title: "Brand Identity", 
    description: "Consistent visual systems including colors, typography, and brand style.",
    icon: <Layers className="w-10 h-10" />,
    color: "blue-accent"
  },
  { 
    title: "Social Media Design", 
    description: "Eye-catching graphics for Instagram, Facebook, and other platforms.",
    icon: <Smartphone className="w-10 h-10" />,
    color: "orange-accent"
  },
  { 
    title: "Flyer & Poster Design", 
    description: "Creative promotional materials for marketing and advertising.",
    icon: <Monitor className="w-10 h-10" />,
    color: "blue-accent"
  },
  { 
    title: "YouTube Thumbnail Design", 
    description: "Attention-grabbing thumbnails designed to increase clicks.",
    icon: <Layout className="w-10 h-10" />,
    color: "orange-accent"
  },
];

// --- Canvas Components ---
const URLImage = ({ item, isSelected, onSelect, onChange, readOnly }: { 
  item: CanvasItem, 
  isSelected: boolean, 
  onSelect: () => void, 
  onChange: (newItem: CanvasItem) => void,
  readOnly?: boolean
}) => {
  const [image] = useImage(item.src, 'anonymous');
  const shapeRef = React.useRef<any>(null);

  return (
    <React.Fragment>
      <KonvaImage
        id={item.id}
        onClick={readOnly ? undefined : onSelect}
        onTap={readOnly ? undefined : onSelect}
        image={image}
        ref={shapeRef}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        draggable={!readOnly}
        dragBoundFunc={(pos) => {
          const stage = shapeRef.current?.getStage();
          if (!stage) return pos;
          const scale = stage.scaleX();
          const x = Math.round((pos.x - stage.x()) / scale / 10) * 10 * scale + stage.x();
          const y = Math.round((pos.y - stage.y()) / scale / 10) * 10 * scale + stage.y();
          return { x, y };
        }}
        onDragEnd={(e) => {
          if (readOnly) return;
          onChange({
            ...item,
            x: Math.round(e.target.x() / 10) * 10,
            y: Math.round(e.target.y() / 10) * 10,
          });
        }}
        onTransform={() => {
          if (readOnly) return;
          const node = shapeRef.current;
          if (!node) return;

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          const width = node.width();
          const height = node.height();
          
          const currentWidth = width * scaleX;
          const currentHeight = height * scaleY;
          
          const snappedWidth = Math.max(10, Math.round(currentWidth / 10) * 10);
          const snappedHeight = Math.max(10, Math.round(currentHeight / 10) * 10);
          
          node.scaleX(snappedWidth / width);
          node.scaleY(snappedHeight / height);
          
          node.x(Math.round(node.x() / 10) * 10);
          node.y(Math.round(node.y() / 10) * 10);
        }}
        onTransformEnd={(e) => {
          if (readOnly) return;
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          onChange({
            ...item,
            x: Math.round(node.x() / 10) * 10,
            y: Math.round(node.y() / 10) * 10,
            rotation: Math.round(node.rotation()),
            scaleX: scaleX,
            scaleY: scaleY,
          });
        }}
      />
    </React.Fragment>
  );
};

const CanvasDesignEditor = ({ 
  items, 
  setItems, 
  onUploadImage,
  backgroundColor,
  setBackgroundColor,
  onUndo,
  onRedo,
  onSetCover,
  onClear
}: { 
  items: CanvasItem[], 
  setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>,
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void,
  backgroundColor: string,
  setBackgroundColor: (color: string) => void,
  onUndo: () => void,
  onRedo: () => void,
  onSetCover?: (dataUrl: string) => void,
  onClear?: () => void
}) => {
  const [selectedId, selectShape] = useState<string | null>(null);
  const stageRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canvasHeight, setCanvasHeight] = useState(450);
  const [stageSize, setStageSize] = useState({ width: 800, height: 450, scale: 1 });

  const [isZoomMode, setIsZoomMode] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const keys = React.useRef({ ctrl: false, space: false });
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const isZoomingRef = React.useRef(false);
  const zoomStartRef = React.useRef({ x: 0, zoom: 1, pointerX: 0, pointerY: 0, stageX: 0, stageY: 0 });
  const trRef = React.useRef<any>(null);

  useEffect(() => {
    if (selectedId && trRef.current && stageRef.current && !isZoomMode && !isPanMode) {
      const attach = () => {
        const node = stageRef.current?.findOne('#' + selectedId);
        if (node) {
          trRef.current.nodes([node]);
          trRef.current.getLayer()?.batchDraw();
        }
      };
      attach();
      const timeout = setTimeout(attach, 50);
      return () => clearTimeout(timeout);
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, items.length, isZoomMode, isPanMode]);

  const handleSetCover = () => {
    if (stageRef.current && onSetCover) {
      selectShape(null);
      // Wait for state update to remove transformer
      setTimeout(() => {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        onSetCover(dataUrl);
      }, 0);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const scale = width / 800;
        const height = canvasHeight * scale;
        setStageSize({ width, height, scale });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasHeight]);

  // Keyboard listener for Undo/Redo, Arrow keys, and Zoom keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') keys.current.ctrl = true;
      if (e.code === 'Space') {
        keys.current.space = true;
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
        }
      }
      
      if (keys.current.ctrl && keys.current.space) {
        setIsZoomMode(true);
        setIsPanMode(false);
      } else if (keys.current.space && !keys.current.ctrl) {
        setIsPanMode(true);
        setIsZoomMode(false);
      }

      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setItems(prevItems => prevItems.map(item => {
          if (item.id === selectedId) {
            const step = e.shiftKey ? 10 : 1;
            let newX = item.x;
            let newY = item.y;
            if (e.key === 'ArrowUp') newY -= step;
            if (e.key === 'ArrowDown') newY += step;
            if (e.key === 'ArrowLeft') newX -= step;
            if (e.key === 'ArrowRight') newX += step;
            return { ...item, x: newX, y: newY };
          }
          return item;
        }));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        onRedo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') keys.current.ctrl = false;
      if (e.code === 'Space') keys.current.space = false;
      
      if (keys.current.ctrl && keys.current.space) {
        setIsZoomMode(true);
        setIsPanMode(false);
      } else if (keys.current.space && !keys.current.ctrl) {
        setIsPanMode(true);
        setIsZoomMode(false);
      } else {
        setIsZoomMode(false);
        setIsPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onUndo, onRedo, selectedId, setItems]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isZoomingRef.current) {
        const dx = e.clientX - zoomStartRef.current.x;
        const zoomFactor = Math.exp(dx / 200); // adjust sensitivity
        const newZoom = Math.max(0.1, Math.min(zoomStartRef.current.zoom * zoomFactor, 10));
        
        const oldScale = zoomStartRef.current.zoom * stageSize.scale;
        const newScale = newZoom * stageSize.scale;
        
        const logicalX = (zoomStartRef.current.pointerX - zoomStartRef.current.stageX) / oldScale;
        const logicalY = (zoomStartRef.current.pointerY - zoomStartRef.current.stageY) / oldScale;
        
        const newStageX = zoomStartRef.current.pointerX - logicalX * newScale;
        const newStageY = zoomStartRef.current.pointerY - logicalY * newScale;
        
        setZoom(newZoom);
        setStagePos({ x: newStageX, y: newStageY });
      }
    };

    const handleMouseUp = () => {
      isZoomingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stageSize.scale]);

  const handleMouseDown = (e: any) => {
    if (isZoomMode) {
      isZoomingRef.current = true;
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      zoomStartRef.current = {
        x: e.evt.clientX,
        zoom: zoom,
        pointerX: pos.x,
        pointerY: pos.y,
        stageX: stagePos.x,
        stageY: stagePos.y
      };
      return;
    }

    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleWheel = (e: any) => {
    if (isZoomMode) return;
    e.evt.preventDefault();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += e.evt.deltaY;
    }
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setItems(items.filter(item => item.id !== selectedId));
      selectShape(null);
    }
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    
    const newItems = [...items];
    if (direction === 'up' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    } else if (direction === 'down' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    }
    setItems(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center bg-black/40 p-3 rounded-xl border border-white/10 gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-accent text-black font-bold rounded-lg cursor-pointer hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" /> Add Images
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={onUploadImage} 
              className="hidden" 
            />
          </label>
          
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <label className="text-xs text-gray-400 font-bold uppercase">Height:</label>
            <input 
              type="number" 
              value={canvasHeight}
              onChange={(e) => setCanvasHeight(Number(e.target.value))}
              className="w-16 bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-accent"
              min="450"
              step="50"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <label className="text-xs text-gray-400 font-bold uppercase">Canvas Color:</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-xs font-mono text-gray-400">{backgroundColor}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }}
              className="px-3 py-2 bg-blue-500/20 text-blue-500 border border-blue-500/50 font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors text-xs"
            >
              Reset Zoom
            </button>
          )}
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          <button
            type="button"
            onClick={onUndo}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          {selectedId && (
            <button 
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/50 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors ml-2"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
        <div ref={scrollContainerRef} className="flex-1 rounded-xl overflow-y-auto overflow-x-hidden border border-white/10 relative shadow-inner bg-black/20 h-full custom-scrollbar" style={{ direction: 'rtl' }}>
          <div ref={containerRef} style={{ direction: 'ltr' }} className="w-full min-h-full relative">
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              scaleX={stageSize.scale * zoom}
              scaleY={stageSize.scale * zoom}
              x={stagePos.x}
              y={stagePos.y}
              draggable={isPanMode}
              onDragMove={(e) => {
                if (e.target === stageRef.current) {
                  setStagePos({ x: e.target.x(), y: e.target.y() });
                }
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              onWheel={handleWheel}
              ref={stageRef}
              style={{ cursor: isZoomMode ? 'col-resize' : (isPanMode ? 'grab' : 'default') }}
              className="w-full"
            >
              <Layer>
                <Group
                  clipX={0}
                  clipY={0}
                  clipWidth={800}
                  clipHeight={canvasHeight}
                >
                  <Rect
                    x={0}
                    y={0}
                    width={800}
                    height={canvasHeight}
                    fill={backgroundColor}
                    name="background"
                  />
                  {/* Grid Lines */}
                  {Array.from({ length: Math.ceil(800 / 10) + 1 }).map((_, i) => (
                    <Line
                      key={`v-${i}`}
                      points={[i * 10, 0, i * 10, canvasHeight]}
                      stroke="rgba(128, 128, 128, 0.15)"
                      strokeWidth={1}
                    />
                  ))}
                  {Array.from({ length: Math.ceil(canvasHeight / 10) + 1 }).map((_, i) => (
                    <Line
                      key={`h-${i}`}
                      points={[0, i * 10, 800, i * 10]}
                      stroke="rgba(128, 128, 128, 0.15)"
                      strokeWidth={1}
                    />
                  ))}
                  {items.map((item, i) => (
                    <URLImage
                      key={item.id}
                      item={item}
                      isSelected={item.id === selectedId}
                      onSelect={() => selectShape(item.id)}
                      onChange={(newItem: CanvasItem) => {
                        const newItems = items.slice();
                        newItems[i] = newItem;
                        setItems(newItems);
                      }}
                      readOnly={isZoomMode || isPanMode}
                    />
                  ))}
                </Group>
                <Transformer
                  ref={trRef}
                  visible={!!selectedId && !isZoomMode && !isPanMode}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 pointer-events-none bg-black/50 px-2 py-1 rounded z-10">
              Canvas: 800x{canvasHeight} (Scaled {(stageSize.scale * zoom).toFixed(2)}x)
            </div>
          </div>
        </div>

        {/* Layers Panel */}
        <div className="w-full lg:w-72 bg-black/40 border border-white/10 rounded-xl flex flex-col h-full">
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Layers className="w-3 h-3 text-blue-accent" /> Layers ({items.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs gap-2 opacity-50">
                <Layers className="w-8 h-8" />
                <p>No layers yet</p>
              </div>
            ) : (
              [...items].reverse().map((item, index) => {
                const originalIndex = items.length - 1 - index;
                return (
                  <div 
                    key={item.id}
                    onClick={() => selectShape(item.id)}
                    className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${
                      selectedId === item.id 
                        ? 'bg-blue-accent/10 border-blue-accent/50 shadow-lg shadow-blue-accent/5' 
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 bg-black/50 rounded overflow-hidden flex-shrink-0 border border-white/10 relative">
                      <img src={item.src} className="w-full h-full object-cover" alt="layer" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-medium truncate ${selectedId === item.id ? 'text-blue-accent' : 'text-gray-300'}`}>
                          Image {originalIndex + 1}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate font-mono mt-0.5">
                        {Math.round(item.width)}x{Math.round(item.height)} • {Math.round(item.x)},{Math.round(item.y)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveLayer(item.id, 'up'); }}
                        disabled={originalIndex === items.length - 1}
                        className="p-1 hover:bg-white/20 rounded disabled:opacity-0 text-gray-400 hover:text-white transition-all"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveLayer(item.id, 'down'); }}
                        disabled={originalIndex === 0}
                        className="p-1 hover:bg-white/20 rounded disabled:opacity-0 text-gray-400 hover:text-white transition-all"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 text-center">
        Click image to select &bull; Drag to move &bull; Drag corners to resize &bull; Use layers panel to reorder
      </p>
    </div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard = ({ 
  categories, 
  projects, 
  messages,
  onClose 
}: { 
  categories: Category[], 
  projects: Project[], 
  messages: any[],
  onClose: () => void 
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'projects' | 'messages'>('projects');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'project' | 'category' | 'message', id: string, message: string } | null>(null);

  // Form States
  const [catName, setCatName] = useState('');
  const [catCover, setCatCover] = useState('');
  const [projName, setProjName] = useState('');
  const [projCatId, setProjCatId] = useState('');
  const [projCover, setProjCover] = useState('');
  const [projImages, setProjImages] = useState<string[]>([]);
  const [projDesc, setProjDesc] = useState('');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [canvasBgColor, setCanvasBgColor] = useState('#1a1a1a');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // History State
  const [canvasHistory, setCanvasHistory] = useState<CanvasItem[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const updateCanvasItems = (newItems: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) => {
    let resolvedItems: CanvasItem[];
    if (typeof newItems === 'function') {
      resolvedItems = newItems(canvasItems);
    } else {
      resolvedItems = newItems;
    }

    setCanvasItems(resolvedItems);
    
    const newHistory = canvasHistory.slice(0, historyStep + 1);
    newHistory.push(resolvedItems);
    setCanvasHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setCanvasItems(canvasHistory[newStep]);
    }
  };

  const handleRedo = () => {
    if (historyStep < canvasHistory.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setCanvasItems(canvasHistory[newStep]);
    }
  };

  const handleImageUpload = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (onProgress) onProgress(10);
        else setUploadProgress(10);
        
        // Create an image element to draw the file
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onload = () => {
          if (onProgress) onProgress(40);
          else setUploadProgress(40);

          // Calculate new dimensions (max 1200px width/height to save space)
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          // Draw to canvas for compression
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          if (onProgress) onProgress(70);
          else setUploadProgress(70);

          // Compress to JPEG with 0.7 quality (significantly reduces base64 size)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          URL.revokeObjectURL(objectUrl);
          
          if (onProgress) onProgress(100);
          else setUploadProgress(100);
          
          resolve(dataUrl);
        };

        img.onerror = (error) => {
          URL.revokeObjectURL(objectUrl);
          console.error("Image load error:", error);
          reject(error);
        };

        img.src = objectUrl;
      } catch (error) {
        console.error("Upload failed:", error);
        reject(error);
      }
    });
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const url = await handleImageUpload(e.target.files[0]);
        setProjCover(url);
      } catch (error) {
        alert("Failed to upload cover image.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCatCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const url = await handleImageUpload(e.target.files[0]);
        setCatCover(url);
      } catch (error) {
        alert("Failed to upload category cover image.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAdditionalFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const files = Array.from(e.target.files) as File[];
        const progressMap = new Map<string, number>();
        
        const uploadPromises = files.map(async (file) => {
          const fileId = `${file.name}-${file.lastModified}`;
          progressMap.set(fileId, 0);
          
          const url = await handleImageUpload(file, (progress) => {
            progressMap.set(fileId, progress);
            let totalProgress = 0;
            progressMap.forEach(p => totalProgress += p);
            setUploadProgress(totalProgress / files.length);
          });
          return url;
        });

        const urls = await Promise.all(uploadPromises);
        setProjImages(prev => [...prev, ...urls]);
      } catch (error) {
        alert("Failed to upload some images.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSetCover = (dataUrl: string) => {
    // Only set as cover if not already set, or maybe just update it?
    // User can always change it manually.
    if (!projCover) {
      setProjCover(dataUrl);
    }
  };

  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear the canvas?")) {
      updateCanvasItems([]);
    }
  };

  const handleCanvasImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const files = Array.from(e.target.files);
        const progressMap = new Map<string, number>();
        
        const uploadPromises = files.map(async (file, index) => {
          const fileId = `${file.name}-${file.lastModified}-${index}`;
          progressMap.set(fileId, 0);
          
          const url = await handleImageUpload(file, (progress) => {
            progressMap.set(fileId, progress);
            let totalProgress = 0;
            progressMap.forEach(p => totalProgress += p);
            setUploadProgress(totalProgress / files.length);
          });
          return url;
        });

        const urls = await Promise.all(uploadPromises);
        
        // Process each image to add to canvas
        const newItems: CanvasItem[] = [];
        
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
              let w = img.naturalWidth;
              let h = img.naturalHeight;
              
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 450;

              if (w > MAX_WIDTH || h > MAX_HEIGHT) {
                const ratio = w / h;
                if (w / MAX_WIDTH > h / MAX_HEIGHT) {
                  w = MAX_WIDTH;
                  h = MAX_WIDTH / ratio;
                } else {
                  h = MAX_HEIGHT;
                  w = MAX_HEIGHT * ratio;
                }
              }

              // Offset each new image slightly so they don't stack perfectly on top of each other
              const offset = i * 20;

              const newItem: CanvasItem = {
                id: `img-${Date.now()}-${i}`,
                type: 'image',
                src: url,
                x: (800 - w) / 2 + offset, 
                y: (450 - h) / 2 + offset,
                width: w,
                height: h,
                rotation: 0,
                scaleX: 1,
                scaleY: 1
              };
              newItems.push(newItem);
              resolve();
            };
            img.onerror = () => resolve();
          });
        }
        
        updateCanvasItems((prev: CanvasItem[]) => [...prev, ...newItems]);

      } catch (error) {
        alert("Failed to upload images.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'categories'), {
        name: catName,
        slug: catName.toLowerCase().replace(/\s+/g, '-'),
        order: categories.length,
        coverImage: catCover
      });
      setCatName('');
      setCatCover('');
      setIsAddingCategory(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCover(cat.coverImage || '');
    setIsAddingCategory(false); // Close add form if open
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: catName,
        slug: catName.toLowerCase().replace(/\s+/g, '-'),
        coverImage: catCover
      });
      setCatName('');
      setCatCover('');
      setEditingCategory(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    }
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteConfirmation({ 
      type: 'category', 
      id, 
      message: 'Are you sure you want to delete this category? All projects in it will remain but be uncategorized.' 
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const projectData = {
        name: projName,
        categoryId: projCatId,
        coverImage: projCover,
        images: projImages,
        description: projDesc,
        canvasData: canvasItems,
        canvasBackgroundColor: canvasBgColor,
        createdAt: serverTimestamp()
      };

      if (editingProject) {
        await updateDoc(doc(db, 'projects', editingProject.id), projectData);
      } else {
        await addDoc(collection(db, 'projects'), projectData);
      }

      resetProjectForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'projects');
    }
  };

  const resetProjectForm = () => {
    setProjName('');
    setProjCatId('');
    setProjCover('');
    setProjImages([]);
    setProjDesc('');
    setCanvasItems([]);
    setCanvasHistory([[]]);
    setHistoryStep(0);
    setCanvasBgColor('#1a1a1a');
    setEditingProject(null);
    setIsAddingProject(false);
  };

  const handleDeleteProject = (id: string) => {
    setDeleteConfirmation({ 
      type: 'project', 
      id, 
      message: 'Are you sure you want to delete this project?' 
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { type, id } = deleteConfirmation;
    try {
      if (type === 'category') {
        await deleteDoc(doc(db, 'categories', id));
      } else if (type === 'project') {
        await deleteDoc(doc(db, 'projects', id));
      } else if (type === 'message') {
        await deleteDoc(doc(db, 'messages', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, type === 'category' ? 'categories' : type === 'project' ? 'projects' : 'messages');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-y-auto p-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Admin <span className="text-orange-accent">Dashboard</span></h2>
          <button onClick={onClose} className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'projects' ? 'bg-orange-accent text-black' : 'glass text-gray-400'}`}
          >
            Manage Projects
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-orange-accent text-black' : 'glass text-gray-400'}`}
          >
            Manage Folders
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-orange-accent text-black' : 'glass text-gray-400'}`}
          >
            Messages ({messages.length})
          </button>
        </div>

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Messages</h3>
            {messages.map(msg => (
              <div key={msg.id} className="glass p-6 rounded-3xl flex justify-between items-start">
                <div>
                  <p className="font-bold">{msg.fullName}</p>
                  <p className="text-sm text-gray-400">{msg.email}</p>
                  <p className="font-bold mt-2">{msg.subject}</p>
                  <p className="text-gray-300 mt-1">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-4">{msg.createdAt?.toDate().toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setDeleteConfirmation({ type: 'message', id: msg.id, message: 'Are you sure you want to delete this message?' })}
                  className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Folders (Categories)</h3>
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-accent text-black font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <FolderPlus className="w-4 h-4" /> Add Folder
              </button>
            </div>

            {(isAddingCategory || editingCategory) && (
              <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="glass p-6 rounded-3xl flex flex-col gap-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{editingCategory ? 'Edit Folder Name' : 'Folder Name'}</label>
                    <input 
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g. Logo Design"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-accent"
                      required
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Cover Image</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleCatCoverFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={!catCover}
                      />
                      <div className="w-full bg-white/5 border border-white/10 border-dashed rounded-xl px-4 py-3 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm truncate">{catCover ? 'Image Selected' : 'Upload Cover'}</span>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={isUploading} className="px-6 py-3 bg-orange-accent text-black font-bold rounded-xl disabled:opacity-50">
                    {isUploading ? 'Uploading...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => { setIsAddingCategory(false); setEditingCategory(null); setCatCover(''); setCatName(''); }} className="px-6 py-3 glass rounded-xl">Cancel</button>
                </div>
                {catCover && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-white/10">
                    <img src={catCover} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </form>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="glass p-6 rounded-3xl flex justify-between items-center group relative overflow-hidden">
                  {cat.coverImage && (
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                      <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <p className="font-bold text-lg">{cat.name}</p>
                    <p className="text-xs text-gray-400 font-mono">/{cat.slug}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <button 
                      onClick={() => handleEditCategory(cat)}
                      className="p-3 text-gray-400 hover:text-orange-accent transition-colors bg-black/50 rounded-full"
                      title="Edit Folder"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-3 text-gray-400 hover:text-red-500 transition-colors bg-black/50 rounded-full"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Projects</h3>
              <button 
                onClick={() => setIsAddingProject(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-accent text-black font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
            </div>

            {(isAddingProject || editingProject) && (
              <form onSubmit={handleAddProject} className="glass p-5 md:p-6 rounded-3xl space-y-5 border-orange-accent/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-accent to-blue-accent"></div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-orange-accent/20 flex items-center justify-center text-orange-accent">
                    {editingProject ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <h4 className="text-xl font-black tracking-tight text-white">{editingProject ? 'Edit Project' : 'New Project'}</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Project Name <span className="text-orange-accent">*</span>
                    </label>
                    <input 
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      placeholder="e.g. Modern Brand Identity"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-accent focus:ring-1 focus:ring-orange-accent transition-all text-white placeholder:text-gray-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Folder <span className="text-orange-accent">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={projCatId}
                        onChange={(e) => setProjCatId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-accent focus:ring-1 focus:ring-orange-accent text-white appearance-none transition-all"
                        required
                      >
                        <option value="" className="bg-gray-900 text-gray-400">Select Folder</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-gray-900 text-white">{cat.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <ImageIcon className="w-3 h-3 text-orange-accent" /> Cover Image <span className="text-orange-accent">*</span>
                    </label>
                    
                    {!projCover ? (
                      <div className="relative group">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          required={!editingProject}
                        />
                        <div className="w-full border border-dashed border-white/20 rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 group-hover:border-orange-accent/50 group-hover:bg-orange-accent/5 transition-all">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-orange-accent group-hover:scale-110 transition-all">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-white">Click or drag image</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative inline-block group rounded-xl overflow-hidden border border-white/10">
                        <img src={projCover} alt="Cover Preview" className="h-24 w-auto object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setProjCover('')}
                            className="bg-red-500 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {isUploading && (
                  <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-2 text-white">
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-orange-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Optimizing & Uploading...
                      </span>
                      <span className="text-orange-accent">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-accent to-blue-accent h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-3 border-t border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Layout className="w-3 h-3 text-blue-accent" /> Canvas Editor (Compose your project)
                  </label>
                  <CanvasDesignEditor 
                    items={canvasItems} 
                    setItems={updateCanvasItems} 
                    onUploadImage={handleCanvasImageUpload} 
                    backgroundColor={canvasBgColor}
                    setBackgroundColor={setCanvasBgColor}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onSetCover={handleSetCover}
                    onClear={handleClearCanvas}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <FileText className="w-3 h-3 text-gray-400" /> Description
                  </label>
                  <textarea 
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Describe the project details..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-accent focus:ring-1 focus:ring-orange-accent h-24 text-white placeholder:text-gray-600 resize-none transition-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/10">
                  <button type="submit" disabled={isUploading} className="flex-1 py-3 bg-orange-accent text-black font-black text-sm rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-orange-accent/20">
                    <Send className="w-4 h-4" /> {editingProject ? 'Update Project' : 'Publish Project'}
                  </button>
                  <button type="button" onClick={resetProjectForm} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors border border-white/10">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <div key={proj.id} className="glass rounded-3xl overflow-hidden group">
                  <div className="aspect-video relative">
                    <img src={proj.coverImage} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button 
                        onClick={() => {
                          setEditingProject(proj);
                          setProjName(proj.name);
                          setProjCatId(proj.categoryId);
                          setProjCover(proj.coverImage);
                          setProjImages(proj.images || []);
                          setProjDesc(proj.description);
                          setCanvasItems(proj.canvasData || []);
                          setCanvasHistory([proj.canvasData || []]);
                          setHistoryStep(0);
                          setCanvasBgColor(proj.canvasBackgroundColor || '#1a1a1a');
                          setIsAddingProject(true);
                        }}
                        className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(proj.id)}
                        className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold">{proj.name}</p>
                    <p className="text-xs text-gray-500">{categories.find(c => c.id === proj.categoryId)?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Confirm Deletion</h3>
            <p className="text-gray-300 mb-8">{deleteConfirmation.message}</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Project Modal Component ---
const ProjectModal = ({ project, onClose }: { project: Project, onClose: () => void }) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [selectedCanvasIdx, setSelectedCanvasIdx] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Base width from editor is 800
        setScale(width / 800);
      }
    };
    
    // Initial calculation
    if (project.canvasData && project.canvasData.length > 0) {
      handleResize();
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [project.canvasData]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.images && selectedImageIdx !== null && selectedImageIdx < project.images.length - 1) {
      setSelectedImageIdx(selectedImageIdx + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.images && selectedImageIdx !== null && selectedImageIdx > 0) {
      setSelectedImageIdx(selectedImageIdx - 1);
    }
  };

  const handleCanvasNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.canvasData && selectedCanvasIdx !== null && selectedCanvasIdx < project.canvasData.length - 1) {
      setSelectedCanvasIdx(selectedCanvasIdx + 1);
    }
  };

  const handleCanvasPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.canvasData && selectedCanvasIdx !== null && selectedCanvasIdx > 0) {
      setSelectedCanvasIdx(selectedCanvasIdx - 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl"
    >
      <button 
        onClick={onClose}
        className="fixed top-8 right-8 w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all z-[110]"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="space-y-12">
          <div className="text-center space-y-4 pt-10">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{project.name}</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{project.description}</p>
          </div>

          <div className="space-y-8">
            {project.canvasData && project.canvasData.length > 0 && (
              <div 
                ref={containerRef} 
                className="w-full rounded-xl overflow-hidden relative transition-all duration-300"
                style={{ 
                  height: (project.canvasData.reduce((max, item) => {
                    const itemHeight = item.height * (item.scaleY || 1);
                    const itemBottom = item.y + itemHeight;
                    return Math.max(max, itemBottom);
                  }, 450)) * scale,
                  backgroundColor: 'transparent'
                }}
              >
                {project.canvasData.map((item, idx) => (
                  <img
                    key={item.id}
                    src={item.src}
                    alt=""
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCanvasIdx(idx);
                    }}
                    style={{
                      position: 'absolute',
                      left: item.x * scale,
                      top: item.y * scale,
                      width: item.width * (item.scaleX || 1) * scale,
                      height: item.height * (item.scaleY || 1) * scale,
                      transform: `rotate(${item.rotation || 0}deg)`,
                      transformOrigin: 'top left',
                      zIndex: 10
                    }}
                    className="cursor-zoom-in select-none drop-shadow-xl hover:scale-[1.02] transition-transform duration-300"
                  />
                ))}
              </div>
            )}

            {project.images && project.images.length > 0 ? (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {project.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-[2rem] overflow-hidden glass border-white/10 shadow-xl break-inside-avoid cursor-pointer group relative"
                    onClick={() => setSelectedImageIdx(idx)}
                  >
                    <img src={img} className="w-full h-auto group-hover:scale-105 transition-transform duration-500" alt={`${project.name} - ${idx + 1}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              (!project.canvasData || project.canvasData.length === 0) && (
                <div className="text-center text-gray-500 py-20">
                  No additional images available for this project.
                </div>
              )
            )}
          </div>

          <div className="flex justify-center pt-8">
            <button 
              onClick={onClose}
              className="px-10 py-4 bg-orange-accent text-black font-bold rounded-2xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" /> Back to Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Lightbox */}
      {selectedImageIdx !== null && project.images && (
        <div 
          className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedImageIdx(null)}
        >
          <button 
            onClick={() => setSelectedImageIdx(null)}
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-[150] text-white backdrop-blur-md border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-[90vw] h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedImageIdx > 0 && (
              <button 
                onClick={handlePrev}
                className="absolute left-0 md:-left-16 w-14 h-14 bg-black/50 hover:bg-orange-accent hover:text-black text-white rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 shadow-2xl relative">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-[160] bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomIn(); }} 
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Zoom In"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomOut(); }} 
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Zoom Out"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetTransform(); }} 
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Reset"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <img 
                        src={project.images[selectedImageIdx]} 
                        className="max-w-full max-h-full object-contain select-none shadow-2xl" 
                        alt={`${project.name} - Enlarge ${selectedImageIdx + 1}`} 
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
            
            {selectedImageIdx < project.images.length - 1 && (
              <button 
                onClick={handleNext}
                className="absolute right-0 md:-right-16 w-14 h-14 bg-black/50 hover:bg-orange-accent hover:text-black text-white rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-2 rounded-full text-white/90 text-sm font-mono tracking-widest backdrop-blur-md border border-white/10">
            {selectedImageIdx + 1} / {project.images.length}
          </div>
        </div>
      )}

      {/* Canvas Image Lightbox */}
      {selectedCanvasIdx !== null && project.canvasData && (
        <div 
          className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedCanvasIdx(null)}
        >
          <button 
            onClick={() => setSelectedCanvasIdx(null)}
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-[150] text-white backdrop-blur-md border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-[90vw] h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedCanvasIdx > 0 && (
              <button 
                onClick={handleCanvasPrev}
                className="absolute left-0 md:-left-16 w-14 h-14 bg-black/50 hover:bg-orange-accent hover:text-black text-white rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 shadow-2xl relative">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-[160] bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomIn(); }} 
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Zoom In"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomOut(); }} 
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Zoom Out"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetTransform(); }} 
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Reset"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <div
                        style={{
                          aspectRatio: `${project.canvasData[selectedCanvasIdx].width * (project.canvasData[selectedCanvasIdx].scaleX || 1)} / ${project.canvasData[selectedCanvasIdx].height * (project.canvasData[selectedCanvasIdx].scaleY || 1)}`,
                          maxWidth: '100%',
                          maxHeight: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <img 
                          src={project.canvasData[selectedCanvasIdx].src} 
                          style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                          className="select-none shadow-2xl" 
                          alt="Enlarged view" 
                        />
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
            
            {selectedCanvasIdx < project.canvasData.length - 1 && (
              <button 
                onClick={handleCanvasNext}
                className="absolute right-0 md:-right-16 w-14 h-14 bg-black/50 hover:bg-orange-accent hover:text-black text-white rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-2 rounded-full text-white/90 text-sm font-mono tracking-widest backdrop-blur-md border border-white/10">
            {selectedCanvasIdx + 1} / {project.canvasData.length}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <div className="hidden md:block">
      {/* Horizontal Line */}
      <motion.div
        className="fixed top-0 left-0 h-[1px] bg-orange-accent/40 pointer-events-none z-[9997]"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y,
          width: isHovering ? 0 : 40,
        }}
        transition={{ 
          x: { type: 'tween', duration: 0 },
          y: { type: 'tween', duration: 0 },
          width: { type: 'spring', damping: 30, stiffness: 300 }
        }}
      />
      {/* Vertical Line */}
      <motion.div
        className="fixed top-0 left-0 w-[1px] bg-orange-accent/40 pointer-events-none z-[9997]"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y - 20,
          height: isHovering ? 0 : 40,
        }}
        transition={{ 
          x: { type: 'tween', duration: 0 },
          y: { type: 'tween', duration: 0 },
          height: { type: 'spring', damping: 30, stiffness: 300 }
        }}
      />
      {/* Main Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-orange-accent rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isClicking ? 0.5 : isHovering ? 0 : 1,
        }}
        transition={{ 
          x: { type: 'tween', duration: 0 },
          y: { type: 'tween', duration: 0 },
          scale: { type: 'spring', damping: 30, stiffness: 300, mass: 0.1 }
        }}
      />
      {/* Expanding Ring on Hover */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 border-2 border-blue-accent rounded-full pointer-events-none z-[9998]"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
          opacity: isHovering ? 1 : 0,
          scale: isHovering ? 1.2 : 0,
        }}
        transition={{ 
          x: { type: 'tween', duration: 0 },
          y: { type: 'tween', duration: 0 },
          opacity: { duration: 0.2 },
          scale: { type: 'spring', damping: 20, stiffness: 150 }
        }}
      />
    </div>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for active section
    const observerOptions = {
      root: null,
      rootMargin: '-8% 0px -40% 0px', // Trigger when section is just below the navbar
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Only set active if it's one of our nav links
          const id = entry.target.id;
          if (['home', 'about', 'portfolio', 'services', 'contact'].includes(id)) {
            setActiveSection(id);
          } else if (id === 'skills') {
            // If in skills, maybe keep portfolio active or clear it? 
            // Usually skills is part of the "Portfolio" or "About" context in some designs.
            // Let's map skills to portfolio for better continuity if they are adjacent.
            setActiveSection('portfolio');
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ['home', 'about', 'portfolio', 'skills', 'services', 'contact'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: 'Home', id: 'home', href: '#home' },
    { name: 'About', id: 'about', href: '#about' },
    { name: 'Portfolio', id: 'portfolio', href: '#portfolio' },
    { name: 'Services', id: 'services', href: '#services' },
    { name: 'Contact', id: 'contact', href: '#contact' },
  ];

  const handleNavLinkClick = (id: string) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'py-4 bg-black/80 backdrop-blur-md border-b border-white/10' : 'py-8'}`}>
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-2 md:grid-cols-3 items-center">
        {/* Logo (Left) */}
        <a href="#home" onClick={() => handleNavLinkClick('home')} className="flex items-center gap-3 relative z-10 justify-self-start">
          <img src="https://i.ibb.co/F4Z6Pg99/behanch-cover-photo.png" alt="Wahab Graphic Logo" className="w-10 h-10 rounded-lg shadow-lg object-cover" />
          <span className="text-2xl font-display font-bold tracking-tighter">Wahab Graphic<span className="text-orange-accent">.</span></span>
        </a>

        {/* Desktop Nav - Pill Style (Center) */}
        <div className="hidden md:flex items-center justify-center gap-2 glass px-2 py-2 rounded-full relative justify-self-center">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              onClick={() => handleNavLinkClick(link.id)}
              className={`px-6 py-2 text-sm font-bold rounded-full transition-all tracking-wide relative z-10 ${activeSection === link.id ? 'text-black' : 'text-white hover:text-orange-accent'}`}
            >
              {activeSection === link.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-orange-accent rounded-full -z-10 shadow-[0_0_20px_rgba(255,106,0,0.3)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Menu Button (Right) */}
        <div className="hidden md:flex items-center justify-end justify-self-end gap-4">
          <button className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-orange-accent hover:text-black transition-all border-white/10">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Toggle (Right) */}
        <div className="flex justify-end justify-self-end md:hidden">
          <button 
            className="text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full glass md:hidden py-8 flex flex-col items-center gap-6"
          >
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => handleNavLinkClick(link.id)}
                className={`text-lg font-bold transition-all uppercase tracking-widest ${activeSection === link.id ? 'text-orange-accent' : 'text-white hover:text-orange-accent'}`}
              >
                {link.name}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setImgSize({
      width: rect.width,
      height: rect.height
    });
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-3/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700" />
      
      <div className="max-w-[1600px] mx-auto px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="order-2 lg:order-1"
        >
          <div className="mb-4 text-lg md:text-xl text-gray-400 italic font-light">
            Logo Design, Brand Identity & Social Media Graphics
          </div>
          <div className="mb-8 flex items-baseline">
            <span className="text-2xl font-medium text-white">Hi, I am </span>
            <span className="text-5xl md:text-6xl font-script font-semibold text-orange-accent ml-3">Abdul Wahab</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black leading-[0.9] mb-6 tracking-tighter uppercase">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block"
            >
              Graphic
            </motion.span> <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-orange-accent inline-block"
            >
              Designer
            </motion.span>
          </h1>
          
          <p className="text-gray-300 text-xl max-w-2xl mb-8 leading-relaxed font-medium">
            I create modern, clean, and impactful designs that help brands stand out and communicate their message clearly.
          </p>
          
          <div className="flex flex-wrap items-center gap-6 mb-8">
            <a 
              href="#portfolio" 
              className="px-8 py-4 bg-orange-accent text-black font-bold rounded-2xl hover:scale-105 transition-transform flex items-center gap-2 text-lg shadow-[0_0_30px_rgba(255,106,0,0.4)]"
            >
              View Portfolio <ChevronRight className="w-5 h-5" />
            </a>
            <a 
              href="#contact" 
              className="px-8 py-4 border-2 border-white/20 text-white font-bold rounded-2xl hover:bg-white/5 transition-all flex items-center gap-2 text-lg"
            >
              Contact Me <Send className="w-5 h-5" />
            </a>
          </div>

          {/* Horizontal Stats Card */}
          <div className="glass px-6 py-4 rounded-2xl border-white/10 shadow-xl flex flex-wrap items-center gap-6 z-30 w-fit">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-accent/20 rounded-xl flex items-center justify-center">
                <Palette className="w-5 h-5 text-orange-accent" />
              </div>
              <div>
                <p className="text-lg font-bold">120+</p>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Projects</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-accent/20 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-accent" />
              </div>
              <div>
                <p className="text-lg font-bold">50+</p>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-accent/20 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-accent" />
              </div>
              <div>
                <p className="text-lg font-bold">5 ★</p>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Reviews</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="order-1 lg:order-2 relative flex justify-center items-center h-[600px] w-full"
        >
          {/* Circular Trails - Now centered with the avatar */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] border border-orange-accent/10 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[550px] md:h-[550px] border border-orange-accent/5 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] border border-orange-accent/5 rounded-full pointer-events-none" />

          {/* Floating 3D Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Ai Icon */}
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-[15%] right-[10%] glass w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center z-20 border-orange-accent/30 shadow-[0_0_40px_rgba(255,106,0,0.2)]"
            >
              <div className="text-orange-accent font-black text-xl md:text-2xl">Ai</div>
            </motion.div>
            
            {/* Ps Icon */}
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute bottom-[15%] right-[15%] glass w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center z-20 border-blue-accent/30 shadow-[0_0_40px_rgba(0,163,255,0.2)]"
            >
              <div className="text-blue-accent font-black text-xl md:text-2xl">Ps</div>
            </motion.div>

            {/* Pen Tool */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-[40%] left-[5%] glass w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center z-20 border-white/20"
            >
              <PenTool className="text-orange-accent w-6 h-6 md:w-8 md:h-8" />
            </motion.div>
            
            {/* Palette */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1], x: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="absolute bottom-[30%] left-[10%] glass w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center z-20 border-white/20"
            >
              <Palette className="text-orange-accent w-6 h-6 md:w-8 md:h-8" />
            </motion.div>
          </div>

          <div className="relative z-10 w-full max-w-[320px] md:max-w-md">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ 
                opacity: 1, 
                y: [0, -15, 0],
              }}
              transition={{ 
                opacity: { duration: 1 },
                y: { 
                  repeat: Infinity, 
                  duration: 5, 
                  ease: "easeInOut" 
                }
              }}
              className="relative w-full cursor-none rounded-3xl overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img 
                src="https://i.imgur.com/NU9hpnH.png" 
                alt="Abdul Wahab" 
                className="w-full h-auto object-cover aspect-[4/5] rounded-3xl border-4 border-white/10 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              
              {isHovering && (
                <div
                  className="absolute border-4 border-white rounded-full pointer-events-none shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden bg-black"
                  style={{
                    width: '200px',
                    height: '200px',
                    left: mousePos.x - 100,
                    top: mousePos.y - 100,
                    backgroundImage: `url(https://i.imgur.com/Ohf27J0.png)`,
                    backgroundSize: `${imgSize.width * 1.25}px ${imgSize.height * 1.25}px`,
                    backgroundPosition: `${-mousePos.x * 1.25 + 100}px ${-mousePos.y * 1.25 + 100}px`,
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              )}
            </motion.div>
          </div>
        </motion.div>
        </div>
        
        {/* Horizontal Stats Card at Bottom Right - Removed from here */}
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="min-h-screen flex items-center py-16 scroll-mt-20">
      <div className="max-w-[1600px] mx-auto px-6 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              CRAFTING <span className="text-orange-accent italic">VISUAL</span> <span className="text-blue-accent">STORIES</span>
            </h2>
            <div className="space-y-4 text-gray-400 text-lg leading-relaxed">
              <p>
                Hello, I'm Wahab, a passionate graphic designer who focuses on creating clean, modern, and visually engaging designs. I specialize in logo design, brand identity, and social media graphics that help businesses build a strong visual presence. My goal is to help brands look professional and memorable through thoughtful and effective design.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {['Logo Design', 'Social Media Design', 'Branding', 'Poster Design'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-accent rounded-full" />
                    <span className="text-white text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="glass p-8 rounded-3xl text-center border-orange-accent/20 hover:border-orange-accent/50 transition-colors">
                <h3 className="text-4xl font-bold text-orange-accent mb-2">5+</h3>
                <p className="text-xs uppercase tracking-widest text-gray-400">Years Exp.</p>
              </div>
              <div className="glass p-8 rounded-3xl text-center border-blue-accent/20 hover:border-blue-accent/50 transition-colors">
                <h3 className="text-4xl font-bold text-blue-accent mb-2">150+</h3>
                <p className="text-xs uppercase tracking-widest text-gray-400">Projects</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="glass p-8 rounded-3xl text-center border-orange-accent/20 hover:border-orange-accent/50 transition-colors">
                <h3 className="text-4xl font-bold text-orange-accent mb-2">99%</h3>
                <p className="text-xs uppercase tracking-widest text-gray-400">Happy Clients</p>
              </div>
              <div className="glass p-8 rounded-3xl text-center border-blue-accent/20 hover:border-blue-accent/50 transition-colors">
                <h3 className="text-4xl font-bold text-blue-accent mb-2">24/7</h3>
                <p className="text-xs uppercase tracking-widest text-gray-400">Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Portfolio = ({ categories, projects }: { categories: Category[], projects: Project[] }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categoryProjects = selectedCategory 
    ? projects.filter(p => p.categoryId === selectedCategory.id)
    : [];

  return (
    <section id="portfolio" className="min-h-screen flex items-center py-16 scroll-mt-20 bg-black/30">
      <div className="max-w-[1600px] mx-auto px-6 w-full">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">MY <span className="text-orange-accent italic">PORTFOLIO</span></h2>
          <p className="text-gray-400 max-w-xl mx-auto">Here are some of my selected design works. Each project focuses on creating visually appealing and effective designs that help brands communicate better with their audience.</p>
        </div>

        {!selectedCategory ? (
          <motion.div 
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {categories.map((cat, idx) => {
              const catProjects = projects.filter(p => p.categoryId === cat.id);
              return (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="group relative w-full aspect-[4/3] cursor-pointer"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {/* Back of the Folder (Hidden until hover) */}
                  <div className="absolute inset-0 pt-8 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-full h-full bg-white/10 border border-white/10 rounded-3xl rounded-tl-none relative">
                      {/* Folder Tab */}
                      <div className="absolute -top-8 left-0 w-1/2 max-w-[160px] h-8 bg-white/10 border-t border-l border-r border-white/10 rounded-t-2xl"></div>
                    </div>
                  </div>

                  {/* Files (Projects) sliding out from the middle */}
                  <div className="absolute inset-0 z-10 flex justify-center pointer-events-none">
                    {catProjects.slice(0, 3).map((p, i) => (
                      <div
                        key={p.id}
                        className={`absolute bottom-6 w-[75%] aspect-video bg-white p-1.5 rounded-xl shadow-2xl transition-all duration-500 ease-out opacity-0 group-hover:opacity-100
                          translate-y-12
                          ${i === 0 ? 'group-hover:-translate-y-32 group-hover:-rotate-6' : 
                            i === 1 ? 'group-hover:-translate-y-28 group-hover:rotate-3' : 
                            'group-hover:-translate-y-24 group-hover:rotate-8'}
                        `}
                        style={{ zIndex: 10 + i }}
                      >
                        <img
                          src={p.coverImage}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Front of the Folder (Category Cover) */}
                  <div className="absolute inset-0 z-20 bg-white/5 rounded-3xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-500 group-hover:top-14 group-hover:border-t-white/20 group-hover:translate-y-2">
                    {cat.coverImage ? (
                      <>
                        <img 
                          src={cat.coverImage} 
                          alt={cat.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-black/90 flex flex-col items-center justify-center p-8">
                        <Folder className={`w-20 h-20 mb-4 ${
                          idx % 2 === 0 ? 'text-orange-accent' : 'text-blue-accent'
                        } group-hover:scale-110 transition-transform duration-500`} />
                        <h3 className="text-2xl font-bold text-center">{cat.name}</h3>
                      </div>
                    )}
                    
                    <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <h3 className="text-xl font-bold text-white drop-shadow-md text-center leading-tight">{cat.name}</h3>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Folders</span>
              </button>
              <h3 className="text-2xl font-bold text-white">{selectedCategory.name}</h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {categoryProjects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="group relative overflow-hidden rounded-3xl aspect-[4/3] glass cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <img 
                      src={project.coverImage} 
                      alt={project.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end">
                      <h3 className="text-lg font-bold text-white text-center drop-shadow-md">{project.name}</h3>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {categoryProjects.length === 0 && (
              <div className="text-center py-20 glass rounded-[3rem] mt-8">
                <p className="text-gray-500 italic">No projects found in this category.</p>
              </div>
            )}
          </motion.div>
        )}

        {categories.length === 0 && !selectedCategory && (
          <div className="text-center py-20 glass rounded-[3rem]">
            <p className="text-gray-500 italic">No categories found. Add some in the admin panel!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};

const Skills = () => {
  return (
    <section id="skills" className="min-h-screen flex items-center py-16 scroll-mt-20">
      <div className="max-w-[1600px] mx-auto px-6 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">DESIGN <span className="text-orange-accent italic">ARSENAL</span></h2>
            <p className="text-gray-400 text-lg mb-6 leading-relaxed">
              My technical proficiency allows me to deliver high-quality designs that are both aesthetically pleasing and strategically sound.
            </p>
            <div className="space-y-6">
                {SKILLS.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 glass rounded-lg text-${skill.color}`}>
                          {skill.icon}
                        </div>
                        <span className="font-bold tracking-tight">{skill.name}</span>
                      </div>
                      <span className={`text-${skill.color} font-mono text-sm`}>{skill.level}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full bg-${skill.color}`}
                        style={{ boxShadow: `0 0 15px var(--color-${skill.color})` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>

          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-orange-accent/5 rounded-full blur-[100px]" />
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="space-y-6">
                <div className="glass p-8 rounded-3xl aspect-square flex flex-col items-center justify-center gap-4 hover:border-orange-accent/50 transition-colors">
                  <PenTool className="w-12 h-12 text-orange-accent" />
                  <span className="font-bold text-center">Vector Art</span>
                </div>
                <div className="glass p-8 rounded-3xl aspect-square flex flex-col items-center justify-center gap-4 hover:border-orange-accent/50 transition-colors">
                  <Palette className="w-12 h-12 text-orange-accent" />
                  <span className="font-bold text-center">Retouching</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="glass p-8 rounded-3xl aspect-square flex flex-col items-center justify-center gap-4 hover:border-orange-accent/50 transition-colors">
                  <Layout className="w-12 h-12 text-orange-accent" />
                  <span className="font-bold text-center">UI Design</span>
                </div>
                <div className="glass p-8 rounded-3xl aspect-square flex flex-col items-center justify-center gap-4 hover:border-orange-accent/50 transition-colors">
                  <Award className="w-12 h-12 text-orange-accent" />
                  <span className="font-bold text-center">Branding</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Services = () => {
  return (
    <section id="services" className="min-h-screen flex items-center py-16 scroll-mt-20 bg-black/30">
      <div className="max-w-[1600px] mx-auto px-6 w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">SERVICES I <span className="text-orange-accent italic">OFFER</span></h2>
          <p className="text-gray-400 max-w-xl mx-auto">Specialized design services to help your business grow and shine.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {SERVICES.map((service, idx) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`glass p-6 rounded-3xl transition-all group hover:border-${service.color}/50`}
            >
              <div className={`mb-6 group-hover:scale-110 transition-transform duration-500 text-${service.color}`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{service.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      alert('Message sent successfully!');
      setFormData({ fullName: '', email: '', subject: '', message: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'messages');
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="min-h-screen flex items-center py-16 scroll-mt-20">
      <div className="max-w-[1600px] mx-auto px-6 w-full">
        <div className="glass rounded-[3rem] overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-10 lg:p-16 glass border-r border-white/10">
              <h2 className="text-5xl font-black mb-4 leading-tight uppercase tracking-tighter">
                Let's <span className="text-orange-accent">Work</span> <br />Together
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-md font-medium">
                If you're looking for creative and professional design work for your brand, feel free to get in touch. I would be happy to collaborate and help bring your ideas to life.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-orange-accent/10 rounded-2xl flex items-center justify-center border border-orange-accent/20">
                    <Send className="w-6 h-6 text-orange-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Email Me</p>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=aw6481299@gmail.com" target="_blank" rel="noopener noreferrer" className="text-xl font-bold hover:text-orange-accent transition-colors">aw6481299@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-accent/10 rounded-2xl flex items-center justify-center border border-blue-accent/20">
                    <MessageCircle className="w-6 h-6 text-blue-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Contact Me</p>
                    <a href="https://wa.me/8801973324750?text=Hello%20I%20want%20to%20discuss%20a%20design%20project%20with%20you" target="_blank" rel="noopener noreferrer" className="text-xl font-bold hover:text-blue-accent transition-colors">
                      +8801973324750
                      <span className="ml-2 text-[10px] bg-orange-accent/20 text-orange-accent px-1.5 py-0.5 rounded">Recommended</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Follow Me</p>
                <div className="flex gap-4">
                  {[
                    { icon: Facebook, color: 'orange', href: 'https://www.facebook.com/profile.php?id=61584994744719' },
                    { icon: Instagram, color: 'orange', href: 'https://www.instagram.com/_wahab__graphic_/' }
                  ].map((item, idx) => (
                    <a 
                      key={idx} 
                      href={item.href} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 glass rounded-xl flex items-center justify-center hover:scale-110 transition-transform border-white/5 ${item.color === 'orange' ? 'hover:text-orange-accent' : 'hover:text-blue-accent'}`}
                    >
                      <item.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-10 lg:p-16">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-orange-accent focus:ring-1 focus:ring-orange-accent/50 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-blue-accent focus:ring-1 focus:ring-blue-accent/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Subject</label>
                  <input 
                    type="text" 
                    placeholder="Project Inquiry" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-orange-accent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Message</label>
                  <textarea 
                    rows={4} 
                    placeholder="Tell me about your project..." 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-orange-accent transition-colors resize-none"
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-orange-accent text-black font-bold rounded-xl hover:bg-white transition-all orange-border-glow flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'} <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const adminEmail = "sayedart1999@gmail.com";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u?.email === adminEmail && u?.emailVerified);
    });

    const unsubscribeCats = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    });

    const unsubscribeProjs = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeCats();
      unsubscribeProjs();
    };
  }, []);

  useEffect(() => {
    let unsubscribeMsgs: (() => void) | undefined;

    if (isAdmin) {
      unsubscribeMsgs = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
      });
    } else {
      setMessages([]);
    }

    return () => {
      if (unsubscribeMsgs) unsubscribeMsgs();
    };
  }, [isAdmin]);

  return (
    <div className="relative">
      <CustomCursor />
      <GlassScene />
      <Navbar />
      <Hero />
      <About />
      <Portfolio categories={categories} projects={projects} />
      <Skills />
      <Services />
      <Contact />
      
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/F4Z6Pg99/behanch-cover-photo.png" alt="Wahab Graphic Logo" className="w-8 h-8 rounded-md opacity-80 object-cover" />
            <span className="text-xl font-display font-bold tracking-tighter">Wahab Graphic<span className="text-orange-accent">.</span></span>
          </div>
          
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Abdul Wahab. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {isAdmin ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowAdmin(true)}
                  className="text-xs uppercase tracking-widest text-orange-accent font-bold hover:underline"
                >
                  Admin Panel
                </button>
                <button 
                  onClick={logOut}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Admin Login
              </button>
            )}
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <a key={item} href="#" className="text-xs uppercase tracking-widest text-gray-500 hover:text-orange-accent transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showAdmin && isAdmin && (
          <AdminDashboard 
            categories={categories} 
            projects={projects} 
            messages={messages}
            onClose={() => setShowAdmin(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
