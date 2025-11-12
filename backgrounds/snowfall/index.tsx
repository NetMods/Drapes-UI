'use client';

import { useEffect, useRef } from 'react';

interface SnowflakesAnimationProps {
  maxSnowflakes?: number;
  snowflakeColor?: string;
  backgroundColor?: string;
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
}

class Snowfall {
  x: number = 0;
  y: number = 0;
  xVel: number = 0;
  yVel: number = 0;
  angle: number = 0;
  angleVel: number = 0;
  size: number = 0;
  sizeOsc: number = 0;
  width: number;
  height: number;
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;

  constructor(
    width: number,
    height: number,
    minSize: number,
    maxSize: number,
    minSpeed: number,
    maxSpeed: number,
    anyY = false
  ) {
    this.width = width;
    this.height = height;
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.minSpeed = minSpeed;
    this.maxSpeed = maxSpeed;
    this.spawn(anyY);
  }

  spawn(anyY = false) {
    this.x = this.rand(0, this.width);
    this.y = anyY === true ? this.rand(-50, this.height + 50) : this.rand(-50, -10);
    this.xVel = this.rand(-0.05, 0.05);
    this.yVel = this.rand(this.minSpeed, this.maxSpeed);
    this.angle = this.rand(0, Math.PI * 2);
    this.angleVel = this.rand(-0.001, 0.001);
    this.size = this.rand(this.minSize, this.maxSize);
    this.sizeOsc = this.rand(0.01, 0.5);
  }

  update(elapsed: number, now: number) {
    const xForce = this.rand(-0.001, 0.001);
    if (Math.abs(this.xVel + xForce) < 0.075) {
      this.xVel += xForce;
    }

    this.x += this.xVel * elapsed;
    this.y += this.yVel * elapsed;
    this.angle += this.xVel * 0.05 * elapsed;

    if (
      this.y - this.size > this.height ||
      this.x + this.size < 0 ||
      this.x - this.size > this.width
    ) {
      this.spawn();
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const { x, y, size } = this;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.2, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();
  }

  private rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}

const SnowflakesAnimation = ({
  maxSnowflakes = 100,
  snowflakeColor = '#fff',
  backgroundColor = '#000',
  minSize = 7,
  maxSize = 12,
  minSpeed = 0.02,
  maxSpeed = 0.1,
}: SnowflakesAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let lastNow = 0;
    const snowflakes: Snowfall[] = [];

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = w;
      height = h;
      // Draw initial background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let rafId = 0;
    let isActive = true;

    const render = (now: number) => {
      if (!isActive) return;

      rafId = requestAnimationFrame(render);

      const elapsed = now - lastNow;
      lastNow = now;

      ctx.clearRect(0, 0, width, height);

      if (snowflakes.length < maxSnowflakes) {
        snowflakes.push(
          new Snowfall(width, height, minSize, maxSize, minSpeed, maxSpeed)
        );
      }

      ctx.fillStyle = snowflakeColor;
      ctx.strokeStyle = snowflakeColor;

      snowflakes.forEach((snowflake) => {
        snowflake.update(elapsed, now);
        snowflake.render(ctx);
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        cancelAnimationFrame(rafId);
      } else {
        isActive = true;
        lastNow = performance.now();
        rafId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    lastNow = performance.now();
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(rafId);
      isActive = false;
    };
  }, [maxSnowflakes, snowflakeColor, minSize, maxSize, minSpeed, maxSpeed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor
      }}
    />
  );
};

export default SnowflakesAnimation;
