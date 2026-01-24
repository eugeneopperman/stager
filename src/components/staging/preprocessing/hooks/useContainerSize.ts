"use client";

import { useState, useEffect, type RefObject } from "react";

interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Hook to track container element size with resize observer
 */
export function useContainerSize(containerRef: RefObject<HTMLDivElement | null>): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [containerRef]);

  return size;
}
