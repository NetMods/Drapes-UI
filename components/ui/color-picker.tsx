import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Tooltip } from "./tooltip";

const INNER_RING_COLORS = [
  "#FCA5A5", "#FDBA74", "#FEF08A", "#86EFAC", "#93C5FD", "#C4B5FD",
];

const OUTER_RING_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#84CC16", "#22C55E", "#06B6D4",
  "#3B82F6", "#6366F1", "#8B5CF6", "#D946EF", "#F43F5E", "#EC4899",
];

const CENTER_SIZE = 32;
const INNER_SIZE = 24;
const OUTER_SIZE = 22;
const INNER_RADIUS = 20;
const OUTER_RADIUS = 34;
const FLOWER_EXTENT = OUTER_RADIUS + OUTER_SIZE / 2 + 4;

interface ColorDotProps {
  color: string;
  angle: number;
  radius: number;
  size: number;
  zIndex: number;
  delay: number;
  onClick: (color: string) => void;
}

const ColorDot = ({ color, angle, radius, size, zIndex, delay, onClick }: ColorDotProps) => {
  const finalX = Math.cos(angle) * radius;
  const finalY = Math.sin(angle) * radius;

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
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex,
      }}
      initial={{ x: 0, y: 0 }}
      animate={{ x: finalX, y: finalY }}
      exit={{
        x: 0, y: 0,
        transition: {
          x: { type: "spring", stiffness: 600, damping: 40 },
          y: { type: "spring", stiffness: 600, damping: 40 },
        },
      }}
      whileHover={{ scale: 1.35, zIndex: 50, boxShadow: "0 0 8px rgba(255,255,255,0.5)", transition: { duration: 0.12 } }}
      whileTap={{ scale: 0.9, transition: { duration: 0.08 } }}
      transition={{
        x: { type: "spring", stiffness: 600, damping: 40, delay },
        y: { type: "spring", stiffness: 600, damping: 40, delay },
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

  const close = useCallback(() => setIsOpen(false), []);

  // Calculate position from trigger and open
  const handleOpen = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setPortalPos({
      top: centerY - FLOWER_DIAMETER / 2,
      left: centerX - FLOWER_DIAMETER / 2,
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

  const handleSelect = (color: string) => {
    onChange(color);
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{ duration: 0.08 }}
                style={{
                  position: "fixed",
                  top: portalPos.top,
                  left: portalPos.left,
                  width: FLOWER_DIAMETER,
                  height: FLOWER_DIAMETER,
                  zIndex: 9999,
                  pointerEvents: "auto",
                }}
              >
                {OUTER_RING_COLORS.map((c, i) => (
                  <ColorDot
                    key={c}
                    color={c}
                    angle={(i / OUTER_RING_COLORS.length) * Math.PI * 2}
                    radius={OUTER_RADIUS}
                    size={OUTER_SIZE}
                    delay={0.03 + i * 0.008}
                    zIndex={10}
                    onClick={handleSelect}
                  />
                ))}

                {INNER_RING_COLORS.map((c, i) => (
                  <ColorDot
                    key={c}
                    color={c}
                    angle={(i / INNER_RING_COLORS.length) * Math.PI * 2}
                    radius={INNER_RADIUS}
                    size={INNER_SIZE}
                    delay={0.015 + i * 0.008}
                    zIndex={20}
                    onClick={handleSelect}
                  />
                ))}

                <ColorDot
                  color={value!}
                  angle={0}
                  radius={0}
                  size={CENTER_SIZE}
                  delay={0}
                  zIndex={30}
                  onClick={handleSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default ColorPicker;
