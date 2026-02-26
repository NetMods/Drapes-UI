'use client';
import { useEffect, useRef } from 'react';

interface GameOfLifeProps {
  backgroundColor?: string;
  cellColor?: string;
  cellOpacity?: number;
  cellSize?: number;
  speed?: number;
  density?: number;
  interactive?: boolean;
}

const GameOfLife = ({
  backgroundColor = '#ffffff',
  cellColor = '#22c55e',
  cellOpacity = 0.8,
  cellSize = 8,
  speed = 80,
  density = 0.10,
  interactive = true,
}: GameOfLifeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ backgroundColor, cellColor, cellOpacity, cellSize, speed, density, interactive });
  propsRef.current = { backgroundColor, cellColor, cellOpacity, cellSize, speed, density, interactive };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rows = 0;
    let cols = 0;
    let grid: number[][] = [];
    let animationFrameId: number;
    let lastUpdateTime = 0;

    const initGrid = () => {
      const p = propsRef.current;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / p.cellSize);
      rows = Math.ceil(h / p.cellSize);
      grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() < p.density ? 1 : 0))
      );
    };

    const drawGrid = () => {
      const p = propsRef.current;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = p.backgroundColor;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = p.cellOpacity;
      ctx.fillStyle = p.cellColor;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (grid[i][j]) {
            ctx.fillRect(j * p.cellSize, i * p.cellSize, p.cellSize - 1, p.cellSize - 1);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    };

    const updateGrid = () => {
      const newGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let neighbors = 0;
          for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
              if (x === 0 && y === 0) continue;
              const r = (i + x + rows) % rows;
              const c = (j + y + cols) % cols;
              neighbors += grid[r][c];
            }
          }
          if (grid[i][j] === 1 && (neighbors < 2 || neighbors > 3)) {
            newGrid[i][j] = 0;
          } else if (grid[i][j] === 0 && neighbors === 3) {
            newGrid[i][j] = 1;
          } else {
            newGrid[i][j] = grid[i][j];
          }
        }
      }
      grid = newGrid;
    };

    const render = (timestamp: number) => {
      const p = propsRef.current;
      if (timestamp - lastUpdateTime > p.speed) {
        updateGrid();
        drawGrid();
        lastUpdateTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    const ro = new ResizeObserver(() => {
      initGrid();
    });
    ro.observe(canvas);

    initGrid();
    animationFrameId = requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      if (!propsRef.current.interactive) return;
      const p = propsRef.current;
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left) / p.cellSize);
      const row = Math.floor((e.clientY - rect.top) / p.cellSize);
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const r = row + i;
          const c = col + j;
          if (r >= 0 && r < rows && c >= 0 && c < cols && Math.random() > 0.5) {
            grid[r][c] = 1;
          }
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      ro.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);


  // (async () => {
  //   const { captureCanvasScreenshot } = await import('@/lib/utils');
  //   await captureCanvasScreenshot(canvasRef, "game-of-life.webp", 1000);
  // })()


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

export default GameOfLife;
