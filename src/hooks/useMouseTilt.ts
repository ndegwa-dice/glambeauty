import { useState, useEffect, RefObject } from "react";

interface TiltValues {
  x: number;
  y: number;
}

export function useMouseTilt(
  ref: RefObject<HTMLElement>,
  intensity: number = 10
): TiltValues {
  const [tilt, setTilt] = useState<TiltValues>({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: y * intensity, y: -x * intensity });
    };

    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0 });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref, intensity]);

  return tilt;
}
