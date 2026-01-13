"use client";

import { useEffect, useRef, useMemo, useEffectEvent } from "react";

export type DitherMode = "none" | "bayer" | "floyd";
export type BayerLevel = 2 | 4 | 8 | 16;
export type MediaType = "image" | "video";

interface DitherProps {
  mediaType: MediaType;
  ditherMode: DitherMode;
  isGrayscale: boolean;
  bayerLevel: BayerLevel;
  source: string;
  brightness: number;
  contrast: number;
  highlights: number;
  midtones: number;
  blur: number;
}

const DitherStudio = ({
  mediaType = 'image',
  ditherMode = 'bayer',
  isGrayscale = false,
  bayerLevel = 8,
  source = 'https://cdn.waifu.im/8251.jpg',
  brightness = 0,
  contrast = 0,
  highlights = 0,
  midtones = 0,
  blur = 0,
}: DitherProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  const colorLUT = useMemo(() => {
    const lut = new Uint8Array(256);
    const b = brightness / 100;
    const c = (contrast + 100) / 100;
    const cSqu = c * c;

    let gamma = 1;
    if (midtones < 0) gamma = 1 + midtones / -100;
    else gamma = 1 - midtones / 200;

    const h = 1 + highlights / 200;

    for (let i = 0; i < 256; i++) {
      let val = i / 255;
      val = (val - 0.5) * cSqu + 0.5;
      val += b;
      if (val > 0) val = Math.pow(val, gamma);
      if (val > 0.5) val = val * h;
      lut[i] = Math.min(255, Math.max(0, val * 255));
    }
    return lut;
  }, [brightness, contrast, highlights, midtones]);

  const bayerMatrix = useMemo(() => {
    const createMatrix = (n: number): number[][] => {
      if (n === 2) return [[0, 2], [3, 1]];
      const lowerMatrix = createMatrix(n / 2);
      const size = lowerMatrix.length;
      const matrix = Array.from({ length: size * 2 }, () => new Array(size * 2));
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const value = lowerMatrix[y][x];
          matrix[y][x] = 4 * value;
          matrix[y][x + size] = 4 * value + 2;
          matrix[y + size][x] = 4 * value + 3;
          matrix[y + size][x + size] = 4 * value + 1;
        }
      }
      return matrix;
    };
    return createMatrix(bayerLevel);
  }, [bayerLevel]);

  const onDraw = useEffectEvent(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    const drawSource = mediaType === "video" ? videoRef.current : imageRef.current;

    if (!canvas || !ctx || !drawSource) return;

    const dpi = window.devicePixelRatio || 1;
    if (
      canvas.width !== window.innerWidth * dpi ||
      canvas.height !== window.innerHeight * dpi
    ) {
      canvas.width = window.innerWidth * dpi;
      canvas.height = window.innerHeight * dpi;
    }

    const srcW = drawSource instanceof HTMLVideoElement ? drawSource.videoWidth : drawSource.width;
    const srcH = drawSource instanceof HTMLVideoElement ? drawSource.videoHeight : drawSource.height;
    if (srcW === 0 || srcH === 0) return;

    const scale = Math.min(canvas.width / srcW, canvas.height / srcH);
    const w = srcW * scale;
    const h = srcH * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;

    ctx.filter = `blur(${blur}px)`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(drawSource, x, y, w, h);
    ctx.filter = "none";

    const hasColorAdj = brightness !== 0 || contrast !== 0 || highlights !== 0 || midtones !== 0;

    if (ditherMode !== "none" || hasColorAdj || isGrayscale) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const matrixSize = bayerLevel;
      const matrix = bayerMatrix;
      const isFloyd = ditherMode === "floyd";
      const isBayer = ditherMode === "bayer";

      let grayBuffer: Float32Array | null = null;
      let rgbBuffer: Float32Array | null = null;

      if (isFloyd) {
        if (isGrayscale) grayBuffer = new Float32Array(width * height);
        else rgbBuffer = new Float32Array(width * height * 3);
      }

      for (let i = 0; i < data.length; i += 4) {
        const r = colorLUT[data[i]];
        const g = colorLUT[data[i + 1]];
        const b = colorLUT[data[i + 2]];

        if (isFloyd) {
          if (isGrayscale) {
            // @ts-ignore
            grayBuffer[i / 4] = r * 0.299 + g * 0.587 + b * 0.114;
          } else {
            const idx = (i / 4) * 3;
            // @ts-ignore
            rgbBuffer[idx] = r;
            // @ts-ignore
            rgbBuffer[idx + 1] = g;
            // @ts-ignore
            rgbBuffer[idx + 2] = b;
          }
        } else {
          // This block handles 'bayer' and 'none'
          if (isGrayscale) {
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            data[i] = data[i + 1] = data[i + 2] = gray;
          } else {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
      }

      if (isBayer) {
        for (let py = 0; py < height; py++) {
          for (let px = 0; px < width; px++) {
            const index = (py * width + px) * 4;
            const matrixValue = matrix[py % matrixSize][px % matrixSize];
            const threshold = (matrixValue / (matrixSize * matrixSize)) * 255;

            data[index] = data[index] > threshold ? 255 : 0;
            data[index + 1] = data[index + 1] > threshold ? 255 : 0;
            data[index + 2] = data[index + 2] > threshold ? 255 : 0;
          }
        }
      } else if (isFloyd) {
        // ... existing floyd logic ...
        if (isGrayscale && grayBuffer) {
          // ... (copy existing floyd grayscale logic here)
          for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
              const idx = py * width + px;
              const oldVal = grayBuffer[idx];
              const newVal = oldVal < 128 ? 0 : 255;
              const error = oldVal - newVal;
              grayBuffer[idx] = newVal;

              if (px + 1 < width) grayBuffer[idx + 1] += error * (7 / 16);
              if (py + 1 < height) {
                if (px - 1 >= 0) grayBuffer[idx + width - 1] += error * (3 / 16);
                grayBuffer[idx + width] += error * (5 / 16);
                if (px + 1 < width) grayBuffer[idx + width + 1] += error * (1 / 16);
              }
            }
          }
          for (let i = 0; i < grayBuffer.length; i++) {
            const val = grayBuffer[i];
            const dIdx = i * 4;
            data[dIdx] = data[dIdx + 1] = data[dIdx + 2] = val;
          }
        } else if (rgbBuffer) {
          // ... (copy existing floyd rgb logic here)
          for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
              const idx = (py * width + px) * 3;
              for (let c = 0; c < 3; c++) {
                const cIdx = idx + c;
                const oldVal = rgbBuffer[cIdx];
                const newVal = oldVal < 128 ? 0 : 255;
                const error = oldVal - newVal;
                rgbBuffer[cIdx] = newVal;

                if (px + 1 < width) rgbBuffer[cIdx + 3] += error * (7 / 16);
                if (py + 1 < height) {
                  if (px - 1 >= 0) rgbBuffer[cIdx + (width - 1) * 3] += error * (3 / 16);
                  rgbBuffer[cIdx + width * 3] += error * (5 / 16);
                  if (px + 1 < width) rgbBuffer[cIdx + (width + 1) * 3] += error * (1 / 16);
                }
              }
            }
          }
          for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
            data[i] = rgbBuffer[j];
            data[i + 1] = rgbBuffer[j + 1];
            data[i + 2] = rgbBuffer[j + 2];
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
  });

  useEffect(() => {
    onDraw();
  }, [ditherMode, isGrayscale, bayerLevel, brightness, contrast, highlights, midtones, blur]);

  useEffect(() => {
    const video = videoRef.current;

    // Handle Image Source
    if (mediaType === "image" && source) {
      const newImg = new Image();
      newImg.crossOrigin = "anonymous";
      newImg.src = source;
      newImg.onload = () => {
        imageRef.current = newImg;
        onDraw();
      };
    }

    // Handle Video Logic
    if (video) {
      if (mediaType === "video") {
        video.play().catch((e) => console.error(e));
      } else {
        video.pause();
      }
    }

    const loop = () => {
      if (mediaType === "video") {
        onDraw();
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };
    loop();

    const handleResize = () => onDraw();
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [mediaType, source]);

  return (
    <>
      <video
        ref={videoRef}
        src={mediaType === "video" ? source : undefined}
        crossOrigin="anonymous"
        style={{ display: "none" }}
        loop
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
        }}
      />
    </>
  );
};

export default DitherStudio;
