import React, { useState, useEffect, useRef, useMemo } from 'react';
import Lenis from 'lenis';
import { DndContext, closestCenter, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useAnimation, useAnimationFrame } from 'motion/react';
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
  User as UserIcon,
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
  Redo2,
  Loader2,
  Check,
  ShieldCheck,
  AlertCircle,
  Triangle,
  Square,
  Circle,
  ArrowRight,
  FolderOpen,
  Save,
  BarChart3,
  Clock,
  ChevronDown,
  Settings,
  Phone,
  Moon,
  Sun
} from 'lucide-react';
import { PerspectiveCarousel } from './components/PerspectiveCarousel';
import { supabase } from './lib/supabase';
import { Project, Category, Stat, Skill, Service, CanvasItem } from './types';
import { uploadToCloudinary, uploadMultipleToCloudinary } from './lib/cloudinary';
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

// --- Helper for Centered Section Scrolling ---
export const scrollToSectionHelper = (id: string, e?: React.MouseEvent | React.SyntheticEvent) => {
  if (e) {
    e.preventDefault();
  }
  const element = document.getElementById(id);
  if (element) {
    if (id === 'contact' || id === 'testimonials') {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const elementHeight = element.offsetHeight;
      const viewportHeight = window.innerHeight;
      const targetScrollY = elementTop + (elementHeight / 2) - (viewportHeight / 2);
      
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(targetScrollY, { duration: 2.0 });
      } else {
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    } else {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(`#${id}`, { duration: 2.0 });
      } else {
        window.scrollTo({ top: element.offsetTop, behavior: 'smooth' });
      }
    }
  }
};

// --- Types ---
// Moved to src/types.ts

// --- Data ---
const SKILLS: Skill[] = [
  { name: "Adobe Illustrator", level: 95, icon: <PenTool className="w-5 h-5" />, color: "brand-primary" },
  { name: "Adobe Photoshop", level: 90, icon: <Palette className="w-5 h-5" />, color: "brand-primary" },
  { name: "Color Theory", level: 92, icon: <Layers className="w-5 h-5" />, color: "brand-primary" },
  { name: "Branding", level: 88, icon: <Award className="w-5 h-5" />, color: "brand-primary" },
  { name: "Print Design", level: 90, icon: <Monitor className="w-5 h-5" />, color: "brand-primary" },
];

const SERVICES: Service[] = [
  { 
    title: "Logo Design", 
    description: "Unique and modern logos designed to represent your brand identity.",
    icon: <PenTool className="w-10 h-10" />,
    color: "brand-primary"
  },
  { 
    title: "Brand Identity", 
    description: "Consistent visual systems including colors, typography, and brand style.",
    icon: <Layers className="w-10 h-10" />,
    color: "brand-primary"
  },
  { 
    title: "Social Media Design", 
    description: "Eye-catching graphics for Instagram, Facebook, and other platforms.",
    icon: <Smartphone className="w-10 h-10" />,
    color: "brand-primary"
  },
  { 
    title: "Flyer & Poster Design", 
    description: "Creative promotional materials for marketing and advertising.",
    icon: <Monitor className="w-10 h-10" />,
    color: "brand-primary"
  },
  { 
    title: "YouTube Thumbnail Design", 
    description: "Attention-grabbing thumbnails designed to increase clicks.",
    icon: <Layout className="w-10 h-10" />,
    color: "brand-primary"
  },
  { 
    title: "UI/UX Design", 
    description: "User-centric interface designs for web and mobile applications.",
    icon: <Monitor className="w-10 h-10" />,
    color: "brand-primary"
  },
];

const Preloader = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <motion.div 
      initial={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[9999] bg-dark-bg flex flex-col items-center justify-center p-6 origin-top"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,60,237,0.15)_0%,transparent_70%)]" />
      
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 md:w-40 md:h-40 rounded-full border-t-2 border-r-2 border-brand-primary/40 border-l-2 border-brand-primary/40 border-b-2 border-slate-200"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            src="https://i.imgur.com/mNctGoH.png" 
            alt="Logo" 
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-[0_10px_40px_rgba(124,60,237,0.1)] object-cover bg-white" 
          />
        </div>
      </div>

      <div className="mt-12 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-2xl md:text-3xl font-black uppercase tracking-normal text-slate-900 mb-2"
        >
          Abdul <span className="text-brand-primary">Wahab</span>
        </motion.h2>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 200 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent mx-auto"
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mt-4 animate-pulse"
        >
          Crafting Visual Stories...
        </motion.p>
      </div>

      <div className="absolute bottom-10 text-slate-300 text-[10px] font-mono tracking-widest uppercase">
        © 2026 Wahab Graphic.
      </div>
    </motion.div>
  );
};

const playMechanicalClick = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // Main click sound (high-frequency square wave)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // Noise burst for mechanical texture
    const bufferSize = audioCtx.sampleRate * 0.02;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
    
    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    osc.start();
    noise.start();
    osc.stop(audioCtx.currentTime + 0.1);
    
    // Auto-close context to save resources
    setTimeout(() => audioCtx.close(), 200);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const ThemeTransitionOverlay = ({ isAnimating, isDarkMode }: { isAnimating: boolean, isDarkMode: boolean }) => {
  const sweepVariants = {
    initial: { y: "-100%", skewY: 10 },
    animate: { y: "100%", skewY: 10 },
  };

  return (
    <AnimatePresence>
      {isAnimating && (
        <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
          {/* Layer 1: Brand Color */}
          <motion.div
            variants={sweepVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
            className="absolute inset-0 bg-brand-primary/40 h-[120%]"
          />
          {/* Layer 2: Secondary Tone */}
          <motion.div
            variants={sweepVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1], delay: 0.1 }}
            className={`absolute inset-0 h-[120%] ${
              !isDarkMode ? "bg-slate-800" : "bg-slate-200"
            }`}
          />
          {/* Layer 3: Target Background */}
          <motion.div
            variants={sweepVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
            className={`absolute inset-0 h-[120%] ${
              !isDarkMode ? "bg-slate-950" : "bg-slate-50"
            }`}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

const ThemeToggleButton = ({ isDarkMode, onToggle }: { isDarkMode: boolean, onToggle: () => void }) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={`w-12 h-12 rounded-full shadow-xl border backdrop-blur-xl transition-all duration-500 group flex items-center justify-center relative z-10 ${
        isDarkMode 
          ? "bg-white border-white text-slate-900" 
          : "bg-slate-900 border-slate-800 text-white"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        {isDarkMode ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </div>
    </motion.button>
  );
};

const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    
    // Sensitivity factor
    const factor = 25;
    const rotateX = ((y - centerY) / centerY) * factor;
    const rotateY = ((centerX - x) / centerX) * factor;

    setRotate({ x: rotateX, y: rotateY });
    setIsHovered(true);
  };

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      animate={{
        rotateX: rotate.x,
        rotateY: rotate.y,
        scale: isHovered ? 0.95 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
      style={{ 
        transformStyle: "preserve-3d", 
        perspective: 1000 
      }}
      className={className}
    >
      <div style={{ transform: "translateZ(20px)" }} className="h-full">
        {children}
      </div>
    </motion.div>
  );
};

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
  canvasHeight,
  setCanvasHeight,
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
  canvasHeight: number,
  setCanvasHeight: (h: number) => void,
  onUndo: () => void,
  onRedo: () => void,
  onSetCover?: (dataUrl: string) => void,
  onClear?: () => void
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
      // Wait for state update to remove transformer
      setTimeout(() => {
        // Reduced pixelRatio from 5 to 2 for better performance and smaller file sizes
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

  const handleDeleteSelected = React.useCallback(() => {
    if (selectedId) {
      setItems(prevItems => prevItems.filter(item => item.id !== selectedId));
      selectShape(null);
    }
  }, [selectedId, setItems]);

  // Keyboard listener for Undo/Redo, Arrow keys, and Zoom keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable;

      if (e.key === 'Control' || e.key === 'Meta') keys.current.ctrl = true;
      if (e.code === 'Space') {
        keys.current.space = true;
        if (!isInput) {
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

      if (isInput) return;

      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        handleDeleteSelected();
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
  }, [onUndo, onRedo, selectedId, setItems, handleDeleteSelected]);

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
      <div className="flex flex-wrap justify-between items-center bg-slate-100/50 p-3 rounded-xl border border-slate-200 gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-bold rounded-lg cursor-pointer hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" /> Add Images
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={onUploadImage} 
              className="hidden" 
            />
          </label>
          
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <label className="text-xs text-slate-500 font-bold uppercase">Height:</label>
            <input 
              type="number" 
              value={canvasHeight}
              onChange={(e) => setCanvasHeight(Number(e.target.value))}
              className="w-16 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
              min="450"
              step="50"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <label className="text-xs text-slate-500 font-bold uppercase">Canvas Color:</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <span className="text-xs font-mono text-slate-500">{backgroundColor}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }}
              className="px-3 py-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-bold rounded-lg hover:bg-brand-primary hover:text-white transition-colors text-xs shadow-sm"
            >
              Reset Zoom
            </button>
          )}
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <button
            type="button"
            onClick={onUndo}
            className="p-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-white hover:border-brand-primary/50 transition-all text-slate-500 hover:text-brand-primary shadow-sm"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            className="p-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-white hover:border-brand-primary/50 transition-all text-slate-500 hover:text-brand-primary shadow-sm"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          {selectedId && (
            <button 
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all ml-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          )}
          <button 
            type="button"
            onClick={handleSetCover}
            className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs hover:scale-105 active:scale-100 transition-all shadow-lg shadow-brand-primary/20 ml-2"
          >
            Use as Cover
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
        <div ref={scrollContainerRef} className="flex-1 rounded-xl overflow-y-auto overflow-x-hidden border border-slate-200 relative shadow-inner bg-slate-50 h-full custom-scrollbar" style={{ direction: 'rtl' }}>
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
                      stroke="rgba(0, 0, 0, 0.05)"
                      strokeWidth={1}
                    />
                  ))}
                  {Array.from({ length: Math.ceil(canvasHeight / 10) + 1 }).map((_, i) => (
                    <Line
                      key={`h-${i}`}
                      points={[0, i * 10, 800, i * 10]}
                      stroke="rgba(0, 0, 0, 0.05)"
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
            <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none bg-white/80 px-2 py-1 rounded z-10 border border-slate-100 shadow-sm">
              Canvas: 800x{canvasHeight} (Scaled {(stageSize.scale * zoom).toFixed(2)}x)
            </div>
          </div>
        </div>

        {/* Layers Panel */}
        <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-xl flex flex-col h-full shadow-sm">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Layers className="w-3 h-3 text-brand-primary" /> Layers ({items.length})
            </h3>
          </div>
          
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={[...items].reverse().map(i => i.id)} strategy={verticalListSortingStrategy}>
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
                      <SortableLayerItem 
                        key={item.id}
                        item={item}
                        originalIndex={originalIndex}
                        isSelected={selectedId === item.id}
                        onSelect={() => selectShape(item.id)}
                        onMoveUp={() => moveLayer(item.id, 'up')}
                        onMoveDown={() => moveLayer(item.id, 'down')}
                        itemsLength={items.length}
                      />
                    );
                  })
                )}
              </div>
            </SortableContext>
          </DndContext>
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
  stats,
  onClose,
  setCategories,
  setProjects,
  setStats,
  themeStyles,
  setThemeStyles
}: { 
  categories: Category[], 
  projects: Project[], 
  messages: any[],
  stats: Stat[],
  onClose: () => void,
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setStats: (stats: Stat[]) => void,
  themeStyles: any,
  setThemeStyles: React.Dispatch<React.SetStateAction<any>>
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEndCategories = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((i) => i.id === active.id);
      const newIndex = categories.findIndex((i) => i.id === over.id);
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      
      // Optimistic update
      setCategories(newCategories);

      // Persist to Supabase
      try {
        const updates = newCategories.map((cat, index) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          order: index,
          cover_image: cat.coverImage
        }));

        const { error } = await supabase
          .from('categories')
          .upsert(updates, { onConflict: 'id' });

        if (error) {
          console.error("Error updating category order in DB:", error);
          // If update fails, the real-time fetch or next refresh will revert it correctly
        }
      } catch (err) {
        console.error("Failed to persist category order:", err);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<'categories' | 'messages' | 'notes' | 'stats'>('categories');
  const [browsingFolderId, setBrowsingFolderId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'project' | 'category' | 'message', id: string, message: string } | null>(null);

  // Style Notes Live Edit States
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editBrandPrimary, setEditBrandPrimary] = useState(themeStyles.brandPrimary);
  const [editLightBg, setEditLightBg] = useState(themeStyles.lightBackground);
  const [editDisplayFont, setEditDisplayFont] = useState(themeStyles.displayFont);
  const [editSansFont, setEditSansFont] = useState(themeStyles.sansFont);
  const [editScriptFont, setEditScriptFont] = useState(themeStyles.scriptFont);
  const [editFooterNote, setEditFooterNote] = useState(themeStyles.footerNote);

  useEffect(() => {
    if (activeTab === 'notes') {
      setEditBrandPrimary(themeStyles.brandPrimary);
      setEditLightBg(themeStyles.lightBackground);
      setEditDisplayFont(themeStyles.displayFont);
      setEditSansFont(themeStyles.sansFont);
      setEditScriptFont(themeStyles.scriptFont);
      setEditFooterNote(themeStyles.footerNote);
    }
  }, [themeStyles, activeTab]);

  // Form States
  const [catName, setCatName] = useState('');
  const [catCover, setCatCover] = useState('');
  const catCoverRef = React.useRef(catCover);
  useEffect(() => { catCoverRef.current = catCover; }, [catCover]);
  const [projName, setProjName] = useState('');
  const [projCatId, setProjCatId] = useState('');
  const [projCover, setProjCover] = useState('');
  const projCoverRef = React.useRef(projCover);
  useEffect(() => { projCoverRef.current = projCover; }, [projCover]);

  const [projImages, setProjImages] = useState<string[]>([]);
  const projImagesRef = React.useRef(projImages);
  useEffect(() => { projImagesRef.current = projImages; }, [projImages]);

  const [projDesc, setProjDesc] = useState('');
  const [projStatus, setProjStatus] = useState<'draft' | 'published'>('published');

  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const canvasItemsRef = React.useRef(canvasItems);
  useEffect(() => { canvasItemsRef.current = canvasItems; }, [canvasItems]);
  const [canvasHeight, setCanvasHeight] = useState(450);
  const [canvasBgColor, setCanvasBgColor] = useState('#1a1a1a');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingUploads = React.useRef<Map<string, Promise<string>>>(new Map());

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
    canvasItemsRef.current = resolvedItems;
    
    const newHistory = canvasHistory.slice(0, historyStep + 1);
    newHistory.push(resolvedItems);
    setCanvasHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = React.useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setCanvasItems(canvasHistory[newStep]);
    }
  }, [historyStep, canvasHistory]);

  const handleRedo = React.useCallback(() => {
    if (historyStep < canvasHistory.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setCanvasItems(canvasHistory[newStep]);
    }
  }, [historyStep, canvasHistory]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAddingProject) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleRedo();
        } else if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddingProject, handleUndo, handleRedo]);

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const compressImage = (file: File, maxWidth = 2000, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Safety timeout for compression
      const timeout = setTimeout(() => {
        reject(new Error("Compression timeout"));
      }, 15000);

      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            clearTimeout(timeout);
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/jpeg', quality);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Image load failed for compression"));
        };
      };
      reader.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return await uploadToCloudinary(file);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setProjCover(localUrl);
      projCoverRef.current = localUrl;
    }
  };

  const handleCatCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setCatCover(localUrl);
      catCoverRef.current = localUrl;
    }
  };

  const handleAdditionalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const localUrl = URL.createObjectURL(file);
        setProjImages(prev => [...prev, localUrl]);
        projImagesRef.current = [...projImagesRef.current, localUrl];
        
        const uploadPromise = handleImageUpload(file).then(url => {
          setProjImages(prev => prev.map(u => u === localUrl ? url : u));
          projImagesRef.current = projImagesRef.current.map(u => u === localUrl ? url : u);
          pendingUploads.current.delete(localUrl);
          return url;
        }).catch(err => {
          pendingUploads.current.delete(localUrl);
          throw err;
        });
        pendingUploads.current.set(localUrl, uploadPromise);
      });
    }
  };

  const handleSetCover = (dataUrl: string) => {
    setProjCover(dataUrl);
    projCoverRef.current = dataUrl;
    
    // If it's a data URL (from canvas), upload it to Storage so we don't save huge Base64 to Firestore
    if (dataUrl.startsWith('data:')) {
      try {
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], "canvas_cover.jpg", { type: "image/jpeg" });
        
        const uploadPromise = handleImageUpload(file).then(url => {
          setProjCover(url);
          projCoverRef.current = url;
          pendingUploads.current.delete(dataUrl);
          return url;
        }).catch(err => {
          pendingUploads.current.delete(dataUrl);
          throw err;
        });
        pendingUploads.current.set(dataUrl, uploadPromise);
      } catch (err) {
        console.error("Failed to upload canvas cover:", err);
      }
    }
  };

  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear the canvas?")) {
      updateCanvasItems([]);
    }
  };

  const handleCanvasImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file, index) => {
        const localUrl = URL.createObjectURL(file);
        const tempId = `img-${Date.now()}-${index}`;
        
        const img = new Image();
        img.src = localUrl;
        img.onload = () => {
          const newItem: CanvasItem = {
            id: tempId,
            type: 'image',
            src: localUrl,
            x: (800 - img.naturalWidth) / 2 + (index * 20), 
            y: (450 - img.naturalHeight) / 2 + (index * 20),
            width: img.naturalWidth,
            height: img.naturalHeight,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          };
          updateCanvasItems(prev => [...prev, newItem]);
        };
      });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      let finalCatCover = catCover;
      if (catCover.startsWith('blob:') || catCover.startsWith('data:')) {
        try {
          finalCatCover = await uploadToCloudinary(catCover);
        } catch (uploadErr: any) {
          throw new Error(`Upload failed: ${uploadErr.message}`);
        }
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: catName,
          slug: catName.toLowerCase().replace(/\s+/g, '-'),
          order: categories.length,
          cover_image: finalCatCover
        }])
        .select();

      if (error) throw error;
      if (data) {
        const newCat = {
          ...data[0],
          coverImage: data[0].cover_image
        } as Category;
        setCategories([...categories, newCat]);
      }

      setCatName('');
      setCatCover('');
      setIsAddingCategory(false);
    } catch (err: any) {
      console.error("Error adding category:", err);
      setSaveError(err.message || "Failed to add folder.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatCover(cat.coverImage || '');
    setIsAddingCategory(false);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      let finalCatCover = catCover;
      if (catCover.startsWith('blob:') || catCover.startsWith('data:')) {
        try {
          finalCatCover = await uploadToCloudinary(catCover);
        } catch (uploadErr: any) {
          throw new Error(`Upload failed: ${uploadErr.message}`);
        }
      }

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: catName,
          slug: catName.toLowerCase().replace(/\s+/g, '-'),
          cover_image: finalCatCover
        })
        .eq('id', editingCategory.id)
        .select();

      if (error) throw error;
      if (data) {
        const updatedCat = {
          ...data[0],
          coverImage: data[0].cover_image
        } as Category;
        setCategories(categories.map(c => c.id === editingCategory.id ? updatedCat : c));
      }

      setCatName('');
      setCatCover('');
      setEditingCategory(null);
    } catch (err: any) {
      console.error("Error updating category:", err);
      setSaveError(err.message || "Failed to update folder.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteConfirmation({ 
      type: 'category', 
      id, 
      message: 'Are you sure you want to delete this category?' 
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);
    setSaveError(null);

    try {
      // 1. Upload Cover Image if it's new (blob/data URL)
      let finalCover = projCover;
      if (projCover.startsWith('blob:') || projCover.startsWith('data:')) {
        console.log("Uploading cover image to Cloudinary...");
        finalCover = await uploadToCloudinary(projCover);
      }

      // 2. Upload Canvas Images if they are blobs
      const finalCanvasItems = await Promise.all(canvasItems.map(async (item) => {
        if (item.src.startsWith('blob:') || item.src.startsWith('data:')) {
          const uploadedUrl = await uploadToCloudinary(item.src);
          return { ...item, src: uploadedUrl };
        }
        return item;
      }));

      const selectedCategory = categories.find(c => c.id === projCatId);
      const categoryName = selectedCategory ? selectedCategory.name : 'General';

      // Create project data for Supabase
      const projectData = {
        title: projName.trim() || 'Untitled Project',
        name: projName.trim() || 'Untitled Project',
        category_id: projCatId,
        category: categoryName,
        cover_image: finalCover,
        images: [], // Images are now mainly in canvasData
        description: projDesc,
        status: projStatus,
        canvas_data: finalCanvasItems,
        canvas_background_color: canvasBgColor,
        canvas_height: canvasHeight,
        created_at: editingProject?.createdAt || new Date().toISOString()
      };

      if (editingProject) {
        const { data, error } = await supabase
          .from('portfolio_projects')
          .update(projectData)
          .eq('id', editingProject.id)
          .select();
        
        if (error) throw error;
        
        if (data) {
          const updatedProj = {
            ...data[0],
            categoryId: data[0].category_id,
            coverImage: data[0].cover_image,
            createdAt: data[0].created_at,
            canvasData: data[0].canvas_data,
            canvasBackgroundColor: data[0].canvas_background_color,
            canvasHeight: data[0].canvas_height
          } as Project;
          setProjects(projects.map(p => p.id === editingProject.id ? updatedProj : p));
        }
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        setIsAddingProject(false);
        setEditingProject(null);
        resetProjectForm();
      } else {
        const { data, error } = await supabase
          .from('portfolio_projects')
          .insert([projectData])
          .select();
        
        if (error) throw error;

        if (data) {
          const newProj = {
            ...data[0],
            categoryId: data[0].category_id,
            coverImage: data[0].cover_image,
            createdAt: data[0].created_at,
            canvasData: data[0].canvas_data,
            canvasBackgroundColor: data[0].canvas_background_color,
            canvasHeight: data[0].canvas_height
          } as Project;
          setProjects([...projects, newProj]);
        }
 
        resetProjectForm();
        setIsAddingProject(false);
        setEditingProject(null);
      }
    } catch (err: any) {
      console.error("Error saving project:", err);
      setSaveError(err.message || "An error occurred while saving the project.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetProjectForm = () => {
    setProjName('');
    setProjCatId('');
    setProjCover('');
    setProjImages([]);
    setProjDesc('');
    setProjStatus('published');
    setCanvasItems([]);
    setCanvasHeight(450);
    setCanvasHistory([[]]);
    setHistoryStep(0);
    setCanvasBgColor('#1a1a1a');
    setEditingProject(null);
    setIsAddingProject(false);
    setSaveError(null);
    pendingUploads.current.clear();
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
      let table = '';
      if (type === 'category') table = 'categories';
      else if (type === 'project') table = 'portfolio_projects';
      else if (type === 'message') table = 'messages';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    } finally {
      setDeleteConfirmation(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-lenis-prevent
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl overflow-y-auto p-6 text-slate-900"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Admin <span className="text-brand-primary">Dashboard</span></h2>
          <button onClick={onClose} className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600 shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => { setActiveTab('categories'); setBrowsingFolderId(null); setSaveError(null); }}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'}`}
          >
            Manage Folders
          </button>
          <button 
            onClick={() => { setActiveTab('messages'); setBrowsingFolderId(null); setSaveError(null); }}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'}`}
          >
            Messages ({messages.length})
          </button>
          <button 
            onClick={() => { setActiveTab('notes'); setSaveError(null); }}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'notes' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'}`}
          >
            Style Notes
          </button>
        </div>

        {activeTab === 'notes' && !isEditingNotes && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-200/50">
              <h3 className="text-xl font-bold text-slate-900">Style Guide & Notes</h3>
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" /> Edit Style Details
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-3xl border-brand-primary/20 bg-white">
                <h4 className="text-brand-primary font-bold mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5" /> Color Palette
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: themeStyles.brandPrimary }}></div>
                    <div>
                      <p className="font-bold text-slate-800">Brand Primary (Purple)</p>
                      <p className="font-mono text-xs text-slate-400">{themeStyles.brandPrimary}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: themeStyles.lightBackground }}></div>
                    <div>
                      <p className="font-bold text-slate-800">Light Background Color</p>
                      <p className="font-mono text-xs text-slate-400">{themeStyles.lightBackground}</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="glass p-6 rounded-3xl border-brand-primary/10 bg-white">
                <h4 className="text-brand-primary font-bold mb-4 flex items-center gap-2">
                  <Layout className="w-5 h-5" /> Typography
                </h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <p className="font-bold text-slate-800">Display Font (Headings)</p>
                    <p className="text-slate-500 font-display text-lg">{themeStyles.displayFont}</p>
                  </li>
                  <li>
                    <p className="font-bold text-slate-800">Sans Font (Body Text)</p>
                    <p className="text-slate-500 font-sans">{themeStyles.sansFont}</p>
                  </li>
                  <li>
                    <p className="font-bold text-slate-800">Script Font (Signature & Custom Name)</p>
                    <p className="text-slate-500 font-script text-xl">{themeStyles.scriptFont}</p>
                  </li>
                </ul>
              </div>
            </div>
            <div className="glass p-6 rounded-3xl italic text-slate-400 text-sm bg-slate-50 border-slate-200">
              {themeStyles.footerNote}
            </div>
          </div>
        )}

        {activeTab === 'notes' && isEditingNotes && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setThemeStyles({
                brandPrimary: editBrandPrimary,
                lightBackground: editLightBg,
                displayFont: editDisplayFont,
                sansFont: editSansFont,
                scriptFont: editScriptFont,
                footerNote: editFooterNote
              });
              setIsEditingNotes(false);
            }}
            className="space-y-6 text-slate-900"
          >
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-200/50">
              <h3 className="text-xl font-bold text-slate-900 font-display">Edit Style Guide & Theme</h3>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsEditingNotes(false)}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Style
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Color Palette Panel */}
              <div className="glass p-6 rounded-3xl border-brand-primary/20 bg-white space-y-4">
                <h4 className="text-brand-primary font-bold mb-2 flex items-center gap-2">
                  <Palette className="w-5 h-5" /> Color Palette
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1">Brand Primary (Purple)</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={editBrandPrimary} 
                        onChange={(e) => setEditBrandPrimary(e.target.value)}
                        className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer bg-transparent p-1"
                      />
                      <input 
                        type="text" 
                        value={editBrandPrimary} 
                        onChange={(e) => setEditBrandPrimary(e.target.value)}
                        placeholder="#7c3ced"
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-205 font-mono text-sm focus:outline-none focus:border-brand-primary bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1">Light Background Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={editLightBg} 
                        onChange={(e) => setEditLightBg(e.target.value)}
                        className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer bg-transparent p-1"
                      />
                      <input 
                        type="text" 
                        value={editLightBg} 
                        onChange={(e) => setEditLightBg(e.target.value)}
                        placeholder="#fafafa"
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-205 font-mono text-sm focus:outline-none focus:border-brand-primary bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Fonts Panel */}
              <div className="glass p-6 rounded-3xl border-brand-primary/10 bg-white space-y-4">
                <h4 className="text-brand-primary font-bold mb-2 flex items-center gap-2">
                  <Layout className="w-5 h-5" /> Typography Settings
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-455 block mb-1">Display Font (Headings)</label>
                    <input 
                      type="text" 
                      value={editDisplayFont} 
                      onChange={(e) => setEditDisplayFont(e.target.value)}
                      placeholder="Blushing Rose Regular"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-primary bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-455 block mb-1">Sans Font (Body Text)</label>
                    <input 
                      type="text" 
                      value={editSansFont} 
                      onChange={(e) => setEditSansFont(e.target.value)}
                      placeholder="Plus Jakarta Sans"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-primary bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-455 block mb-1">Script Font (Signature)</label>
                    <input 
                      type="text" 
                      value={editScriptFont} 
                      onChange={(e) => setEditScriptFont(e.target.value)}
                      placeholder="Dancing Script"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-primary bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl bg-slate-50 border-slate-200 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block">Footer Guideline & Notes</label>
              <textarea 
                value={editFooterNote} 
                onChange={(e) => setEditFooterNote(e.target.value)}
                rows={3}
                placeholder="Style guide note summary..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-primary bg-white text-slate-900"
              />
            </div>
          </form>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4 text-slate-900">
            <h3 className="text-xl font-bold">Messages</h3>
            {messages.map(msg => (
              <div key={msg.id} className="glass p-6 rounded-3xl flex justify-between items-start bg-white hover:border-brand-primary/30 transition-colors">
                <div>
                  <p className="font-bold text-slate-900">{msg.fullName}</p>
                  <p className="text-sm text-slate-500 font-medium">{msg.email}</p>
                  <p className="font-bold mt-2 text-slate-800">{msg.subject}</p>
                  <p className="text-slate-600 mt-1 leading-relaxed">{msg.message}</p>
                  <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {msg.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setDeleteConfirmation({ type: 'message', id: msg.id, message: 'Are you sure you want to delete this message?' })}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            {!browsingFolderId ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                    <FolderOpen className="w-6 h-6 text-brand-primary" /> Folders <span className="text-slate-400 font-normal">/ Gallery</span>
                  </h3>
                  <button 
                    onClick={() => setIsAddingCategory(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
                  >
                    <FolderPlus className="w-5 h-5" /> Add Folder
                  </button>
                </div>

                {(isAddingCategory || editingCategory) && (
                  <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="bg-white p-6 rounded-3xl flex flex-col gap-4 border border-slate-200 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
                    {saveError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {saveError}
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{editingCategory ? 'Edit Folder Name' : 'Folder Name'}</label>
                        <input 
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          placeholder="e.g. Logo Design"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-all text-slate-900"
                          required
                        />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cover Image</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleCatCoverFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            required={!catCover}
                          />
                          <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl px-4 py-3 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-sm text-slate-500">
                            <Upload className="w-4 h-4 text-brand-primary" />
                            <span className="truncate">{catCover ? 'Change Image' : 'Upload Cover'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button type="submit" disabled={isSaving} className="flex-1 md:flex-none px-8 py-3 bg-brand-primary text-white font-black rounded-xl disabled:opacity-50 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand-primary/20">
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" onClick={() => { setIsAddingCategory(false); setEditingCategory(null); setCatCover(''); setCatName(''); }} className="px-6 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                      </div>
                    </div>
                    {catCover && (
                      <div className="w-32 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img src={catCover} alt="Cover Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </form>
                )}

                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndCategories}
                >
                  <SortableContext 
                    items={categories.map(c => c.id)} 
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categories.map(cat => (
                        <SortableCategoryItem 
                          key={cat.id} 
                          cat={cat} 
                          onEdit={handleEditCategory} 
                          onDelete={handleDeleteCategory} 
                          onBrowse={(id) => {
                            setBrowsingFolderId(id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                
                {categories.length === 0 && !isAddingCategory && (
                  <div className="py-20 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-[40px]">
                    <FolderPlus className="w-16 h-16 mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-[0.2em] text-xs">No folders yet. Create your first collection!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-8">
                {/* Folder Navigation Header */}
                <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent pointer-events-none"></div>
                  
                  <button 
                    onClick={() => setBrowsingFolderId(null)}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all font-black text-xs uppercase tracking-widest text-slate-600 border border-slate-200"
                  >
                    <ArrowLeft className="w-5 h-5 text-brand-primary" /> Back to Folders
                  </button>

                  <div className="hidden md:flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Browsing Directory</span>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                       <span className="text-brand-primary">#</span> {categories.find(c => c.id === browsingFolderId)?.name}
                    </h3>
                  </div>

                  <button 
                    onClick={() => {
                      setProjCatId(browsingFolderId);
                      setIsAddingProject(true);
                      setEditingProject(null);
                      setProjName('');
                      setProjCover('');
                      setProjDesc('');
                      setCanvasItems([]);
                      setCanvasBgColor('#ffffff');
                      setCanvasHeight(450);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/30 text-xs uppercase tracking-widest"
                  >
                    <Plus className="w-5 h-5" /> New Project
                  </button>
                </div>

                {/* Project Management Grid or Form */}
                {/* (The rest of the form and grid logic follows) */}

                {/* Project List Content */}
                {(isAddingProject || editingProject) && (
                  <form onSubmit={handleAddProject} className="bg-white p-5 md:p-6 rounded-3xl space-y-5 border border-slate-200 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                        {editingProject ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                      <h4 className="text-xl font-black tracking-tight text-slate-900">{editingProject ? 'Edit Project' : 'New Project'}</h4>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          Project Name <span className="text-brand-primary">*</span>
                        </label>
                        <input 
                          value={projName}
                          onChange={(e) => setProjName(e.target.value)}
                          placeholder="e.g. Modern Brand Identity"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-slate-900 placeholder:text-slate-400"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          Folder Location
                        </label>
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 font-bold flex items-center gap-2">
                          <Folder className="w-4 h-4 text-brand-primary" /> {categories.find(c => c.id === browsingFolderId)?.name}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          Visibility <span className="text-brand-primary">*</span>
                        </label>
                        <div className="relative">
                          <select 
                            value={projStatus}
                            onChange={(e) => setProjStatus(e.target.value as 'draft' | 'published')}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-slate-900 appearance-none transition-all"
                            required
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft (Hidden)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <ImageIcon className="w-3 h-3 text-brand-primary" /> Cover Image <span className="text-brand-primary">*</span>
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
                            <div className="w-full border border-dashed border-slate-300 rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 group-hover:border-brand-primary/50 group-hover:bg-brand-primary/5 transition-all bg-white">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:scale-110 transition-all">
                                <Upload className="w-4 h-4" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-slate-600">Click or drag image</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative inline-block group rounded-xl overflow-hidden border border-slate-200">
                            <img src={projCover} alt="Cover Preview" referrerPolicy="no-referrer" className="h-24 w-auto object-cover" />
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

                      <div className="space-y-4">
                        <label className="text-xs font-bold tracking-tight text-slate-600">Layout Canvas</label>
                        <CanvasDesignEditor 
                          items={canvasItems} 
                          setItems={updateCanvasItems} 
                          onUploadImage={handleCanvasImageUpload} 
                          backgroundColor={canvasBgColor}
                          setBackgroundColor={setCanvasBgColor}
                          canvasHeight={canvasHeight}
                          setCanvasHeight={setCanvasHeight}
                          onUndo={handleUndo}
                          onRedo={handleRedo}
                          onSetCover={handleSetCover}
                          onClear={handleClearCanvas}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-slate-400" /> Description
                      </label>
                      <textarea 
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        placeholder="Describe the project process..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary h-32 text-slate-900 placeholder:text-slate-400 resize-none transition-all"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
                      <div className="flex-1 flex flex-col gap-1">
                        {saveError && (
                          <div className="mb-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {saveError}
                          </div>
                        )}
                        <button 
                          type="submit" 
                          disabled={isSaving} 
                          className="w-full py-3 bg-brand-primary text-white font-black text-sm rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
                        >
                          {isSaving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                          ) : (
                            <><Send className="w-4 h-4" /> {editingProject ? 'Update Project' : 'Publish Project'}</>
                          )}
                        </button>
                      </div>
                      <button type="button" onClick={resetProjectForm} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors border border-slate-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.filter(p => p.categoryId === browsingFolderId).map(proj => (
                    <div key={proj.id} className="bg-white rounded-3xl overflow-hidden group border border-slate-200 relative shadow-sm hover:shadow-xl transition-all">
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={proj.coverImage} 
                          alt={proj.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className={`px-2 py-1 ${proj.status === 'published' ? 'bg-green-500 shadow-md shadow-green-500/20' : 'bg-yellow-500 shadow-md shadow-yellow-500/20'} text-white text-[10px] font-bold rounded uppercase tracking-widest`}>
                            {proj.status}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={() => {
                              setEditingProject(proj);
                              setProjName(proj.name);
                              setProjCatId(proj.categoryId || '');
                              setProjCover(proj.coverImage);
                              setProjDesc(proj.description || '');
                              setProjStatus(proj.status);
                              setCanvasItems(proj.canvasData || []);
                              setCanvasHeight(proj.canvasHeight || 450);
                              setCanvasBgColor(proj.canvasBackgroundColor || '#ffffff');
                              setIsAddingProject(true);
                            }}
                            className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProject(proj.id)}
                            className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <h4 className="font-bold text-sm truncate text-slate-900">{proj.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                {projects.filter(p => p.categoryId === browsingFolderId).length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-3xl">
                    <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No projects in this folder</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Confirm Deletion</h3>
            <p className="text-slate-500 mb-8">{deleteConfirmation.message}</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setDeleteConfirmation(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
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
  const [imageError, setImageError] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setImageError(false);
  }, [selectedImageIdx, selectedCanvasIdx]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const modalLenis = new Lenis({
      wrapper: scrollRef.current,
      content: scrollRef.current.firstElementChild as HTMLElement,
      duration: 2.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    
    let rafId: number;
    function raf(time: number) {
      modalLenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      modalLenis.destroy();
    };
  }, []);

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

  // Keyboard navigation for lightboxes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If image lightbox is open
      if (selectedImageIdx !== null) {
        if (e.key === 'ArrowLeft' && selectedImageIdx > 0) {
          setSelectedImageIdx(selectedImageIdx - 1);
        } else if (e.key === 'ArrowRight' && project.images && selectedImageIdx < project.images.length - 1) {
          setSelectedImageIdx(selectedImageIdx + 1);
        } else if (e.key === 'Escape') {
          setSelectedImageIdx(null);
        }
      } 
      // If canvas lightbox is open
      else if (selectedCanvasIdx !== null) {
        if (e.key === 'ArrowLeft' && selectedCanvasIdx > 0) {
          setSelectedCanvasIdx(selectedCanvasIdx - 1);
        } else if (e.key === 'ArrowRight' && project.canvasData && selectedCanvasIdx < project.canvasData.length - 1) {
          setSelectedCanvasIdx(selectedCanvasIdx + 1);
        } else if (e.key === 'Escape') {
          setSelectedCanvasIdx(null);
        }
      } 
      // Close main modal if no lightbox is open
      else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIdx, selectedCanvasIdx, project.images, project.canvasData, onClose]);

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
      className="fixed inset-0 z-[100] bg-slate-50/98 backdrop-blur-2xl"
    >
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 md:top-8 md:right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-all z-[110] border border-slate-200 shadow-xl"
      >
        <X className="w-6 h-6" />
      </button>


      <div ref={scrollRef} className="h-full overflow-y-auto custom-scrollbar" data-lenis-prevent>
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="space-y-12">
          <div className="text-center space-y-4 pt-10">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900">{project.name}</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">{project.description}</p>
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
                  }, project.canvasHeight || 450)) * scale,
                  backgroundColor: 'transparent'
                }}
              >
                {project.canvasData.map((item, idx) => (
                  <img
                    key={item.id}
                    src={item.src || undefined}
                    alt=""
                    referrerPolicy="no-referrer"
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
                      zIndex: 10,
                      imageRendering: 'auto'
                    }}
                    className="cursor-zoom-in select-none drop-shadow-md hover:scale-[1.02] transition-transform duration-300"
                  />
                ))}
              </div>
            )}

            {project.images && project.images.length > 0 ? (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {project.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-[2rem] overflow-hidden bg-white border border-slate-200 shadow-xl break-inside-avoid cursor-pointer group relative"
                    onClick={() => setSelectedImageIdx(idx)}
                  >
                    <img src={img || undefined} referrerPolicy="no-referrer" className="w-full h-auto group-hover:scale-105 transition-transform duration-500" alt={`${project.name} - ${idx + 1}`} />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
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
              className="px-10 py-4 bg-brand-primary text-white font-bold rounded-2xl hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-brand-primary/20"
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
          className="fixed inset-0 z-[120] bg-white flex items-center justify-center"
          onClick={() => setSelectedImageIdx(null)}
        >
          <button 
            onClick={() => setSelectedImageIdx(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all z-[150] text-slate-900 border border-slate-200 shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-[90vw] h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedImageIdx > 0 && (
              <button 
                onClick={handlePrev}
                className="absolute left-0 md:-left-16 w-14 h-14 bg-white/80 hover:bg-brand-primary hover:text-white text-slate-900 rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-slate-200 shadow-lg"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-lg relative">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-[160] bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200 shadow-sm">
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomIn(); }} 
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        title="Zoom In"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomOut(); }} 
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        title="Zoom Out"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetTransform(); }} 
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        title="Reset"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      {imageError ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-slate-100 rounded-3xl border border-slate-200 max-w-md mx-auto text-center">
                          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">Image Failed to Load</h3>
                          <p className="text-slate-500 text-sm leading-relaxed">
                            The image resource could not be retrieved. This can happen if the upload was interrupted or the local preview expired.
                          </p>
                        </div>
                      ) : (
                        <img 
                          key={project.images[selectedImageIdx]}
                          src={project.images[selectedImageIdx] || undefined} 
                          className="max-w-full max-h-full object-contain select-none shadow-lg" 
                          alt={`${project.name} - Enlarge ${selectedImageIdx + 1}`} 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error("Image failed to load in modal:", project.images[selectedImageIdx]);
                            setImageError(true);
                          }}
                        />
                      )}
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
            
            {selectedImageIdx < project.images.length - 1 && (
              <button 
                onClick={handleNext}
                className="absolute right-0 md:-right-16 w-14 h-14 bg-white/80 hover:bg-brand-primary hover:text-white text-slate-900 rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-slate-200 shadow-lg"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 px-6 py-2 rounded-full text-slate-600 text-sm font-mono tracking-widest backdrop-blur-md border border-slate-200 shadow-lg">
            {selectedImageIdx + 1} / {project.images.length}
          </div>
        </div>
      )}

      {/* Canvas Image Lightbox */}
      {selectedCanvasIdx !== null && project.canvasData && (
        <div 
          className="fixed inset-0 z-[120] bg-white flex items-center justify-center"
          onClick={() => setSelectedCanvasIdx(null)}
        >
          <button 
            onClick={() => setSelectedCanvasIdx(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all z-[150] text-slate-900 border border-slate-200 shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-[90vw] h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedCanvasIdx > 0 && (
              <button 
                onClick={handleCanvasPrev}
                className="absolute left-0 md:-left-16 w-14 h-14 bg-white/80 hover:bg-brand-primary hover:text-white text-slate-900 rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-slate-200 shadow-lg"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-lg relative">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-[160] bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200 shadow-sm">
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomIn(); }} 
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        title="Zoom In"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); zoomOut(); }} 
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        title="Zoom Out"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetTransform(); }} 
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        title="Reset"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <div className="relative w-full h-full flex items-center justify-center p-4">
                        {imageError ? (
                          <div className="flex flex-col items-center justify-center p-12 bg-slate-100 rounded-3xl border border-slate-200 max-w-md mx-auto text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                              <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Canvas Image Failed</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              This canvas element could not be loaded.
                            </p>
                          </div>
                        ) : (
                          <img 
                            key={project.canvasData[selectedCanvasIdx].src}
                            src={project.canvasData[selectedCanvasIdx].src || undefined} 
                            className="max-w-full max-h-full object-contain select-none shadow-2xl" 
                            style={{ imageRendering: 'auto' }}
                            alt="Enlarged view" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              console.error("Image failed to load in modal:", project.canvasData[selectedCanvasIdx].src);
                              setImageError(true);
                            }}
                          />
                        )}
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
            
            {selectedCanvasIdx < project.canvasData.length - 1 && (
              <button 
                onClick={handleCanvasNext}
                className="absolute right-0 md:-right-16 w-14 h-14 bg-white/80 hover:bg-brand-primary hover:text-white text-slate-900 rounded-full flex items-center justify-center transition-all z-[140] backdrop-blur-md border border-slate-200 shadow-lg"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 px-6 py-2 rounded-full text-slate-600 text-sm font-mono tracking-widest backdrop-blur-md border border-slate-200 shadow-lg">
            {selectedCanvasIdx + 1} / {project.canvasData.length}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const GlobalBackground = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();

  // Gentle scroll-based movements for a connected feeling
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

  const shapes = [
    { Icon: Circle, top: '15%', left: '10%', size: 24, factor: 0.04, opacity: 0.15, fill: true },
    { Icon: Triangle, top: '25%', left: '85%', size: 32, factor: -0.05, opacity: 0.1, fill: true },
    { Icon: Square, top: '65%', left: '15%', size: 28, factor: 0.03, opacity: 0.12, fill: false },
    { Icon: Plus, top: '80%', left: '75%', size: 36, factor: -0.04, opacity: 0.08, fill: false },
    { Icon: Circle, top: '45%', left: '45%', size: 20, factor: 0.06, opacity: 0.1, fill: true },
    { Icon: Triangle, top: '75%', left: '40%', size: 30, factor: 0.02, opacity: 0.05, fill: true },
    { Icon: Square, top: '10%', left: '70%', size: 24, factor: -0.03, opacity: 0.07, fill: false },
    { Icon: Plus, top: '50%', left: '80%', size: 28, factor: 0.05, opacity: 0.1, fill: false },
    { Icon: Circle, top: '85%', left: '10%', size: 40, factor: -0.02, opacity: 0.04, fill: true },
    { Icon: Square, top: '30%', left: '30%', size: 16, factor: 0.07, opacity: 0.15, fill: false },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-slate-50">
      {/* Background Dot Grid - Fixed */}
      <div className="absolute inset-0 dot-grid opacity-[0.03]" />
      
      {/* Connected Gradient Flow / Ambient Large Blobs */}
      <div className={`absolute inset-0 opacity-20 ${isDarkMode ? 'mix-blend-screen' : 'mix-blend-multiply'}`}>
        <motion.div 
          style={{ y: y1 }}
          animate={{
            x: (mousePosition.x - centerX) * 0.02,
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[120vw] h-[100vh] bg-brand-primary rounded-[100%] blur-[200px] md:blur-[250px]"
        />
        
        <motion.div 
          style={{ y: y2 }}
          animate={{
            x: (mousePosition.x - centerX) * -0.015,
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-30%] right-[-20%] w-[150vw] h-[120vh] bg-purple-400 rounded-[100%] blur-[250px] md:blur-[300px]"
        />
        
        <motion.div 
          style={{ y: y3 }}
          animate={{
            x: (mousePosition.x - centerX) * 0.01,
            scale: [1, 1.05, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[10%] w-[100vw] h-[80vh] bg-blue-300 rounded-[100%] blur-[200px] md:blur-[250px]"
        />
      </div>

      {/* Layer to soften the gradient even further */}
      <div className="absolute inset-0 bg-white/70 pointer-events-none z-[1]" />

      {/* Movable Individual Elements */}
      <div className="absolute inset-0 z-[2]">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            x: (mousePosition.x - centerX) * shape.factor,
            y: (mousePosition.y - centerY) * shape.factor,
            rotate: (mousePosition.x + mousePosition.y) * 0.01 * (i % 2 === 0 ? 1 : -1)
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 100 }}
          style={{ top: shape.top, left: shape.left }}
          className="absolute"
        >
          <shape.Icon 
            size={shape.size} 
            className="text-brand-primary" 
            style={{ 
              opacity: shape.opacity,
              fill: shape.fill ? 'currentColor' : 'none',
              strokeWidth: shape.fill ? 0 : 2
            }} 
          />
        </motion.div>
      ))}
      </div>
    </div>
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
      if (!target) return;
      
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        (typeof target.closest === 'function' && (
          target.closest('a') || 
          target.closest('button') ||
          target.closest('.cursor-pointer')
        )) ||
        (typeof target.getAttribute === 'function' && target.getAttribute('role') === 'button') ||
        (target.classList && target.classList.contains('cursor-pointer'));

      if (isInteractive) {
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
        className="fixed top-0 left-0 h-[1px] bg-brand-primary/40 pointer-events-none z-[9997]"
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
        className="fixed top-0 left-0 w-[1px] bg-brand-primary/40 pointer-events-none z-[9997]"
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
        className="fixed top-0 left-0 w-2 h-2 bg-brand-primary rounded-full pointer-events-none z-[9999]"
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
        className="fixed top-0 left-0 w-12 h-12 border border-brand-primary rounded-full pointer-events-none z-[9998]"
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

const Navbar = ({ isAdmin, onAdminClick, onLogoSecretClick, isDarkMode, onToggleTheme }: { isAdmin: boolean, onAdminClick: () => void, onLogoSecretClick: () => void, isDarkMode: boolean, onToggleTheme: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

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
          if (['home', 'about', 'portfolio', 'services', 'testimonials', 'contact'].includes(id)) {
            setActiveSection(id);
          } else if (id === 'skills') {
            // If in skills, maybe keep portfolio active or clear it? 
            // Usually skills is part of the "Portfolio" or "About" context in some designs.
            // Let's map skills to portfolio for better continuity if they are adjacent.
            setActiveSection('portfolio');
          } else if (id === 'faq') {
            setActiveSection('contact');
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ['home', 'about', 'portfolio', 'skills', 'services', 'contact', 'faq', 'testimonials'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: 'Home', id: 'home', href: '#home' },
    { name: 'About', id: 'about', href: '#about' },
    { name: 'Portfolio', id: 'portfolio', href: '#portfolio' },
    { name: 'Services', id: 'services', href: '#services' },
    { name: 'FAQ', id: 'faq', href: '#faq' },
    { name: 'Feedback', id: 'testimonials', href: '#testimonials' },
    { name: 'Contact', id: 'contact', href: '#contact' },
  ];

  const handleNavLinkClick = (id: string, e?: React.MouseEvent) => {
    scrollToSectionHelper(id, e);
    setActiveSection(id);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClickCombined = (e: React.MouseEvent) => {
    handleNavLinkClick('home', e);
    const now = Date.now();
    if (now - lastClickTime < 800) {
      const nextClicks = logoClicks + 1;
      setLogoClicks(nextClicks);
      if (nextClicks >= 5) {
        onLogoSecretClick();
        setLogoClicks(0);
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${isScrolled ? 'pt-4' : 'pt-8'}`}>
      <div className={`mx-auto transition-all duration-500 ease-out flex items-center justify-between md:grid md:grid-cols-3 ${isScrolled ? 'w-[calc(100%-2rem)] max-w-[1200px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/[0.04] rounded-full px-6 py-3' : 'w-full max-w-[1600px] px-6 py-2'}`}>
        {/* Logo (Left) */}
    <a href="#home" onClick={handleLogoClickCombined} className="flex items-center gap-3 relative z-10 justify-self-start select-none">
      <img 
        src="https://i.imgur.com/mNctGoH.png" 
        alt="Wahab Graphic Logo" 
        referrerPolicy="no-referrer" 
        className="w-10 h-10 rounded-full shadow-sm object-cover border border-slate-200/50 bg-white" 
        loading="lazy"
      />
      <span className="text-xl md:text-2xl font-display font-bold tracking-normal text-slate-900">Wahab Graphic<span className="text-brand-primary">.</span></span>
    </a>

        {/* Desktop Nav - Pill Style (Center) - Feedback and FAQ excluded from outside horizontal nav */}
        <div className={`hidden md:flex items-center justify-center gap-1 ${isScrolled ? '' : 'glass px-2 py-2 rounded-full'} relative justify-self-center`}>
          {navLinks.filter(link => link.id !== 'testimonials' && link.id !== 'faq').map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              onClick={(e) => handleNavLinkClick(link.id, e)}
              className={`px-6 py-2 text-sm font-bold rounded-full transition-all tracking-wide relative z-10 ${activeSection === link.id ? 'text-white' : 'text-slate-600 hover:text-brand-primary'}`}
            >
              {activeSection === link.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-brand-primary rounded-full -z-10 shadow-[0_5px_15px_rgba(124,60,237,0.2)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Menu Button (Right) */}
        <div className="hidden md:flex items-center justify-end justify-self-end gap-4">
          <ThemeToggleButton isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          {isAdmin && (
            <button 
              onClick={onAdminClick}
              className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all bg-white border-slate-200 group cursor-pointer"
              title="Admin Dashboard"
            >
              <UserIcon className="w-6 h-6 group-hover:scale-110 transition-transform text-slate-600 group-hover:text-white" />
            </button>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all bg-white border-slate-200 text-slate-600 cursor-pointer"
            title="Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-6 h-6 animate-pulse" />}
          </button>
        </div>

        {/* Mobile Toggle (Right) */}
        <div className="flex justify-end justify-self-end md:hidden gap-4 items-center">
          <ThemeToggleButton isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          {isAdmin && (
            <button 
              onClick={onAdminClick}
              className="text-slate-600 hover:text-brand-primary transition-colors cursor-pointer"
            >
              <UserIcon className="w-6 h-6" />
            </button>
          )}
          <button 
            className="text-slate-900 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Menu Dropdown Container */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className={`absolute top-full flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl z-50 mt-3
              w-[calc(100%-2rem)] left-4 items-center py-8 gap-6 rounded-[2rem]
              md:w-[280px] md:left-auto md:right-4 md:items-stretch md:py-6 md:px-3 md:gap-1`}
          >
            {/* Soft subtle header on desktop */}
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 pb-2 mb-1 border-b border-slate-100 hidden md:block">
              {isMobile ? "Navigation Menu" : "More Options"}
            </div>
            {(isMobile ? navLinks : navLinks.filter(link => ['faq', 'testimonials'].includes(link.id))).map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => handleNavLinkClick(link.id, e)}
                className={`w-[85%] md:w-full text-center md:text-left py-3 md:py-2.5 px-4 rounded-xl text-lg md:text-sm font-bold transition-all uppercase tracking-widest md:normal-case md:tracking-normal flex items-center justify-center md:justify-start gap-3 hover:bg-slate-50/80 cursor-pointer
                  ${activeSection === link.id ? 'text-brand-primary bg-slate-50' : 'text-slate-600 hover:text-brand-primary'}`}
              >
                {/* Visual active indicator dot */}
                <span className={`w-1.5 h-1.5 rounded-full bg-brand-primary transition-all duration-300 ${activeSection === link.id ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                {link.name}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ stats }: { stats: Stat[] }) => {
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
    <section id="home" className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 relative z-10 w-full pt-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="order-2 lg:order-1 flex flex-col justify-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-block"
          >
            <div className="inline-flex py-2 px-4 rounded-full glass border-white/40 shadow-sm text-xs md:text-sm font-semibold tracking-widest text-slate-500 uppercase">
              ✨ Logo Design, Brand Identity & Social Media
            </div>
          </motion.div>

          <div className="mb-6 flex items-baseline flex-wrap">
            <span className="text-xl md:text-2xl font-light text-slate-500 tracking-tight">Hi, I am </span>
            <span className="text-4xl sm:text-5xl md:text-6xl font-script font-semibold text-brand-primary ml-3">Abdul Wahab</span>
          </div>
          
          <h1 className="text-[40px] xs:text-[50px] sm:text-7xl md:text-8xl xl:text-[9rem] font-bold leading-[1.05] xs:leading-none md:leading-[1.02] mb-6 tracking-normal uppercase text-slate-900 drop-shadow-sm">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              Graphic
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-transparent bg-clip-text bg-gradient-to-br from-brand-primary via-brand-primary to-purple-400 block pb-2 drop-shadow-none"
            >
              Designer.
            </motion.span>
          </h1>
          
          <p className="text-slate-500 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
            I create <span className="font-medium text-slate-800">modern, clean, and impactful</span> designs that help brands stand out and communicate their message clearly.
          </p>
          
          <div className="flex flex-row items-center gap-2.5 sm:gap-4 mb-6 w-full max-w-md sm:max-w-none">
            <a 
              href="#portfolio" 
              onClick={(e) => scrollToSectionHelper('portfolio', e)}
              className="group relative overflow-hidden flex-[1.4] sm:flex-none px-5 sm:px-8 py-3.5 sm:py-4 bg-slate-900 text-white font-bold rounded-full hover:scale-105 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-3 text-xs sm:text-sm tracking-widest uppercase hover:shadow-2xl hover:shadow-slate-900/20 shrink-0 text-center whitespace-nowrap"
            >
              <span className="relative z-10 flex items-center gap-1 sm:gap-2">EXPLORE WORK <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-brand-primary transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0"></div>
            </a>
            <a 
              href="#contact" 
              onClick={(e) => scrollToSectionHelper('contact', e)}
              className="flex-[0.8] sm:flex-none px-5 sm:px-8 py-3.5 sm:py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 hover:text-brand-primary hover:border-brand-primary/30 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-3 text-xs sm:text-sm tracking-widest uppercase shrink-0 text-center whitespace-nowrap"
            >
              LET'S COLLABORATING
            </a>
          </div>

          {/* Horizontal Stats Card */}
          <div className="glass px-3 py-2.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl border-slate-200 shadow-lg flex flex-row items-center justify-between sm:justify-start gap-2.5 sm:gap-6 z-30 w-full sm:w-fit">
            {stats.map((stat) => (
              <div key={stat.id} className="flex items-center gap-1.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-brand-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  {stat.type === 'projects' && <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />}
                  {stat.type === 'clients' && <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />}
                  {stat.type === 'reviews' && <Award className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-lg font-bold text-slate-900 leading-tight">{stat.value}</p>
                  <p className="text-[9px] sm:text-xs text-slate-400 font-medium tracking-wide truncate">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="order-1 lg:order-2 relative flex justify-center items-center h-[380px] sm:h-[450px] lg:h-[600px] w-full"
        >
          {/* Circular Trails - Now centered with the avatar */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] md:w-[700px] md:h-[700px] border border-brand-primary/10 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] sm:w-[400px] sm:h-[400px] md:w-[550px] md:h-[550px] border border-brand-primary/5 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] border border-brand-primary/5 rounded-full pointer-events-none" />

          {/* Floating 3D Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Ai Icon */}
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-[15%] right-[10%] glass w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center z-20 border-brand-primary/30 shadow-[0_0_40px_rgba(124,60,237,0.2)]"
            >
              <div className="text-brand-primary font-black text-xl md:text-2xl">Ai</div>
            </motion.div>
            
            {/* Ps Icon */}
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute bottom-[15%] right-[15%] glass w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center z-20 border-brand-primary/30 shadow-[0_0_40px_rgba(124,60,237,0.2)]"
            >
              <div className="text-brand-primary font-black text-xl md:text-2xl">Ps</div>
            </motion.div>

            {/* Pen Tool */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-[40%] left-[5%] glass w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center z-20 border-white/20"
            >
              <PenTool className="text-brand-primary w-6 h-6 md:w-8 md:h-8" />
            </motion.div>
            
            {/* Palette */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1], x: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="absolute bottom-[30%] left-[10%] glass w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center z-20 border-white/20"
            >
              <Palette className="text-brand-primary w-6 h-6 md:w-8 md:h-8" />
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
          loading="eager"
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
    <section id="about" className="min-h-screen flex items-center py-24 scroll-mt-20 relative px-4 sm:px-6 md:px-8 xl:px-0">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="max-w-[1400px] mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-brand-primary/[0.03] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 md:p-16 lg:p-20 overflow-hidden"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
            <div className="min-w-0">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 mb-6 border border-slate-200/50">
                  <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">About Me</span>
                </div>
                               <h2 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.1]">
                  CRAFTING <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400 italic pr-1">VISUAL</span> <br />STORIES
                </h2>
                
                <div className="space-y-6 text-slate-500 text-lg md:text-xl leading-relaxed font-light mb-10">
                  <p>
                    Hello, I'm <span className="font-semibold text-slate-800">Wahab</span>, a passionate graphic designer who focuses on creating clean, modern, and visually engaging designs. I specialize in logo design, brand identity, and social media graphics that help businesses build a strong visual presence.
                  </p>
                  <p>
                    My goal is to help brands look professional and memorable through thoughtful and effective design.
                  </p>
                </div>

                <div className="flex flex-row sm:flex-wrap items-center justify-start overflow-x-auto sm:overflow-x-visible gap-2 sm:gap-4 pt-2 w-full no-scrollbar pb-3 sm:pb-0 snap-x snap-mandatory">
                  {['Logo Design', 'Social Media Design', 'Branding', 'Poster Design'].map((item, i) => (
                    <motion.div 
                      key={item} 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex-shrink-0 sm:flex-none flex items-center gap-1.5 sm:gap-3 bg-white/60 backdrop-blur-sm px-4 py-2.5 sm:px-5 sm:py-3 rounded-full border border-slate-200 shadow-sm justify-center sm:justify-start snap-center"
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary shrink-0" />
                      <span className="text-slate-700 text-xs sm:text-sm font-semibold truncate">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 relative">
              <div className="space-y-6 mt-12">
                <TiltCard className="cursor-default relative z-10 hover:-translate-y-2 transition-transform duration-500">
                  <div className="bg-white/80 backdrop-blur-md p-4 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-center border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group">
                    <h3 className="text-5xl md:text-6xl font-black text-slate-800 mb-3 group-hover:text-brand-primary transition-colors">5<span className="text-brand-primary">+</span></h3>
                    <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">Years Exp.</p>
                  </div>
                </TiltCard>
                <TiltCard className="cursor-default relative z-10 hover:-translate-y-2 transition-transform duration-500">
                  <div className="bg-white/80 backdrop-blur-md p-4 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-center border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group">
                    <h3 className="text-5xl md:text-6xl font-black text-slate-800 mb-3 group-hover:text-brand-primary transition-colors">150<span className="text-brand-primary">+</span></h3>
                    <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">Projects</p>
                  </div>
                </TiltCard>
              </div>
              <div className="space-y-6">
                <TiltCard className="cursor-default relative z-10 hover:-translate-y-2 transition-transform duration-500">
                   <div className="bg-white/80 backdrop-blur-md p-4 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-center border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group">
                    <h3 className="text-5xl md:text-6xl font-black text-slate-800 mb-3 group-hover:text-brand-primary transition-colors">99<span className="text-brand-primary">%</span></h3>
                    <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">Happy Clients</p>
                  </div>
                </TiltCard>
                <TiltCard className="cursor-default relative z-10 hover:-translate-y-2 transition-transform duration-500">
                  <div className="bg-white/80 backdrop-blur-md p-4 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-center border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group">
                    <h3 className="text-5xl md:text-6xl font-black text-slate-800 mb-3 group-hover:text-brand-primary transition-colors">24<span className="text-brand-primary">/</span>7</h3>
                    <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">Support</p>
                  </div>
                </TiltCard>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const Portfolio = ({ 
  categories, 
  projects, 
  currentPath, 
  navigateTo 
}: { 
  categories: Category[], 
  projects: Project[], 
  currentPath: string, 
  navigateTo: (path: string) => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Determine active states based on URL path
  const isProjectRoute = currentPath.startsWith('/project');
  
  const routeParts = useMemo(() => {
    return currentPath.split('/').filter(Boolean);
  }, [currentPath]);
  
  // routeParts: ['project', 'category-slug', 'project-slug']
  const categorySlug = routeParts[1] ? decodeURIComponent(routeParts[1]) : null;
  const projectSlug = routeParts[2] ? decodeURIComponent(routeParts[2]) : null;

  const selectedCategory = useMemo(() => {
    if (!categorySlug) return null;
    return categories.find(c => c.slug === categorySlug || slugify(c.name) === slugify(categorySlug));
  }, [categorySlug, categories]);

  const selectedProject = useMemo(() => {
    if (!selectedCategory || !projectSlug) return null;
    return projects.find(p => 
      p.categoryId === selectedCategory.id && 
      (slugify(p.name) === slugify(projectSlug) || p.id === projectSlug)
    );
  }, [projectSlug, selectedCategory, projects]);

  useEffect(() => {
    if (isProjectRoute) {
      document.body.style.overflow = 'hidden';
      (window as any).lenis?.stop();
    } else {
      document.body.style.overflow = '';
      (window as any).lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      (window as any).lenis?.start();
    };
  }, [isProjectRoute]);

  // Filter for published projects only (or projects without status field for backward compatibility)
  const publishedProjects = useMemo(() => {
    return projects.filter(p => !p.status || p.status === 'published');
  }, [projects]);

  const categoryProjects = useMemo(() => {
    return selectedCategory 
      ? publishedProjects.filter(p => p.categoryId === selectedCategory.id)
      : [];
  }, [selectedCategory, publishedProjects]);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return publishedProjects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, publishedProjects]);

  return (
    <>
      {/* 1. MAIN HOMEPAGE SECTION (Only visible on home / other paths, hidden inside /project) */}
      <section id="portfolio" className="min-h-screen flex items-center py-24 scroll-mt-20 relative px-4 md:px-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="max-w-[1600px] mx-auto w-full relative z-10 px-6">
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Selected Work</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-slate-900 tracking-tight"
            >
              MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400 italic pr-2">PORTFOLIO</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed"
            >
              Here are some of my selected design works. Each project focuses on creating visually appealing and effective designs that help brands communicate better with their audience.
            </motion.p>
          </div>        

          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-20 gap-x-10"
          >
            {categories.slice(0, 3).map((cat) => {
              const catProjects = publishedProjects.filter(p => p.categoryId === cat.id);
              return (
                <TiltCard key={cat.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="group relative w-full aspect-[4/3] cursor-pointer"
                    onClick={() => navigateTo(`/project/${cat.slug}`)}
                  >
                    {/* Sliding Papers (Projects) */}
                    <div className="absolute inset-x-6 top-6 bottom-6 z-10 flex justify-center pointer-events-none">
                      {catProjects.slice(0, 3).map((p, i) => (
                        <div
                          key={p.id}
                          className={`absolute bottom-0 w-full aspect-video bg-white p-1 rounded-xl shadow-xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] opacity-0 group-hover:opacity-100 border border-slate-200/50
                            ${i === 0 ? 'group-hover:-translate-y-28 group-hover:-rotate-3 group-hover:scale-[1.08] group-hover:shadow-2xl' : 
                              i === 1 ? 'group-hover:-translate-y-24 group-hover:rotate-2 group-hover:scale-[1.03] group-hover:shadow-xl' : 
                              'group-hover:-translate-y-20 group-hover:rotate-6 group-hover:scale-95 group-hover:shadow-lg'}
                          `}
                          style={{ zIndex: 10 + i }}
                        >
                          <div className="w-full h-full overflow-hidden rounded-lg">
                            <img
                              src={p.coverImage || undefined}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Front of the Folder Cover */}
                    <div className="absolute inset-0 z-20 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:top-14 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] group-hover:translate-y-2 group-hover:scale-115">
                      {cat.coverImage ? (
                        <img 
                          src={cat.coverImage} 
                          alt={cat.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-8">
                          <Folder className="w-20 h-20 mb-4 text-brand-primary/30" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 p-8 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        <h3 className="text-sm font-medium text-white tracking-widest uppercase text-center pb-0 mb-[-25px] transition-colors z-10">{cat.name}</h3>
                      </div>
                    </div>
                  </motion.div>
                </TiltCard>
              );
            })}
          </motion.div>

          {categories.length > 3 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-20"
            >
              <button 
                onClick={() => navigateTo('/project')}
                className="group relative flex items-center gap-3 px-10 py-4 rounded-full bg-slate-900 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden"
              >
                <span className="relative z-10">View All Projects</span>
                <div className="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </motion.div>
          )}

          {categories.length === 0 && (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-[3rem] shadow-sm">
              <p className="text-slate-400 italic">No categories found. Add some in the admin panel!</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. PREMIUM FULL-SCREEN PROJECT EXPLORER POPUP / WINDOW */}
      <AnimatePresence>
        {isProjectRoute && (
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-slate-50/98 dark:bg-slate-950/98 backdrop-blur-xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
          >
            {/* Header / Breadcrumb navigation bar */}
            <div className="border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-md relative z-30">
              <div className="flex items-center gap-3 text-sm font-medium">
                <button 
                  onClick={() => navigateTo('/')}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Home
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                <button 
                  onClick={() => navigateTo('/project')}
                  className={`${!selectedCategory ? 'text-brand-primary font-bold' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'} transition-colors`}
                >
                  All Folders
                </button>
                {selectedCategory && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                    <button 
                      onClick={() => navigateTo(`/project/${selectedCategory.slug}`)}
                      className={`${!selectedProject ? 'text-brand-primary font-bold' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'} transition-colors`}
                    >
                      {selectedCategory.name}
                    </button>
                  </>
                )}
                {selectedProject && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                    <span className="text-brand-primary font-bold truncate max-w-[150px]">
                      {selectedProject.name}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Dynamic project search */}
                <div className="relative hidden md:block">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary w-48 transition-all focus:w-64"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-sans">🔍</div>
                </div>

                <button 
                  onClick={() => navigateTo('/')}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:scale-105 transition-all shadow-sm"
                  title="Close Project Window"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12">
              <div className="max-w-[1400px] mx-auto w-full">
                
                {/* Search query layout */}
                {searchQuery.trim() ? (
                  <div>
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-900 pb-4">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        Search Results for "{searchQuery}"
                      </h3>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-brand-primary hover:underline font-bold"
                      >
                        Clear Search
                      </button>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {searchResults.map((p) => {
                          const catOfProj = categories.find(c => c.id === p.categoryId);
                          return (
                            <motion.div
                              key={p.id}
                              whileHover={{ y: -6 }}
                              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm cursor-pointer"
                              onClick={() => navigateTo(`/project/${catOfProj?.slug || 'unknown'}/${slugify(p.name)}`)}
                            >
                              <div className="aspect-video overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
                                <img
                                  src={p.coverImage}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                              </div>
                              <div className="p-4">
                                <span className="text-[10px] font-bold text-brand-primary tracking-wider uppercase">
                                  {catOfProj?.name || "Folder"}
                                </span>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                                  {p.name}
                                </h4>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-850">
                        <p className="text-slate-400 dark:text-slate-500 italic">
                          No matching projects found. Try different keywords!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Folder Root View (No folder selected) */}
                    {!selectedCategory ? (
                      <div className="space-y-12">
                        <div className="text-center max-w-xl mx-auto space-y-3">
                          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            PROJECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400 italic">DIRECTORY</span>
                          </h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            Welcome to my comprehensive works archive. Click on any of the folders below to explore custom project showcase galleries.
                          </p>
                        </div>

                        {/* Beautiful grid of all folders */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 pt-4">
                          {categories.map((cat) => {
                            const catProjects = publishedProjects.filter(p => p.categoryId === cat.id);
                            return (
                              <TiltCard key={cat.id}>
                                <motion.div
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="group relative w-full aspect-[4/3] cursor-pointer"
                                  onClick={() => navigateTo(`/project/${cat.slug}`)}
                                >
                                  {/* Sliding Papers */}
                                  <div className="absolute inset-x-6 top-6 bottom-6 z-10 flex justify-center pointer-events-none">
                                    {catProjects.slice(0, 3).map((p, i) => (
                                      <div
                                        key={p.id}
                                        className={`absolute bottom-0 w-full aspect-video bg-white p-1 rounded-xl shadow-xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] opacity-0 group-hover:opacity-100 border border-slate-200/50
                                          ${i === 0 ? 'group-hover:-translate-y-28 group-hover:-rotate-3 group-hover:scale-[1.08] group-hover:shadow-2xl' : 
                                            i === 1 ? 'group-hover:-translate-y-24 group-hover:rotate-2 group-hover:scale-[1.03] group-hover:shadow-xl' : 
                                            'group-hover:-translate-y-20 group-hover:rotate-6 group-hover:scale-95 group-hover:shadow-lg'}
                                        `}
                                        style={{ zIndex: 10 + i }}
                                      >
                                        <div className="w-full h-full overflow-hidden rounded-lg">
                                          <img
                                            src={p.coverImage || undefined}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Folder Front */}
                                  <div className="absolute inset-0 z-20 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:top-14 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] group-hover:translate-y-2 group-hover:scale-115">
                                    {cat.coverImage ? (
                                      <img 
                                        src={cat.coverImage} 
                                        alt={cat.name} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-8">
                                        <Folder className="w-20 h-20 mb-4 text-brand-primary/30" />
                                      </div>
                                    )}
                                    
                                    <div className="absolute inset-0 p-8 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                      <h3 className="text-sm font-medium text-white tracking-widest uppercase text-center pb-0 mb-[-25px] transition-colors z-10">{cat.name}</h3>
                                    </div>
                                  </div>
                                </motion.div>
                              </TiltCard>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Active Folder Content View */
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                          <button 
                            onClick={() => navigateTo('/project')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
                          >
                            <ArrowLeft className="w-5 h-5 text-brand-primary" />
                            <span>Back to Folders</span>
                          </button>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Portfolio <span className="text-brand-primary">/</span> {selectedCategory.name}
                          </h3>
                        </div>

                        <div className="py-12">
                          <PerspectiveCarousel 
                            projects={categoryProjects} 
                            onProjectClick={(p) => navigateTo(`/project/${selectedCategory.slug}/${slugify(p.name)}`)} 
                          />
                        </div>

                        {categoryProjects.length === 0 && (
                          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] mt-8 shadow-sm">
                            <p className="text-slate-400 dark:text-slate-500 italic">No projects found in this category.</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Immersive project viewer modal synced directly to deep URLs */}
            <AnimatePresence>
              {selectedProject && (
                <ProjectModal 
                  project={selectedProject} 
                  onClose={() => navigateTo(`/project/${selectedCategory?.slug}`)} 
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Skills = () => {
  return (
    <section id="skills" className="min-h-screen flex items-center py-24 scroll-mt-20 relative px-4 md:px-0">
      <div className="max-w-[1400px] mx-auto w-full relative z-10 px-6">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 mb-6">
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Expertise</span>
            </div>
            
            <h2 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">DESIGN <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400 italic pr-2">ARSENAL</span></h2>
            
            <p className="text-slate-500 text-lg md:text-xl mb-12 leading-relaxed font-light">
              My technical proficiency allows me to deliver high-quality designs that are both aesthetically pleasing and strategically sound.
            </p>
            
            <div className="space-y-8">
                {SKILLS.map((skill, i) => (
                  <motion.div 
                    key={skill.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-white/50 border border-slate-100 rounded-xl text-brand-primary shadow-sm`}>
                          {skill.icon}
                        </div>
                        <span className="font-semibold text-slate-800 tracking-tight text-lg">{skill.name}</span>
                      </div>
                      <span className={`text-brand-primary font-mono font-bold tracking-widest text-sm`}>{skill.level}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full bg-gradient-to-r from-brand-primary to-purple-400`}
                      />
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>

          <div className="relative hidden md:block mt-12 md:mt-0">
            <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-2 gap-8 relative z-10 w-full max-w-[500px] ml-auto">
              <div className="space-y-8 pt-12">
                <TiltCard className="cursor-default hover:-translate-y-2 transition-transform duration-500">
                  <div className="glass p-10 rounded-[2rem] aspect-square flex flex-col items-center justify-center gap-6 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group border-white/60">
                    <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-brand-primary/5 transition-colors">
                      <PenTool className="w-10 h-10 text-brand-primary" />
                    </div>
                    <span className="font-bold text-center text-slate-700 tracking-tight">Vector Art</span>
                  </div>
                </TiltCard>
                <TiltCard className="cursor-default hover:-translate-y-2 transition-transform duration-500">
                  <div className="glass p-10 rounded-[2rem] aspect-square flex flex-col items-center justify-center gap-6 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group border-white/60">
                    <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-brand-primary/5 transition-colors">
                      <Palette className="w-10 h-10 text-brand-primary" />
                    </div>
                    <span className="font-bold text-center text-slate-700 tracking-tight">Retouching</span>
                  </div>
                </TiltCard>
              </div>
              <div className="space-y-8">
                <TiltCard className="cursor-default hover:-translate-y-2 transition-transform duration-500">
                  <div className="glass p-10 rounded-[2rem] aspect-square flex flex-col items-center justify-center gap-6 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group border-white/60">
                    <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-brand-primary/5 transition-colors">
                      <Layout className="w-10 h-10 text-brand-primary" />
                    </div>
                    <span className="font-bold text-center text-slate-700 tracking-tight">UI Design</span>
                  </div>
                </TiltCard>
                <TiltCard className="cursor-default hover:-translate-y-2 transition-transform duration-500">
                  <div className="glass p-10 rounded-[2rem] aspect-square flex flex-col items-center justify-center gap-6 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all group border-white/60">
                    <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-brand-primary/5 transition-colors">
                      <Award className="w-10 h-10 text-brand-primary" />
                    </div>
                    <span className="font-bold text-center text-slate-700 tracking-tight">Branding</span>
                  </div>
                </TiltCard>
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
    <section id="services" className="min-h-screen flex items-center py-24 scroll-mt-20 relative px-4 md:px-0">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="max-w-[1400px] mx-auto w-full relative z-10 px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">What I Do</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight"
            >
              SERVICES I <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400 italic pr-2">OFFER</span>
            </motion.h2>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-500 max-w-md text-lg leading-relaxed font-light"
          >
            Specialized design services tailored to help your brand grow, engage audiences, and stand out in a competitive market.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {SERVICES.map((service, idx) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`glass p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-500 group border-white/60 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] relative overflow-hidden`}
            >
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className={`p-4 rounded-2xl bg-slate-50 shadow-sm inline-block group-hover:scale-110 transition-transform duration-500 text-${service.color} shrink-0`}>
                  {service.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight group-hover:text-brand-primary transition-colors leading-tight">{service.title}</h3>
              </div>
              <p className="text-slate-500 leading-relaxed font-light relative z-10">
                {service.description}
              </p>
              
              {/* Subtle background glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQS = [
  {
    question: "How long does a design project take?",
    answer: "Most projects are completed within 1–5 business days depending on complexity and revision requirements."
  },
  {
    question: "Do you provide source files?",
    answer: "Yes, source files can be provided upon request depending on the project package."
  },
  {
    question: "How many revisions are included?",
    answer: "I provide revisions to ensure the final design meets your expectations and project goals."
  },
  {
    question: "What design services do you offer?",
    answer: "I specialize in logo design, brand identity, social media graphics, marketing materials, and custom graphic design solutions."
  },
  {
    question: "Can you redesign my existing logo or brand?",
    answer: "Yes, I can modernize and improve existing logos and brand assets while maintaining brand recognition."
  },
  {
    question: "What information do you need before starting?",
    answer: "Project goals, brand details, design preferences, target audience, and any reference materials help achieve the best results."
  },
  {
    question: "Do you work with international clients?",
    answer: "Yes, I work remotely with clients worldwide and communicate throughout the project process."
  },
  {
    question: "How will I receive the final files?",
    answer: "Final files are delivered in high-quality formats suitable for both digital and print use."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 scroll-mt-20 relative px-4 md:px-0">
      {/* Subtle top divider to match services and skills dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-90" />
      
      {/* Soft dynamic brand color glow behind FAQ */}
      <div className="absolute left-1/4 bottom-0 w-96 h-96 bg-brand-primary/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1000px] mx-auto w-full relative z-10 px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">FAQ</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-4"
          >
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400 italic pr-2">Questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-500 max-w-xl mx-auto text-lg font-light leading-relaxed font-sans"
          >
            Common questions clients ask before starting a design project.
          </motion.p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="glass rounded-[1.5rem] border border-white/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] bg-white/40 backdrop-blur-md"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer transition-colors duration-300 select-none group focus:outline-none"
                >
                  <span className="font-semibold text-lg text-slate-800 tracking-tight pr-4 group-hover:text-brand-primary transition-colors">
                    {faq.question}
                  </span>
                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`p-2 transition-colors duration-300 flex items-center justify-center bg-transparent ${isOpen ? 'text-brand-primary' : 'text-slate-400 group-hover:text-brand-primary'}`}
                  >
                    {isOpen ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-1 text-slate-600 leading-relaxed font-light border-t border-slate-100/50 text-base md:text-[1.05rem]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["0.3 1", "1 1"]
  });

  // Smooth cinematic background dome centered on scroll without flipping or changing softness
  const scaleX = 1.1;
  const stretchY = 1.4;
  const yOffset1 = useTransform(scrollYProgress, [0, 1], ["-47%", "-53%"]);
  const yOffset2 = useTransform(scrollYProgress, [0, 1], ["-48%", "-52%"]);
  const yOffset3 = useTransform(scrollYProgress, [0, 1], ["-49%", "-51%"]);
  const opacity = 0.8;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          ...formData,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;

      alert('Message sent successfully!');
      setFormData({ fullName: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error("Error sending message:", err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      id="contact" 
      ref={containerRef}
      style={{ height: '2000px' }}
      className="min-h-[150vh] flex flex-col justify-center items-center relative overflow-hidden"
    >
      {/* Cinematic Curved Dome Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         {/* Outer Arc (Brand Color) blending into white */}
         <motion.div 
           style={{
             x: "-50%",
             y: yOffset1,
             scaleX,
             scaleY: stretchY,
             opacity: opacity
           }}
           className="absolute left-1/2 top-1/2 w-[200vw] md:w-[150vw] h-[90vh] md:h-[125vh] bg-brand-primary rounded-[100%] blur-[40px] md:blur-[60px] origin-center" 
         />
         {/* Middle Arc */}
         <motion.div 
           style={{
             x: "-50%",
             y: yOffset2,
             scaleX,
             scaleY: stretchY
           }}
           className="absolute left-1/2 top-1/2 w-[170vw] md:w-[125vw] h-[75vh] md:h-[105vh] bg-[#3111ac] rounded-[100%] blur-[30px] md:blur-[40px] opacity-95 origin-center" 
         />
         {/* Inner Core (The Darkest Void - Navy Blue) */}
         <motion.div 
           style={{
             x: "-50%",
             y: yOffset3,
             scaleX,
             scaleY: stretchY
           }}
           className="absolute left-1/2 top-1/2 w-[140vw] md:w-[100vw] h-[62vh] md:h-[85vh] bg-[#080d29] rounded-[100%] blur-[20px] md:blur-[30px] opacity-100 origin-center" 
         />
      </div>

      <div className="max-w-4xl mx-auto px-6 w-full relative z-20 text-center flex flex-col items-center py-12 mt-0 md:mt-0">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md mb-6 border border-white/15"
        >
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/90">Get In Touch</span>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[32px] xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-8 text-white !text-white tracking-tight leading-[1.3] xs:leading-[1.2] sm:leading-[1.1] drop-shadow-xl"
        >
          Let's Talk About <br />
          Your Project
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white/90 !text-white/90 text-lg md:text-xl lg:text-2xl mb-12 max-w-4xl mx-auto font-light leading-relaxed drop-shadow-md flex flex-col gap-2"
        >
          <span>Feel free to reach out for collaborations or just a friendly hello.</span>
          <span>I'm always open to discussing new projects and creative ideas.</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap justify-center items-center gap-4 md:gap-6 mt-4"
        >
          {[
            { name: 'WhatsApp', icon: MessageCircle, href: 'https://wa.me/8801973324750?text=Hello%20I%20want%20to%20discuss%20a%20design%20project' },
            { name: 'Email', icon: Mail, href: 'https://mail.google.com/mail/?view=cm&fs=1&to=aw6481299@gmail.com' },
            { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61584994744719' },
            { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/_wahab__graphic_/' },
            { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/abdul-wahab-988726409' }
          ].map((item, idx) => (
            <a 
              key={idx} 
              href={item.href} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-2xl hover:-translate-y-2 transition-all duration-300 border border-white/20 shadow-xl hover:shadow-[0_20px_40px_rgba(255,255,255,0.15)] group relative z-10 overflow-hidden text-white hover:bg-white/20"
              title={item.name}
            >
              <item.icon className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-110 transition-transform duration-300 relative z-10" />
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const WhatClientsSaid = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [rotation, setRotation] = useState(0);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTime = useRef<number>(0);

  const activeIdxRef = useRef(activeIdx);
  activeIdxRef.current = activeIdx;

  const prevRotationRef = useRef(rotation);
  const rotationDiff = rotation - prevRotationRef.current;

  useEffect(() => {
    prevRotationRef.current = rotation;
  }, [rotation]);

  const reviews = [
    {
      quote: "Working with Wahab was smooth from start to finish. The designs looked modern, clean, and exactly matched our brand direction.",
      client: "Rahim Ahmed",
      role: "Founder, Creative Agency"
    },
    {
      quote: "The thumbnail and branding work improved the visual quality of our online content. Communication and delivery were professional.",
      client: "Nusrat Jahan",
      role: "Content Creator"
    },
    {
      quote: "We wanted a premium but simple visual style, and the final result exceeded our expectations.",
      client: "Tanvir Hasan",
      role: "Small Business Owner"
    },
    {
      quote: "His logo design completely renovated our brand. We saw a noticeable increase in client trust immediately.",
      client: "Anika Rahman",
      role: "E-commerce Founder"
    },
    {
      quote: "Excellent vector illustration work and attention to details. Fast turnaround time and great response.",
      client: "Sayedul Karim",
      role: "Tech Product Lead"
    },
    {
      quote: "Wahab's banner and social media designs are outstanding. He easily turns complex concepts into gorgeous artwork.",
      client: "Taskin Ahmed",
      role: "Marketing Manager"
    },
    {
      quote: "Exceptional design standard! The YouTube templates and covers increased our engagement immensely.",
      client: "Fabiha Tasnim",
      role: "Digital Content Producer"
    },
    {
      quote: "Highly standard and quality designs delivered on time. The visual identity package is incredibly premium.",
      client: "Mahedi Hasan",
      role: "Startup Co-founder"
    }
  ];

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    const handleWheel = (e: WheelEvent) => {
      const rect = circle.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dist = Math.sqrt((mouseX - centerX) ** 2 + (mouseY - centerY) ** 2);
      
      // Adjust check bound to the physical avatar orbit circle (42% plus slight padding = ~46% of width)
      const maxRadius = rect.width * 0.46;
      
      if (dist > maxRadius) {
        // If mouse is outside the testimonial circle, let the page scroll normally, and do not rotate the reviews
        (window as any).lenis?.start();
        return;
      }

      // If mouse is inside the circle, allow smooth infinite loop of review transitions and prevent standard page scroll
      (window as any).lenis?.stop();
      e.preventDefault();
      e.stopPropagation();

      if (Math.abs(e.deltaY) < 12) return;

      const now = Date.now();
      const N = reviews.length;

      if (now - lastScrollTime.current > 400) { // slightly faster transitions for optimal feel (400ms)
        lastScrollTime.current = now;
        const currentActive = activeIdxRef.current;
        if (e.deltaY > 0) {
          // Scroll Down: Rotate to NEXT item (Infinite loop modulo)
          const nextIdx = (currentActive + 1) % N;
          setRotation(prev => prev + (360 / N));
          setActiveIdx(nextIdx);
        } else {
          // Scroll Up: Rotate to PREVIOUS item (Infinite loop modulo)
          const prevIdx = (currentActive - 1 + N) % N;
          setRotation(prev => prev - (360 / N));
          setActiveIdx(prevIdx);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = circle.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dist = Math.sqrt((mouseX - centerX) ** 2 + (mouseY - centerY) ** 2);
      const maxRadius = rect.width * 0.46;

      if (dist <= maxRadius) {
        (window as any).lenis?.stop();
      } else {
        (window as any).lenis?.start();
      }
    };

    const handleMouseLeave = () => {
      (window as any).lenis?.start();
    };

    circle.addEventListener('wheel', handleWheel, { passive: false });
    circle.addEventListener('mousemove', handleMouseMove);
    circle.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      circle.removeEventListener('wheel', handleWheel);
      circle.removeEventListener('mousemove', handleMouseMove);
      circle.removeEventListener('mouseleave', handleMouseLeave);
      (window as any).lenis?.start();
    };
  }, []);

  const handleSelect = (idx: number) => {
    const N = reviews.length;
    let steps = idx - activeIdx;
    
    // Calculate shortest angular offset on circle click to rotate seamlessly
    if (steps > N / 2) {
      steps -= N;
    } else if (steps < -N / 2) {
      steps += N;
    }
    
    setRotation(prev => prev + steps * (360 / N));
    setActiveIdx(idx);
  };

  const StarIcon = ({ className = "w-4 h-4 fill-amber-400 text-amber-400" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );

  const clientColors = [
    { 
      from: "from-violet-500", 
      to: "to-fuchsia-600", 
      border: "hover:border-violet-500/50 hover:bg-violet-50/40", 
      text: "group-hover:text-violet-600", 
      ring: "ring-violet-500/20",
      accent: "#8b5cf6",
      colors: {
        glowLine: "from-violet-500 to-fuchsia-400",
        rightBar: "bg-violet-500",
        bottomRight: "from-fuchsia-400 to-purple-600 shadow-fuchsia-500/25",
        ribbonMain: "from-violet-500 to-fuchsia-500 shadow-violet-500/25",
        ribbonFold: "bg-violet-800",
        ribbonTail: "from-fuchsia-600 to-violet-700 shadow-fuchsia-500/20"
      }
    },
    { 
      from: "from-rose-500", 
      to: "to-orange-500", 
      border: "hover:border-rose-500/50 hover:bg-rose-50/40", 
      text: "group-hover:text-rose-600", 
      ring: "ring-rose-500/20",
      accent: "#f43f5e",
      colors: {
        glowLine: "from-rose-500 to-orange-400",
        rightBar: "bg-rose-500",
        bottomRight: "from-orange-400 to-red-600 shadow-orange-500/25",
        ribbonMain: "from-rose-500 to-orange-500 shadow-rose-500/25",
        ribbonFold: "bg-rose-800",
        ribbonTail: "from-orange-500 to-rose-700 shadow-orange-500/25"
      }
    },
    { 
      from: "from-emerald-400", 
      to: "to-teal-600", 
      border: "hover:border-emerald-500/50 hover:bg-emerald-50/40", 
      text: "group-hover:text-emerald-600", 
      ring: "ring-emerald-500/20",
      accent: "#34d399",
      colors: {
        glowLine: "from-emerald-400 to-teal-400",
        rightBar: "bg-emerald-500",
        bottomRight: "from-teal-400 to-cyan-600 shadow-teal-500/25",
        ribbonMain: "from-emerald-400 to-teal-500 shadow-emerald-500/25",
        ribbonFold: "bg-emerald-800",
        ribbonTail: "from-teal-500 to-emerald-700 shadow-teal-500/20"
      }
    },
    { 
      from: "from-cyan-400", 
      to: "to-blue-600", 
      border: "hover:border-cyan-500/50 hover:bg-cyan-50/40", 
      text: "group-hover:text-cyan-600", 
      ring: "ring-cyan-500/20",
      accent: "#22d3ee",
      colors: {
        glowLine: "from-cyan-400 to-blue-400",
        rightBar: "bg-cyan-500",
        bottomRight: "from-blue-400 to-indigo-600 shadow-blue-500/25",
        ribbonMain: "from-cyan-400 to-blue-550 shadow-cyan-500/25",
        ribbonFold: "bg-cyan-800",
        ribbonTail: "from-blue-500 to-cyan-700 shadow-blue-500/20"
      }
    },
    { 
      from: "from-amber-400", 
      to: "to-orange-500", 
      border: "hover:border-amber-400/50 hover:bg-amber-50/40", 
      text: "group-hover:text-amber-600", 
      ring: "ring-amber-400/20",
      accent: "#fbbf24",
      colors: {
        glowLine: "from-amber-400 to-orange-400",
        rightBar: "bg-amber-400",
        bottomRight: "from-orange-400 to-amber-600 shadow-orange-500/25",
        ribbonMain: "from-amber-400 to-orange-400 shadow-amber-500/25",
        ribbonFold: "bg-amber-800",
        ribbonTail: "from-orange-500 to-amber-700 shadow-orange-500/20"
      }
    },
    { 
      from: "from-fuchsia-500", 
      to: "to-pink-600", 
      border: "hover:border-fuchsia-500/50 hover:bg-fuchsia-50/40", 
      text: "group-hover:text-fuchsia-600", 
      ring: "ring-fuchsia-500/20",
      accent: "#d946ef",
      colors: {
        glowLine: "from-fuchsia-500 to-pink-400",
        rightBar: "bg-fuchsia-500",
        bottomRight: "from-pink-400 to-rose-600 shadow-pink-500/25",
        ribbonMain: "from-fuchsia-500 to-pink-500 shadow-fuchsia-500/25",
        ribbonFold: "bg-fuchsia-800",
        ribbonTail: "from-pink-500 to-fuchsia-700 shadow-pink-500/20"
      }
    },
    { 
      from: "from-teal-400", 
      to: "to-emerald-500", 
      border: "hover:border-teal-400/50 hover:bg-teal-50/40", 
      text: "group-hover:text-teal-600", 
      ring: "ring-teal-500/20",
      accent: "#2dd4bf",
      colors: {
        glowLine: "from-teal-400 to-emerald-400",
        rightBar: "bg-teal-500",
        bottomRight: "from-emerald-400 to-green-600 shadow-emerald-500/25",
        ribbonMain: "from-teal-400 to-emerald-500 shadow-teal-500/25",
        ribbonFold: "bg-teal-800",
        ribbonTail: "from-emerald-500 to-teal-700 shadow-emerald-500/20"
      }
    },
    { 
      from: "from-purple-500", 
      to: "to-violet-700", 
      border: "hover:border-purple-500/50 hover:bg-purple-50/40", 
      text: "group-hover:text-purple-600", 
      ring: "ring-purple-500/20",
      accent: "#a855f7",
      colors: {
        glowLine: "from-purple-500 to-violet-500",
        rightBar: "bg-purple-500",
        bottomRight: "from-violet-500 to-fuchsia-700 shadow-violet-500/25",
        ribbonMain: "from-purple-500 to-violet-600 shadow-purple-500/25",
        ribbonFold: "bg-purple-800",
        ribbonTail: "from-violet-600 to-purple-800 shadow-violet-500/20"
      }
    }
  ];

  // Position angles symmetrically around the entire 360-degree circle
  const getPositionStyles = (index: number) => {
    const angleInDegrees = -90 + (index * 360) / reviews.length;
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    
    // Orbit radius (42% of container width)
    const radius = 42; 
    const x = 50 + radius * Math.cos(angleInRadians);
    const y = 50 + radius * Math.sin(angleInRadians);
    
    return {
      left: `${x}%`,
      top: `${y}%`
    };
  };

  return (
    <section 
      id="testimonials" 
      className="py-24 scroll-mt-20 relative px-4 md:px-0 bg-transparent overflow-hidden"
    >
      {/* Subtle top divider to match services and skills dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-90" />
      
      {/* Soft gorgeous ambient brand glows */}
      <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/[0.025] rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-400/[0.02] rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto w-full relative z-10 px-6">
        
        {/* Centered header content with matching gradients and typography styles */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Feedback</span>
          </motion.div>
          
          <h2 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight uppercase text-slate-900 leading-tight">
            WHAT CLIENTS <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400 italic pr-2">SAID</span>
          </h2>
          
          <p className="text-slate-500 max-w-xl mx-auto text-lg font-light leading-relaxed font-sans">
            Honest feedback and appreciation from creative founders, content creators, and small business partners.
          </p>
        </div>

        {/* Circular Testimonials Diagram Presentation Container */}
        <div className="w-full relative py-4 flex flex-col items-center justify-center overflow-visible">
          
          {/* Main 100% fluid custom circle tracker layout with responsive scaling for mobile viewports */}
          <div 
            ref={circleRef}
            className="hidden sm:block w-full max-w-[620px] aspect-square relative scale-[0.80] xs:scale-[0.88] sm:scale-100 transition-transform duration-300 origin-center"
          >
            
            
             {/* Rotating Orbit Container (Wrapper for Track and Avatars) */}
            <motion.div
              className="absolute inset-0 w-full h-full z-[6]"
              animate={{ rotate: -rotation }}
              transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
            >
              {/* Double-layered glowing circular track lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer concentric subtle dot ring */}
                <circle cx="50" cy="50" r="46" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 3" className="opacity-40" />
                {/* Main solid orbit track ring */}
                <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="1.25" />
                {/* Inner concentric technical track line */}
                <circle cx="50" cy="50" r="38" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3 4" className="opacity-40" />
              </svg>
  
               {/* Individual Client Circles placed symmetrically around the circular track */}
              {reviews.map((rev, idx) => {
                const isActive = activeIdx === idx;
                const posStyles = getPositionStyles(idx);
                const colorTheme = clientColors[idx % clientColors.length];
                
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    style={posStyles}
                    animate={{ 
                      rotate: rotation,
                      scale: isActive ? 1.3 : 1
                    }}
                    transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 focus:outline-none cursor-pointer group ${isActive ? 'z-30' : 'z-20'}`}
                  >
                    <div className="relative">
                      {isActive && (
                        <>
                          <motion.span 
                            className={`absolute -inset-2.5 rounded-full bg-gradient-to-tr ${colorTheme.from}/10 ${colorTheme.to}/10 border border-brand-primary/20`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <span className="absolute -inset-1 rounded-full border border-white bg-transparent z-[1]" />
                        </>
                      )}
                      
                      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex flex-col items-center justify-center font-bold text-xs tracking-tight transition-all duration-500 relative ${
                        isActive 
                          ? `bg-gradient-to-tr ${colorTheme.from} ${colorTheme.to} text-white shadow-[0_10px_25px_rgba(124,60,237,0.3)] border-2 border-white ring-4 ${colorTheme.ring}`
                          : `bg-white/95 border border-slate-200 text-slate-500 select-none backdrop-blur-sm ${colorTheme.border} ${colorTheme.text}`
                      }`}>
                        <span className={`transition-all duration-300 ${isActive ? 'text-[13px] font-black tracking-tight drop-shadow-sm font-display' : 'text-xs font-semibold font-sans'}`}>
                          {rev.client.split(' ').map(n => n[0]).join('')}
                        </span>
                        
                        {isActive && (
                          <span className="text-[5px] font-extrabold text-[rgba(255,255,255,0.75)] tracking-widest uppercase font-mono mt-0.5 leading-none">
                            ACT
                          </span>
                        )}
                      </div>
  
                       {/* Tiny tooltip indicator showing client first name on hover if NOT active */}
                      {!isActive && (
                        <div className="absolute top-[125%] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-semibold py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-md">
                          {rev.client}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
  
            {/* Dynamic Connecting Vertical Line synced with active bubble accent color & inertial pendulum swing physics */}
            {(() => {
              const colorTheme = clientColors[activeIdx % clientColors.length];
              const initialTilt = rotationDiff > 0 ? 18 : (rotationDiff < 0 ? -18 : 0);
              return (
                <motion.div
                  key={`line-connector-${activeIdx}-${rotation}`}
                  initial={{ 
                    height: 0, 
                    opacity: 0, 
                    rotate: initialTilt,
                    scaleY: 0.4
                  }}
                  animate={{ 
                    height: "18.5%", 
                    opacity: 0.95, 
                    rotate: 0,
                    scaleY: 1
                  }}
                  transition={{ 
                    rotate: {
                      type: "spring",
                      stiffness: 85,
                      damping: 8,
                      mass: 0.85
                    },
                    height: { duration: 0.45, ease: "easeOut" },
                    scaleY: { duration: 0.45, ease: "easeOut" },
                    opacity: { duration: 0.3 }
                  }}
                  className="absolute left-1/2 -translate-x-1/2 top-[12.5%] w-[1.5px] z-[4] origin-top"
                  style={{
                    background: `linear-gradient(to bottom, ${colorTheme.accent} 0%, rgba(226, 232, 240, 0.2) 100%)`
                  }}
                >
                  {/* Travelling liquid/laser drop that shoots down the connecting line */}
                  <motion.div
                    initial={{ top: "0%", opacity: 0, scale: 0.5 }}
                    animate={{ top: "100%", opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.6] }}
                    transition={{ 
                      duration: 0.55, 
                      ease: "easeOut",
                      delay: 0.12
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-lg pointer-events-none"
                    style={{ 
                      backgroundColor: colorTheme.accent,
                      boxShadow: `0 0 10px 2px ${colorTheme.accent}`
                    }}
                  />
                </motion.div>
              );
            })()}

            {/* Center Review Statement Box Containing dynamic testimonial statements */}
            <AnimatePresence mode="wait">
              {(() => {
                const colorTheme = clientColors[activeIdx % clientColors.length];
                return (
                  <motion.div
                    key={`testimonial-card-${activeIdx}`}
                    initial={{ scale: 0.4, opacity: 0, rotate: -25, x: 60 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0, x: 0 }}
                    exit={{ scale: 0.4, opacity: 0, rotate: 25, x: -60 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 350,
                      damping: 24,
                      mass: 0.8
                    }}
                    className="hidden sm:flex absolute top-[31%] w-[46%] h-[38%] left-[27%] z-20 flex-col items-center justify-center group"
                  >
                    {/* The main slanted card body matching the user sketch design perfectly but with the site's default light glass look */}
                    <div className="absolute inset-0 bg-white/95 border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition-all duration-300 transform skew-y-[-4.5deg] origin-center z-0 flex flex-col justify-between items-center overflow-visible">
                      
                      {/* Glowing custom-themed line at the top to match the reference banner design layout */}
                      <div className={`absolute top-[4%] left-[10%] w-[60%] h-[3px] bg-gradient-to-r ${colorTheme.colors.glowLine} opacity-95 rounded-full shadow-sm`} />
                      
                      {/* Clean vertical thick brand accent strip on the right boundary */}
                      <div className={`absolute top-[15%] right-0 w-[4px] h-[35%] ${colorTheme.colors.rightBar} rounded-l`} />

                      {/* SKEWED LAYERS BEHIND / UNDERNEATH */}
                      {/* Blue polygon accent block peeking underneath at the right bottom */}
                      <div className={`absolute bottom-[-9px] right-[12%] w-[38%] h-[14px] bg-gradient-to-r ${colorTheme.colors.bottomRight} rounded-[2px] transform skew-x-[-20deg] -z-10`} />
                      
                      {/* Folded Ribbon hanging underneath on the left bottom */}
                      {/* 1. Horizontal banner belt */}
                      <div className={`absolute bottom-[-9px] left-[12%] w-[42%] h-[14px] bg-gradient-to-r ${colorTheme.colors.ribbonMain} transform skew-x-[-20deg] -z-10`} />
                      
                      {/* 2. Fold connection shadow (overlapping triangle) - vertically aligned perfectly at top: -9px, horizontally matched precisely to tail's right edge */}
                      <div className={`absolute bottom-[-19px] left-[28%] w-[4%] h-[10px] ${colorTheme.colors.ribbonFold} -z-20`} style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />

                      {/* 3. Hanging tail ribbon bookmark - vertically aligned perfectly at top: -9px */}
                      <div className={`absolute bottom-[-39px] left-[20%] w-[8%] h-[30px] bg-gradient-to-b ${colorTheme.colors.ribbonTail} -z-30`} style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%)' }} />
                    </div>

                    {/* Content Layer (Kept completely flat / non-skewed for reading satisfaction) */}
                    <div className="relative z-10 w-full h-full p-4 sm:p-5 flex flex-col justify-between items-center text-center">
                      {/* Styled Quote Signifier with Brand Gradient Border */}
                      <div className="p-1 sm:p-1.5 rounded-xl bg-slate-50 border border-slate-100 shadow-inner mb-0.5 pointer-events-none">
                        <Quote className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" style={{ color: colorTheme.accent }} />
                      </div>
     
                      <div className="flex flex-col items-center space-y-1 sm:space-y-1.5 max-w-xs sm:max-w-md">
                        {/* Minimal star score */}
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <StarIcon key={s} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
     
                        {/* Testimonial Statement Quote */}
                        <div className="overflow-y-auto max-h-[50px] xs:max-h-[65px] sm:max-h-[90px] px-1 scrollbar-thin">
                          <p className="text-slate-600 text-[9px] xs:text-xs sm:text-sm lg:text-[12px] font-medium leading-relaxed italic tracking-tight font-sans">
                            "{reviews[activeIdx].quote}"
                          </p>
                        </div>
                      </div>
     
                      {/* Elegant bottom divider & reviewer name designation */}
                      <div className="w-full flex flex-col items-center mt-1 pt-1 border-t border-slate-100">
                        <h4 className="font-extrabold text-slate-800 text-[11px] sm:text-xs font-display tracking-tight uppercase leading-tight">
                          {reviews[activeIdx].client}
                        </h4>
                        <p className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest mt-0.5" style={{ color: colorTheme.accent }}>
                          {reviews[activeIdx].role}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
 
          </div>

          {/* Mobile Testimonial Viewport - beautiful and highly optimized layout for mobile devices (< sm) */}
          <div className="block sm:hidden w-full max-w-[430px] px-2 relative z-10 py-2">
            
            {/* 1. Horizontal scrollable list/rail of client initials avatar buttons */}
            <div className="flex items-center gap-2.5 overflow-x-auto py-3 px-1 no-scrollbar w-full mb-5 scroll-smooth snap-x">
              {reviews.map((rev, idx) => {
                const isActive = activeIdx === idx;
                const colorTheme = clientColors[idx % clientColors.length];
                return (
                  <button
                    key={`mobile-avatar-${idx}`}
                    onClick={() => handleSelect(idx)}
                    className={`flex-shrink-0 w-11 h-11 rounded-full flex flex-col items-center justify-center font-bold text-xs transition-all duration-300 snap-center ${
                      isActive
                        ? `bg-gradient-to-tr ${colorTheme.from} ${colorTheme.to} text-white scale-110 shadow-[0_6px_15px_rgba(124,60,237,0.25)] ring-2 ring-violet-200 border border-white`
                        : 'bg-white border border-slate-200 text-slate-500 shadow-sm'
                    }`}
                  >
                    <span className="text-[11px] font-bold">
                      {rev.client.split(' ').map(n => n[0]).join('')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. Testimonial Card */}
            <AnimatePresence mode="wait">
              {(() => {
                const colorTheme = clientColors[activeIdx % clientColors.length];
                return (
                  <motion.div
                    key={`testimonial-card-mobile-${activeIdx}`}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="relative bg-white/95 border border-slate-200/80 shadow-[0_15px_35px_rgba(15,23,42,0.06)] backdrop-blur-2xl rounded-[1.5rem] w-full p-6 flex flex-col items-center text-center overflow-hidden"
                  >
                    {/* Elegant custom-themed glow line at the top */}
                    <div className={`absolute top-0 left-[10%] w-[80%] h-[4px] bg-gradient-to-r ${colorTheme.colors.glowLine} opacity-95 rounded-b-full shadow-sm`} />
                    
                    {/* Clean right brand accent strip */}
                    <div className={`absolute top-[20%] right-0 w-[4px] h-[30%] ${colorTheme.colors.rightBar} rounded-l-md`} />

                    {/* Styled Quote Signifier with Brand Accent Background */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner mb-4 pointer-events-none mt-1">
                      <Quote className="w-5 h-5 stroke-[2.5]" style={{ color: colorTheme.accent }} />
                    </div>
                    
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <StarIcon key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    {/* Testimonial Quote - Fully readable and clear */}
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic tracking-tight font-sans px-1 mb-5">
                      "{reviews[activeIdx].quote}"
                    </p>

                    {/* Bottom Divider / Designations */}
                    <div className="w-full flex flex-col items-center pt-4 border-t border-slate-100">
                      <h4 className="font-extrabold text-slate-800 text-sm font-display tracking-tight uppercase leading-tight">
                        {reviews[activeIdx].client}
                      </h4>
                      <p className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: colorTheme.accent }}>
                        {reviews[activeIdx].role}
                      </p>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* 3. Slider controls below card (Next / Prev arrows with pagination dots) */}
            <div className="flex items-center justify-between w-full mt-6 px-1">
              <button
                onClick={() => handleSelect((activeIdx - 1 + reviews.length) % reviews.length)}
                className="p-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              
              <div className="flex items-center gap-1.5 overflow-hidden max-w-[150px] py-1">
                {reviews.map((_, idx) => (
                  <span 
                    key={`dot-${idx}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeIdx === idx ? 'w-4 bg-brand-primary' : 'w-1.5 bg-slate-200'}`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleSelect((activeIdx + 1) % reviews.length)}
                className="p-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

const SortableLayerItem = ({ item, originalIndex, isSelected, onSelect, onMoveUp, onMoveDown, itemsLength }: { item: any, originalIndex: number, isSelected: boolean, onSelect: () => void, onMoveUp: () => void, onMoveDown: () => void, itemsLength: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onSelect}
      className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${
        isSelected 
          ? 'bg-brand-primary/10 border-brand-primary/50 shadow-lg shadow-brand-primary/5' 
          : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
      }`}
    >
      <div className="w-10 h-10 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-200 relative">
        <img src={item.src || undefined} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="layer" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium truncate ${isSelected ? 'text-brand-primary' : 'text-slate-700'}`}>
            Image {originalIndex + 1}
          </p>
        </div>
        <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
          {Math.round(item.width)}x{Math.round(item.height)} • {Math.round(item.x)},{Math.round(item.y)}
        </p>
      </div>
      
      <div className="flex flex-col gap-0.5">
        <button 
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={originalIndex === itemsLength - 1}
          className="p-1 hover:bg-slate-200 rounded disabled:opacity-0 text-slate-400 hover:text-slate-900 transition-all"
          title="Bring Forward"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={originalIndex === 0}
          className="p-1 hover:bg-slate-200 rounded disabled:opacity-0 text-slate-400 hover:text-slate-900 transition-all"
          title="Send Backward"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

function SortableCategoryItem({ cat, onEdit, onDelete, onBrowse }: { cat: any, onEdit: (cat: any) => void, onDelete: (id: string) => void, onBrowse: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`bg-white border border-slate-200 p-6 rounded-3xl flex justify-between items-center group relative overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${isDragging ? 'shadow-2xl ring-2 ring-brand-primary/50 scale-105' : ''}`}
    >
      {cat.coverImage && (
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
          <img src={cat.coverImage} alt={cat.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative z-10 flex-1">
        <p className="font-bold text-lg text-slate-900">{cat.name}</p>
        <p className="text-xs text-slate-400 font-mono">/{cat.slug}</p>
        <button 
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onBrowse(cat.id); }}
          className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          Manage Projects <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="relative z-10 flex items-center gap-2" onPointerDown={e => e.stopPropagation()}>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
          className="p-3 text-slate-400 hover:text-brand-primary transition-colors bg-slate-100 rounded-full cursor-pointer"
          title="Edit Folder"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(cat.id); }}
          className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 rounded-full cursor-pointer"
          title="Delete Folder"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

const STATIC_STATS = [
  { id: '1', label: 'Projects', value: '18', type: 'projects' },
  { id: '2', label: 'Real Client', value: '7', type: 'clients' },
  { id: '3', label: 'Reviews', value: '4.2+', type: 'reviews' },
];

const playMelodicTune = (frequency: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // Main warm base tone (Sine wave)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    
    // Sparkly crystal chime overtone (Octave harmonic for premium feel)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    
    const filter = audioCtx.createBiquadFilter();
    
    osc1.type = 'sine'; 
    osc1.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, audioCtx.currentTime); // Pure crystalline octave
    
    // Soft attack and luxurious ambient release for main tone
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.2);
    
    // Sparkly short burst for the octave chime
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
    
    // Smooth filter sweep
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 2.5);
    filter.Q.value = 1.2;
    
    osc1.connect(gain1);
    gain1.connect(filter);
    
    osc2.connect(gain2);
    gain2.connect(filter);
    
    filter.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(audioCtx.currentTime + 3.2);
    osc2.stop(audioCtx.currentTime + 3.2);
    
    setTimeout(() => audioCtx.close(), 3800);
  } catch (e) {
    console.error("Audio failed", e);
  }
};

const InteractiveGuitarTicker = ({ themeStyles }: { themeStyles: any }) => {
  const [plucks, setPlucks] = useState<{ [key: number]: { x: number, intensity: number, direction: number, time: number } }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<(SVGPathElement | null)[]>([]);
  const lastYRef = useRef<number | null>(null);

  // Generate 36 strings evenly spaced
  const strings = useMemo(() => Array.from({ length: 36 }).map((_, i) => ({
    y: 2 + (i * (96 / 35)), // 2% to 98%
    freq: 130.81 * Math.pow(1.059463, i) // C3 as base, musical scale
  })), []);

  useAnimationFrame((time) => {
    strings.forEach((string, i) => {
      const pluck = plucks[i];
      const path = pathsRef.current[i];
      if (!path) return;

      if (!pluck || pluck.intensity <= 0.05) {
        path.setAttribute('d', `M 0 ${string.y} L 1000 ${string.y}`);
        return;
      }

      const elapsed = (time - pluck.time) / 1000;
      const decay = Math.exp(-elapsed * 5); // Slower movement decay for longer sound
      const oscillation = Math.sin(elapsed * 50) * pluck.intensity * (pluck.direction || 1) * decay;
      
      const x = pluck.x;
      const range = 100;

      const d = `M 0 ${string.y} L ${x - range} ${string.y} Q ${x} ${string.y + oscillation} ${x + range} ${string.y} L 1000 ${string.y}`;
      path.setAttribute('d', d);

      if (decay < 0.01) {
        setPlucks(prev => {
          const next = { ...prev };
          delete next[i];
          return next;
        });
      }
    });
  });

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const virtualX = (x / rect.width) * 1000;
    const virtualY = (y / rect.height) * 100;

    if (lastYRef.current !== null) {
      const prevY = lastYRef.current;
      const deltaY = virtualY - prevY;
      
      if (Math.abs(deltaY) > 0.01) {
        const direction = deltaY > 0 ? 1 : -1;

        strings.forEach((string, i) => {
          const minBound = Math.min(prevY, virtualY);
          const maxBound = Math.max(prevY, virtualY);
          
          // Check if mouse crossed this string's Y coordinate or is extremely close
          const isCrossing = string.y >= minBound && string.y <= maxBound;
          const isExtremelyClose = Math.abs(virtualY - string.y) < 0.6;

          if (isCrossing || isExtremelyClose) {
            const lastPluck = plucks[i];
            const now = performance.now();
            // Debounce/cooldown to prevent double triggering same string instantly
            if (!lastPluck || (now - lastPluck.time) > 150) {
              setPlucks(prev => ({
                ...prev,
                [i]: { x: virtualX, intensity: 5, direction: direction, time: now }
              }));
              playMelodicTune(string.freq);
            }
          }
        });
      }
    }
    
    lastYRef.current = virtualY;
  };

  const handleMouseLeave = () => {
    lastYRef.current = null;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full bg-transparent relative select-none overflow-hidden h-64 md:h-96 flex items-center"
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleMouseLeave}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <defs>
          <pattern id="tickerTextPattern" x="0" y="0" width="2000" height="100" patternUnits="userSpaceOnUse">
             <motion.g
               animate={{ x: [0, -2000] }}
               transition={{ duration: 45, ease: "linear", repeat: Infinity }}
             >
                <text 
                  x="0" y="85" 
                  fontSize="110" fontWeight="900" 
                  textAnchor="start" fill="white" 
                  className="uppercase font-sans"
                  textLength="2000" lengthAdjust="spacing"
                >
                  WAHAB • GRAPHIC • WAHAB • GRAPHIC • 
                </text>
                <text 
                  x="2000" y="85" 
                  fontSize="110" fontWeight="900" 
                  textAnchor="start" fill="white" 
                  className="uppercase font-sans"
                  textLength="2000" lengthAdjust="spacing"
                >
                  WAHAB • GRAPHIC • WAHAB • GRAPHIC • 
                </text>
             </motion.g>
          </pattern>
          <mask id="tickerMask">
             <rect width="100%" height="100%" fill="url(#tickerTextPattern)" />
          </mask>
        </defs>

        <g mask="url(#tickerMask)">
          {strings.map((string, i) => (
            <path
              key={i}
              ref={el => { pathsRef.current[i] = el; }}
              d={`M 0 ${string.y} L 1000 ${string.y}`}
              stroke={themeStyles.brandPrimary}
              strokeWidth="0.05"
              fill="none"
              opacity="1"
            />
          ))}
        </g>
        
        {/* Background text visibility set to 0 for pure string-mask effect */}
        <rect width="100%" height="100%" fill="url(#tickerTextPattern)" opacity="0" />
      </svg>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<Stat[]>(STATIC_STATS);

  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate-changed', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate-changed', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new Event('pushstate-changed'));
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isThemeAnimating, setIsThemeAnimating] = useState(false);

  const handleToggleTheme = () => {
    playMechanicalClick();
    
    setIsThemeAnimating(true);

    // Toggle theme halfway through the sweep
    setTimeout(() => {
      setIsDarkMode(!isDarkMode);
    }, 450);

    setTimeout(() => {
      setIsThemeAnimating(false);
    }, 1200);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [themeStyles, setThemeStyles] = useState({
    brandPrimary: localStorage.getItem('style_brand_primary') || '#7c3ced',
    lightBackground: localStorage.getItem('style_light_bg') || '#fafafa',
    displayFont: (localStorage.getItem('style_font_display') === 'Space Grotesk' || localStorage.getItem('style_font_display') === 'ROYAL Hefana' || localStorage.getItem('style_font_display') === 'Lovelace' || localStorage.getItem('style_font_display') === 'lovelace' || !localStorage.getItem('style_font_display')) ? 'Blushing Rose Regular' : localStorage.getItem('style_font_display')!,
    sansFont: (localStorage.getItem('style_font_sans') === 'Inter' || !localStorage.getItem('style_font_sans')) ? 'Plus Jakarta Sans' : localStorage.getItem('style_font_sans')!,
    scriptFont: localStorage.getItem('style_font_script') || 'Dancing Script',
    footerNote: localStorage.getItem('style_footer_note') || 'Note: These colors and fonts have been specifically chosen to maintain a premium and modern graphic designer portfolio aesthetic in light mode.'
  });

  useEffect(() => {
    localStorage.setItem('style_brand_primary', themeStyles.brandPrimary);
    localStorage.setItem('style_light_bg', themeStyles.lightBackground);
    localStorage.setItem('style_font_display', themeStyles.displayFont);
    localStorage.setItem('style_font_sans', themeStyles.sansFont);
    localStorage.setItem('style_font_script', themeStyles.scriptFont);
    localStorage.setItem('style_footer_note', themeStyles.footerNote);

    document.documentElement.style.setProperty('--color-brand-primary', themeStyles.brandPrimary);
    document.documentElement.style.setProperty('--color-dark-bg', themeStyles.lightBackground);
    document.documentElement.style.setProperty('--font-display', `"${themeStyles.displayFont}", sans-serif`);
    document.documentElement.style.setProperty('--font-sans', `"${themeStyles.sansFont}", sans-serif`);
    document.documentElement.style.setProperty('--font-script', `"${themeStyles.scriptFont}", cursive`);
  }, [themeStyles]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 2.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    (window as any).lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, []);

  useEffect(() => {
    // Stats are now static
  }, [stats]);

  useEffect(() => {
    if (showAdmin) {
      document.body.style.overflow = 'hidden';
      (window as any).lenis?.stop();
    } else {
      document.body.style.overflow = '';
      (window as any).lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      (window as any).lenis?.start();
    };
  }, [showAdmin]);

  const adminEmail = "sayedart1999@gmail.com";

  const logOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: "https://wahab-graphic-one.vercel.app"
      }
    });
    if (error) console.error("Error signing in:", error);
  };

  const [footerClicks, setFooterClicks] = useState(0);
  const [footerLastClick, setFooterLastClick] = useState(0);

  const handleLogoSecretClick = () => {
    if (isAdmin) {
      setShowAdmin(true);
    } else {
      signInWithGoogle();
    }
  };

  const handleFooterLogoClick = () => {
    const now = Date.now();
    if (now - footerLastClick < 800) {
      const nextClicks = footerClicks + 1;
      setFooterClicks(nextClicks);
      if (nextClicks >= 5) {
        handleLogoSecretClick();
        setFooterClicks(0);
      }
    } else {
      setFooterClicks(1);
    }
    setFooterLastClick(now);
  };

  useEffect(() => {
    // Initial load handling
    const initializeApp = async () => {
      const start = Date.now();
      
      try {
        // 1. Get session first to determine admin status
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        const isUserAdmin = u?.email === adminEmail;
        
        setUser(u);
        setIsAdmin(isUserAdmin);

        // 2. Fetch categories and projects in parallel
        const [catsRes, projsRes] = await Promise.all([
          supabase.from('categories').select('*').order('order', { ascending: true }),
          isUserAdmin 
            ? supabase.from('portfolio_projects').select('*').order('created_at', { ascending: false })
            : supabase.from('portfolio_projects').select('*').eq('status', 'published').order('created_at', { ascending: false })
        ]);

        if (catsRes.data) {
          setCategories(catsRes.data.map(c => ({
            ...c,
            coverImage: c.cover_image
          })));
        }

        if (projsRes.data) {
          setProjects(projsRes.data.map(p => ({
            ...p,
            coverImage: p.cover_image,
            categoryId: p.category_id,
            canvasData: p.canvas_data,
            canvasBackgroundColor: p.canvas_background_color,
            canvasHeight: p.canvas_height,
            createdAt: p.created_at
          })));
        } else if (projsRes.error && projsRes.error.code === '42703') {
           // Fallback if status column is missing
           const { data: allData } = await supabase
             .from('portfolio_projects')
             .select('*')
             .order('created_at', { ascending: false });
           
           if (allData) {
             setProjects(allData.map(p => ({
               ...p,
               coverImage: p.cover_image,
               categoryId: p.category_id,
               canvasData: p.canvas_data,
               canvasBackgroundColor: p.canvas_background_color,
               canvasHeight: p.canvas_height,
               createdAt: p.created_at
             })));
           }
        }

        if (isUserAdmin) {
          const { data: msgData } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
          if (msgData) setMessages(msgData);
        }

      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        const elapsed = Date.now() - start;
        const minDelay = 1000; // 1 second minimum delay
        if (elapsed < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }
        setIsInitialLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.email === adminEmail);
    });

    // Subscribe to real-time changes for categories
    const catsChannel = supabase.channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').order('order', { ascending: true }).then(({ data }) => {
          if (data) setCategories(data.map(c => ({ ...c, coverImage: c.cover_image })));
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(catsChannel);
    };
  }, []);

  useEffect(() => {
    if (isInitialLoading) return; // Skip if still inside initial load
    
    // Fetch projects with Supabase
    const fetchProjs = async () => {
      try {
        let query = supabase
          .from('portfolio_projects')
          .select('*')
          .order('created_at', { ascending: false });

        // First attempt with status filter if not admin
        if (!isAdmin) {
          const { data, error } = await query.eq('status', 'published');
          
          if (error) {
            // If column doesn't exist, try fetching without the filter
            if (error.code === '42703') { 
              console.warn("Status column missing in projects table, fetching all.");
              const { data: allData, error: allErr } = await supabase
                .from('portfolio_projects')
                .select('*')
                .order('created_at', { ascending: false });
              
              if (allErr) throw allErr;
              processProjects(allData);
            } else {
              throw error;
            }
          } else {
            processProjects(data);
          }
        } else {
          const { data, error } = await query;
          if (error) throw error;
          processProjects(data);
        }
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      }
    };

    const processProjects = (data: any[] | null) => {
      const projs = (data || []).map(p => ({
        ...p,
        coverImage: p.cover_image,
        categoryId: p.category_id,
        canvasData: p.canvas_data,
        canvasBackgroundColor: p.canvas_background_color,
        canvasHeight: p.canvas_height,
        createdAt: p.created_at
      })) as Project[];
      setProjects(projs);
    };

    fetchProjs();

    // Real-time changes for projects
    const projsChannel = supabase.channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_projects' }, () => {
        fetchProjs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(projsChannel);
    };
  }, [isAdmin]);

  useEffect(() => {
    const fetchMsgs = async () => {
      if (!isAdmin) {
        setMessages([]);
        return;
      }
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) console.error("Error fetching messages:", error);
      else setMessages(data || []);
    };

    fetchMsgs();

    const msgsChannel = supabase.channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMsgs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgsChannel);
    };
  }, [isAdmin]);

  return (
    <div className="relative">
      {/* Premium film grain / noise overlay */}
      <div className="grain-overlay" />
      <AnimatePresence mode="wait">
        {isInitialLoading && <Preloader key="preloader" isDarkMode={isDarkMode} />}
      </AnimatePresence>


      <ThemeTransitionOverlay isAnimating={isThemeAnimating} isDarkMode={isDarkMode} />
      <GlobalBackground isDarkMode={isDarkMode} />
      <CustomCursor />
      <Navbar 
        isAdmin={isAdmin} 
        onAdminClick={() => setShowAdmin(true)} 
        onLogoSecretClick={handleLogoSecretClick}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />
      <Hero stats={stats} />
      <About />
      <Portfolio 
        categories={categories} 
        projects={projects} 
        currentPath={currentPath}
        navigateTo={navigateTo}
      />
      <Skills />
      <Services />
      <Contact />
      <FAQ />
      <WhatClientsSaid />
      
      
      <footer className="pt-12 pb-0 border-t border-slate-200/60 bg-white/80 backdrop-blur-md relative z-20 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div onClick={handleFooterLogoClick} className="flex items-center gap-3 cursor-pointer select-none">
            <img 
              src="https://i.imgur.com/mNctGoH.png" 
              alt="Wahab Graphic Logo" 
              referrerPolicy="no-referrer" 
              className="w-8 h-8 rounded-md opacity-95 object-cover border border-slate-200 bg-white" 
              loading="lazy"
            />
            <span className="text-xl font-display font-bold tracking-normal text-slate-900">Wahab Graphic<span className="text-brand-primary">.</span></span>
          </div>

          {/* Emergency Contact Number */}
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold font-sans">
              For Emergency Contact
            </span>
            <a 
              href="tel:+8801973324750" 
              className="flex items-center gap-2 text-base font-semibold text-slate-700 hover:text-brand-primary transition-colors cursor-pointer group font-mono"
            >
              <Phone className="w-4 h-4 text-brand-primary group-hover:scale-110 transition-transform animate-pulse" />
              <span>+880 1973 324750</span>
            </a>
          </div>
        </div>

        {/* Elegant Infinite Horizontal Ticker / Marquee with Interactive Guitar Strings */}
        <InteractiveGuitarTicker themeStyles={themeStyles} />
      </footer>

      <AnimatePresence>
        {showAdmin && isAdmin && (
          <AdminDashboard 
            categories={categories} 
            projects={projects} 
            messages={messages}
            stats={stats}
            onClose={() => setShowAdmin(false)}
            setCategories={setCategories}
            setProjects={setProjects}
            setStats={setStats}
            themeStyles={themeStyles}
            setThemeStyles={setThemeStyles}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
