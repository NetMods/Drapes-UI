'use client'
import { useEffect, useRef, useState } from 'react';
interface InteractiveDotGridProps {
  dotSpacing?: number;
  dotBaseSize?: number;
  influenceRadius?: number;
  maxScale?: number;
  backgroundColor?: string;
  glowColor?: string;
  showGrid?: boolean;
  numLayers?: number; // For multi-layer glow effect
}
const InteractiveDotGrid = ({
  dotSpacing = 30,
  dotBaseSize = 2,
  influenceRadius = 150,
  maxScale = 8,
  backgroundColor = '#0a0a0a',
  glowColor = '#8b5cf6',
  showGrid = true,
  numLayers = 2, // Layers for gradient/glow depth
}: InteractiveDotGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    // Create grid of dots
    const createDots = () => {
      const dots: { x: number; y: number; baseSize: number }[] = [];
      for (let x = dotSpacing; x < canvas.offsetWidth; x += dotSpacing) {
        for (let y = dotSpacing; y < canvas.offsetHeight; y += dotSpacing) {
          dots.push({ x, y, baseSize: dotBaseSize });
        }
      }
      return dots;
    };
    let dots = createDots();
    let animationId: number;
    const animate = () => {
      if (!ctx || !canvas) return;
      // Clear canvas with background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      // Recreate dots on resize (approximate)
      if (Math.abs(canvas.width - canvas.offsetWidth * window.devicePixelRatio) > 1) {
        dots = createDots();
      }
      // Draw each dot
      dots.forEach((dot) => {
        // Calculate distance from mouse to dot
        const dx = mousePos.x - dot.x;
        const dy = mousePos.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Calculate scale based on distance
        let scale = 1;
        if (distance < influenceRadius && showGrid) {
          const influence = 1 - distance / influenceRadius;
          scale = 1 + influence * influence * (maxScale - 1);
        }
        const size = dot.baseSize * scale;
        const glowIntensity = Math.min(1, (scale - 1) / (maxScale - 1));
        // Multi-layer gradient for depth
        const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, size * numLayers);
        if (scale > 1.5) {
          // Glowing layered gradient: outer glow to inner core
          gradient.addColorStop(0, `rgba(255, 255, 255, ${glowIntensity * 0.3})`); // Soft outer
          for (let layer = 1; layer < numLayers; layer++) {
            const layerOpacity = glowIntensity * (1 - layer / numLayers);
            const layerStop = layer / numLayers;
            gradient.addColorStop(layerStop, `rgba(167, 139, 250, ${layerOpacity})`); // Mid tones
          }
          gradient.addColorStop(1, `${glowColor}`); // Core color
        } else {
          // Subtle grayscale for idle dots
          const intensity = Math.min(255, 100 + (scale - 1) * 40);
          gradient.addColorStop(0, `rgb(${intensity}, ${intensity}, ${intensity})`);
          gradient.addColorStop(1, `rgb(${intensity * 0.7}, ${intensity * 0.7}, ${intensity * 0.7})`);
        }
        // Draw with glow for prominent dots
        if (glowIntensity > 0.2) {
          ctx.shadowBlur = 20 * glowIntensity * numLayers;
          ctx.shadowColor = `${glowColor}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`;
        }
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    const handleMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000 });
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [mousePos, dotSpacing, dotBaseSize, influenceRadius, maxScale, backgroundColor, glowColor, showGrid, numLayers]);
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
export default InteractiveDotGrid
