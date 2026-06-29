export interface CanvasItem {
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

export interface Project {
  id: string;
  name: string;
  categoryId: string;
  coverImage: string;
  images: string[];
  description: string;
  status: 'draft' | 'published';
  createdAt: string;
  canvasData?: CanvasItem[];
  canvasBackgroundColor?: string;
  canvasHeight?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  coverImage?: string;
}

export interface Stat {
  id: string;
  label: string;
  value: string;
  type: string;
}

export interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface Skill {
  name: string;
  level: number;
  icon: React.ReactNode;
  color: string;
}
