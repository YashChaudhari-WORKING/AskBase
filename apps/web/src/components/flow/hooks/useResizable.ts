"use client";

import { useState, useCallback, useEffect } from "react";

export function useResizable(
  initialWidth: number,
  min: number,
  max: number,
  direction: "right" | "left" = "right"
) {
  const [width, setWidth] = useState(initialWidth);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(initialWidth);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setStartX(e.clientX);
    setStartWidth(width);
  }, [width]);

  useEffect(() => {
    if (!dragging) return;

    function onMouseMove(e: MouseEvent) {
      const delta = direction === "right"
        ? e.clientX - startX   // drag right → grow
        : startX - e.clientX;  // drag left → grow
      setWidth(Math.min(max, Math.max(min, startWidth + delta)));
    }

    function onMouseUp() { setDragging(false); }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, startX, startWidth, min, max, direction]);

  return { width, onMouseDown, dragging };
}
