'use client';
import { useEffect, useRef } from 'react';

interface FlowFieldParticlesProps {
  backgroundColor?: string;
  particleNum?: number;
  step?: number;
  base?: number;
  zInc?: number;
  colorTheme?: 'rainbow' | 'monochrome' | 'warm' | 'cool' | 'gruvbox' | 'pastel' | 'neon';
  fadeSpeed?: number;
  maxLines?: number;
  spawnRate?: number | undefined; // Made undefined the default for instant spawn
}

// Color theme definitions
const COLOR_THEMES = {
  rainbow: {
    type: 'hsl' as const,
    useHueRotation: true,
    saturation: 1,
    lightness: 0.5,
  },
  monochrome: {
    type: 'hsl' as const,
    useHueRotation: false,
    baseHue: 0,
    saturation: 0,
    lightness: 0.8,
    lightnessVariation: 0.3,
  },
  warm: {
    type: 'hsl' as const,
    useHueRotation: true,
    hueRange: [0, 60] as [number, number], // Red to yellow
    saturation: 0.9,
    lightness: 0.6,
  },
  cool: {
    type: 'hsl' as const,
    useHueRotation: true,
    hueRange: [180, 260] as [number, number], // Cyan to blue to purple
    saturation: 0.85,
    lightness: 0.55,
  },
  gruvbox: {
    type: 'palette' as const,
    colors: [
      [251, 73, 52], // red
      [250, 189, 47], // yellow
      [184, 187, 38], // green
      [142, 192, 124], // aqua
      [211, 134, 155], // purple
      [254, 128, 25], // orange
    ],
  },
  pastel: {
    type: 'hsl' as const,
    useHueRotation: true,
    saturation: 0.6,
    lightness: 0.75,
  },
  neon: {
    type: 'palette' as const,
    colors: [
      [255, 16, 240], // Hot pink
      [0, 255, 255], // Cyan
      [57, 255, 20], // Lime
      [255, 231, 0], // Yellow
      [255, 0, 110], // Magenta
      [0, 234, 255], // Electric blue
    ],
  },
};

// SimplexNoise implementation
class SimplexNoise {
  private grad3: number[][];
  private p: number[];
  private perm: number[];
  private gradP: number[][];

  constructor() {
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(Math.random() * 256);
    }
    this.perm = [];
    this.gradP = [];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.gradP[i] = this.grad3[this.perm[i] % 12];
    }
  }

  private dot(g: number[], x: number, y: number, z: number): number {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  noise3D(xin: number, yin: number, zin: number): number {
    let n0, n1, n2, n3;
    const F3 = 1.0 / 3.0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1.0 / 6.0;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    let i1, j1, k1;
    let i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.gradP[ii + this.perm[jj + this.perm[kk]]];
    const gi1 = this.gradP[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
    const gi2 = this.gradP[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
    const gi3 = this.gradP[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(gi0, x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(gi1, x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(gi2, x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot(gi3, x3, y3, z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

// Particle class
class Particle {
  x: number;
  y: number;
  pastX: number;
  pastY: number;
  color: string;
  alpha: number;
  baseHue?: number;
  paletteIndex?: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.pastX = x;
    this.pastY = y;
    this.color = '';
    this.alpha = 0;
  }
}

const NoiseField = ({
  backgroundColor = 'black',
  particleNum = 1000,
  step = 1,
  base = 1000,
  zInc = 0.001,
  colorTheme = 'monochrome',
  fadeSpeed = 0,
  maxLines = 500,
  spawnRate, // Default undefined for instant spawn
}: FlowFieldParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let screenWidth = 0;
    let screenHeight = 0;
    let centerX = 0;
    let centerY = 0;
    const particles: Particle[] = [];
    let hueBase = 0;
    let simplexNoise: SimplexNoise;
    let zoff = 0;
    let spawnAccumulator = 0;

    const theme = COLOR_THEMES[colorTheme];
    const targetNum = maxLines !== undefined ? maxLines : particleNum;

    ctx.fillStyle = backgroundColor;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      screenWidth = w;
      screenHeight = h;
      centerX = screenWidth / 2;
      centerY = screenHeight / 2;
      ctx.lineWidth = 0.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Draw initial background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, screenWidth, screenHeight);
    };

    const getNoise = (x: number, y: number, z: number): number => {
      const octaves = 4;
      const fallout = 0.5;
      let amp = 1;
      let f = 1;
      let sum = 0;
      for (let i = 0; i < octaves; ++i) {
        amp *= fallout;
        sum += amp * (simplexNoise.noise3D(x * f, y * f, z * f) + 1) * 0.5;
        f *= 2;
      }
      return sum;
    };

    const getParticleColor = (p: Particle, angle: number): string => {
      if (theme.type === 'palette') {
        if (p.paletteIndex === undefined) {
          p.paletteIndex = Math.floor(Math.random() * theme.colors.length);
        }
        const color = theme.colors[p.paletteIndex];
        return `rgba(${color[0]},${color[1]},${color[2]},${p.alpha})`;
      }
      // Now theme is narrowed to HSL themes
      let h: number;
      if (theme.useHueRotation) {
        if ('hueRange' in theme && theme.hueRange) {
          const [minHue, maxHue] = theme.hueRange;
          const angleNorm = ((angle * 180) / Math.PI + 180) / 360;
          h = minHue + angleNorm * (maxHue - minHue);
          h = (h + hueBase) % 360;
        } else {
          h = hueBase + (angle * 180) / Math.PI;
        }
      } else {
        h = 'baseHue' in theme ? theme.baseHue : 0;
      }
      let l = theme.lightness;
      if ('lightnessVariation' in theme && theme.lightnessVariation) {
        const angleNorm = ((angle * 180) / Math.PI + 180) / 360;
        l = theme.lightness + (angleNorm - 0.5) * theme.lightnessVariation;
      }
      return `hsla(${h},${theme.saturation * 100}%,${l * 100}%,${p.alpha})`;
    };

    const initParticle = (p: Particle) => {
      p.x = p.pastX = screenWidth * Math.random();
      p.y = p.pastY = screenHeight * Math.random();
      p.alpha = 0.3; // Start semi-visible for quicker buildup
      if (theme.type === 'palette') {
        p.paletteIndex = Math.floor(Math.random() * theme.colors.length);
      }
    };

    const onCanvasClick = () => {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      ctx.restore();

      if (spawnRate !== undefined) {
        particles.length = 0;
        spawnAccumulator = 0;
      } else {
        // Instant respawn with staggered alphas
        particles.length = 0;
        for (let i = 0; i < targetNum; i++) {
          const p = new Particle();
          initParticle(p);
          p.alpha = Math.random() * 0.5; // Staggered initial alpha for organic feel
          particles.push(p);
        }
      }
      simplexNoise = new SimplexNoise();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    simplexNoise = new SimplexNoise();

    // Initial spawn: always instant with staggered alphas if no spawnRate
    if (spawnRate === undefined) {
      for (let i = 0; i < targetNum; i++) {
        const p = new Particle();
        initParticle(p);
        p.alpha = Math.random() * 0.5; // Staggered initial alpha
        particles.push(p);
      }
    }

    canvas.addEventListener('click', onCanvasClick);

    let rafId = 0;
    const update = () => {
      // Fade trails if fadeSpeed > 0
      if (fadeSpeed > 0) {
        ctx.save();
        ctx.globalAlpha = fadeSpeed;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        ctx.restore();
      }

      // Spawn new particles slowly if spawnRate is provided
      if (spawnRate !== undefined && particles.length < targetNum) {
        spawnAccumulator += spawnRate;
        while (spawnAccumulator >= 1 && particles.length < targetNum) {
          const p = new Particle();
          initParticle(p);
          particles.push(p);
          spawnAccumulator -= 1;
        }
      }

      // Update and draw existing particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pastX = p.x;
        p.pastY = p.y;
        const angle =
          Math.PI * 6 * getNoise((p.x / base) * 1.75, (p.y / base) * 1.75, zoff);
        p.x += Math.cos(angle) * step;
        p.y += Math.sin(angle) * step;
        if (p.alpha < 1) p.alpha += 0.02; // Faster fade-in
        const particleAngle = Math.atan2(centerY - p.y, centerX - p.x);
        p.color = getParticleColor(p, particleAngle);
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.pastX, p.pastY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        if (p.x < 0 || p.x > screenWidth || p.y < 0 || p.y > screenHeight) {
          initParticle(p);
        }
      }

      hueBase += 0.1;
      zoff += zInc;
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', onCanvasClick);
      cancelAnimationFrame(rafId);
    };
  }, [backgroundColor, particleNum, step, base, zInc, colorTheme, fadeSpeed, maxLines, spawnRate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        backgroundColor
      }}
    />
  );
};

export default NoiseField;
