'use client';
import { useEffect, useRef } from 'react';

interface WaveGradientProps {
  color1?: string;
  color2?: string;
  amplitude?: number;
  frequency?: number;
  speed?: number;
  showWave?: boolean;
  waveDirection?: 'leftToRight' | 'rightToLeft';
  waveShape?: 'sine' | 'cosine' | 'triangle';
}

export default function WaveGradient({
  color1 = '#6366f1',
  color2 = '#8b5cf6',
  amplitude = 50,
  frequency = 2,
  speed = 1,
  showWave = true,
  waveDirection = 'leftToRight',
  waveShape = 'sine',
}: WaveGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    let offset = 0;

    // Helper function to generate wave y based on shape
    const getWaveY = (x: number, height: number) => {
      const base = (x * frequency + offset) * 0.01;
      switch (waveShape) {
        case 'cosine':
          return height / 2 + Math.cos(base) * amplitude;
        case 'triangle':
          const period = 2 * Math.PI / frequency;
          const normalizedX = (x % period) / period;
          return height / 2 + (normalizedX < 0.5 ? normalizedX * 2 : 2 - normalizedX * 2) * amplitude;
        default: // sine
          return height / 2 + Math.sin(base) * amplitude;
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw wave only if enabled
      if (showWave) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        // Reverse direction if rightToLeft
        const startX = waveDirection === 'rightToLeft' ? canvas.width : 0;
        const endX = waveDirection === 'rightToLeft' ? 0 : canvas.width;
        const step = waveDirection === 'rightToLeft' ? -1 : 1;

        for (let x = startX; x !== endX; x += step) {
          const y = getWaveY(Math.abs(x), canvas.height);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(endX, canvas.height);
        ctx.lineTo(startX, canvas.height);
        ctx.closePath();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
      }

      // Adjust offset based on direction
      offset += (waveDirection === 'rightToLeft' ? -speed : speed);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color1, color2, amplitude, frequency, speed, showWave, waveDirection, waveShape]);

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
      }}
    />
  );
};
