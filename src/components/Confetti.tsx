"use client";

import { useEffect, useState } from "react";

const COLORS = ["#0097D7", "#33B5E8", "#EFC40F", "#57BCBC", "#1F4789", "#FFFFFF"];
const PIECES = Array.from({ length: 54 }, (_, index) => ({
  left: (index * 37) % 100,
  drift: ((index * 29) % 160) - 80,
  delay: (index % 12) * 0.045,
  duration: 1.9 + (index % 6) * 0.16,
  rotation: (index * 47) % 180,
  width: 6 + (index % 3) * 2,
  height: 10 + (index % 4) * 2,
}));

type ConfettiProps = {
  active: boolean;
};

export default function Confetti({ active }: ConfettiProps) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) return;

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              backgroundColor: COLORS[index % COLORS.length],
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-rotation": `${piece.rotation}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
