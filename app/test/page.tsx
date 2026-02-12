'use client';

import React, { useRef, useEffect } from 'react';

interface TileDisplacementProps {
  text?: string;
  subText?: string;
  description?: string;
  fontSize?: number;
}

const TileDisplacement: React.FC<TileDisplacementProps> = ({
  text = 'lokasasmita',
  subText = 'CREATIVE DEVELOPER',
  description = 'WEB DEV · DESIGN · ANIMATION',
  fontSize = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    let animationFrameId: number;

    // --- Configuration ---
    const COLS = 80;
    const DAMPING = 0.92; // Slightly higher damping for smoother stopping
    const SPRING = 0.05;
    const PROPAGATION = 0.20;
    const MOUSE_FORCE = 5;
    const MOUSE_RADIUS = 3; // In grid units
    const RGB_SHIFT_AMOUNT = 3.5;

    let W = 0, H = 0, tileW = 0, tileH = 0, rows = 0;
    let dpr = 1;

    // Offscreen buffers for RGB channels
    let srcR: HTMLCanvasElement;
    let srcG: HTMLCanvasElement;
    let srcB: HTMLCanvasElement;

    interface MouseState {
      x: number;
      y: number;
      px: number;
      py: number;
      active: boolean;
    }

    let mouse: MouseState = { x: -1000, y: -1000, px: -1000, py: -1000, active: false };

    class Tile {
      dx: number = 0;
      dy: number = 0;
      vx: number = 0;
      vy: number = 0;
    }

    let tiles: Tile[][] = [];
    let propX: Float32Array[] = [];
    let propY: Float32Array[] = [];

    // Helper: Draw text/shapes onto a channel canvas
    const drawContent = (cvs: HTMLCanvasElement, color: string) => {
      const c = cvs.getContext('2d');
      if (!c) return;

      // Clear with transparency
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);

      c.fillStyle = color;
      c.textAlign = 'center';
      c.textBaseline = 'middle';

      // Main Text
      const mainSize = Math.min(W * 0.11, fontSize);
      c.font = `900 ${mainSize}px "Inter", sans-serif`;
      c.fillText(text, W / 2, H * 0.35);

      // Sub Text
      const subSize = Math.min(W * 0.025, 28);
      c.font = `900 ${subSize}px "Inter", sans-serif`;
      c.globalAlpha = 0.5;
      c.fillText(subText, W / 2, H * 0.35 + mainSize * 0.7);
      c.globalAlpha = 1;

      // Draw Logo Shape
      drawLogo(c, W / 2, H * 0.72, Math.min(W * 0.06, 60), color);

      // Footer Text
      c.globalAlpha = 0.25;
      const smallSize = Math.min(W * 0.013, 14);
      c.font = `900 ${smallSize}px "Inter", sans-serif`;
      c.fillText(description, W / 2, H * 0.88);
      c.globalAlpha = 1;
    };

    const drawLogo = (c: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
      c.save();
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineCap = 'round';

      // Concentric arcs
      for (let i = 0; i < 4; i++) {
        const r = size * (0.3 + i * 0.25);
        c.beginPath();
        c.arc(cx, cy, r, -Math.PI * 0.35, Math.PI * 0.35, false);
        c.lineWidth = size * 0.12;
        c.stroke();
      }

      // Center dot
      c.beginPath();
      c.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    const createChannelCanvas = () => {
      const cvs = document.createElement('canvas');
      cvs.width = W * dpr;
      cvs.height = H * dpr;
      return cvs;
    };

    const resize = () => {
      if (!container) return;

      dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      W = rect.width;
      H = rect.height;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Grid setup
      tileW = W / COLS;
      tileH = tileW; // Square tiles
      rows = Math.ceil(H / tileW) + 1;

      // Re-init tiles
      tiles = [];
      propX = [];
      propY = [];
      for (let r = 0; r < rows + 1; r++) {
        tiles[r] = [];
        propX[r] = new Float32Array(COLS + 1);
        propY[r] = new Float32Array(COLS + 1);
        for (let c = 0; c < COLS + 1; c++) {
          tiles[r][c] = new Tile();
        }
      }

      // Re-create offscreen buffers
      srcR = createChannelCanvas();
      srcG = createChannelCanvas();
      srcB = createChannelCanvas();

      drawContent(srcR, '#ff0000');
      drawContent(srcG, '#00ff00');
      drawContent(srcB, '#0000ff');
    };

    // --- Interaction ---
    const updateMouse = (x: number, y: number) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = x - rect.left;
      mouse.y = y - rect.top;
      mouse.active = true;
    };

    const handleMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      updateMouse(t.clientX, t.clientY);
    };
    const handleMouseLeave = () => { mouse.active = false; };

    // --- Physics Engine ---
    const updatePhysics = () => {
      if (mouse.active) {
        const mc = mouse.x / tileW;
        const mr = mouse.y / tileH;
        // Mouse velocity
        const velX = (mouse.x - mouse.px) * 0.5;
        const velY = (mouse.y - mouse.py) * 0.5;

        for (let r = 0; r < rows + 1; r++) {
          for (let c = 0; c < COLS + 1; c++) {
            const dc = c - mc;
            const dr = r - mr;
            const dist = Math.sqrt(dc * dc + dr * dr);

            // Repulsion
            if (dist < MOUSE_RADIUS) {
              const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
              const tile = tiles[r]?.[c];
              if (tile) {
                tile.vx += velX * force * 0.05;
                tile.vy += velY * force * 0.05;
                if (dist > 0.01) {
                  tile.vx += (dc / dist) * force * 0.15;
                  tile.vy += (dr / dist) * force * 0.15;
                }
              }
            }
          }
        }
      }

      // 1. Calculate Propagation forces (using separate arrays to avoid order bias)
      for (let r = 0; r < rows + 1; r++) {
        for (let c = 0; c < COLS + 1; c++) {
          propX[r][c] = 0;
          propY[r][c] = 0;
        }
      }

      for (let r = 0; r < rows + 1; r++) {
        for (let c = 0; c < COLS + 1; c++) {
          const t = tiles[r][c];

          // Link to Top
          if (r > 0) {
            const n = tiles[r - 1][c];
            propX[r - 1][c] += (t.dx - n.dx) * PROPAGATION;
            propY[r - 1][c] += (t.dy - n.dy) * PROPAGATION;
          }
          // Link to Bottom
          if (r < rows) {
            const n = tiles[r + 1][c];
            propX[r + 1][c] += (t.dx - n.dx) * PROPAGATION;
            propY[r + 1][c] += (t.dy - n.dy) * PROPAGATION;
          }
          // Link to Left
          if (c > 0) {
            const n = tiles[r][c - 1];
            propX[r][c - 1] += (t.dx - n.dx) * PROPAGATION;
            propY[r][c - 1] += (t.dy - n.dy) * PROPAGATION;
          }
          // Link to Right
          if (c < COLS) {
            const n = tiles[r][c + 1];
            propX[r][c + 1] += (t.dx - n.dx) * PROPAGATION;
            propY[r][c + 1] += (t.dy - n.dy) * PROPAGATION;
          }
        }
      }

      // 2. Apply forces
      for (let r = 0; r < rows + 1; r++) {
        for (let c = 0; c < COLS + 1; c++) {
          const t = tiles[r][c];
          t.vx += propX[r][c];
          t.vy += propY[r][c];

          // Spring return to origin (0,0)
          t.vx -= t.dx * SPRING;
          t.vy -= t.dy * SPRING;

          // Damping
          t.vx *= DAMPING;
          t.vy *= DAMPING;

          // Update position
          t.dx += t.vx;
          t.dy += t.vy;
        }
      }
    };

    const render = () => {
      // Clear background
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Additive blending for RGB reconstruction
      ctx.globalCompositeOperation = 'lighter';

      const channels = [
        { src: srcR, dirX: 1.0, dirY: 0.6 },
        { src: srcG, dirX: 0.0, dirY: 0.0 },
        { src: srcB, dirX: -1.0, dirY: -0.6 },
      ];

      const sx_scale = dpr;
      const sy_scale = dpr;

      for (const ch of channels) {
        if (!ch.src) continue;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < COLS; c++) {
            // Current tile screen position
            const px = c * tileW;
            const py = r * tileH;

            // Get corners
            const tl = tiles[r][c];
            // Boundary checks
            const tr = (c < COLS) ? tiles[r][c + 1] : tl;
            const bl = (r < rows) ? tiles[r + 1][c] : tl;
            const br = (r < rows && c < COLS) ? tiles[r + 1][c + 1] : tl;

            // Average displacement and velocity for this grid cell
            const avgDx = (tl.dx + tr.dx + bl.dx + br.dx) * 0.25;
            const avgDy = (tl.dy + tr.dy + bl.dy + br.dy) * 0.25;
            const avgVx = (tl.vx + tr.vx + bl.vx + br.vx) * 0.25;
            const avgVy = (tl.vy + tr.vy + bl.vy + br.vy) * 0.25;

            // RGB Offset based on velocity (Chromatism)
            const rgbX = avgVx * RGB_SHIFT_AMOUNT * ch.dirX;
            const rgbY = avgVy * RGB_SHIFT_AMOUNT * ch.dirY;

            const totalDx = avgDx + rgbX;
            const totalDy = avgDy + rgbY;

            // Draw Slice
            // We only draw if the tile has significant displacement or velocity 
            // (Optimization optional, but we draw all for consistency)

            ctx.drawImage(
              ch.src,
              (px - totalDx) * sx_scale, // Source X
              (py - totalDy) * sy_scale, // Source Y
              tileW * sx_scale,          // Source Width
              tileH * sy_scale,          // Source Height
              px, py, tileW + 1, tileH + 1 // Dest X, Y, W, H (+1 to fix subpixel gaps)
            );
          }
        }
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = () => {
      updatePhysics();
      render();
      animationFrameId = requestAnimationFrame(loop);
    };

    // Initialize
    window.addEventListener('resize', resize);
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleMouseLeave);
    }

    resize();
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, subText, description, fontSize]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden cursor-crosshair font-sans">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default TileDisplacement;
