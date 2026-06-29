import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Project } from "../types";

interface PerspectiveCarouselProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export const PerspectiveCarousel: React.FC<PerspectiveCarouselProps> = ({
  projects,
  onProjectClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastScrollTime, setLastScrollTime] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  // Add scroll handler with lock logic
  const handleWheel = (e: WheelEvent) => {
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    // Check if mouse is over the component
    const isMouseOver = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    if (!isMouseOver) return;

    const now = Date.now();
    if (now - lastScrollTime < 400) {
      // If we are debouncing but still over the component, we might want to prevent default 
      // to avoid page jitter if we haven't reached boundaries.
      // However, it's safer to just return and let the previous logic handle it.
    }

    if (e.deltaY > 0) {
      // Scrolling down
      if (currentIndex < projects.length - 1) {
        if (now - lastScrollTime >= 400) {
          setCurrentIndex(prev => prev + 1);
          setLastScrollTime(now);
        }
        if (e.cancelable) e.preventDefault();
      }
    } else if (e.deltaY < 0) {
      // Scrolling up
      if (currentIndex > 0) {
        if (now - lastScrollTime >= 400) {
          setCurrentIndex(prev => prev - 1);
          setLastScrollTime(now);
        }
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  React.useEffect(() => {
    const container = document.getElementById("perspective-carousel-container");
    if (container) {
      container.addEventListener("wheel", handleWheel as any, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel as any);
      }
    };
  }, [currentIndex, projects.length, lastScrollTime]);

  if (!projects || projects.length === 0) return null;

  return (
    <div 
      id="perspective-carousel-container"
      className="relative w-full min-h-[500px] flex flex-col items-center justify-center select-none overflow-visible py-20"
    >
      <div className="relative w-full h-full flex items-center justify-center [perspective:1500px] [transform-style:preserve-3d]">
        <AnimatePresence initial={false} mode="popLayout">
          {projects.map((project, i) => {
            // Logic for a relative index to keep active in middle
            let relativeIndex = i - currentIndex;
            
            // Wrap around logic for infinite loop effect
            if (relativeIndex > Math.floor(projects.length / 2)) {
              relativeIndex -= projects.length;
            } else if (relativeIndex < -Math.floor(projects.length / 2)) {
              relativeIndex += projects.length;
            }

            const absIndex = Math.abs(relativeIndex);
            
            // Only show 2 cards on each side
            if (absIndex > 2) return null;

            return (
              <motion.div
                key={project.id}
                initial={false}
                animate={{
                  x: relativeIndex * 280, // Horizontal spread
                  z: absIndex * -150, // Depth
                  rotateY: relativeIndex * -35, // Perspective rotation
                  scale: 1 - absIndex * 0.12,
                  opacity: 1 - absIndex * 0.4,
                  zIndex: 10 - absIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 25,
                }}
                onClick={() => {
                  if (i === currentIndex) {
                    onProjectClick(project);
                  } else {
                    setCurrentIndex(i);
                  }
                }}
                className="absolute w-[300px] xs:w-[380px] sm:w-[450px] aspect-[4/3] cursor-pointer"
              >
                <div className="w-full h-full relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 dark:border-white/5 group bg-black">
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 text-brand-primary font-medium text-sm">
                          <span>View Project</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Glass highlight on center card */}
                  {i === currentIndex && (
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-[2.5rem] pointer-events-none" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
