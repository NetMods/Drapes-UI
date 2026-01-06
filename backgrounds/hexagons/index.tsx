'use client';

import { useEffect, useRef } from 'react';

interface HexagonalLightTrailsProps {
  lineLength?: number;
  maxLineCount?: number;
  baseTime?: number;
  addedTime?: number;
  dieChance?: number;
  spawnChance?: number;
  sparkChance?: number;
  sparkDistance?: number;
  sparkSize?: number;
  baseLight?: number;
  addedLight?: number;
  shadowToTimePropMultiplier?: number;
  baseLightInputMultiplier?: number;
  addedLightInputMultiplier?: number;
  repaintAlpha?: number;
  hueChange?: number;
  backgroundColor?: string;
}

interface LineData {
  x: number;
  y: number;
  addedX: number;
  addedY: number;
  rad: number;
  lightInputMultiplier: number;
  hue: number;
  cumulativeTime: number;
  time: number;
  targetTime: number;
}

const Hexagons = ({
  lineLength = 25,
  maxLineCount = 100, // Reduced slightly for better default performance
  baseTime = 10,
  addedTime = 10,
  dieChance = 0.05,
  spawnChance = 1,
  sparkChance = 0.06,
  sparkDistance = 10,
  sparkSize = 2,
  baseLight = 70,
  addedLight = 3,
  shadowToTimePropMultiplier = 2,
  baseLightInputMultiplier = 0.015,
  addedLightInputMultiplier = 0.02,
  repaintAlpha = 0.09,
  hueChange = 0.1,
  backgroundColor = 'black',
}: HexagonalLightTrailsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use a ref to store the animation ID so we can cancel it reliably
  const frameIdRef = useRef<number>(0);

  // Store options in a ref to avoid re-triggering effect on non-visual prop changes if needed,
  // but strictly we want to update if props update.
  const optsRef = useRef({
    len: lineLength,
    count: maxLineCount,
    baseTime,
    addedTime,
    dieChance,
    spawnChance,
    sparkChance,
    sparkDist: sparkDistance,
    sparkSize,
    baseLight,
    addedLight,
    shadowToTimePropMult: shadowToTimePropMultiplier,
    baseLightInputMultiplier,
    addedLightInputMultiplier,
    repaintAlpha,
    hueChange,
  });

  // Update opts ref when props change
  useEffect(() => {
    optsRef.current = {
      len: lineLength,
      count: maxLineCount,
      baseTime,
      addedTime,
      dieChance,
      spawnChance,
      sparkChance,
      sparkDist: sparkDistance,
      sparkSize,
      baseLight,
      addedLight,
      shadowToTimePropMult: shadowToTimePropMultiplier,
      baseLightInputMultiplier,
      addedLightInputMultiplier,
      repaintAlpha,
      hueChange,
    };
  }, [
    lineLength, maxLineCount, baseTime, addedTime, dieChance,
    spawnChance, sparkChance, sparkDistance, sparkSize, baseLight,
    addedLight, shadowToTimePropMultiplier, baseLightInputMultiplier,
    addedLightInputMultiplier, repaintAlpha, hueChange
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: false, // Optimizes by telling browser the canvas is opaque
      desynchronized: true // Hint to browser to optimize for low latency
    });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let dieX = 0;
    let dieY = 0;

    const lines: LineData[] = [];
    let tick = 0;
    const baseRad = (Math.PI * 2) / 6;

    const resize = () => {
      // PERFORMANCE TIP: Cap DPR to 2. Screens with 3x or 4x will kill performance 
      // with full-screen canvas effects like this.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      ctx.scale(dpr, dpr);

      w = window.innerWidth;
      h = window.innerHeight;
      cx = w / 2;
      cy = h / 2;

      // Cache these calculations
      const len = optsRef.current.len;
      dieX = w / 2 / len;
      dieY = h / 2 / len;
    };

    const resetLine = (line: LineData) => {
      const opts = optsRef.current;
      line.x = 0;
      line.y = 0;
      line.addedX = 0;
      line.addedY = 0;
      line.rad = 0;
      line.lightInputMultiplier =
        opts.baseLightInputMultiplier +
        opts.addedLightInputMultiplier * Math.random();

      line.hue = tick * opts.hueChange;
      line.cumulativeTime = 0;

      beginPhase(line);
    };

    const beginPhase = (line: LineData) => {
      const opts = optsRef.current;
      line.x += line.addedX;
      line.y += line.addedY;
      line.time = 0;
      line.targetTime = (opts.baseTime + opts.addedTime * Math.random()) | 0;

      line.rad += baseRad * (Math.random() < 0.5 ? 1 : -1);
      line.addedX = Math.cos(line.rad);
      line.addedY = Math.sin(line.rad);

      if (
        Math.random() < opts.dieChance ||
        line.x > dieX ||
        line.x < -dieX ||
        line.y > dieY ||
        line.y < -dieY
      ) {
        resetLine(line);
      }
    };

    const stepLine = (line: LineData) => {
      const opts = optsRef.current;
      line.time++;
      line.cumulativeTime++;

      if (line.time >= line.targetTime) {
        beginPhase(line);
      }

      const prop = line.time / line.targetTime;
      const wave = Math.sin((prop * Math.PI) / 2);
      const x = line.addedX * wave;
      const y = line.addedY * wave;

      const currentLight =
        opts.baseLight +
        opts.addedLight *
        Math.sin(line.cumulativeTime * line.lightInputMultiplier);

      // PERFORMANCE TIP: Round hue to reduce string complexity for the browser
      const hsl = `hsl(${line.hue | 0},100%,${currentLight | 0}%)`;

      // ShadowBlur is expensive. Only apply if visible.
      if (opts.shadowToTimePropMult > 0) {
        ctx.shadowBlur = prop * opts.shadowToTimePropMult;
        ctx.shadowColor = hsl;
      }

      ctx.fillStyle = hsl;

      // PERFORMANCE TIP: Use bitwise OR 0 (| 0) to force integers. 
      // Canvas draws much faster on whole pixels than sub-pixels.
      const drawX = cx + (line.x + x) * opts.len;
      const drawY = cy + (line.y + y) * opts.len;

      ctx.fillRect(drawX | 0, drawY | 0, 2, 2);

      if (Math.random() < opts.sparkChance) {
        const randDist = Math.random() * opts.sparkDist * (Math.random() < 0.5 ? 1 : -1);
        ctx.fillRect(
          (drawX + randDist) | 0,
          (drawY + randDist) | 0,
          opts.sparkSize,
          opts.sparkSize
        );
      }
    };

    const loop = () => {
      const opts = optsRef.current;
      frameIdRef.current = requestAnimationFrame(loop);

      ++tick;

      // Fade Effect
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(0,0,0,${opts.repaintAlpha})`;
      ctx.fillRect(0, 0, w, h);

      // Draw Lines
      ctx.globalCompositeOperation = 'lighter';

      if (lines.length < opts.count && Math.random() < opts.spawnChance) {
        lines.push({
          x: 0, y: 0, addedX: 0, addedY: 0, rad: 0,
          lightInputMultiplier: 0, hue: 0, cumulativeTime: 0,
          time: 0, targetTime: 0
        });
        resetLine(lines[lines.length - 1]);
      }

      lines.forEach((line) => stepLine(line));
    };

    // Initialize
    resize();
    window.addEventListener('resize', resize);
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameIdRef.current);
    };
  }, []); // Run once on mount. Props are handled via ref to prevent full restart.

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10,
        backgroundColor: backgroundColor,
        pointerEvents: 'none' // Ensures canvas doesn't block clicks underneath
      }}
    />
  );
};

export default Hexagons;
