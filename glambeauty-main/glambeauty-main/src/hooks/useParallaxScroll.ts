import { useState, useEffect, useCallback, RefObject } from "react";

interface ParallaxValues {
  scrollY: number;
  backgroundOffset: number;
  foregroundOffset: number;
  opacity: number;
  scale: number;
}

export function useParallaxScroll(
  containerRef: RefObject<HTMLElement>,
  options = { backgroundSpeed: 0.3, foregroundSpeed: 0.5 }
): ParallaxValues {
  const [values, setValues] = useState<ParallaxValues>({
    scrollY: 0,
    backgroundOffset: 0,
    foregroundOffset: 0,
    opacity: 1,
    scale: 1,
  });

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollY = container.scrollTop;
    const maxScroll = 400; // Max scroll distance for parallax calculations
    
    setValues({
      scrollY,
      backgroundOffset: scrollY * options.backgroundSpeed,
      foregroundOffset: scrollY * options.foregroundSpeed,
      opacity: Math.max(0.3, 1 - scrollY / maxScroll),
      scale: 1 + (scrollY / maxScroll) * 0.1,
    });
  }, [containerRef, options.backgroundSpeed, options.foregroundSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef, handleScroll]);

  return values;
}
