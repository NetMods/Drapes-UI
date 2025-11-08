'use client'
import { useEffect, useRef } from "react"

interface PageProps {
  className?: string
  numConfetti?: number
}

const COLORS = [[85, 71, 106], [174, 61, 99], [219, 56, 83], [244, 92, 68], [248, 182, 70]];
const PI_2 = 2 * Math.PI;
const DEFAULT_NUM_CONFETTI = 350;

class Confetti {
  style: number[] = COLORS[0];
  rgb: string = '';
  r: number = 0;
  r2: number = 0;
  opacity: number = 0;
  dop: number = 0;
  x: number = 0;
  y: number = 0;
  xmax: number = 0;
  ymax: number = 0;
  vx: number = 0;
  vy: number = 0;

  constructor(w: number, h: number, xpos: number) {
    this.style = COLORS[Math.floor(Math.random() * 5)];
    this.rgb = `rgba(${this.style[0]},${this.style[1]},${this.style[2]}`;
    this.r = Math.floor(Math.random() * 4) + 2;
    this.r2 = 2 * this.r;
    this.replace(w, h, xpos);
  }

  replace(w: number, h: number, xpos: number) {
    this.opacity = 0;
    this.dop = 0.03 * (Math.random() * 3 + 1);
    this.x = Math.random() * (w - this.r2 * 2) - this.r2;
    this.y = Math.random() * (h + 20) - 20;
    this.xmax = w - this.r;
    this.ymax = h - this.r;
    this.vx = Math.random() * 2 + 8 * xpos - 5;
    this.vy = 0.7 * this.r + (Math.random() * 2 - 1);
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

const Page = ({
  className,
  numConfetti = DEFAULT_NUM_CONFETTI
}: PageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null);
  const confettiRef = useRef<Confetti[]>([]);
  const xposRef = useRef(0.5);

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error("No canvas found")
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error("No ctx found")
      return
    }

    let w = 0;
    let h = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      w = canvas.width;
      h = canvas.height;
      confettiRef.current.forEach(c => {
        c.xmax = w - c.r;
        c.ymax = h - c.r;
      });
    }

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
      confettiRef.current.push(new Confetti(w, h, xposRef.current));
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
    }
  }, [numConfetti])

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
  )
}

export default Page
