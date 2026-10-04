"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Dock flottant avec effet de loupe (inspiré de magicui, sur framer-motion).
 *
 * Le dock suit la souris en coordonnées relatives à son centre ; chaque icône
 * calcule sa propre distance au curseur et grossit / se lève d'autant plus
 * qu'elle est proche. Sur mobile (pas de survol), les icônes restent à leur
 * taille normale et réagissent au tap.
 */

const FAR_AWAY = 9999;

type DockContextValue = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  dockRef: React.RefObject<HTMLDivElement | null>;
};

const DockContext = React.createContext<DockContextValue | null>(null);

export interface DockProps extends React.ComponentProps<"div"> {
  /** Distance (px) à laquelle l'icône reprend sa taille normale. */
  range?: number;
}

export function Dock({
  className,
  children,
  range = 130,
  ...props
}: DockProps) {
  const dockRef = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(FAR_AWAY);
  const mouseY = useMotionValue(FAR_AWAY);

  React.useEffect(() => {
    const node = dockRef.current;
    if (!node) return;

    const handleMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      mouseX.set(event.clientX - (rect.left + rect.width / 2));
      mouseY.set(event.clientY - (rect.top + rect.height / 2));
    };
    const reset = () => {
      mouseX.set(FAR_AWAY);
      mouseY.set(FAR_AWAY);
    };

    node.addEventListener("mousemove", handleMove);
    node.addEventListener("mouseleave", reset);
    return () => {
      node.removeEventListener("mousemove", handleMove);
      node.removeEventListener("mouseleave", reset);
    };
  }, [mouseX, mouseY]);

  const context = React.useMemo(() => ({ mouseX, mouseY, dockRef }), [mouseX, mouseY]);

  return (
    <DockContext.Provider value={context}>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2",
          className
        )}
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        {...props}
      >
        <motion.div
          ref={dockRef}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className={cn(
            "pointer-events-auto flex items-center gap-5 rounded-full border border-white/10 bg-ink/95 p-2.5 shadow-lift backdrop-blur-md will-change-transform lg:hidden"
          )}
          style={{ ["--dock-range" as string]: `${range}px` }}
        >
          {children}
        </motion.div>
      </div>
    </DockContext.Provider>
  );
}

export interface DockIconProps extends React.ComponentProps<typeof motion.div> {
  /** Hauteur maximale du soulèvement, en px. */
  bump?: number;
  /** Grossissement maximal. */
  scale?: number;
}

export function DockIcon({
  className,
  children,
  bump = 16,
  scale: maxScale = 1.18,
  ...props
}: DockIconProps) {
  const ctx = React.useContext(DockContext);
  const ref = React.useRef<HTMLDivElement>(null);
  const centerX = useMotionValue(0);
  const centerY = useMotionValue(0);

  // Position du centre de l'icône par rapport au centre du dock.
  React.useEffect(() => {
    const measure = () => {
      const icon = ref.current;
      const dock = ctx?.dockRef.current;
      if (!icon || !dock) return;
      const iconRect = icon.getBoundingClientRect();
      const dockRect = dock.getBoundingClientRect();
      centerX.set(iconRect.left + iconRect.width / 2 - (dockRect.left + dockRect.width / 2));
      centerY.set(iconRect.top + iconRect.height / 2 - (dockRect.top + dockRect.height / 2));
    };

    measure();
    // Le dock peut changer de taille (chargement des polices, rotation).
    const timers = [window.setTimeout(measure, 120), window.setTimeout(measure, 600)];
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [centerX, centerY, ctx?.dockRef]);

  const deltaX = useTransform(ctx?.mouseX ?? centerX, (value) => value - centerX.get());
  const deltaY = useTransform(ctx?.mouseY ?? centerY, (value) => value - centerY.get());
  const distance = useTransform(
    [deltaX, deltaY],
    ([dx, dy]: number[]) => Math.hypot(dx, dy)
  );

  const targetScale = useTransform(distance, [0, 130], [maxScale, 1], { clamp: true });
  const targetY = useTransform(distance, [0, 130], [-bump, 0], { clamp: true });

  const springScale = useSpring(targetScale, { mass: 0.1, stiffness: 260, damping: 18 });
  const springY = useSpring(targetY, { mass: 0.1, stiffness: 260, damping: 18 });

  return (
    <motion.div
      ref={ref}
      style={{ scale: springScale, y: springY }}
      whileTap={{ scale: 0.92, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "group/dock-icon relative flex aspect-square size-12 shrink-0 items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
