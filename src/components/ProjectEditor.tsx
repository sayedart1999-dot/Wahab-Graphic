import React, { useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

const URLImage = ({ image, isSelected, onSelect, onChange }: { image: any, isSelected: boolean, onSelect: () => void, onChange: (newAttrs: any) => void }) => {
  const [img] = useImage(image.url);
  const shapeRef = React.useRef<any>(null);
  const trRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={image.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        onDragEnd={(e) => {
          onChange({
            ...image,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...image,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export const ProjectEditor = ({ project, onClose, onSave }: { project: any, onClose: () => void, onSave: (images: any[]) => void }) => {
  const [images, setImages] = useState(project.images || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl"
    >
      <div className="absolute top-8 right-8 z-[110] flex gap-4">
        <button 
          onClick={() => onSave(images)}
          className="px-6 py-3 bg-brand-primary text-white font-bold rounded-2xl hover:scale-105 transition-transform"
        >
          Save Changes
        </button>
        <button 
          onClick={onClose}
          className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <Stage width={window.innerWidth} height={window.innerHeight} onClick={() => setSelectedId(null)}>
        <Layer>
          {images.map((img: any, i: number) => (
            <URLImage
              key={i}
              image={img}
              isSelected={selectedId === img.url}
              onSelect={() => setSelectedId(img.url)}
              onChange={(newAttrs: any) => {
                const newImages = images.slice();
                newImages[i] = newAttrs;
                setImages(newImages);
              }}
            />
          ))}
        </Layer>
      </Stage>
    </motion.div>
  );
};
