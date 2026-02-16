"use client";

import { useEffect, useRef } from "react";

type SpriteConfig = {
  src: string;
  width: number;
  height: number;
  scale: number;
  fps: number;
  colsWalk: number;
  colsIdle: number;
};

const SPRITE_DATA: Record<string, SpriteConfig> = {
  bull: {
    src: "/data/Bull_animation_with_shadow.png",
    width: 64,
    height: 64,
    scale: 3,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  sheep: {
    src: "/data/Sheep_animation_with_shadow.png",
    width: 32,
    height: 32,
    scale: 5,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  pig: {
    src: "/data/Piglet_animation_with_shadow.png",
    width: 32,
    height: 32,
    scale: 4,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  chick: {
    src: "/data/Chick_animation_with_shadow.png",
    width: 16,
    height: 16,
    scale: 5,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
  turkey: {
    src: "/data/Turkey_animation_with_shadow.png",
    width: 32,
    height: 32,
    scale: 4,
    fps: 12,
    colsWalk: 6,
    colsIdle: 4,
  },
};


interface AnimalAnimationProps {
  animal?: string;
}

function AnimalAnimation({ animal = "turkey" }: AnimalAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedConfig = SPRITE_DATA[animal.toLowerCase()] || SPRITE_DATA["sheep"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    };
    window.addEventListener("resize", resize);
    resize();

    const img = new Image();
    img.src = selectedConfig.src;
    let isLoaded = false;
    img.onload = () => { isLoaded = true; };

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let targetX = x;
    let targetY = y;

    let frame = 0;
    let dir = 0;
    let isIdle = true;

    let lastTime = 0;
    let timer = 0;
    const interval = 1000 / selectedConfig.fps;
    const SPEED = 6;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

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
        x += (dx / dist) * SPEED;
        y += (dy / dist) * SPEED;

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
        const maxFrames = isIdle ? selectedConfig.colsIdle : selectedConfig.colsWalk;
        frame = (frame + 1) % maxFrames;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let row = dir;
      if (isIdle) row += 4;

      const sx = frame * selectedConfig.width;
      const sy = row * selectedConfig.height;

      const drawW = selectedConfig.width * selectedConfig.scale;
      const drawH = selectedConfig.height * selectedConfig.scale;

      ctx.drawImage(
        img,
        sx, sy, selectedConfig.width, selectedConfig.height,
        x - drawW / 2, y - drawH / 2, drawW, drawH
      );
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [selectedConfig]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}

export default AnimalAnimation;
