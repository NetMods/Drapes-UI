'use client';

import { useEffect, useRef } from 'react';

interface FractalTreeProps {
  primaryColor?: string;
  maxDepth?: number;
  branchLength?: number;
  branchProbability?: number;
  growthSpeed?: number;
}

const FractalTree = ({
  primaryColor = 'rgba(51, 51, 51, 0.15)',
  maxDepth = 30,
  branchLength = 6,
  branchProbability = 0.5,
  growthSpeed = 40,
}: FractalTreeProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    // Canvas Resizing Logic
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.scale(dpr, dpr);
      width = w;
      height = h;

      // Restart animation on resize
      start();
    };

    // Math Constants
    const r180 = Math.PI;
    const r90 = Math.PI / 2;
    const r15 = Math.PI / 12;

    const { random } = Math;

    let steps: (() => void)[] = [];
    let prevSteps: (() => void)[] = [];
    let lastTime = performance.now();

    // Helper: Polar to Cartesian
    const polar2cart = (x = 0, y = 0, r = 0, theta = 0) => {
      const dx = r * Math.cos(theta);
      const dy = r * Math.sin(theta);
      return [x + dx, y + dy];
    };

    // Step Logic
    const step = (x: number, y: number, rad: number, counter: { value: number } = { value: 0 }) => {
      const length = random() * branchLength;
      counter.value += 1;

      const [nx, ny] = polar2cart(x, y, length, rad);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      const rad1 = rad + random() * r15;
      const rad2 = rad - random() * r15;

      // Boundary check
      if (nx < -100 || nx > width + 100 || ny < -100 || ny > height + 100) return;

      const rate = counter.value <= maxDepth ? 0.8 : branchProbability;

      // Left branch
      if (random() < rate) steps.push(() => step(nx, ny, rad1, counter));

      // Right branch
      if (random() < rate) steps.push(() => step(nx, ny, rad2, counter));
    };

    // Random Root Generator
    const randomMiddle = () => random() * 0.6 + 0.2;

    const randomRoot = () => {
      const type = random() > 0.5 ? 'vertical' : 'horizontal';
      if (type === 'vertical') {
        const x = randomMiddle() * width;
        const y = random() > 0.5 ? -5 : height + 5;
        const angle = y === -5 ? r90 : -r90;
        steps.push(() => step(x, y, angle));
      } else {
        const x = random() > 0.5 ? -5 : width + 5;
        const y = randomMiddle() * height;
        const angle = x === -5 ? 0 : r180;
        steps.push(() => step(x, y, angle));
      }
    };

    // Animation Loop
    const frame = () => {
      const currentTime = performance.now();

      if (currentTime - lastTime >= growthSpeed) {
        prevSteps = steps;
        steps = [];
        lastTime = currentTime;

        if (!prevSteps.length) {
          // If tree died out, spawn new root occasionally
          if (random() < 0.05) randomRoot();
        }

        prevSteps.forEach((i) => {
          // 50% chance to defer the step to next frame (simulates organic uneven growth)
          if (random() < 0.5) steps.push(i);
          else i();
        });
      }

      animationId = requestAnimationFrame(frame);
    };

    const start = () => {
      // Clear and reset
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = primaryColor;
      prevSteps = [];
      steps = [];

      // Initial roots based on screen size
      if (width < 500) {
        steps.push(() => step(randomMiddle() * width, -5, r90));
        steps.push(() => step(randomMiddle() * width, height + 5, -r90));
      } else {
        steps.push(() => step(randomMiddle() * width, -5, r90));
        steps.push(() => step(randomMiddle() * width, height + 5, -r90));
        steps.push(() => step(-5, randomMiddle() * height, 0));
        steps.push(() => step(width + 5, randomMiddle() * height, r180));
      }

      cancelAnimationFrame(animationId);
      frame();
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [primaryColor, maxDepth, branchLength, branchProbability, growthSpeed]);

  const mask = "radial-gradient(circle, transparent 20%, #000 100%)";

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
        pointerEvents: 'none',
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
};

export default FractalTree;
