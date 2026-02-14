import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Tooltip } from "./tooltip";

// --- Configuration ---

const INNER_RING_COLORS = [
  "#FCA5A5", "#FDBA74", "#FEF08A", "#86EFAC", "#93C5FD", "#C4B5FD",
];

const OUTER_RING_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#84CC16", "#22C55E", "#06B6D4",
  "#3B82F6", "#6366F1", "#8B5CF6", "#D946EF", "#F43F5E", "#EC4899",
];

// --- Flower Layout ---
const CENTER_SIZE = 28;
const INNER_SIZE = 20;
const OUTER_SIZE = 18;
const INNER_RADIUS = 18;
const OUTER_RADIUS = 32;
const FLOWER_EXTENT = OUTER_RADIUS + OUTER_SIZE / 2 + 4; // total radius from center

// --- Physics Dot Component ---
interface ColorDotProps {
  color: string;
  angle: number;
  radius: number;
  size: number;
  delay: number;
  zIndex: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  onClick: (color: string) => void;
}

const ColorDot = ({ color, angle, radius, size, delay, zIndex, mouseX, mouseY, onClick }: ColorDotProps) => {
  const baseX = Math.cos(angle) * radius;
  const baseY = Math.sin(angle) * radius;

  const distance = useTransform(() => {
    const dx = mouseX.get() - baseX;
    const dy = mouseY.get() - baseY;
    return Math.sqrt(dx * dx + dy * dy);
  });

  const pushForce = useTransform(distance, [0, 50], [6, 0]);

  const x = useTransform(() => {
    const dx = baseX - mouseX.get();
    const dist = distance.get();
    if (dist === 0 || dist > 50) return baseX;
    return baseX + (dx / dist) * pushForce.get();
  });

  const y = useTransform(() => {
    const dy = baseY - mouseY.get();
    const dist = distance.get();
    if (dist === 0 || dist > 50) return baseY;
    return baseY + (dy / dist) * pushForce.get();
  });

  const springX = useSpring(x, { stiffness: 200, damping: 18 });
  const springY = useSpring(y, { stiffness: 200, damping: 18 });

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        onClick(color);
      }}
      className="absolute rounded-full shadow-md border border-white/30 cursor-pointer"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        x: springX,
        y: springY,
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.35, zIndex: 50, boxShadow: "0 0 8px rgba(255,255,255,0.5)" }}
      whileTap={{ scale: 0.9 }}
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 20 },
        opacity: { duration: 0.15, delay },
      }}
    />
  );
};

// --- Main Component ---
interface ColorPickerProps {
  label: string;
  value?: string;
  onChange: (color: string) => void;
  description?: string;
  onReset: () => void;
}

const RING_PADDING = 6;
const RING_THICKNESS = 4;
const RING_DIAMETER = (FLOWER_EXTENT + RING_PADDING) * 2;
const FLOWER_DIAMETER = FLOWER_EXTENT * 2;

const ColorPicker = ({
  label,
  value,
  onChange,
  description,
  onReset,
}: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const flowerRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0 });

  const mouseX = useMotionValue(9999);
  const mouseY = useMotionValue(9999);

  const close = useCallback(() => setIsOpen(false), []);

  // Calculate position from trigger and open
  const handleOpen = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setPortalPos({
      top: centerY - RING_DIAMETER / 2,
      left: centerX - RING_DIAMETER / 2,
    });
    setIsOpen(true);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        flowerRef.current && !flowerRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  // Close on any scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => close();
    document.addEventListener("scroll", handleScroll, true);
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, [isOpen, close]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!flowerRef.current) return;
    const rect = flowerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    mouseX.set(e.clientX - rect.left - centerX);
    mouseY.set(e.clientY - rect.top - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(9999);
    mouseY.set(9999);
  };

  const handleSelect = (color: string) => {
    onChange(color);
    close();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full">
        <label className="font-mono text-xs capitalize text-base-content/80 inline-flex justify-center items-center gap-1 group">
          {label}
          <Tooltip description={description || ""} />
        </label>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-base-content/60 hover:text-base-content transition-colors"
            aria-label="Reset color"
          >
            <ArrowCounterClockwiseIcon size={16} weight="bold" />
          </button>

          {/* Trigger - always in DOM, fixed 24x24 */}
          <button
            ref={triggerRef}
            onClick={handleOpen}
            className="rounded-full cursor-pointer w-6 h-6 border-2 border-base-200 shadow-sm block transition-opacity"
            style={{
              background: value,
              opacity: isOpen ? 0 : 1,
              pointerEvents: isOpen ? "none" : "auto",
            }}
          />
        </div>
      </div>

      {/* Portal: flower renders at body level, escapes all overflow clipping */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={flowerRef}
                key="flower"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  position: "fixed",
                  top: portalPos.top,
                  left: portalPos.left,
                  width: RING_DIAMETER,
                  height: RING_DIAMETER,
                  zIndex: 9999,
                  pointerEvents: "auto",
                }}
              >
                {/* Glowing border ring showing current color */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: 0,
                    border: `${RING_THICKNESS}px solid ${value}`,
                    boxShadow: `0 0 14px 2px ${value}, inset 0 0 14px 2px ${value}`,
                    opacity: 0.85,
                  }}
                />

                {/* Dots container - centered inside the ring */}
                <div
                  className="absolute"
                  style={{
                    width: FLOWER_DIAMETER,
                    height: FLOWER_DIAMETER,
                    top: RING_PADDING + RING_THICKNESS,
                    left: RING_PADDING + RING_THICKNESS,
                  }}
                >
                  {/* Outer Ring - lowest z-index */}
                  {OUTER_RING_COLORS.map((c, i) => (
                    <ColorDot
                      key={c}
                      color={c}
                      angle={(i / OUTER_RING_COLORS.length) * Math.PI * 2}
                      radius={OUTER_RADIUS}
                      size={OUTER_SIZE}
                      delay={0.06 + i * 0.015}
                      zIndex={10}
                      mouseX={mouseX}
                      mouseY={mouseY}
                      onClick={handleSelect}
                    />
                  ))}

                  {/* Inner Ring - middle z-index */}
                  {INNER_RING_COLORS.map((c, i) => (
                    <ColorDot
                      key={c}
                      color={c}
                      angle={(i / INNER_RING_COLORS.length) * Math.PI * 2}
                      radius={INNER_RADIUS}
                      size={INNER_SIZE}
                      delay={0.03 + i * 0.015}
                      zIndex={20}
                      mouseX={mouseX}
                      mouseY={mouseY}
                      onClick={handleSelect}
                    />
                  ))}

                  {/* Center Dot - highest z-index */}
                  <ColorDot
                    color={value!}
                    angle={0}
                    radius={0}
                    size={CENTER_SIZE}
                    delay={0}
                    zIndex={30}
                    mouseX={mouseX}
                    mouseY={mouseY}
                    onClick={handleSelect}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default ColorPicker;
