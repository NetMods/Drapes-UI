'use client'
import { useEffect, useRef } from 'react';

interface WinterForestProps {
  speed?: number;
  backgroundColor?: string;
  snowflakeColor?: string;
  treeColor?: string;
  treeCount?: number;
  windStrength?: number;
  snowflakeSize?: number;
  snowSpeed?: number;
  direction?: 'left' | 'right' | 'none';
}

const WinterForest = ({
  speed = 1.0,
  backgroundColor = '#e8e8e8',
  snowflakeColor = '#ffffff',
  treeColor = '#000000',
  treeCount = 47,
  windStrength = 9,
  snowflakeSize = 2,
  snowSpeed = 99,
  direction = 'right',
}: WinterForestProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let t = 0;

    const render = () => {
      t += (1 / 60) * speed;

      const c = canvas;
      const x = ctx;
      const S = Math.sin;

      const displayHeight = c.offsetHeight;

      // Clear with background color
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = backgroundColor;
      x.fillRect(0, 0, c.width, c.height);

      let j = treeCount;

      while (j--) {
        let T = 170;
        let s = 1.02;

        x.scale(s, s);

        let h = T + (j ** 6) % T;
        let i = h;
        let w;

        while ((w = i-- / 3)) {
          let y = h - i;

          const dir = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
          let X = (j ** 5 - t * T * dir);

          // Draw the Tree
          x.fillStyle = treeColor;
          x.fillRect(
            (X % 2500) - (h * y % w) - T,
            (displayHeight * 0.43) - y,
            w,
            3 / (j ** 0.6)
          );

          // Draw the Snow
          let r = (i % 5) + snowflakeSize;

          x.fillStyle = snowflakeColor;
          x.fillRect(
            (X + i * T) % 2500 + S(t * 3 + i) * windStrength,
            (t * snowSpeed + i ** 5) % (displayHeight * 0.43),
            r,
            r
          );
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, backgroundColor, snowflakeColor, treeColor, treeCount, windStrength, snowflakeSize, snowSpeed, direction]);

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
        backgroundColor: backgroundColor
      }}
    />
  );
};

export default WinterForest;
