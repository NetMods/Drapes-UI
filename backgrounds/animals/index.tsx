'use client';

import { useRef, useEffect } from 'react';

type SpriteConfig = {
  src: string;
  width: number;
  height: number;
  baseScale: number;
  fps: number;
  colsWalk: number;
  colsIdle: number;
};

const SPRITE_DATA: Record<string, SpriteConfig> = {
  bull: {
    src: '/data/Bull_animation_with_shadow.png',
    width: 64,
    height: 64,
    baseScale: 3,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  sheep: {
    src: '/data/Sheep_animation_with_shadow.png',
    width: 32,
    height: 32,
    baseScale: 5,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  pig: {
    src: '/data/Piglet_animation_with_shadow.png',
    width: 32,
    height: 32,
    baseScale: 4,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  chick: {
    src: '/data/Chick_animation_with_shadow.png',
    width: 16,
    height: 16,
    baseScale: 5,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  turkey: {
    src: '/data/Turkey_animation_with_shadow.png',
    width: 32,
    height: 32,
    baseScale: 4,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
};

interface AnimalsProps {
  animal?: string;
  speed?: number;
  scale?: number;
  initialX?: number;
  initialY?: number;
  transparent?: boolean;
  backgroundColor?: string;
}

const Animals = ({
  animal = 'sheep',
  speed = 4,
  scale = 3,
  initialX = 50,
  initialY = 50,
  transparent = true,
  backgroundColor = '#4a7c59',
}: AnimalsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const container = canvas.parentElement;
    if (!container) return;

    const selectedConfig =
      SPRITE_DATA[animal.toLowerCase()] || SPRITE_DATA['sheep'];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.imageSmoothingEnabled = false;
    };
    window.addEventListener('resize', resize);
    resize();

    const img = new Image();
    img.src = selectedConfig.src;
    let isLoaded = false;
    img.onload = () => {
      isLoaded = true;
    };

    let x = (initialX / 100) * canvas.width;
    let y = (initialY / 100) * canvas.height;
    let targetX = x;
    let targetY = y;

    let frame = 0;
    let dir = 0;
    let isIdle = true;

    let lastTime = 0;
    let timer = 0;
    const interval = 1000 / selectedConfig.fps;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMouseMove);

    let rafId: number;

    const loop = (timestamp: number) => {
      rafId = requestAnimationFrame(loop);
      if (!isLoaded) return;

      const dt = timestamp - lastTime;
      lastTime = timestamp;

      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const wasIdle = isIdle;

      if (dist > 10) {
        isIdle = false;
        x += (dx / dist) * speed;
        y += (dy / dist) * speed;

        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? 3 : 2;
        } else {
          dir = dy > 0 ? 0 : 1;
        }
      } else {
        isIdle = true;
      }

      if (wasIdle !== isIdle) frame = 0;

      timer += dt;
      if (timer > interval) {
        timer = 0;
        const maxFrames = isIdle
          ? selectedConfig.colsIdle
          : selectedConfig.colsWalk;
        frame = (frame + 1) % maxFrames;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!transparent) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      let row = dir;
      if (isIdle) {
        row += 4;
      }

      const sx = frame * selectedConfig.width;
      const sy = row * selectedConfig.height;

      const drawW = selectedConfig.width * scale;
      const drawH = selectedConfig.height * scale;

      ctx.drawImage(
        img,
        sx,
        sy,
        selectedConfig.width,
        selectedConfig.height,
        x - drawW / 2,
        y - drawH / 2,
        drawW,
        drawH,
      );
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [animal, speed, scale, initialX, initialY, transparent, backgroundColor]);


  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default Animals;
