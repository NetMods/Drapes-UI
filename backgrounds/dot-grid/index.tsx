'use client';
import { useCallback, useEffect, useRef } from 'react';

interface InteractiveDotGridProps {
  dotSpacing?: number;
  dotBaseSize?: number;
  influenceRadius?: number;
  displacementStrength?: number;
  backgroundColor?: string;
  dotColor?: string;
  mouseInteraction?: boolean;
  shape?: 'circle' | 'triangle' | 'square';
}

// Parse hex color once, outside component
function parseColor(color: string) {
  if (color.startsWith('#') && color.length >= 7) {
    return {
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16),
    };
  }
  return { r: 100, g: 100, b: 100 };
}

const DotGrid = ({
  dotSpacing = 30,
  dotBaseSize = 2,
  influenceRadius = 150,
  displacementStrength = 40,
  backgroundColor = '#0a0a0a',
  dotColor = '#646464',
  mouseInteraction = true,
  shape = 'circle',
}: InteractiveDotGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const lastMousePos = useRef({ x: -1000, y: -1000 });
  const dotsRef = useRef<{ x: number; y: number }[]>([]);

  const propsRef = useRef({
    dotSpacing,
    dotBaseSize,
    influenceRadius,
    displacementStrength,
    backgroundColor,
    dotColor,
    mouseInteraction,
    shape,
  });
  propsRef.current = {
    dotSpacing,
    dotBaseSize,
    influenceRadius,
    displacementStrength,
    backgroundColor,
    dotColor,
    mouseInteraction,
    shape,
  };

  const rebuildDots = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { dotSpacing: spacing } = propsRef.current;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const dots: { x: number; y: number }[] = [];
    for (let x = spacing; x < w; x += spacing) {
      for (let y = spacing; y < h; y += spacing) {
        dots.push({ x, y });
      }
    }
    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const applySize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildDots();
      lastMousePos.current = { x: -9999, y: -9999 };
    };
    applySize();

    const ro = new ResizeObserver(applySize);
    ro.observe(canvas);

    const drawShape = (
      x: number,
      y: number,
      size: number,
      s: 'circle' | 'triangle' | 'square',
    ) => {
      ctx.beginPath();
      if (s === 'triangle') {
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size * 0.866, y + size * 0.5);
        ctx.lineTo(x + size * 0.866, y + size * 0.5);
        ctx.closePath();
      } else if (s === 'square') {
        ctx.rect(x - size, y - size, size * 2, size * 2);
      } else {
        ctx.arc(x, y, size, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const animate = () => {
      const p = propsRef.current;
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const lx = lastMousePos.current.x;
      const ly = lastMousePos.current.y;

      const moved = Math.abs(mx - lx) > 1 || Math.abs(my - ly) > 1;
      if (moved || lx === -9999) {
        lastMousePos.current.x = mx;
        lastMousePos.current.y = my;

        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        const baseColor = parseColor(p.dotColor);
        const irSq = p.influenceRadius * p.influenceRadius;

        ctx.fillStyle = p.backgroundColor;
        ctx.fillRect(0, 0, w, h);

        const dots = dotsRef.current;
        const len = dots.length;

        for (let i = 0; i < len; i++) {
          const dot = dots[i];
          const dx = dot.x - mx;
          const dy = dot.y - my;
          const distSq = dx * dx + dy * dy;

          let drawX = dot.x;
          let drawY = dot.y;
          let scale = 1;

          if (p.mouseInteraction && distSq < irSq && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const inf = 1 - dist / p.influenceRadius;
            const inf2 = inf * inf;

            const disp = inf2 * p.displacementStrength;
            const invDist = 1 / dist;
            drawX += dx * invDist * disp;
            drawY += dy * invDist * disp;
            scale = 1 + inf2 * 2;
          }

          const size = p.dotBaseSize * scale;
          const brightness = Math.min(2.5, 1 + (scale - 1) * 0.8);
          const r = Math.min(255, baseColor.r * brightness) | 0;
          const g = Math.min(255, baseColor.g * brightness) | 0;
          const b = Math.min(255, baseColor.b * brightness) | 0;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          drawShape(drawX, drawY, size, p.shape);
        }

        if (p.mouseInteraction && mx > 0 && my > 0) {
          const cursorSize = p.dotBaseSize * 3;
          const bright = Math.min(2.5, 2.6);
          const r = Math.min(255, baseColor.r * bright) | 0;
          const g = Math.min(255, baseColor.g * bright) | 0;
          const b = Math.min(255, baseColor.b * bright) | 0;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          drawShape(mx, my, cursorSize, p.shape);
        }
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    // --- Pointer events (passive for performance) ---
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mousePos.current.x = -1000;
      mousePos.current.y = -1000;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [rebuildDots]);

  useEffect(() => {
    rebuildDots();
    lastMousePos.current = { x: -9999, y: -9999 };
  }, [dotSpacing, rebuildDots]);

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
        backgroundColor,
        touchAction: 'none',
      }}
    />
  );
};

export default DotGrid;
