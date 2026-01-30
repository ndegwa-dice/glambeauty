import { useState, useEffect } from "react";

interface ParallaxValues {
  scrollY: number;
  slow: number;
  medium: number;
  fast: number;
}

export function useParallax(): ParallaxValues {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return {
    scrollY,
    slow: scrollY * 0.3,
    medium: scrollY * 0.5,
    fast: scrollY * 0.7,
  };
}
