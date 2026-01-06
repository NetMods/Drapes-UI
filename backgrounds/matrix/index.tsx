'use client';
import { useEffect, useRef } from 'react';

type Language = 'japanese' | 'chinese' | 'korean' | 'english' | 'russian';

interface MatrixProps {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  speed?: number;
  hasNumbers?: boolean;
  language?: Language;
  trailLength?: number;
}

const Matrix = ({
  backgroundColor = 'rgba(0, 0, 0, 1)',
  textColor = '#0F0',
  fontSize = 14,
  speed = 33,
  hasNumbers = false,
  language = 'japanese',
  trailLength = 1.0
}: MatrixProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drops: number[] = [];

    const getFadeColor = (): string => {
      const tempDiv = document.createElement('div');
      tempDiv.style.color = backgroundColor;
      document.body.appendChild(tempDiv);
      const computedColor = window.getComputedStyle(tempDiv).color;
      document.body.removeChild(tempDiv);

      const baseAlpha = 0.1;
      const alpha = baseAlpha / trailLength;

      const match = computedColor.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return `rgba(0, 0, 0, ${alpha})`;
    };

    const fadeColor = getFadeColor();

    const getRandomChar = (): string => {
      const chars: string[] = [];

      switch (language) {
        case 'japanese':
          chars.push(String.fromCharCode(0x30A0 + Math.random() * 96));
          break;
        case 'chinese':
          chars.push(String.fromCharCode(0x4E00 + Math.random() * 1000));
          break;
        case 'korean':
          chars.push(String.fromCharCode(0xAC00 + Math.random() * 11172));
          break;
        case 'russian':
          chars.push(String.fromCharCode(0x0410 + Math.random() * 32));
          break;
        case 'english':
        default:
          chars.push(String.fromCharCode(0x0041 + Math.random() * 52));
          break;
      }

      if (hasNumbers && Math.random() > 0.5) {
        return Math.floor(Math.random() * 10).toString();
      }

      return chars[0];
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);

      const columns = Math.floor((rect.width + fontSize) / fontSize);
      drops = new Array(columns).fill(1);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.fillStyle = fadeColor;
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      ctx.fillStyle = textColor;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = getRandomChar();

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > (canvas.height / dpr) && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, speed);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(interval);
    };
  }, [backgroundColor, textColor, fontSize, speed, hasNumbers, language, trailLength]);

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
        backgroundColor: 'black',
      }}
    />
  );
};

export default Matrix;
