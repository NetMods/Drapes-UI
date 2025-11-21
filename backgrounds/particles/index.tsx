'use client'
import { useEffect, useRef } from 'react';

interface ConfettiAnimationProps {
  numConfetti?: number;
  colors?: number[][];
  minRadius?: number;
  maxRadius?: number;
  minSpeed?: number;
  maxSpeed?: number;
  gravity?: number;
  fadeSpeed?: number;
  backgroundColor?: string;
}

const DEFAULT_COLORS = [
  [255, 107, 107],  // Coral Red
  [255, 183, 77],   // Golden Orange
  [255, 234, 167],  // Pale Yellow
  [72, 219, 251],   // Sky Blue
  [162, 155, 254],  // Soft Purple
  [108, 92, 231],   // Deep Purple
  [255, 121, 198],  // Pink
  [94, 234, 212],   // Turquoise
  [134, 239, 172],  // Mint Green
  [251, 146, 60]    // Bright Orange
];

const PI_2 = 2 * Math.PI;

class Confetti {
  style: number[];
  rgb: string;
  r: number;
  r2: number;
  opacity: number;
  dop: number;
  x: number;
  y: number;
  xmax: number;
  ymax: number;
  vx: number;
  vy: number;
  colors: number[][];
  minRadius: number;
  maxRadius: number;
  minSpeed: number;
  maxSpeed: number;
  gravity: number;
  fadeSpeed: number;

  constructor(
    w: number,
    h: number,
    xpos: number,
    colors: number[][],
    minRadius: number,
    maxRadius: number,
    minSpeed: number,
    maxSpeed: number,
    gravity: number,
    fadeSpeed: number
  ) {
    this.colors = colors;
    this.minRadius = minRadius;
    this.maxRadius = maxRadius;
    this.minSpeed = minSpeed;
    this.maxSpeed = maxSpeed;
    this.gravity = gravity;
    this.fadeSpeed = fadeSpeed;
    this.style = colors[Math.floor(Math.random() * colors.length)];
    this.rgb = `rgba(${this.style[0]},${this.style[1]},${this.style[2]}`;
    this.r = Math.floor(Math.random() * (maxRadius - minRadius + 1)) + minRadius;
    this.r2 = 2 * this.r;
    this.x = 0;
    this.y = 0;
    this.xmax = 0;
    this.ymax = 0;
    this.vx = 0;
    this.vy = 0;
    this.opacity = 0;
    this.dop = 0;
    this.replace(w, h, xpos);
  }

  replace(w: number, h: number, xpos: number) {
    this.opacity = 0;
    this.dop = this.fadeSpeed * (Math.random() * 3 + 1);
    this.x = Math.random() * (w - this.r2 * 2) - this.r2;
    this.y = Math.random() * (h + 20) - 20;
    this.xmax = w - this.r;
    this.ymax = h - this.r;
    this.vx = Math.random() * (this.maxSpeed - this.minSpeed) + this.minSpeed * xpos - (this.minSpeed + this.maxSpeed) / 2;
    this.vy = this.gravity * this.r + (Math.random() * 2 - 1);
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, xpos: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.opacity += this.dop;

    if (this.opacity > 1) {
      this.opacity = 1;
      this.dop *= -1;
    }

    if (this.opacity < 0 || this.y > this.ymax) {
      this.replace(w, h, xpos);
    }

    if (!(0 < this.x && this.x < this.xmax)) {
      this.x = (this.x + this.xmax) % this.xmax;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, PI_2, false);
    ctx.fillStyle = `${this.rgb},${this.opacity})`;
    ctx.fill();
  }
}

const Particles = ({
  colors = DEFAULT_COLORS,
  numConfetti = 350,
  minRadius = 2,
  maxRadius = 6,
  minSpeed = 1,
  maxSpeed = 1,
  gravity = 0.7,
  fadeSpeed = 0.01,
  backgroundColor = 'transparent'
}: ConfettiAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const confettiRef = useRef<Confetti[]>([]);
  const xposRef = useRef(0.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      w = rect.width;
      h = rect.height;

      confettiRef.current.forEach(c => {
        c.xmax = w - c.r;
        c.ymax = h - c.r;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (w > 0) {
        xposRef.current = e.pageX / w;
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      confettiRef.current.forEach(c => c.draw(ctx, w, h, xposRef.current));
      animationRef.current = requestAnimationFrame(step);
    };

    resize();

    confettiRef.current = [];
    for (let i = 0; i < numConfetti; i++) {
      confettiRef.current.push(
        new Confetti(w, h, xposRef.current, colors, minRadius, maxRadius, minSpeed, maxSpeed, gravity, fadeSpeed)
      );
    }

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', handleMouseMove);

    step();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [numConfetti, colors, minRadius, maxRadius, minSpeed, maxSpeed, gravity, fadeSpeed]);




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

export default Particles;
