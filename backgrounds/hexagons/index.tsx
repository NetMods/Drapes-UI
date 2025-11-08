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

const Page = ({
  lineLength = 20,
  maxLineCount = 50,
  baseTime = 10,
  addedTime = 10,
  dieChance = 0.05,
  spawnChance = 1,
  sparkChance = 0.1,
  sparkDistance = 10,
  sparkSize = 2,
  baseLight = 20,
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

    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

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
    const lines: Line[] = [];
    let dieX = w / 2 / opts.len;
    let dieY = h / 2 / opts.len;
    const baseRad = Math.PI * 2 / 6;

    class Line {
      x = 0;
      y = 0;
      addedX = 0;
      addedY = 0;
      rad = 0;
      lightInputMultiplier = 0;
      color = '';
      cumulativeTime = 0;
      time = 0;
      targetTime = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = 0;
        this.y = 0;
        this.addedX = 0;
        this.addedY = 0;
        this.rad = 0;
        this.lightInputMultiplier = opts.baseLightInputMultiplier + opts.addedLightInputMultiplier * Math.random();
        this.color = opts.color.replace('hue', String(tick * opts.hueChange));
        this.cumulativeTime = 0;
        this.beginPhase();
      }

      beginPhase() {
        this.x += this.addedX;
        this.y += this.addedY;
        this.time = 0;
        this.targetTime = (opts.baseTime + opts.addedTime * Math.random()) | 0;
        this.rad += baseRad * (Math.random() < 0.5 ? 1 : -1);
        this.addedX = Math.cos(this.rad);
        this.addedY = Math.sin(this.rad);

        if (Math.random() < opts.dieChance || this.x > dieX || this.x < -dieX || this.y > dieY || this.y < -dieY) {
          this.reset();
        }
      }

      step() {
        ++this.time;
        ++this.cumulativeTime;

        if (this.time >= this.targetTime) {
          this.beginPhase();
        }

        const prop = this.time / this.targetTime;
        const wave = Math.sin(prop * Math.PI / 2);
        const x = this.addedX * wave;
        const y = this.addedY * wave;

        ctx!.shadowBlur = prop * opts.shadowToTimePropMult;
        ctx!.fillStyle = ctx!.shadowColor = this.color.replace('light', String(opts.baseLight + opts.addedLight * Math.sin(this.cumulativeTime * this.lightInputMultiplier)));
        ctx!.fillRect(opts.cx + (this.x + x) * opts.len, opts.cy + (this.y + y) * opts.len, 2, 2);

        if (Math.random() < opts.sparkChance) {
          ctx!.fillRect(
            opts.cx + (this.x + x) * opts.len + Math.random() * opts.sparkDist * (Math.random() < 0.5 ? 1 : -1) - opts.sparkSize / 2,
            opts.cy + (this.y + y) * opts.len + Math.random() * opts.sparkDist * (Math.random() < 0.5 ? 1 : -1) - opts.sparkSize / 2,
            opts.sparkSize,
            opts.sparkSize
          );
        }
      }
    }

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);

    let animationId: number;

    function loop() {
      animationId = requestAnimationFrame(loop);
      ++tick;

      ctx!.globalCompositeOperation = 'source-over';
      ctx!.shadowBlur = 0;
      ctx!.fillStyle = `rgba(0,0,0,${opts.repaintAlpha})`;
      ctx!.fillRect(0, 0, w, h);
      ctx!.globalCompositeOperation = 'lighter';

      if (lines.length < opts.count && Math.random() < opts.spawnChance) {
        lines.push(new Line());
      }

      lines.forEach(line => line.step());
    }

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
    <div className='h-screen w-screen'>
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
    </div>
  );
}

export default Page
