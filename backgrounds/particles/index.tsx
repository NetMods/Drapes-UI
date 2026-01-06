'use client';

import { useEffect, useRef } from 'react';

interface Grad {
  x: number;
  y: number;
  z: number;
  dot2(x: number, y: number): number;
  dot3(x: number, y: number, z: number): number;
}

interface FlowFieldProps {
  scale?: number;
  cellSize?: number;
  radius?: number;
  fieldSpeed?: number;
  particleSpeed?: number;
  particleCount?: number;
  backgroundColor?: string;
  particleColor?: string;
}

// Helper to convert Hex to "r, g, b" format for usage in rgba()
const hexToRgb = (hex: string): string => {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `${r}, ${g}, ${b}`;
};

class Particle {
  x: number;
  y: number;
  ctx: CanvasRenderingContext2D;
  radius: number;
  opacity: number;

  constructor(
    x: number,
    y: number,
    ctx: CanvasRenderingContext2D,
    radius: number
  ) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.radius = radius;
    this.opacity = Math.random() * 0.5 + 0.2;
  }

  update(flowField: number[][], cellSize: number, speed: number, width: number, height: number): void {
    const rows = flowField.length;
    const cols = rows > 0 ? flowField[0].length : 0;

    let col = Math.floor(this.x / cellSize);
    let row = Math.floor(this.y / cellSize);

    col = Math.max(0, Math.min(col, cols - 1));
    row = Math.max(0, Math.min(row, rows - 1));

    if (rows > 0 && cols > 0 && flowField[row] && flowField[row][col] !== undefined) {
      const angle = flowField[row][col] + (Math.random() * 0.3 - 0.2);
      this.x += Math.cos(angle) * speed;
      this.y += Math.sin(angle) * speed;
    }

    this.wrap(width, height);
  }

  wrap(width: number, height: number): void {
    if (this.x > width) {
      this.x = 0;
      this.y = Math.random() * height;
    } else if (this.x < 0) {
      this.x = width;
      this.y = Math.random() * height;
    }

    if (this.y > height) {
      this.y = 0;
      this.x = Math.random() * width;
    } else if (this.y < 0) {
      this.y = height;
      this.x = Math.random() * width;
    }
  }

  draw(rgbColor: string): void {
    // rgbColor must be "r, g, b"
    this.ctx.fillStyle = `rgba(${rgbColor},${this.opacity})`;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}

class PerlinNoise {
  private grad3: Grad[] = [
    { x: 1, y: 1, z: 0 },
    { x: -1, y: 1, z: 0 },
    { x: 1, y: -1, z: 0 },
    { x: -1, y: -1, z: 0 },
    { x: 1, y: 0, z: 1 },
    { x: -1, y: 0, z: 1 },
    { x: 1, y: 0, z: -1 },
    { x: -1, y: 0, z: -1 },
    { x: 0, y: 1, z: 1 },
    { x: 0, y: -1, z: 1 },
    { x: 0, y: 1, z: -1 },
    { x: 0, y: -1, z: -1 },
  ].map((g) => ({
    x: g.x,
    y: g.y,
    z: g.z,
    dot2: (x: number, y: number) => g.x * x + g.y * y,
    dot3: (x: number, y: number, z: number) => g.x * x + g.y * y + g.z * z,
  }));

  private p: number[] = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
    141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];

  private perm: number[] = new Array(512);
  private gradP: Grad[] = new Array(512);

  constructor(seed: number = 0) {
    this.seed(seed);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }

  public seed(seed: number): void {
    if (seed > 0 && seed < 1) {
      seed *= 65536;
    }
    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    for (let i = 0; i < 256; i++) {
      const v =
        i & 1 ? this.p[i] ^ (seed & 255) : this.p[i] ^ ((seed >> 8) & 255);
      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }

  public perlin1(x: number): number {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);

    const n0 = this.gradP[X + this.perm[0]].dot2(x, 0);
    const n1 = this.gradP[X + 1 + this.perm[0]].dot2(x - 1, 0);

    return this.lerp(n0, n1, this.fade(x));
  }

  public perlin2(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);

    const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
    const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
    const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
    const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);

    const u = this.fade(x);
    return this.lerp(
      this.lerp(n00, n10, u),
      this.lerp(n01, n11, u),
      this.fade(y),
    );
  }

  public perlin3(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const n000 = this.gradP[X + this.perm[Y + this.perm[Z]]].dot3(x, y, z);
    const n001 = this.gradP[X + this.perm[Y + this.perm[Z + 1]]].dot3(
      x,
      y,
      z - 1,
    );
    const n010 = this.gradP[X + this.perm[Y + 1 + this.perm[Z]]].dot3(
      x,
      y - 1,
      z,
    );
    const n011 = this.gradP[X + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
      x,
      y - 1,
      z - 1,
    );
    const n100 = this.gradP[X + 1 + this.perm[Y + this.perm[Z]]].dot3(
      x - 1,
      y,
      z,
    );
    const n101 = this.gradP[X + 1 + this.perm[Y + this.perm[Z + 1]]].dot3(
      x - 1,
      y,
      z - 1,
    );
    const n110 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z]]].dot3(
      x - 1,
      y - 1,
      z,
    );
    const n111 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
      x - 1,
      y - 1,
      z - 1,
    );

    const x0 = this.lerp(n000, n100, u);
    const x1 = this.lerp(n010, n110, u);
    const x2 = this.lerp(n001, n101, u);
    const x3 = this.lerp(n011, n111, u);

    const y0 = this.lerp(x0, x1, v);
    const y1 = this.lerp(x2, x3, v);

    return this.lerp(y0, y1, w);
  }
}

const FlowField = ({
  scale = 0.001,
  cellSize = 20,
  radius = 2,
  fieldSpeed = 0.0005,
  particleSpeed = 2,
  particleCount = 1400,
  backgroundColor = '#4169e1',
  particleColor = '#ffffff'
}: FlowFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const noiseRef = useRef(new PerlinNoise(Math.random()));
  const particlesRef = useRef<Particle[]>([]);
  const flowFieldRef = useRef<number[][]>([]);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const isHex = particleColor.startsWith('#');
    const drawColor = isHex ? hexToRgb(particleColor) : particleColor;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      w = rect.width;
      h = rect.height;

      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        particlesRef.current.push(new Particle(x, y, ctx, radius));
      }
    };

    const step = () => {
      timeRef.current = performance.now();

      const cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);

      // CHANGE 1: Use fillRect instead of clearRect
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      flowFieldRef.current = [];
      for (let y = 0; y < rows; y++) {
        flowFieldRef.current[y] = [];
        for (let x = 0; x < cols; x++) {
          const worldX = x * cellSize;
          const worldY = y * cellSize;

          const timeOffset = timeRef.current * fieldSpeed;

          const noiseValue = noiseRef.current.perlin3(
            worldX * scale + timeOffset,
            worldY * scale,
            0
          );

          const angle = noiseValue;

          flowFieldRef.current[y][x] = angle;
        }
      }

      particlesRef.current.forEach((p) => {
        p.radius = radius;
        p.update(flowFieldRef.current, cellSize, particleSpeed, w, h);
        p.draw(drawColor);
      });

      animationRef.current = requestAnimationFrame(step);
    };

    resize();
    step();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scale, cellSize, radius, fieldSpeed, particleSpeed, particleCount, particleColor, backgroundColor]);

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
      }}
    />
  );
};

export default FlowField;
