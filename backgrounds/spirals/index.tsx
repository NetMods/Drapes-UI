'use client';

import { useEffect, useRef } from 'react';

interface SpiralAnimationProps {
  maxOffset?: number;
  spacing?: number;
  pointsPerLap?: number;
  shadowStrength?: number;
  primaryColor?: string;
  secondaryColor?: string;
  lineWidth?: number;
  initialVelocity?: number;
}

const Spirals = ({
  maxOffset = 400,
  spacing = 3,
  pointsPerLap = 6,
  shadowStrength = 6,
  primaryColor = '#fff',
  secondaryColor = '#fff',
  lineWidth = 2,
  initialVelocity = 0.1,
}: SpiralAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let velocity = initialVelocity;
    let velocityTarget = initialVelocity;
    let width = 0;
    let height = 0;
    let lastX = 0;
    let lastY = 0;

    const POINTS = maxOffset / spacing;
    const PEAK = maxOffset * 0.25;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = w;
      height = h;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const clear = () => {
      ctx.clearRect(0, 0, width, height);
    };

    const render = () => {
      const cx = width / 2;
      const cy = height / 2;

      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = secondaryColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (let i = POINTS; i > 0; i--) {
        const value = i * spacing + (time % spacing);

        const ax = Math.sin(value / pointsPerLap) * Math.PI;
        const ay = Math.cos(value / pointsPerLap) * Math.PI;

        let x = ax * value;
        let y = ay * value * 0.35;

        const o = 1 - Math.min(value, PEAK) / PEAK;

        y -= Math.pow(o, 2) * 200;
        y += (200 * value) / maxOffset;
        y += (x / cx) * width * 0.1;

        ctx.globalAlpha = 1 - value / maxOffset;
        ctx.shadowBlur = shadowStrength * o;

        ctx.lineTo(cx + x, cy + y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + x, cy + y);
      }

      ctx.lineTo(cx, cy - 200);
      ctx.lineTo(cx, 0);
      ctx.stroke();
    };

    const step = () => {
      time += velocity;
      velocity += (velocityTarget - velocity) * 0.3;

      clear();
      render();

      rafId = requestAnimationFrame(step);
    };

    let rafId = requestAnimationFrame(step);

    const onMouseDown = (event: MouseEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (event: MouseEvent) => {
      let vx = (event.clientX - lastX) / 100;
      let vy = (event.clientY - lastY) / 100;

      if (event.clientY < height / 2) vx *= -1;
      if (event.clientX > width / 2) vy *= -1;

      velocityTarget = vx + vy;

      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onTouchStart = (event: TouchEvent) => {
      event.preventDefault();

      lastX = event.touches[0].clientX;
      lastY = event.touches[0].clientY;

      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    };

    const onTouchMove = (event: TouchEvent) => {
      let vx = (event.touches[0].clientX - lastX) / 100;
      let vy = (event.touches[0].clientY - lastY) / 100;

      if (event.touches[0].clientY < height / 2) vx *= -1;
      if (event.touches[0].clientX > width / 2) vy *= -1;

      velocityTarget = vx + vy;

      lastX = event.touches[0].clientX;
      lastY = event.touches[0].clientY;
    };

    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('mousedown', onMouseDown);
    document.addEventListener('touchstart', onTouchStart);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('touchstart', onTouchStart);
      cancelAnimationFrame(rafId);
    };
  }, [maxOffset, spacing, pointsPerLap, shadowStrength, primaryColor, secondaryColor, lineWidth, initialVelocity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default Spirals;
