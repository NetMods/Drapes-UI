'use client';
import { useEffect, useRef } from 'react';

interface WaveGradientProps {
  color1?: string;
  color2?: string;
  amplitude?: number;
  frequency?: number;
  speed?: number;
}

export default function WaveGradient({
  color1 = '#6366f1',
  color2 = '#8b5cf6',
  amplitude = 50,
  frequency = 2,
  speed = 1,
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
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin((x * frequency + offset) * 0.01) * amplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
      offset += speed;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color1, color2, amplitude, frequency, speed]);

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
