import React, { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { DndContext, closestCenter, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  Briefcase,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  FolderOpen,
  Github,
  Instagram,
  Layers,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Palette,
  PenTool,
  Phone,
  Plus,
  RotateCcw,
  Send,
  Settings,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Twitter,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react';
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
// BACKEND COMPONENTS (PRESERVED)
// ============================================

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
        const zoomFactor = Math.exp(dx / 200);
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
            <label className="text-xs text-slate-500 font-bold uppercase">Color:</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }}
              className="px-3 py-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-bold rounded-lg hover:bg-brand-primary hover:text-white transition-colors text-xs"
            >
              Reset
            </button>
          )}
          <button type="button" onClick={onUndo} className="p-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-white transition-all text-slate-500 hover:text-brand-primary">
            <RotateCcw className="w-4 h-4" />
          </button>
          {selectedId && (
            <button type="button" onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={handleSetCover} className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs hover:scale-105 transition-all">
            Use as Cover
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
        <div ref={scrollContainerRef} className="flex-1 rounded-xl overflow-y-auto overflow-x-hidden border border-slate-200 relative bg-slate-50 h-full">
          <div ref={containerRef} className="w-full min-h-full relative">
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
            >
              <Layer>
                <Group clipX={0} clipY={0} clipWidth={800} clipHeight={canvasHeight}>
                  <Rect x={0} y={0} width={800} height={canvasHeight} fill={backgroundColor} name="background" />
                  {Array.from({ length: Math.ceil(800 / 10) + 1 }).map((_, i) => (
                    <Line key={`v-${i}`} points={[i * 10, 0, i * 10, canvasHeight]} stroke="rgba(0, 0, 0, 0.05)" strokeWidth={1} />
                  ))}
                  {Array.from({ length: Math.ceil(canvasHeight / 10) + 1 }).map((_, i) => (
                    <Line key={`h-${i}`} points={[0, i * 10, 800, i * 10]} stroke="rgba(0, 0, 0, 0.05)" strokeWidth={1} />
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
                    if (newBox.width < 5 || newBox.height < 5) return oldBox;
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-xl flex flex-col h-full">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Layers className="w-3 h-3 text-brand-primary" /> Layers ({items.length})
            </h3>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={[...items].reverse().map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
    </div>
  );
};

// Sortable Layer Item Component
const SortableLayerItem = ({ item, originalIndex, isSelected, onSelect, onMoveUp, onMoveDown, itemsLength }: {
  item: CanvasItem,
  originalIndex: number,
  isSelected: boolean,
  onSelect: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  itemsLength: number,
}) => {
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
      onClick={onSelect}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-brand-primary/10 border border-brand-primary/30' : 'bg-white hover:bg-slate-50 border border-transparent'}`}
    >
      <div {...listeners} className="cursor-grab p-1">
        <span className="text-slate-400">⋮⋮</span>
      </div>
      <img src={item.src} alt="" className="w-10 h-10 object-cover rounded border border-slate-200" />
      <span className="text-xs text-slate-600 flex-1 truncate">Layer {itemsLength - originalIndex}</span>
    </div>
  );
};

// Sortable Category Item
const SortableCategoryItem = ({ cat, onEdit, onDelete, onBrowse }: {
  cat: Category,
  onEdit: (cat: Category) => void,
  onDelete: (id: string) => void,
  onBrowse: (id: string) => void,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="bg-white rounded-2xl overflow-hidden border border-slate-200 group">
      <div className="aspect-video bg-slate-100 relative overflow-hidden">
        {cat.coverImage && (
          <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={() => onBrowse(cat.id)} className="p-2 bg-white rounded-full hover:scale-110 transition-transform">
            <Eye className="w-4 h-4 text-slate-900" />
          </button>
          <button onClick={() => onEdit(cat)} className="p-2 bg-brand-primary rounded-full hover:scale-110 transition-transform">
            <Edit2 className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => onDelete(cat.id)} className="p-2 bg-red-500 rounded-full hover:scale-110 transition-transform">
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <div className="p-4" {...listeners}>
        <h4 className="font-bold text-slate-900">{cat.name}</h4>
      </div>
    </div>
  );
};

// ============================================
// ADMIN DASHBOARD (PRESERVED)
// ============================================

const AdminDashboard = ({
  categories,
  projects,
  messages,
  onClose,
  setCategories,
  setProjects,
}: {
  categories: Category[],
  projects: Project[],
  messages: any[],
  onClose: () => void,
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
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
      setCategories(newCategories);

      try {
        const updates = newCategories.map((cat, index) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          order: index,
          cover_image: cat.coverImage
        }));

        await supabase.from('categories').upsert(updates, { onConflict: 'id' });
      } catch (err) {
        console.error("Failed to persist category order:", err);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<'categories' | 'messages'>('categories');
  const [browsingFolderId, setBrowsingFolderId] = useState<string | null>(null);
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
  const [projDesc, setProjDesc] = useState('');
  const [projStatus, setProjStatus] = useState<'draft' | 'published'>('published');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [canvasHeight, setCanvasHeight] = useState(450);
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setProjCover(localUrl);
    }
  };

  const handleCatCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setCatCover(localUrl);
    }
  };

  const handleSetCover = (dataUrl: string) => {
    setProjCover(dataUrl);
    if (dataUrl.startsWith('data:')) {
      try {
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], "canvas_cover.jpg", { type: "image/jpeg" });
        uploadToCloudinary(file).then(url => {
          setProjCover(url);
        });
      } catch (err) {
        console.error("Failed to upload canvas cover:", err);
      }
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
        finalCatCover = await uploadToCloudinary(catCover);
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
        finalCatCover = await uploadToCloudinary(catCover);
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
    setSaveError(null);

    try {
      let finalCover = projCover;
      if (projCover.startsWith('blob:') || projCover.startsWith('data:')) {
        finalCover = await uploadToCloudinary(projCover);
      }

      const finalCanvasItems = await Promise.all(canvasItems.map(async (item) => {
        if (item.src.startsWith('blob:') || item.src.startsWith('data:')) {
          const uploadedUrl = await uploadToCloudinary(item.src);
          return { ...item, src: uploadedUrl };
        }
        return item;
      }));

      const selectedCategory = categories.find(c => c.id === projCatId);
      const categoryName = selectedCategory ? selectedCategory.name : 'General';

      const projectData = {
        title: projName.trim() || 'Untitled Project',
        name: projName.trim() || 'Untitled Project',
        category_id: projCatId,
        category: categoryName,
        cover_image: finalCover,
        images: [],
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
    setProjDesc('');
    setProjStatus('published');
    setCanvasItems([]);
    setCanvasHeight(450);
    setCanvasHistory([[]]);
    setHistoryStep(0);
    setCanvasBgColor('#ffffff');
    setEditingProject(null);
    setIsAddingProject(false);
    setSaveError(null);
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

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;

      if (type === 'category') {
        setCategories(categories.filter(c => c.id !== id));
      } else if (type === 'project') {
        setProjects(projects.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Error deleting item:", err);
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
          <h2 className="text-3xl font-black text-slate-900">Admin <span className="text-brand-primary">Dashboard</span></h2>
          <button onClick={onClose} className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => { setActiveTab('categories'); setBrowsingFolderId(null); setSaveError(null); }}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-brand-primary text-white' : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'}`}
          >
            Manage Folders
          </button>
          <button
            onClick={() => { setActiveTab('messages'); setBrowsingFolderId(null); setSaveError(null); }}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-brand-primary text-white' : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'}`}
          >
            Messages ({messages.length})
          </button>
        </div>

        {activeTab === 'messages' && (
          <div className="space-y-4 text-slate-900">
            <h3 className="text-xl font-bold">Messages</h3>
            {messages.map(msg => (
              <div key={msg.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{msg.fullName}</p>
                  <p className="text-sm text-slate-500 font-medium">{msg.email}</p>
                  <p className="font-bold mt-2 text-slate-800">{msg.subject}</p>
                  <p className="text-slate-600 mt-1 leading-relaxed">{msg.message}</p>
                  <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {msg.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
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
                    <FolderOpen className="w-6 h-6 text-brand-primary" /> Folders
                  </h3>
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-black rounded-xl hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Add Folder
                  </button>
                </div>

                {(isAddingCategory || editingCategory) && (
                  <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="bg-white p-6 rounded-2xl flex flex-col gap-4 border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
                    {saveError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                        <X className="w-4 h-4" />
                        {saveError}
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Folder Name</label>
                        <input
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          placeholder="e.g. Logo Design"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary text-slate-900"
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
                          />
                          <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Upload className="w-4 h-4 text-brand-primary" />
                            <span>{catCover ? 'Change Image' : 'Upload Cover'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button type="submit" disabled={isSaving} className="flex-1 md:flex-none px-8 py-3 bg-brand-primary text-white font-black rounded-xl disabled:opacity-50">
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" onClick={() => { setIsAddingCategory(false); setEditingCategory(null); setCatCover(''); setCatName(''); }} className="px-6 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCategories}>
                  <SortableContext items={categories.map(c => c.id)} strategy={rectSortingStrategy}>
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
              </>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setBrowsingFolderId(null)}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all font-bold text-xs uppercase text-slate-600"
                  >
                    <ArrowRight className="w-5 h-5 text-brand-primary rotate-180" /> Back
                  </button>
                  <h3 className="text-xl font-black text-slate-900">
                    {categories.find(c => c.id === browsingFolderId)?.name}
                  </h3>
                  <button
                    onClick={() => {
                      setProjCatId(browsingFolderId);
                      setIsAddingProject(true);
                      setEditingProject(null);
                      resetProjectForm();
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-black rounded-2xl hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" /> New Project
                  </button>
                </div>

                {(isAddingProject || editingProject) && (
                  <form onSubmit={handleAddProject} className="bg-white p-6 rounded-2xl space-y-4 border border-slate-200">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Project Name</label>
                        <input
                          value={projName}
                          onChange={(e) => setProjName(e.target.value)}
                          placeholder="e.g. Modern Brand Identity"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-slate-900"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</label>
                        <select
                          value={projStatus}
                          onChange={(e) => setProjStatus(e.target.value as 'draft' | 'published')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-slate-900"
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft (Hidden)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Cover Image</label>
                      {!projCover ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full border border-dashed border-slate-300 rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-all bg-slate-50">
                            <Upload className="w-4 h-4 text-brand-primary" />
                            <p className="text-xs font-bold text-slate-600">Upload Cover Image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative inline-block group rounded-xl overflow-hidden border border-slate-200">
                          <img src={projCover} alt="Cover Preview" className="h-24 w-auto object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setProjCover('')}
                              className="bg-red-500 text-white rounded-full p-2 hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Canvas Editor</label>
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
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Description</label>
                      <textarea
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        placeholder="Describe the project..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary h-24 text-slate-900 resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-slate-200">
                      {saveError && (
                        <div className="flex-1 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                          {saveError}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 py-3 bg-brand-primary text-white font-black text-sm rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : (editingProject ? 'Update' : 'Publish')}
                      </button>
                      <button type="button" onClick={resetProjectForm} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.filter(p => p.categoryId === browsingFolderId).map(proj => (
                    <div key={proj.id} className="bg-white rounded-2xl overflow-hidden group border border-slate-200 relative">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={proj.coverImage}
                          alt={proj.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-4 left-4">
                          <span className={`px-2 py-1 ${proj.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'} text-white text-[10px] font-bold rounded uppercase`}>
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
                            className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
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
                  <div className="py-20 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-slate-200 rounded-2xl">
                    <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold text-xs uppercase tracking-widest">No projects in this folder</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {deleteConfirmation && (
          <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-slate-900">Confirm Deletion</h3>
              <p className="text-slate-500 mb-8">{deleteConfirmation.message}</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// NEW DESIGN COMPONENTS
// ============================================

// Preloader
const Preloader = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full mx-auto mb-4"
        />
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </motion.div>
  );
};

// Navigation
const Navigation = ({
  isAdmin,
  onAdminClick,
  isDarkMode,
  onToggleTheme,
}: {
  isAdmin: boolean;
  onAdminClick: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Work', href: '#portfolio' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <a href="#" className="text-2xl font-black text-slate-900">
            W<span className="text-brand-primary">.</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-brand-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="w-px h-5 bg-slate-200" />
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {isAdmin && (
              <button
                onClick={onAdminClick}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 pb-6"
            >
              <div className="flex flex-col gap-4 pt-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-slate-600 hover:text-brand-primary transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// Hero Section
const Hero = () => {
  return (
    <section className="min-h-screen flex items-center pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full text-brand-primary text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Available for work
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] mb-6">
              Creative
              <br />
              <span className="text-brand-primary">Designer</span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
              I craft meaningful visual experiences that help brands stand out and connect with their audience through thoughtful design.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#portfolio"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-brand-primary transition-colors"
              >
                View Work
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 font-bold rounded-full hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                Get in Touch
              </a>
            </div>

            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-slate-200">
              <div>
                <p className="text-3xl font-black text-slate-900">5+</p>
                <p className="text-sm text-slate-500">Years Experience</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <p className="text-3xl font-black text-slate-900">150+</p>
                <p className="text-sm text-slate-500">Projects Done</p>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div>
                <p className="text-3xl font-black text-slate-900">99%</p>
                <p className="text-sm text-slate-500">Happy Clients</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <img
                src="https://i.imgur.com/NU9hpnH.png"
                alt="Abdul Wahab"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -left-6 top-1/3 bg-white p-4 rounded-2xl shadow-xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Top Rated</p>
                  <p className="text-xs text-slate-500">On Fiverr</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Badge 2 */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-6 bottom-1/4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Fast Delivery</p>
                  <p className="text-xs text-slate-500">24-48 hours</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  return (
    <section id="about" className="py-32 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden">
              <img
                src="https://i.imgur.com/Ohf27J0.png"
                alt="About"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-brand-primary p-8 rounded-2xl text-white">
              <p className="text-4xl font-black">5+</p>
              <p className="text-sm opacity-80">Years Experience</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-brand-primary font-semibold mb-4">About Me</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Transforming Ideas Into Visual Stories
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              I'm Abdul Wahab, a passionate graphic designer from Bangladesh specializing in logo design, brand identity, and social media graphics. I help businesses create memorable visual identities that resonate with their target audience.
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              With over 5 years of experience and 150+ successful projects, I've had the privilege of working with clients from various industries. My goal is simple: to deliver designs that not only look amazing but also drive results.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <PenTool className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Logo Design</p>
                  <p className="text-sm text-slate-500">Brand identities</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Palette className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Brand Identity</p>
                  <p className="text-sm text-slate-500">Visual systems</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Monitor className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Social Media</p>
                  <p className="text-sm text-slate-500">Digital graphics</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Print Design</p>
                  <p className="text-sm text-slate-500">Marketing materials</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Portfolio Section
const PortfolioSection = ({
  categories,
  projects,
  onProjectClick,
}: {
  categories: Category[];
  projects: Project[];
  onProjectClick: (project: Project) => void;
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredProjects = activeCategory
    ? projects.filter(p => p.categoryId === activeCategory)
    : projects;

  return (
    <section id="portfolio" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-brand-primary font-semibold mb-4">Portfolio</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
            Selected Work
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            A collection of my recent projects across various design disciplines.
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              !activeCategory ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeCategory === cat.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.slice(0, 6).map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onProjectClick(project)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-4">
                <img
                  src={project.coverImage}
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    View Project <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{project.name}</h3>
              <p className="text-sm text-slate-500">
                {categories.find(c => c.id === project.categoryId)?.name || 'Project'}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400">No projects found.</p>
          </div>
        )}
      </div>
    </section>
  );
};

// Services Section
const ServicesSection = () => {
  const services = [
    {
      icon: <PenTool className="w-6 h-6" />,
      title: 'Logo Design',
      description: 'Unique and memorable logos that capture your brand essence and make a lasting impression.',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Brand Identity',
      description: 'Complete visual identity systems including colors, typography, and brand guidelines.',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Social Media Design',
      description: 'Eye-catching social media graphics that engage your audience and drive results.',
    },
    {
      icon: <Monitor className="w-6 h-6" />,
      title: 'Print Design',
      description: 'Professional print materials including brochures, flyers, and business cards.',
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: 'Packaging Design',
      description: 'Creative packaging solutions that stand out on shelves and protect your products.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'UI/UX Design',
      description: 'User-centered interface designs for web and mobile applications.',
    },
  ];

  return (
    <section id="services" className="py-32 px-6 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-primary font-semibold mb-4">Services</p>
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            What I Offer
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From concept to completion, I provide comprehensive design services to help your brand succeed.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors"
            >
              <div className="w-14 h-14 bg-brand-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/30 transition-colors text-brand-primary">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-slate-400 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('messages').insert([{
        full_name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        created_at: new Date().toISOString(),
      }]);

      if (error) throw error;
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-brand-primary font-semibold mb-4">Contact</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Let's Work Together
            </h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              Have a project in mind? I'd love to hear about it. Send me a message and let's discuss how we can bring your ideas to life.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Email</p>
                  <a href="mailto:sayedart1999@gmail.com" className="text-slate-500 hover:text-brand-primary transition-colors">
                    sayedart1999@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Phone</p>
                  <a href="tel:+8801973324750" className="text-slate-500 hover:text-brand-primary transition-colors">
                    +880 1973 324750
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Location</p>
                  <p className="text-slate-500">Bangladesh</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <a href="#" className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-brand-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-brand-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-brand-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-600">Thank you for reaching out. I'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="Project inquiry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-primary transition-colors resize-none"
                    placeholder="Tell me about your project..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-brand-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Project Modal
const ProjectModal = ({ project, onClose }: { project: Project; onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / 800);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl overflow-y-auto p-6 md:p-12"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-slate-900">{project.name}</h2>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="aspect-video rounded-2xl overflow-hidden mb-8 relative">
          <img
            src={project.coverImage}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>

        {project.canvasData && project.canvasData.length > 0 && (
          <div
            ref={containerRef}
            className="relative bg-slate-100 rounded-2xl overflow-hidden mb-8"
            style={{
              height: (project.canvasData.reduce((max, item) => {
                const itemHeight = item.height * (item.scaleY || 1);
                const itemBottom = item.y + itemHeight;
                return Math.max(max, itemBottom);
              }, project.canvasHeight || 450)) * scale,
              backgroundColor: project.canvasBackgroundColor || '#ffffff',
            }}
          >
            {project.canvasData.map((item) => (
              <img
                key={item.id}
                src={item.src}
                alt=""
                style={{
                  position: 'absolute',
                  left: item.x * scale,
                  top: item.y * scale,
                  width: item.width * (item.scaleX || 1) * scale,
                  height: item.height * (item.scaleY || 1) * scale,
                  transform: `rotate(${item.rotation || 0}deg)`,
                  transformOrigin: 'top left',
                }}
              />
            ))}
          </div>
        )}

        {project.description && (
          <p className="text-slate-600 leading-relaxed mb-8">{project.description}</p>
        )}

        <button
          onClick={onClose}
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-brand-primary transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <a href="#" className="text-3xl font-black text-slate-900">
              W<span className="text-brand-primary">.</span>
            </a>
            <p className="text-slate-500 mt-2">Creating impactful designs since 2019.</p>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-brand-primary transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-brand-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-brand-primary transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Wahab Graphic. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Scroll to Top Button
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 500);
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-primary transition-colors z-40"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
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

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (showAdmin) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAdmin]);

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  const adminEmail = "sayedart1999@gmail.com";

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: "https://wahab-graphic-one.vercel.app"
      }
    });
    if (error) console.error("Error signing in:", error);
  };

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
        const minDelay = 1000;
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogoClick = () => {
    if (isAdmin) {
      setShowAdmin(true);
    } else {
      signInWithGoogle();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {isInitialLoading && <Preloader key="preloader" />}
      </AnimatePresence>

      {!isInitialLoading && (
        <>
          <Navigation
            isAdmin={isAdmin}
            onAdminClick={() => setShowAdmin(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
          />

          <Hero />
          <AboutSection />
          <PortfolioSection
            categories={categories}
            projects={projects}
            onProjectClick={(project) => setSelectedProject(project)}
          />
          <ServicesSection />
          <ContactSection />
          <Footer />
          <ScrollToTop />

          <AnimatePresence>
            {showAdmin && isAdmin && (
              <AdminDashboard
                categories={categories}
                projects={projects}
                messages={messages}
                onClose={() => setShowAdmin(false)}
                setCategories={setCategories}
                setProjects={setProjects}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedProject && (
              <ProjectModal
                project={selectedProject}
                onClose={() => setSelectedProject(null)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
