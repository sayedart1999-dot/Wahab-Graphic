import React, { useState, useMemo, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    // Minimum swipe distance - smaller on mobile
    const minSwipe = isMobile ? 30 : 50;

    if (Math.abs(diff) > minSwipe) {
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

  // Scroll handler for desktop
  const handleWheel = (e: WheelEvent) => {
    if (projects.length === 0 || isMobile) return;
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    const isMouseOver = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    if (!isMouseOver) return;

    const now = Date.now();
    if (now - lastScrollTime < 400) {
      if (e.cancelable) e.preventDefault();
      return;
    }

    if (e.deltaY > 0) {
      setCurrentIndex(prev => (prev + 1) % projects.length);
      setLastScrollTime(now);
      if (e.cancelable) e.preventDefault();
    } else if (e.deltaY < 0) {
      setCurrentIndex(prev => (prev - 1 + projects.length) % projects.length);
      setLastScrollTime(now);
      if (e.cancelable) e.preventDefault();
    }
  };

  useEffect(() => {
    const container = document.getElementById("perspective-carousel-container");
    if (container && !isMobile) {
      container.addEventListener("wheel", handleWheel as any, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel as any);
      }
    };
  }, [currentIndex, projects.length, lastScrollTime, isMobile]);

  // Responsive values
  const cardWidth = isMobile ? 280 : 380;
  const horizontalSpread = isMobile ? 160 : 280;
  const depthSpread = isMobile ? 80 : 150;
  const rotationAngle = isMobile ? -25 : -35;

  if (!projects || projects.length === 0) return null;

  // On mobile, show simpler 2D slider
  if (isMobile) {
    return (
      <div
        id="perspective-carousel-container"
        className="relative w-full flex flex-col items-center select-none py-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Simple card view */}
        <div className="relative w-full px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={() => onProjectClick(projects[currentIndex])}
              className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <img
                src={projects[currentIndex].coverImage}
                alt={projects[currentIndex].name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                    {projects[currentIndex].name}
                  </h3>
                  <div className="flex items-center gap-2 text-brand-primary font-medium text-sm">
                    <span>Tap to view</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6 w-full">
          <button
            onClick={handlePrev}
            className="p-3 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-primary active:scale-95 transition-all shadow-md"
            aria-label="Previous Project"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex gap-2 items-center">
            {projects.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? "w-6 bg-brand-primary" : "w-2 bg-slate-300 dark:bg-slate-700"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-3 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-primary active:scale-95 transition-all shadow-md"
            aria-label="Next Project"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop: 3D carousel
  return (
    <div
      id="perspective-carousel-container"
      className="relative w-full min-h-[500px] flex flex-col items-center justify-center select-none overflow-hidden py-12"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Stage Container */}
      <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] flex items-center justify-center [perspective:1500px] [transform-style:preserve-3d]">
        <AnimatePresence initial={false} mode="popLayout">
          {projects.map((project, i) => {
            let relativeIndex = i - currentIndex;

            if (relativeIndex > Math.floor(projects.length / 2)) {
              relativeIndex -= projects.length;
            } else if (relativeIndex < -Math.floor(projects.length / 2)) {
              relativeIndex += projects.length;
            }

            const absIndex = Math.abs(relativeIndex);

            if (absIndex > 2) return null;

            return (
              <motion.div
                key={project.id}
                initial={false}
                animate={{
                  x: relativeIndex * horizontalSpread,
                  z: absIndex * -depthSpread,
                  rotateY: relativeIndex * rotationAngle,
                  scale: 1 - absIndex * 0.1,
                  opacity: absIndex > 1 ? 0.6 : 1,
                  zIndex: 10 - absIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                }}
                onClick={() => {
                  if (i === currentIndex) {
                    onProjectClick(project);
                  } else {
                    setCurrentIndex(i);
                  }
                }}
                className="absolute w-[320px] sm:w-[400px] md:w-[450px] aspect-[4/3] cursor-pointer"
              >
                <div className="w-full h-full relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/10 group bg-black hover:shadow-[0_25px_60px_rgba(0,0,0,0.35)] transition-shadow">
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 opacity-0 ${i === currentIndex ? 'group-hover:opacity-100' : 'pointer-events-none'}`}>
                    <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 text-brand-primary font-medium text-sm">
                          <span>View Project</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Ring highlight */}
                  {i === currentIndex && (
                    <div className="absolute inset-0 ring-2 ring-inset ring-brand-primary/30 rounded-[2rem] pointer-events-none" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-6 mt-12 z-30 relative">
        <button
          onClick={handlePrev}
          className="p-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-primary hover:scale-110 active:scale-95 transition-all shadow-lg"
          aria-label="Previous Project"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="flex gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-sm">
          {projects.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? "w-5 bg-brand-primary" : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-primary hover:scale-110 active:scale-95 transition-all shadow-lg"
          aria-label="Next Project"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
