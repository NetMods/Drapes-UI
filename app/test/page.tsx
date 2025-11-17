'use client';
import { useEffect, useRef } from 'react';

interface PipeAnimationProps {
  pipeCount?: number;
  backgroundColor?: string;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseTTL?: number;
  rangeTTL?: number;
  baseWidth?: number;
  rangeWidth?: number;
  baseHue?: number;
  rangeHue?: number;
  turnCount?: number;
}

// --- Helper constants and functions ---
const TO_RAD = Math.PI / 180;
const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const { cos, sin, round } = Math;
const rand = (min: number, max: number): number => min + Math.random() * (max - min);
const fadeInOut = (life: number, ttl: number): number => {
  const halfTTL = ttl / 2;
  if (life < halfTTL) {
    return life / halfTTL;
  }
  return 1 - (life - halfTTL) / halfTTL;
};

const Pipes = ({
  pipeCount = 30,
  backgroundColor = 'hsla(150,80%,1%,1)',
  baseSpeed = 0.5,
  rangeSpeed = 1,
  baseTTL = 300,
  rangeTTL = 600,
  baseWidth = 15,
  rangeWidth = 12,
  baseHue = 180,
  rangeHue = 60,
  turnCount = 8,
}: PipeAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const pipePropsRef = useRef<Float32Array | null>(null);
  const centerRef = useRef<[number, number]>([0, 0]);
  const tickRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    visibleCtxRef.current = ctx;
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvasRef.current = offscreenCanvas;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;
    offscreenCtxRef.current = offscreenCtx;

    // --- Constants and State ---
    const pipePropCount = 10; // CHANGED: Was 8, added 2 for prevX/prevY
    const pipePropsLength = pipeCount * pipePropCount;
    const turnAmount = (360 / turnCount) * TO_RAD;
    const turnChanceRange = 58;
    tickRef.current = 0;
    const fadingBackgroundColor = backgroundColor.replace(/,1\)$/, ',0.05)');
    let isActive = true;

    const initPipe = (i: number) => {
      const w = offscreenCanvasRef.current?.width ?? 0;
      const h = offscreenCanvasRef.current?.height ?? 0;
      let x, y, direction, speed, life, ttl, width, hue;
      x = rand(0, w);
      y = rand(0, h);
      direction = rand(0, TAU);
      speed = baseSpeed + rand(0, rangeSpeed);
      life = 0;
      ttl = baseTTL + rand(0, rangeTTL);
      width = baseWidth + rand(0, rangeWidth);
      hue = baseHue + rand(0, rangeHue);
      // CHANGED: Set prevX/prevY to current x/y on init
      pipePropsRef.current?.set([x, y, direction, speed, life, ttl, width, hue, x, y], i);
    };

    const initPipes = () => {
      pipePropsRef.current = new Float32Array(pipePropsLength);
      for (let i = 0; i < pipePropsLength; i += pipePropCount) {
        initPipe(i);
      }
    };

    // CHANGED: This function now draws lines
    const drawPipe = (
      x: number, y: number,
      prevX: number, prevY: number,
      life: number, ttl: number,
      width: number, hue: number
    ) => {
      const ctxA = offscreenCtxRef.current;
      if (!ctxA) return;
      ctxA.save();
      // CHANGED: Removed * 0.5 multiplier for full brightness
      ctxA.strokeStyle = `hsla(${hue},75%,50%,${fadeInOut(life, ttl)})`;
      ctxA.lineWidth = width;
      ctxA.lineCap = 'round'; // Makes line ends smoother
      ctxA.beginPath();
      ctxA.moveTo(prevX, prevY);
      ctxA.lineTo(x, y);
      ctxA.stroke();
      ctxA.closePath();
      ctxA.restore();
    };

    const updatePipe = (i: number) => {
      const props = pipePropsRef.current;
      if (!props) return;
      // CHANGED: Added i9 and i10 for prevX/prevY
      const i2 = 1 + i, i3 = 2 + i, i4 = 3 + i, i5 = 4 + i, i6 = 5 + i, i7 = 6 + i, i8 = 7 + i, i9 = 8 + i, i10 = 9 + i;
      let x = props[i];
      let y = props[i2];
      let direction = props[i3];
      let speed = props[i4];
      let life = props[i5];
      let ttl = props[i6];
      let width = props[i7];
      let hue = props[i8];
      let prevX = props[i9];
      let prevY = props[i10];

      // Draw the line segment
      drawPipe(x, y, prevX, prevY, life, ttl, width, hue);

      // Update state
      life++;
      const newX = x + cos(direction) * speed;
      const newY = y + sin(direction) * speed;
      const tick = tickRef.current;
      const turnChance = !(tick % round(rand(1, turnChanceRange))) && (!(round(x) % 6) || !(round(y) % 6));
      const turnBias = round(rand(0, 1)) ? -1 : 1;
      direction += turnChance ? turnAmount * turnBias : 0;

      // Write back to array
      props[i] = newX; // Set new X
      props[i2] = newY; // Set new Y
      props[i3] = direction;
      props[i5] = life;
      props[i9] = x; // Set new prevX (which is the old x)
      props[i10] = y; // Set new prevY (which is the old y)

      // Reset if dead
      life > ttl && initPipe(i);
    };

    const updatePipes = () => {
      tickRef.current++;
      for (let i = 0; i < pipePropsLength; i += pipePropCount) {
        updatePipe(i);
      }
    };

    // This is the main 'draw' loop
    const draw = () => {
      if (!isActive) return;
      rafIdRef.current = requestAnimationFrame(draw);
      const ctxA = offscreenCtxRef.current;
      const canvasA = offscreenCanvasRef.current;
      const ctxB = visibleCtxRef.current;
      const canvasB = canvasRef.current;
      if (!ctxA || !canvasA || !ctxB || !canvasB) return;

      // 1. Fade the offscreen buffer (the "trails")
      ctxA.fillStyle = fadingBackgroundColor;
      ctxA.fillRect(0, 0, canvasA.width, canvasA.height);

      // 2. Update and draw new pipe segments to offscreen buffer
      updatePipes();

      // 3. Render to the visible canvas
      ctxB.fillStyle = backgroundColor;
      ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
      ctxB.save();
      ctxB.filter = 'blur(12px)';
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();
      ctxB.save();
      ctxB.drawImage(canvasA, 0, 0); // Sharp on top
      ctxB.restore();
    };

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      const canvasA = offscreenCanvasRef.current;
      const canvasB = canvasRef.current;
      if (!canvasA || !canvasB) return;
      canvasA.width = innerWidth;
      canvasA.height = innerHeight;
      canvasB.width = innerWidth;
      canvasB.height = innerHeight;
      centerRef.current = [0.5 * innerWidth, 0.5 * innerHeight];
      initPipes();
    };

    // --- Initialization and Cleanup ---
    resize();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        cancelAnimationFrame(rafIdRef.current);
      } else {
        isActive = true;
        rafIdRef.current = requestAnimationFrame(draw);
      }
    };
    rafIdRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(rafIdRef.current);
      isActive = false;
    };
  }, [
    pipeCount, backgroundColor, baseSpeed, rangeSpeed, baseTTL, rangeTTL,
    baseWidth, rangeWidth, baseHue, rangeHue, turnCount
  ]);

  return (
    <canvas
      ref={canvasRef}
    />
  );
};

export default Pipes;
