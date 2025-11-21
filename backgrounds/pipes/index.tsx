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

const convertToAlphaColor = (color: string, alpha: number = 0.05): string => {
  if (/^hsla?\(/.test(color)) {
    return color.replace(/,\s*[\d.]+\)$/, `,${alpha})`).replace(/^hsl\(/, 'hsla(');
  }
  if (/^rgba?\(/.test(color)) {
    return color.replace(/,\s*[\d.]+\)$/, `,${alpha})`).replace(/^rgb\(/, 'rgba(');
  }
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    const r = parseInt(shortHexMatch[1] + shortHexMatch[1], 16);
    const g = parseInt(shortHexMatch[2] + shortHexMatch[2], 16);
    const b = parseInt(shortHexMatch[3] + shortHexMatch[3], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  try {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = color;
      const computedColor = tempCtx.fillStyle;
      const rgbMatch = computedColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 16);
        const g = parseInt(rgbMatch[2], 16);
        const b = parseInt(rgbMatch[3], 16);
        return `rgba(${r},${g},${b},${alpha})`;
      }
    }
  } catch (e) {
  }
  return `rgba(0,0,0,${alpha})`;
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

    const pipePropCount = 10;
    const pipePropsLength = pipeCount * pipePropCount;
    const turnAmount = (360 / turnCount) * TO_RAD;
    const turnChanceRange = 58;
    tickRef.current = 0;
    const fadingBackgroundColor = convertToAlphaColor(backgroundColor, 0.05);
    let isActive = true;

    const initPipe = (i: number) => {
      const w = offscreenCanvasRef.current?.width ?? 0;
      const x = rand(0, w);
      const y = centerRef.current[1];
      const direction = round(rand(0, 1)) ? HALF_PI : TAU - HALF_PI;
      const speed = baseSpeed + rand(0, rangeSpeed);
      const life = 0;
      const ttl = baseTTL + rand(0, rangeTTL);
      const width = baseWidth + rand(0, rangeWidth);
      const hue = baseHue + rand(0, rangeHue);
      // CHANGED: Set prevX/prevY to current x/y on init
      pipePropsRef.current?.set([x, y, direction, speed, life, ttl, width, hue, x, y], i);
    };

    const initPipes = () => {
      pipePropsRef.current = new Float32Array(pipePropsLength);
      for (let i = 0; i < pipePropsLength; i += pipePropCount) {
        initPipe(i);
      }
    };

    const drawPipe = (
      x: number, y: number,
      prevX: number, prevY: number,
      life: number, ttl: number,
      width: number, hue: number
    ) => {
      const ctxA = offscreenCtxRef.current;
      if (!ctxA) return;
      ctxA.save();
      ctxA.strokeStyle = `hsla(${hue},75%,50%,${fadeInOut(life, ttl)})`;
      ctxA.lineWidth = width;
      ctxA.lineCap = 'round';
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
      const i2 = 1 + i, i3 = 2 + i, i4 = 3 + i, i5 = 4 + i, i6 = 5 + i, i7 = 6 + i, i8 = 7 + i, i9 = 8 + i, i10 = 9 + i;
      const x = props[i];
      const y = props[i2];
      let direction = props[i3];
      const speed = props[i4];
      let life = props[i5];
      const ttl = props[i6];
      const width = props[i7];
      const hue = props[i8];
      const prevX = props[i9];
      const prevY = props[i10];
      // Draw the line segment
      drawPipe(x, y, prevX, prevY, life, ttl, width, hue);
      life++;
      const newX = x + cos(direction) * speed;
      const newY = y + sin(direction) * speed;
      const tick = tickRef.current;
      const turnChance = !(tick % round(rand(1, turnChanceRange))) && (!(round(x) % 6) || !(round(y) % 6));
      const turnBias = round(rand(0, 1)) ? -1 : 1;
      direction += turnChance ? turnAmount * turnBias : 0;
      props[i] = newX;
      props[i2] = newY;
      props[i3] = direction;
      props[i5] = life;
      props[i9] = x;
      props[i10] = y;
      life > ttl && initPipe(i);
    };

    const updatePipes = () => {
      tickRef.current++;
      for (let i = 0; i < pipePropsLength; i += pipePropCount) {
        updatePipe(i);
      }
    };

    const draw = () => {
      if (!isActive) return;
      rafIdRef.current = requestAnimationFrame(draw);
      const ctxA = offscreenCtxRef.current;
      const canvasA = offscreenCanvasRef.current;
      const ctxB = visibleCtxRef.current;
      const canvasB = canvasRef.current;
      if (!ctxA || !canvasA || !ctxB || !canvasB) return;
      ctxA.fillStyle = fadingBackgroundColor;
      ctxA.fillRect(0, 0, canvasA.width, canvasA.height);
      updatePipes();
      ctxB.fillStyle = backgroundColor;
      ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
      ctxB.save();
      ctxB.filter = 'blur(12px)';
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();
      ctxB.save();
      ctxB.drawImage(canvasA, 0, 0);
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
      centerRef.current = [innerWidth / 2, innerHeight / 2];
      initPipes();
    };

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
      style={{ display: 'block', width: '100%', height: '100vh' }}
    />
  );
};

export default Pipes;
