'use client'
import { useEffect, useRef } from 'react';

interface WinterForestProps {
  speed?: number;
}

const WinterForest = ({ speed = 1.0 }: WinterForestProps) => {
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

      const displayWidth = c.offsetWidth;
      const displayHeight = c.offsetHeight;

      // Clear with background color
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = '#f8f9fa';
      x.fillRect(0, 0, c.width, c.height);

      let j = 47;

      while (j--) {
        let T = 170;
        let s = 1.02;

        x.scale(s, s);

        let h = T + (j ** 6) % T;
        let i = h;
        let w;

        while ((w = i-- / 3)) {
          let y = h - i;

          let X = (j ** 5 - t * T);

          // Draw the Tree (Black Rects)
          x.fillStyle = '#000000';
          x.fillRect(
            (X % 2500) - (h * y % w) - T,
            (displayHeight * 0.43) - y,
            w,
            3 / (j ** 0.6)
          );

          // Draw the Snow (Clear Rects)
          let r = (i % 5) + 2;

          x.clearRect(
            (X + i * T) % 2500 + S(t * 3 + i) * 9,
            (t * 99 + i ** 5) % (displayHeight * 0.43),
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
  }, [speed]);

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
        backgroundColor: '#f8f9fa'
      }}
    />
  );
};

export default WinterForest;
