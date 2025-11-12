'use client';
import { useEffect, useRef } from 'react';

interface MatrixProps {
  backgroundColor: string;
  textColor: string
}



const Matrix = ({
  backgroundColor = 'rgba(0, 0, 0, 1)',
  textColor = '#0F0'
}: MatrixProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  (async () => {
    const { captureCanvasScreenshot } = await import('@/lib/utils');
    await captureCanvasScreenshot(canvasRef, "matrix.webp", 2000);
  })()


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const letters = Array(256).join('1').split('').map(() => Math.floor(Math.random() * 758 + 10)); // Initialize y positions randomly for better effect

    const draw = () => {
      // Fade background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = textColor;

      letters.forEach((y, i) => {
        const text = String.fromCharCode(33 + Math.random() * 92);
        const x = i * 10;

        ctx.fillText(text, x, y);

        // Update y position
        letters[i] = y > 758 + Math.random() * 10000 ? 0 : y + 10;
      });
    };

    const interval = setInterval(draw, 60);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(interval);
    };
  }, [backgroundColor, textColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        backgroundColor
      }}
    />
  );
};

export default Matrix;
