import React, { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { DndContext, closestCenter, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from 'motion/react';
import { ArrowRight, ArrowUp, Briefcase, Clock, CreditCard as Edit2, Eye, FolderOpen, Github, Instagram, Layers, Linkedin, Loader as Loader2, Mail, MapPin, Menu, MessageCircle, Monitor, Moon, Palette, PenTool, Phone, Plus, RotateCcw, Send, Settings, Smartphone, Sparkles, Star, Sun, Trash2, Twitter, Upload, User, X, Zap, Heart, Globe, Feather, MousePointer } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Project, Category, Stat, Skill, Service, CanvasItem } from './types';
import { uploadToCloudinary } from './lib/cloudinary';
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Transformer,
  Rect,
  Group,
  Line,
} from 'react-konva';
import useImage from 'use-image';

// ============================================
// ANIMATED BACKGROUND COMPONENTS
// ============================================

const FloatingOrb = ({ delay, duration, size, startX, startY, color }: {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
  color: string;
}) => {
  return (
    <motion.div
      initial={{
        x: startX,
        y: startY,
        scale: 0,
        opacity: 0
      }}
      animate={{
        x: [startX, startX + 100, startX - 50, startX + 50, startX],
        y: [startY, startY - 100, startY + 50, startY - 50, startY],
        scale: [1, 1.2, 0.9, 1.1, 1],
        opacity: [0.6, 0.8, 0.5, 0.7, 0.6],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}40 0%, ${color}10 50%, transparent 70%)`,
      }}
    />
  );
};

const Particle = ({ index }: { index: number }) => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  const randomDelay = Math.random() * 5;
  const randomDuration = 10 + Math.random() * 10;
  const randomSize = 2 + Math.random() * 4;

  return (
    <motion.div
      initial={{
        x: `${randomX}vw`,
        y: `${randomY}vh`,
        opacity: 0
      }}
      animate={{
        y: [`${randomY}vh`, `${randomY - 100}vh`],
        opacity: [0, 1, 0],
        scale: [0, 1, 0.5],
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute rounded-full bg-white/60 pointer-events-none"
      style={{
        width: randomSize,
        height: randomSize,
        left: `${randomX}%`,
      }}
    />
  );
};

const AnimatedSkyBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Sky */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 30%, #24243e 60%, #1a1a2e 100%)',
        }}
      />

      {/* Animated Aurora */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          opacity: [0.3, 0.5, 0.3, 0.4],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(124, 60, 237, 0.3) 0%, transparent 50%)',
        }}
      />

      {/* Floating Orbs */}
      <FloatingOrb delay={0} duration={15} size={400} startX={10} startY={20} color="#7c3ced" />
      <FloatingOrb delay={2} duration={18} size={300} startX={70} startY={40} color="#3b82f6" />
      <FloatingOrb delay={4} duration={20} size={350} startX={40} startY={60} color="#ec4899" />
      <FloatingOrb delay={6} duration={16} size={250} startX={80} startY={10} color="#06b6d4" />
      <FloatingOrb delay={8} duration={22} size={500} startX={-10} startY={70} color="#8b5cf6" />

      {/* Stars/Particles */}
      {Array.from({ length: 50 }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};

// ============================================
// CUSTOM CURSOR
// ============================================

const CustomCursor = () => {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button') || target.classList.contains('cursor-pointer')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => setIsHovering(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      <motion.div
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
      >
        <motion.div
          animate={{
            scale: isClicking ? 0.8 : isHovering ? 2 : 1,
            opacity: isHovering ? 0.8 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="relative -translate-x-1/2 -translate-y-1/2"
        >
          <div className={`w-4 h-4 rounded-full bg-white ${isHovering ? 'border-2 border-white' : ''}`} />
        </motion.div>
      </motion.div>

      {/* Trailing cursor */}
      <motion.div
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        transition={{ damping: 30, stiffness: 200 }}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
      >
        <motion.div
          animate={{
            scale: isHovering ? 3 : 1.5,
            opacity: isHovering ? 0.3 : 0.15,
          }}
          className="w-10 h-10 rounded-full bg-brand-primary -translate-x-1/2 -translate-y-1/2 blur-sm"
        />
      </motion.div>
    </>
  );
};

// ============================================
// BACKEND COMPONENTS (PRESERVED)
// ============================================

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
        onTransformEnd={() => {
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
  items, setItems, onUploadImage, backgroundColor, setBackgroundColor,
  canvasHeight, setCanvasHeight, onUndo, onRedo, onSetCover,
}: {
  items: CanvasItem[], setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>,
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void,
  backgroundColor: string, setBackgroundColor: (color: string) => void,
  canvasHeight: number, setCanvasHeight: (h: number) => void,
  onUndo: () => void, onRedo: () => void, onSetCover?: (dataUrl: string) => void,
}) => {
  const [selectedId, selectShape] = useState<string | null>(null);
  const stageRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: canvasHeight, scale: 1 });

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      setItems((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

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
        setStageSize({ width, height: canvasHeight * scale, scale });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasHeight]);

  const handleDeleteSelected = React.useCallback(() => {
    if (selectedId) {
      setItems(prevItems => prevItems.filter(item => item.id !== selectedId));
      selectShape(null);
    }
  }, [selectedId, setItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === 'Control' || e.key === 'Meta') keys.current.ctrl = true;
      if (e.code === 'Space') { keys.current.space = true; if (!isInput) e.preventDefault(); }
      if (keys.current.ctrl && keys.current.space) { setIsZoomMode(true); setIsPanMode(false); }
      else if (keys.current.space && !keys.current.ctrl) { setIsPanMode(true); setIsZoomMode(false); }
      if (isInput) return;
      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); handleDeleteSelected(); }
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setItems(prevItems => prevItems.map(item => {
          if (item.id === selectedId) {
            const step = e.shiftKey ? 10 : 1;
            return { ...item, x: e.key === 'ArrowLeft' ? item.x - step : e.key === 'ArrowRight' ? item.x + step : item.x, y: e.key === 'ArrowUp' ? item.y - step : e.key === 'ArrowDown' ? item.y + step : item.y };
          }
          return item;
        }));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? onRedo() : onUndo(); }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') keys.current.ctrl = false;
      if (e.code === 'Space') keys.current.space = false;
      if (keys.current.ctrl && keys.current.space) { setIsZoomMode(true); setIsPanMode(false); }
      else if (keys.current.space && !keys.current.ctrl) { setIsPanMode(true); setIsZoomMode(false); }
      else { setIsZoomMode(false); setIsPanMode(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [onUndo, onRedo, selectedId, setItems, handleDeleteSelected]);

  const handleMouseDown = (e: any) => {
    if (isZoomMode) {
      isZoomingRef.current = true;
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      zoomStartRef.current = { x: e.evt.clientX, zoom: zoom, pointerX: pos.x, pointerY: pos.y, stageX: stagePos.x, stageY: stagePos.y };
      return;
    }
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty) selectShape(null);
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    const newItems = [...items];
    if (direction === 'up' && index < newItems.length - 1) {[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];}
    else if (direction === 'down' && index > 0) {[newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];}
    setItems(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/10 gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-bold rounded-lg cursor-pointer hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" /> Add Images
            <input type="file" accept="image/*" multiple onChange={onUploadImage} className="hidden" />
          </label>
          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <label className="text-xs text-white/60 font-bold uppercase">Height:</label>
            <input type="number" value={canvasHeight} onChange={(e) => setCanvasHeight(Number(e.target.value))} className="w-16 bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-primary" min="450" step="50" />
          </div>
          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <label className="text-xs text-white/60 font-bold uppercase">Color:</label>
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onUndo} className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all text-white"><RotateCcw className="w-4 h-4" /></button>
          {selectedId && <button type="button" onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>}
          <button type="button" onClick={handleSetCover} className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs hover:scale-105 transition-all">Use as Cover</button>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex-1 rounded-xl overflow-y-auto overflow-x-hidden border border-white/10 relative bg-slate-900 h-[500px]">
        <div ref={containerRef} className="w-full min-h-full relative">
          <Stage width={stageSize.width} height={stageSize.height} scaleX={stageSize.scale * zoom} scaleY={stageSize.scale * zoom} x={stagePos.x} y={stagePos.y} draggable={isPanMode} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown} ref={stageRef} style={{ cursor: isZoomMode ? 'col-resize' : (isPanMode ? 'grab' : 'default') }}>
            <Layer>
              <Group clipX={0} clipY={0} clipWidth={800} clipHeight={canvasHeight}>
                <Rect x={0} y={0} width={800} height={canvasHeight} fill={backgroundColor} name="background" />
                {items.map((item, i) => (<URLImage key={item.id} item={item} isSelected={item.id === selectedId} onSelect={() => selectShape(item.id)} onChange={(newItem) => { const newItems = items.slice(); newItems[i] = newItem; setItems(newItems); }} readOnly={isZoomMode || isPanMode} />))}
              </Group>
              <Transformer ref={trRef} visible={!!selectedId && !isZoomMode && !isPanMode} boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5) ? oldBox : newBox} />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

const SortableLayerItem = ({ item, originalIndex, isSelected, onSelect, itemsLength }: { item: CanvasItem, originalIndex: number, isSelected: boolean, onSelect: () => void, itemsLength: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} onClick={onSelect} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-brand-primary/20 border border-brand-primary/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
      <div {...listeners} className="cursor-grab p-1 text-white/40">⋮⋮</div>
      <img src={item.src} alt="" className="w-10 h-10 object-cover rounded border border-white/10" />
      <span className="text-xs text-white/60 flex-1 truncate">Layer {itemsLength - originalIndex}</span>
    </div>
  );
};

const SortableCategoryItem = ({ cat, onEdit, onDelete, onBrowse }: { cat: Category, onEdit: (cat: Category) => void, onDelete: (id: string) => void, onBrowse: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="bg-slate-800 rounded-2xl overflow-hidden border border-white/10 group">
      <div className="aspect-video bg-slate-700 relative overflow-hidden">
        {cat.coverImage && <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={() => onBrowse(cat.id)} className="p-2 bg-white rounded-full hover:scale-110 transition-transform"><Eye className="w-4 h-4 text-slate-900" /></button>
          <button onClick={() => onEdit(cat)} className="p-2 bg-brand-primary rounded-full hover:scale-110 transition-transform"><Edit2 className="w-4 h-4 text-white" /></button>
          <button onClick={() => onDelete(cat.id)} className="p-2 bg-red-500 rounded-full hover:scale-110 transition-transform"><Trash2 className="w-4 h-4 text-white" /></button>
        </div>
      </div>
      <div className="p-4" {...listeners}><h4 className="font-bold text-white">{cat.name}</h4></div>
    </div>
  );
};

// ============================================
// ADMIN DASHBOARD
// ============================================

const AdminDashboard = ({ categories, projects, messages, onClose, setCategories, setProjects }: {
  categories: Category[], projects: Project[], messages: any[], onClose: () => void,
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>, setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
}) => {
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));
  const [activeTab, setActiveTab] = useState<'categories' | 'messages'>('categories');
  const [browsingFolderId, setBrowsingFolderId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'project' | 'category' | 'message', id: string, message: string } | null>(null);
  const [catName, setCatName] = useState('');
  const [catCover, setCatCover] = useState('');
  const [projName, setProjName] = useState('');
  const [projCatId, setProjCatId] = useState('');
  const [projCover, setProjCover] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStatus, setProjStatus] = useState<'draft' | 'published'>('published');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [canvasHeight, setCanvasHeight] = useState(450);
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [isSaving, setIsSaving] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<CanvasItem[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const updateCanvasItems = (newItems: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) => {
    const resolvedItems = typeof newItems === 'function' ? newItems(canvasItems) : newItems;
    setCanvasItems(resolvedItems);
    const newHistory = canvasHistory.slice(0, historyStep + 1);
    newHistory.push(resolvedItems);
    setCanvasHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => { if (historyStep > 0) { setHistoryStep(historyStep - 1); setCanvasItems(canvasHistory[historyStep - 1]); } };
  const handleRedo = () => { if (historyStep < canvasHistory.length - 1) { setHistoryStep(historyStep + 1); setCanvasItems(canvasHistory[historyStep + 1]); } };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(','); const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setProjCover(URL.createObjectURL(e.target.files[0])); };
  const handleCatCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setCatCover(URL.createObjectURL(e.target.files[0])); };

  const handleSetCover = (dataUrl: string) => {
    setProjCover(dataUrl);
    if (dataUrl.startsWith('data:')) {
      try { uploadToCloudinary(new File([dataUrlToBlob(dataUrl)], "canvas_cover.jpg", { type: "image/jpeg" })).then(url => setProjCover(url)); }
      catch (err) { console.error("Failed to upload canvas cover:", err); }
    }
  };

  const handleCanvasImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file, index) => {
        const localUrl = URL.createObjectURL(file);
        const img = new Image(); img.src = localUrl;
        img.onload = () => {
          updateCanvasItems(prev => [...prev, {
            id: `img-${Date.now()}-${index}`, type: 'image', src: localUrl,
            x: (800 - img.naturalWidth) / 2 + (index * 20), y: (450 - img.naturalHeight) / 2 + (index * 20),
            width: img.naturalWidth, height: img.naturalHeight, rotation: 0, scaleX: 1, scaleY: 1
          }]);
        };
      });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      let finalCatCover = catCover;
      if (catCover.startsWith('blob:') || catCover.startsWith('data:')) finalCatCover = await uploadToCloudinary(catCover);
      const { data, error } = await supabase.from('categories').insert([{ name: catName, slug: catName.toLowerCase().replace(/\s+/g, '-'), order: categories.length, cover_image: finalCatCover }]).select();
      if (error) throw error;
      if (data) setCategories([...categories, { ...data[0], coverImage: data[0].cover_image }]);
      setCatName(''); setCatCover(''); setIsAddingCategory(false);
    } catch (err: any) { console.error("Error adding category:", err); }
    finally { setIsSaving(false); }
  };

  const handleEditCategory = (cat: Category) => { setEditingCategory(cat); setCatName(cat.name); setCatCover(cat.coverImage || ''); setIsAddingCategory(false); };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingCategory) return; setIsSaving(true);
    try {
      let finalCatCover = catCover;
      if (catCover.startsWith('blob:') || catCover.startsWith('data:')) finalCatCover = await uploadToCloudinary(catCover);
      const { data, error } = await supabase.from('categories').update({ name: catName, slug: catName.toLowerCase().replace(/\s+/g, '-'), cover_image: finalCatCover }).eq('id', editingCategory.id).select();
      if (error) throw error;
      if (data) setCategories(categories.map(c => c.id === editingCategory.id ? { ...data[0], coverImage: data[0].cover_image } : c));
      setCatName(''); setCatCover(''); setEditingCategory(null);
    } catch (err: any) { console.error("Error updating category:", err); }
    finally { setIsSaving(false); }
  };

  const handleDeleteCategory = (id: string) => setDeleteConfirmation({ type: 'category', id, message: 'Delete this category?' });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      let finalCover = projCover;
      if (projCover.startsWith('blob:') || projCover.startsWith('data:')) finalCover = await uploadToCloudinary(projCover);
      const finalCanvasItems = await Promise.all(canvasItems.map(async (item) => {
        if (item.src.startsWith('blob:') || item.src.startsWith('data:')) return { ...item, src: await uploadToCloudinary(item.src) };
        return item;
      }));
      const selectedCategory = categories.find(c => c.id === projCatId);
      const projectData = { title: projName.trim() || 'Untitled', name: projName.trim() || 'Untitled', category_id: projCatId, category: selectedCategory?.name || 'General', cover_image: finalCover, images: [], description: projDesc, status: projStatus, canvas_data: finalCanvasItems, canvas_background_color: canvasBgColor, canvas_height: canvasHeight, created_at: editingProject?.createdAt || new Date().toISOString() };
      if (editingProject) {
        const { data, error } = await supabase.from('portfolio_projects').update(projectData).eq('id', editingProject.id).select();
        if (error) throw error;
        if (data) setProjects(projects.map(p => p.id === editingProject.id ? { ...data[0], coverImage: data[0].cover_image, categoryId: data[0].category_id, createdAt: data[0].created_at, canvasData: data[0].canvas_data, canvasBackgroundColor: data[0].canvas_background_color, canvasHeight: data[0].canvas_height } : p));
        resetProjectForm();
      } else {
        const { data, error } = await supabase.from('portfolio_projects').insert([projectData]).select();
        if (error) throw error;
        if (data) setProjects([...projects, { ...data[0], coverImage: data[0].cover_image, categoryId: data[0].category_id, createdAt: data[0].created_at, canvasData: data[0].canvas_data, canvasBackgroundColor: data[0].canvas_background_color, canvasHeight: data[0].canvas_height }]);
        resetProjectForm();
      }
    } catch (err: any) { console.error("Error saving project:", err); }
    finally { setIsSaving(false); }
  };

  const resetProjectForm = () => {
    setProjName(''); setProjCatId(''); setProjCover(''); setProjDesc(''); setProjStatus('published');
    setCanvasItems([]); setCanvasHeight(450); setCanvasHistory([[]]); setHistoryStep(0); setCanvasBgColor('#ffffff');
    setEditingProject(null); setIsAddingProject(false);
  };

  const handleDeleteProject = (id: string) => setDeleteConfirmation({ type: 'project', id, message: 'Delete this project?' });

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { type, id } = deleteConfirmation;
    try {
      let table = type === 'category' ? 'categories' : type === 'project' ? 'portfolio_projects' : 'messages';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (type === 'category') setCategories(categories.filter(c => c.id !== id));
      else if (type === 'project') setProjects(projects.filter(p => p.id !== id));
    } catch (err) { console.error("Error deleting item:", err); }
    finally { setDeleteConfirmation(null); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl overflow-y-auto p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black">Admin <span className="text-brand-primary">Dashboard</span></h2>
          <button onClick={onClose} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex gap-4 mb-8">
          <button onClick={() => { setActiveTab('categories'); setBrowsingFolderId(null); }} className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-brand-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Folders</button>
          <button onClick={() => { setActiveTab('messages'); setBrowsingFolderId(null); }} className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-brand-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>Messages ({messages.length})</button>
        </div>
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="bg-slate-800 p-6 rounded-2xl border border-white/10 flex justify-between items-start">
                <div>
                  <p className="font-bold">{msg.fullName}</p>
                  <p className="text-sm text-white/60">{msg.email}</p>
                  <p className="font-medium mt-2">{msg.subject}</p>
                  <p className="text-white/70 mt-1">{msg.message}</p>
                </div>
                <button onClick={() => setDeleteConfirmation({ type: 'message', id: msg.id, message: 'Delete?' })} className="p-2 hover:bg-red-500/20 rounded-full text-red-400"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'categories' && !browsingFolderId && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Folders</h3>
              <button onClick={() => setIsAddingCategory(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:scale-105"><Plus className="w-5 h-5" /> Add</button>
            </div>
            {(isAddingCategory || editingCategory) && (
              <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="bg-slate-800 p-6 rounded-2xl border border-white/10 space-y-4">
                <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Folder name" className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-3 text-white" required />
                <div className="relative"><input type="file" accept="image/*" onChange={handleCatCoverFileChange} className="absolute inset-0 opacity-0 cursor-pointer" /><div className="bg-slate-700 border border-white/10 rounded-xl px-4 py-3 text-center text-white/60"><Upload className="w-4 h-4 inline mr-2" />Upload Cover</div></div>
                <div className="flex gap-2"><button type="submit" disabled={isSaving} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-xl">{isSaving ? 'Saving...' : 'Save'}</button><button type="button" onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }} className="px-6 py-3 bg-white/10 rounded-xl">Cancel</button></div>
              </form>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter}>
              <SortableContext items={categories.map(c => c.id)} strategy={rectSortingStrategy}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{categories.map(cat => (<SortableCategoryItem key={cat.id} cat={cat} onEdit={handleEditCategory} onDelete={handleDeleteCategory} onBrowse={(id) => setBrowsingFolderId(id)} />))}</div>
              </SortableContext>
            </DndContext>
          </div>
        )}
        {activeTab === 'categories' && browsingFolderId && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button onClick={() => setBrowsingFolderId(null)} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20"><ArrowRight className="w-4 h-4 rotate-180" /> Back</button>
              <h3 className="text-xl font-bold">{categories.find(c => c.id === browsingFolderId)?.name}</h3>
              <button onClick={() => { setProjCatId(browsingFolderId); setIsAddingProject(true); resetProjectForm(); }} className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl"><Plus className="w-5 h-5" /> New</button>
            </div>
            {isAddingProject && (
              <form onSubmit={handleAddProject} className="bg-slate-800 p-6 rounded-2xl border border-white/10 space-y-4">
                <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Project name" className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-3 text-white" required />
                <div className="relative"><input type="file" accept="image/*" onChange={handleCoverFileChange} className="absolute inset-0 opacity-0 cursor-pointer" /><div className="bg-slate-700 border border-white/10 rounded-xl px-4 py-3 text-center text-white/60"><Upload className="w-4 h-4 inline mr-2" />Upload Cover</div></div>
                <textarea value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Description" className="w-full bg-slate-700 border border-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none" />
                <CanvasDesignEditor items={canvasItems} setItems={updateCanvasItems} onUploadImage={handleCanvasImageUpload} backgroundColor={canvasBgColor} setBackgroundColor={setCanvasBgColor} canvasHeight={canvasHeight} setCanvasHeight={setCanvasHeight} onUndo={handleUndo} onRedo={handleRedo} onSetCover={handleSetCover} />
                <div className="flex gap-2"><button type="submit" disabled={isSaving} className="px-8 py-3 bg-brand-primary text-white font-bold rounded-xl">{isSaving ? 'Saving...' : 'Save'}</button><button type="button" onClick={resetProjectForm} className="px-6 py-3 bg-white/10 rounded-xl">Cancel</button></div>
              </form>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.filter(p => p.categoryId === browsingFolderId).map(proj => (
                <div key={proj.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-white/10 group relative">
                  <div className="aspect-video relative overflow-hidden">
                    <img src={proj.coverImage} alt={proj.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => { setEditingProject(proj); setProjName(proj.name); setProjCatId(proj.categoryId || ''); setProjCover(proj.coverImage); setProjDesc(proj.description || ''); setProjStatus(proj.status); setCanvasItems(proj.canvasData || []); setCanvasHeight(proj.canvasHeight || 450); setCanvasBgColor(proj.canvasBackgroundColor || '#ffffff'); setIsAddingProject(true); }} className="p-2 bg-brand-primary rounded-full"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProject(proj.id)} className="p-2 bg-red-500 rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="p-4"><h4 className="font-bold text-sm">{proj.name}</h4></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-6 rounded-2xl max-w-md w-full">
              <p className="mb-6">{deleteConfirmation.message}</p>
              <div className="flex justify-end gap-4"><button onClick={() => setDeleteConfirmation(null)} className="px-6 py-2 bg-white/10 rounded-xl">Cancel</button><button onClick={confirmDelete} className="px-6 py-2 bg-red-500 rounded-xl">Delete</button></div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// ANIMATED TEXT COMPONENT
// ============================================

const AnimatedText = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mr-[0.25em]"
          style={{ transformOrigin: "bottom" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// ============================================
// PORTFOLIO SECTION
// ============================================

const PortfolioSection = ({ categories, projects, onProjectClick }: { categories: Category[]; projects: Project[]; onProjectClick: (project: Project) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={containerRef} id="portfolio" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="text-center mb-16">
          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-brand-primary text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" /> Selected Works
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
            <AnimatedText text="My Portfolio" />
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            A curated collection of creative works that showcase design excellence
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.slice(0, 6).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 100, rotateY: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onProjectClick(project)}
              className="group cursor-pointer"
              style={{ perspective: 1000 }}
            >
              <motion.div whileHover={{ y: -10, rotateX: 5, rotateY: -5 }} transition={{ duration: 0.4 }} className="relative">
                <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-slate-800/50 backdrop-blur-sm">
                  <motion.img
                    src={project.coverImage}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Content overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute bottom-0 left-0 right-0 p-6"
                >
                  <span className="text-brand-primary text-xs font-bold uppercase tracking-widest mb-2 block">
                    {categories.find(c => c.id === project.categoryId)?.name || 'Project'}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                  <motion.div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                    View Project <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>

                {/* Glow effect on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute -inset-2 bg-brand-primary/20 rounded-[2rem] blur-xl -z-10"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// SERVICES SECTION
// ============================================

const ServicesSection = () => {
  const services = [
    { icon: <PenTool className="w-7 h-7" />, title: 'Logo Design', description: 'Unique brand identities that stand out' },
    { icon: <Palette className="w-7 h-7" />, title: 'Brand Identity', description: 'Complete visual systems for your brand' },
    { icon: <Smartphone className="w-7 h-7" />, title: 'Social Media', description: 'Engaging content for all platforms' },
    { icon: <Monitor className="w-7 h-7" />, title: 'Print Design', description: 'Professional marketing materials' },
    { icon: <Briefcase className="w-7 h-7" />, title: 'Packaging', description: 'Creative packaging solutions' },
    { icon: <Globe className="w-7 h-7" />, title: 'UI/UX Design', description: 'User-centered digital experiences' },
  ];

  return (
    <section id="services" className="py-32 px-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <FloatingOrb delay={0} duration={25} size={600} startX={-20} startY={30} color="#7c3ced" />
      <FloatingOrb delay={5} duration={30} size={500} startX={70} startY={60} color="#3b82f6" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="text-center mb-16">
          <span className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-brand-primary text-sm font-semibold mb-6">
            <Feather className="w-4 h-4" /> What I Do
          </span>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
            <AnimatedText text="Services" />
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
              whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group"
            >
              <div className="relative p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-brand-primary/30 transition-all duration-500 h-full">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-brand-primary/50 rounded-tl-3xl transition-all group-hover:w-full group-hover:h-full group-hover:opacity-0" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-brand-primary/50 rounded-br-3xl transition-all group-hover:w-full group-hover:h-full group-hover:opacity-0" />

                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 rounded-2xl flex items-center justify-center mb-6"
                >
                  {React.cloneElement(service.icon, { className: 'text-brand-primary' })}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-white/60">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// CONTACT SECTION
// ============================================

const ContactSection = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('messages').insert([{
        full_name: formData.name, email: formData.email, subject: formData.subject, message: formData.message, created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) { console.error('Error:', err); }
    finally { setIsSubmitting(false); }
  };

  return (
    <section id="contact" className="py-32 px-6 relative overflow-hidden">
      <FloatingOrb delay={3} duration={20} size={400} startX={10} startY={50} color="#ec4899" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-brand-primary text-sm font-semibold mb-6">
              <MessageCircle className="w-4 h-4" /> Get in Touch
            </span>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              Let's <span className="text-brand-primary">Create</span><br />Together
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-lg">
              Have a creative project in mind? Let's bring your vision to life. I'm always excited to work on new challenges.
            </p>

            <div className="space-y-6">
              <motion.a href="mailto:sayedart1999@gmail.com" whileHover={{ x: 10 }} className="flex items-center gap-4 text-white/80 hover:text-brand-primary transition-colors">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10"><Mail className="w-5 h-5 text-brand-primary" /></div>
                sayedart1999@gmail.com
              </motion.a>
              <motion.a href="tel:+8801973324750" whileHover={{ x: 10 }} className="flex items-center gap-4 text-white/80 hover:text-brand-primary transition-colors">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10"><Phone className="w-5 h-5 text-brand-primary" /></div>
                +880 1973 324750
              </motion.a>
            </div>

            <div className="flex gap-4 mt-8">
              {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                <motion.a key={i} href="#" whileHover={{ y: -5, scale: 1.1 }} whileTap={{ scale: 0.95 }} className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white/60 hover:text-brand-primary hover:border-brand-primary/30 transition-colors">
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            {isSubmitted ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/5 rounded-3xl border border-white/10 p-8 text-center">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-green-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-white/60">Thank you for reaching out. I'll get back to you soon.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Your Name</label>
                    <motion.input whileFocus={{ scale: 1.02 }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-primary/50 transition-all" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Your Email</label>
                    <motion.input whileFocus={{ scale: 1.02 }} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-primary/50 transition-all" placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Subject</label>
                  <motion.input whileFocus={{ scale: 1.02 }} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-primary/50 transition-all" placeholder="Project Inquiry" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Your Message</label>
                  <motion.textarea whileFocus={{ scale: 1.02 }} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={5} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand-primary/50 transition-all resize-none" placeholder="Tell me about your project..." />
                </div>
                <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-gradient-to-r from-brand-primary to-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden group">
                  <span className="relative z-10">{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  <Send className="w-5 h-5 relative z-10" />
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-brand-primary" initial={{ x: "100%" }} whileHover={{ x: 0 }} transition={{ duration: 0.4 }} />
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// HERO SECTION
// ============================================

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <section ref={containerRef} className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <motion.div style={{ y, opacity, scale }} className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Status badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Available for freelance work</span>
            </motion.div>
          </motion.div>

          {/* Main heading */}
          <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="text-6xl md:text-8xl lg:text-[10rem] font-black text-white leading-[0.9] tracking-tight mb-8">
            <motion.span className="inline-block" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>Creative</motion.span>
            <br />
            <motion.span className="inline-block bg-gradient-to-r from-brand-primary via-purple-400 to-blue-400 bg-clip-text text-transparent" animate={{ backgroundPosition: ["0%", "100%", "0%"] }} transition={{ duration: 5, repeat: Infinity }} style={{ backgroundSize: "200%" }}>Designer</motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="text-white/60 text-lg md:text-xl max-w-2xl text-center mb-12">
            Transforming ideas into visual masterpieces. I craft memorable brand identities, stunning graphics, and immersive digital experiences.
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }} className="flex flex-col sm:flex-row gap-4">
            <motion.a href="#portfolio" whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(124,60,237,0.3)" }} whileTap={{ scale: 0.95 }} className="group px-8 py-4 bg-gradient-to-r from-brand-primary to-purple-600 text-white font-bold rounded-full flex items-center gap-3 relative overflow-hidden">
              <span className="relative z-10">View My Work</span>
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ArrowRight className="w-5 h-5 relative z-10" /></motion.span>
              <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-brand-primary" initial={{ x: "100%" }} whileHover={{ x: 0 }} transition={{ duration: 0.4 }} />
            </motion.a>
            <motion.a href="#contact" whileHover={{ scale: 1.05, borderColor: "rgba(124,60,237,0.5)" }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-white/5 border border-white/20 text-white font-bold rounded-full flex items-center gap-3 backdrop-blur-sm hover:bg-white/10 transition-colors">
              Get in Touch
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }} className="mt-24 grid grid-cols-3 gap-8 md:gap-16">
            {[
              { value: "5+", label: "Years Experience" },
              { value: "150+", label: "Projects Completed" },
              { value: "99%", label: "Happy Clients" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 + i * 0.1 }} className="text-center">
                <motion.p className="text-4xl md:text-5xl font-black text-white mb-1" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>{stat.value}</motion.p>
                <p className="text-white/40 text-xs md:text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
              <motion.div animate={{ opacity: [1, 0, 1], y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-2 bg-white/40 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

// ============================================
// ABOUT SECTION
// ============================================

const AboutSection = () => {
  return (
    <section id="about" className="py-32 px-6 relative overflow-hidden">
      <FloatingOrb delay={2} duration={22} size={450} startX={60} startY={20} color="#06b6d4" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -100, rotateY: 30 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="relative">
            <div className="aspect-[3/4] relative">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} className="w-full h-full rounded-3xl overflow-hidden border border-white/10">
                <img src="https://i.imgur.com/NU9hpnH.png" alt="Abdul Wahab" className="w-full h-full object-cover" />
              </motion.div>
              {/* Floating badge */}
              <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-6 -right-6 bg-gradient-to-br from-brand-primary to-purple-600 p-6 rounded-2xl shadow-2xl">
                <p className="text-3xl font-black text-white">5+</p>
                <p className="text-xs text-white/80">Years Exp.</p>
              </motion.div>
              {/* Decorative elements */}
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-4 -left-4 w-24 h-24 border border-brand-primary/30 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-2 -left-2 w-20 h-20 border border-white/10 rounded-full" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}>
            <span className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-brand-primary text-sm font-semibold mb-6">
              <User className="w-4 h-4" /> About Me
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Turning Visions Into <span className="bg-gradient-to-r from-brand-primary to-blue-400 bg-clip-text text-transparent">Visual Reality</span>
            </h2>
            <p className="text-white/70 text-lg mb-6 leading-relaxed">
              I'm Abdul Wahab, a passionate graphic designer from Bangladesh. With over 5 years of experience, I've helped 150+ businesses create memorable visual identities.
            </p>
            <p className="text-white/50 mb-10 leading-relaxed">
              My approach combines strategic thinking with creative execution, ensuring every design not only looks stunning but also achieves your business goals.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: <PenTool className="w-6 h-6" />, title: "Logo Design", desc: "Brand identities" },
                { icon: <Palette className="w-6 h-6" />, title: "Branding", desc: "Visual systems" },
                { icon: <Monitor className="w-6 h-6" />, title: "Digital", desc: "Web & social" },
                { icon: <Briefcase className="w-6 h-6" />, title: "Print", desc: "Marketing materials" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }} whileHover={{ x: 5, scale: 1.02 }} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-brand-primary/20 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// NAVIGATION
// ============================================

const Navigation = ({ isAdmin, onAdminClick, isDarkMode, onToggleTheme }: { isAdmin: boolean; onAdminClick: () => void; isDarkMode: boolean; onToggleTheme: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [{ name: 'Portfolio', href: '#portfolio' }, { name: 'About', href: '#about' }, { name: 'Services', href: '#services' }, { name: 'Contact', href: '#contact' }];

  return (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100 }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <motion.a href="#" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-3xl font-black text-white relative group">
            <span>W</span>
            <span className="text-brand-primary">.</span>
            <motion.div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full transition-all duration-300" />
          </motion.a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <motion.a key={link.name} href={link.href} whileHover={{ y: -2 }} className="text-white/60 hover:text-white transition-colors text-sm font-medium relative group">
                {link.name}
                <motion.div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary group-hover:w-full" />
              </motion.a>
            ))}
            <div className="w-px h-5 bg-white/20" />
            <motion.button onClick={onToggleTheme} whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }} className="p-2 text-white/60 hover:text-white transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            {isAdmin && (
              <motion.button onClick={onAdminClick} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-white/60 hover:text-brand-primary transition-colors">
                <Settings className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-white">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-slate-900 border-t border-white/5 pb-6">
              <div className="flex flex-col gap-4 pt-4">
                {navLinks.map((link) => (
                  <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-white text-base font-medium">{link.name}</a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// ============================================
// PROJECT MODAL
// ============================================

const ProjectModal = ({ project, onClose }: { project: Project; onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => { if (containerRef.current) setScale(containerRef.current.offsetWidth / 800); };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl overflow-y-auto p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white">{project.name}</h2>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 border border-white/10"><X className="w-6 h-6 text-white" /></motion.button>
        </div>

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="aspect-video rounded-2xl overflow-hidden mb-8 border border-white/10">
          <img src={project.coverImage} alt={project.name} className="w-full h-full object-cover" />
        </motion.div>

        {project.canvasData && project.canvasData.length > 0 && (
          <div ref={containerRef} className="relative rounded-2xl overflow-hidden mb-8 border border-white/10" style={{ height: (project.canvasData.reduce((max, item) => Math.max(max, item.y + item.height * (item.scaleY || 1)), project.canvasHeight || 450)) * scale, backgroundColor: project.canvasBackgroundColor || '#ffffff' }}>
            {project.canvasData.map((item) => (
              <img key={item.id} src={item.src} alt="" style={{ position: 'absolute', left: item.x * scale, top: item.y * scale, width: item.width * (item.scaleX || 1) * scale, height: item.height * (item.scaleY || 1) * scale, transform: `rotate(${item.rotation || 0}deg)`, transformOrigin: 'top left' }} />
            ))}
          </div>
        )}

        {project.description && <p className="text-white/60 leading-relaxed mb-8">{project.description}</p>}

        <motion.button onClick={onClose} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-colors">Close</motion.button>
      </div>
    </motion.div>
  );
};

// ============================================
// FOOTER
// ============================================

const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-white/5 bg-slate-950/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center md:text-left">
            <a href="#" className="text-4xl font-black text-white hover:text-brand-primary transition-colors">W<span className="text-brand-primary">.</span></a>
            <p className="text-white/40 mt-2 text-sm">Creating impactful designs since 2019</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex items-center gap-6">
            {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
              <motion.a key={i} href="#" whileHover={{ y: -5, scale: 1.1 }} className="text-white/40 hover:text-brand-primary transition-colors"><Icon className="w-5 h-5" /></motion.a>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} Wahab Graphic. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-white/40 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">Terms</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

// ============================================
// PRELOADER
// ============================================

const Preloader = () => {
  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full mx-auto mb-6" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/60 text-sm">Loading creative portfolio...</motion.p>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleToggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    if (showAdmin || selectedProject) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showAdmin, selectedProject]);

  const adminEmail = "sayedart1999@gmail.com";

  useEffect(() => {
    const initializeApp = async () => {
      const start = Date.now();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        const isUserAdmin = u?.email === adminEmail;
        setUser(u);
        setIsAdmin(isUserAdmin);

        const [catsRes, projsRes] = await Promise.all([
          supabase.from('categories').select('*').order('order', { ascending: true }),
          isUserAdmin ? supabase.from('portfolio_projects').select('*').order('created_at', { ascending: false }) : supabase.from('portfolio_projects').select('*').eq('status', 'published').order('created_at', { ascending: false })
        ]);

        if (catsRes.data) setCategories(catsRes.data.map(c => ({ ...c, coverImage: c.cover_image })));
        if (projsRes.data) setProjects(projsRes.data.map(p => ({ ...p, coverImage: p.cover_image, categoryId: p.category_id, canvasData: p.canvas_data, canvasBackgroundColor: p.canvas_background_color, canvasHeight: p.canvas_height, createdAt: p.created_at })));

        if (isUserAdmin) {
          const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
          if (msgData) setMessages(msgData);
        }
      } catch (err) { console.error("Init error:", err); }
      finally {
        const elapsed = Date.now() - start;
        if (elapsed < 1000) await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
        setIsInitialLoading(false);
      }
    };

    initializeApp();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.email === adminEmail);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatePresence mode="wait">{isInitialLoading && <Preloader key="preloader" />}</AnimatePresence>

      {!isInitialLoading && (
        <>
          <AnimatedSkyBackground />
          <CustomCursor />
          <Navigation isAdmin={isAdmin} onAdminClick={() => setShowAdmin(true)} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} />
          <HeroSection />
          <AboutSection />
          <PortfolioSection categories={categories} projects={projects} onProjectClick={(project) => setSelectedProject(project)} />
          <ServicesSection />
          <ContactSection />
          <Footer />

          <AnimatePresence>{showAdmin && isAdmin && <AdminDashboard categories={categories} projects={projects} messages={messages} onClose={() => setShowAdmin(false)} setCategories={setCategories} setProjects={setProjects} />}</AnimatePresence>
          <AnimatePresence>{selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}</AnimatePresence>
        </>
      )}
    </div>
  );
}
