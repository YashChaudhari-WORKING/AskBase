"use client";

import { useState } from "react";
import "./Folder.css";

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) color = color.split("").map(c => c + c).join("");
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

interface FolderProps {
  color?: string;
  size?: number;
  label?: string;
  items?: React.ReactNode[];
  className?: string;
  onClick?: () => void;
}

export default function Folder({
  color = "#6366f1",
  size = 1,
  label,
  items = [],
  className = "",
  onClick,
}: FolderProps) {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) papers.push(null);

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 }))
  );

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor("#ffffff", 0.1);
  const paper2 = darkenColor("#ffffff", 0.05);
  const paper3 = "#ffffff";

  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if there's a parent onClick (card navigation)
    e.stopPropagation();
    setOpen(prev => !prev);
    if (open) setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
    onClick?.();
  };

  const handlePaperMouseMove = (e: React.MouseEvent, index: number) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (_e: React.MouseEvent, index: number) => {
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  // Compensate layout box so scaled folder doesn't leave dead space
  const ORIG_W = 100;
  const ORIG_H = 80;

  return (
    <div
      style={{ width: ORIG_W * size, height: ORIG_H * size, overflow: "visible" }}
      className={className}
    >
      <div style={{ transform: `scale(${size})`, transformOrigin: "top left", width: ORIG_W, height: ORIG_H }}>
      <div
        className={`folder${open ? " open" : ""}`}
        style={{
          "--folder-color": color,
          "--folder-back-color": folderBackColor,
          "--paper-1": paper1,
          "--paper-2": paper2,
          "--paper-3": paper3,
        } as React.CSSProperties}
        onClick={handleClick}
      >
        <div className="folder__back">
          {papers.map((item, i) => (
            <div
              key={i}
              className={`paper paper-${i + 1}`}
              onMouseMove={e => handlePaperMouseMove(e, i)}
              onMouseLeave={e => handlePaperMouseLeave(e, i)}
              style={
                open
                  ? ({
                      "--magnet-x": `${paperOffsets[i]?.x ?? 0}px`,
                      "--magnet-y": `${paperOffsets[i]?.y ?? 0}px`,
                    } as React.CSSProperties)
                  : {}
              }
            >
              {item}
            </div>
          ))}
          <div className="folder__front" />
          <div className="folder__front right" />
          {label && (
            <span style={{
              position: "absolute",
              zIndex: 4,
              bottom: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.92)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "80%",
              textAlign: "center",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              pointerEvents: "none",
              userSelect: "none",
            }}>
              {label}
            </span>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
