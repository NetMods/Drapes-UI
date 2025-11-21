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
  color: string;
  cumulativeTime: number;
  time: number;
  targetTime: number;
}

const Hexagons = ({
  lineLength = 25,
  maxLineCount = 120,
  baseTime = 10,
  addedTime = 10,
  dieChance = 0.1,
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const opts = {
      len: lineLength,
      count: maxLineCount,
      baseTime,
      addedTime,
      dieChance,
      spawnChance,
      sparkChance,
      sparkDist: sparkDistance,
      sparkSize,
      color: 'hsl(hue,100%,light%)',
      baseLight,
      addedLight,
      shadowToTimePropMult: shadowToTimePropMultiplier,
      baseLightInputMultiplier,
      addedLightInputMultiplier,
      cx: w / 2,
      cy: h / 2,
      repaintAlpha,
      hueChange,
    };

    let tick = 0;
    const lines: LineData[] = [];
    let dieX = w / 2 / opts.len;
    let dieY = h / 2 / opts.len;
    const baseRad = (Math.PI * 2) / 6;

    const createLine = (): LineData => ({
      x: 0,
      y: 0,
      addedX: 0,
      addedY: 0,
      rad: 0,
      lightInputMultiplier: 0,
      color: '',
      cumulativeTime: 0,
      time: 0,
      targetTime: 0,
    });

    const resetLine = (line: LineData) => {
      line.x = 0;
      line.y = 0;
      line.addedX = 0;
      line.addedY = 0;
      line.rad = 0;
      line.lightInputMultiplier =
        opts.baseLightInputMultiplier +
        opts.addedLightInputMultiplier * Math.random();
      line.color = opts.color.replace('hue', String(tick * opts.hueChange));
      line.cumulativeTime = 0;
      beginPhase(line);
    };

    const beginPhase = (line: LineData) => {
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

    // 4. Step/Draw Logic
    const stepLine = (line: LineData) => {
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

      ctx.shadowBlur = prop * opts.shadowToTimePropMult;
      ctx.fillStyle = ctx.shadowColor = line.color.replace(
        'light',
        String(currentLight)
      );

      ctx.fillRect(
        opts.cx + (line.x + x) * opts.len,
        opts.cy + (line.y + y) * opts.len,
        2,
        2
      );

      if (Math.random() < opts.sparkChance) {
        ctx.fillRect(
          opts.cx +
          (line.x + x) * opts.len +
          Math.random() * opts.sparkDist * (Math.random() < 0.5 ? 1 : -1) -
          opts.sparkSize / 2,
          opts.cy +
          (line.y + y) * opts.len +
          Math.random() * opts.sparkDist * (Math.random() < 0.5 ? 1 : -1) -
          opts.sparkSize / 2,
          opts.sparkSize,
          opts.sparkSize
        );
      }
    };

    let animationId: number;

    const loop = () => {
      animationId = requestAnimationFrame(loop);
      ++tick;

      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(0,0,0,${opts.repaintAlpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      if (lines.length < opts.count && Math.random() < opts.spawnChance) {
        const newLine = createLine();
        resetLine(newLine);
        lines.push(newLine);
      }

      lines.forEach((line) => stepLine(line));
    };

    loop();

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      opts.cx = w / 2;
      opts.cy = h / 2;

      dieX = w / 2 / opts.len;
      dieY = h / 2 / opts.len;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [
    lineLength,
    maxLineCount,
    baseTime,
    addedTime,
    dieChance,
    spawnChance,
    sparkChance,
    sparkDistance,
    sparkSize,
    baseLight,
    addedLight,
    shadowToTimePropMultiplier,
    baseLightInputMultiplier,
    addedLightInputMultiplier,
    repaintAlpha,
    hueChange,
    backgroundColor,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor,
      }}
    />
  );
};

export default Hexagons;
