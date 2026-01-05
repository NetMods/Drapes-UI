'use client'
import { useEffect, useRef } from 'react';

interface InteractiveDotGridProps {
  dotSpacing?: number;
  dotBaseSize?: number;
  influenceRadius?: number;
  maxScale?: number;
  backgroundColor?: string;
  glowColor?: string;
  dotColor?: string;
  activeDotColor?: string;
  glowCoreColor?: string;
  showGrid?: boolean;
  numLayers?: number;
  hiddots?: boolean;
}

const InteractiveDotGrid = ({
  dotSpacing = 30,
  dotBaseSize = 2,
  influenceRadius = 150,
  maxScale = 8,
  backgroundColor = '#0a0a0a',
  glowColor = '#8b5cf6',
  dotColor = '#646464',
  activeDotColor = '#a78bfa',
  glowCoreColor = '#ffffff',
  showGrid = true,
  numLayers = 2,
  hiddots = false,
}: InteractiveDotGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const lastMousePos = useRef({ x: -1000, y: -1000 });
  const dotsRef = useRef<{ x: number; y: number; baseSize: number }[]>([]);
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);

      dotsRef.current = [];
      for (let x = dotSpacing; x < canvas.offsetWidth; x += dotSpacing) {
        for (let y = dotSpacing; y < canvas.offsetHeight; y += dotSpacing) {
          dotsRef.current.push({ x, y, baseSize: dotBaseSize });
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const influenceRadiusSq = influenceRadius * influenceRadius;

    // Parse colors once
    const parseColor = (color: string) => {
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return { r, g, b };
      }
      return { r: 100, g: 100, b: 100 };
    };
    const baseColor = parseColor(dotColor);

    const animate = () => {
      if (!ctx || !canvas) return;

      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const lastMx = lastMousePos.current.x;
      const lastMy = lastMousePos.current.y;

      // Skip frame if mouse hasn't moved significantly
      const mouseMoved = Math.abs(mx - lastMx) > 2 || Math.abs(my - lastMy) > 2;

      if (mouseMoved || lastMx === -1000) {
        lastMousePos.current.x = mx;
        lastMousePos.current.y = my;

        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

        // Calculate visible bounds for optimization
        const minX = mx - influenceRadius * 1.5;
        const maxX = mx + influenceRadius * 1.5;
        const minY = my - influenceRadius * 1.5;
        const maxY = my + influenceRadius * 1.5;

        for (let i = 0; i < dotsRef.current.length; i++) {
          const dot = dotsRef.current[i];

          // Skip dots outside influence area for hiddots mode
          if (hiddots) {
            if (dot.x < minX || dot.x > maxX || dot.y < minY || dot.y > maxY) {
              continue;
            }
          }

          const dx = mx - dot.x;
          const dy = my - dot.y;
          const distanceSq = dx * dx + dy * dy;

          if (hiddots && distanceSq >= influenceRadiusSq) {
            continue;
          }

          let scale = 1;
          if (distanceSq < influenceRadiusSq && showGrid) {
            const distance = Math.sqrt(distanceSq);
            const influence = 1 - distance / influenceRadius;
            scale = 1 + influence * influence * (maxScale - 1);
          }

          const size = dot.baseSize * scale;
          const glowIntensity = Math.min(1, (scale - 1) / (maxScale - 1));

          // Reset shadow state explicitly
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';

          if (scale > 1.5) {
            const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, size * numLayers);
            const coreAlpha = Math.floor(glowIntensity * 0.3 * 255).toString(16).padStart(2, '0');
            gradient.addColorStop(0, `${glowCoreColor}${coreAlpha}`);

            for (let layer = 1; layer < numLayers; layer++) {
              const layerOpacity = glowIntensity * (1 - layer / numLayers);
              const layerStop = layer / numLayers;
              const alpha = Math.floor(layerOpacity * 255).toString(16).padStart(2, '0');
              gradient.addColorStop(layerStop, `${activeDotColor}${alpha}`);
            }
            gradient.addColorStop(1, glowColor);
            ctx.fillStyle = gradient;

            if (glowIntensity > 0.2) {
              ctx.shadowBlur = 20 * glowIntensity * numLayers;
              const shadowAlpha = Math.floor(glowIntensity * 255).toString(16).padStart(2, '0');
              ctx.shadowColor = `${glowColor}${shadowAlpha}`;
            }
          } else {
            const intensity = 1 + (scale - 1) * 0.4;
            const r = Math.min(255, baseColor.r * intensity);
            const g = Math.min(255, baseColor.g * intensity);
            const b = Math.min(255, baseColor.b * intensity);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          }

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Final cleanup
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mousePos.current.x = -1000;
      mousePos.current.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [dotSpacing, dotBaseSize, influenceRadius, maxScale, backgroundColor, glowColor, dotColor, activeDotColor, glowCoreColor, showGrid, numLayers, hiddots]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        backgroundColor
      }}
    />
  );
}

export default InteractiveDotGrid;
