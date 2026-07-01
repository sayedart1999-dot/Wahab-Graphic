import React, { useState, useMemo } from "react";
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
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleNext = () => {
    if (projects.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const handlePrev = () => {
    if (projects.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || projects.length === 0) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    // Minimum swipe distance of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Add scroll handler with lock logic
  const handleWheel = (e: WheelEvent) => {
    if (projects.length === 0) return;
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
      // Debounce window
      if (e.cancelable) e.preventDefault();
      return;
    }

    if (e.deltaY > 0) {
      // Scrolling down - infinite next
      setCurrentIndex(prev => (prev + 1) % projects.length);
      setLastScrollTime(now);
      if (e.cancelable) e.preventDefault();
    } else if (e.deltaY < 0) {
      // Scrolling up - infinite prev
      setCurrentIndex(prev => (prev - 1 + projects.length) % projects.length);
      setLastScrollTime(now);
      if (e.cancelable) e.preventDefault();
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
      className="relative w-full min-h-[550px] flex flex-col items-center justify-center select-none overflow-visible py-16"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Stage Container */}
      <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] flex items-center justify-center [perspective:1500px] [transform-style:preserve-3d]">
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
                  opacity: 1,
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
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 opacity-0 ${i === currentIndex ? 'group-hover:opacity-100' : 'pointer-events-none'}`}>
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

      {/* Navigation Controls (Chevron Buttons & Pagination Dots) */}
      <div className="flex items-center justify-center gap-6 mt-16 z-30 relative">
        <button
          onClick={handlePrev}
          className="p-3 sm:p-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
          aria-label="Previous Project"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        {/* Progress indicator dots */}
        <div className="flex gap-1.5 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-sm">
          {projects.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? "w-6 bg-brand-primary" : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-3 sm:p-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-primary dark:hover:text-brand-primary hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
          aria-label="Next Project"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};
