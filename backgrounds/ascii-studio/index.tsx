"use client";
import { useEffect, useRef, useMemo, useCallback } from "react";

export type AsciiMode =
  | "standard"
  | "technical"
  | "dense"
  | "minimal"
  | "blocks"
  | "braille"
  | "hatching";

export type MediaType = "image" | "video";
export type ObjectFit = "contain" | "cover" | "fill";

interface AsciiProps {
  mediaType: MediaType;
  asciiMode: AsciiMode;
  source: string;
  objectFit?: ObjectFit;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  inverted?: boolean;
  colored?: boolean;
}

const ASCII_CHARS: Record<AsciiMode, string> = {
  standard: " .:-=+*#%@",
  technical: " ._-~:;=!*#$@",
  dense: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  minimal: " .-+*#",
  blocks: " ░▒▓█",
  braille: " ⠁⠃⠇⠏⠟⠿⡿⣿",
  hatching: " -=≡≣",
};

const AsciiStudio = ({
  mediaType = "image",
  asciiMode = "standard",
  source,
  objectFit = "contain",
  fontSize = 10,
  color = "#eeeeee",
  backgroundColor = "#000000",
  inverted = false,
  colored = true,
}: AsciiProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const charSet = useMemo(() => {
    const chars = ASCII_CHARS[asciiMode];
    return inverted ? chars.split("").reverse().join("") : chars;
  }, [asciiMode, inverted]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const hiddenCtx = hiddenCanvas?.getContext("2d", { willReadFrequently: true });

    if (!canvas || !hiddenCanvas || !ctx || !hiddenCtx) return;

    const sourceElem =
      mediaType === "video" ? videoRef.current : imageRef.current;
    if (!sourceElem) return;

    const srcW =
      sourceElem instanceof HTMLVideoElement
        ? sourceElem.videoWidth
        : sourceElem.width;
    const srcH =
      sourceElem instanceof HTMLVideoElement
        ? sourceElem.videoHeight
        : sourceElem.height;

    if (srcW === 0 || srcH === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Calculate character dimensions
    ctx.font = `${fontSize * dpr}px "Courier New", monospace`;
    ctx.textBaseline = "top";

    const charWidth = ctx.measureText("M").width;
    const charHeight = fontSize * dpr * 1.2;

    // Calculate grid size
    const cols = Math.floor(canvas.width / charWidth);
    const rows = Math.floor(canvas.height / charHeight);

    if (cols <= 0 || rows <= 0) return;

    // Set hidden canvas to sample size
    hiddenCanvas.width = cols;
    hiddenCanvas.height = rows;

    // Calculate aspect ratios for correction
    const cellRatio = charHeight / charWidth;
    const sourceAspect = srcW / srcH;
    const correctedSourceAspect = sourceAspect * cellRatio;
    const canvasAspect = cols / rows;

    let drawX = 0,
      drawY = 0,
      drawW = cols,
      drawH = rows;

    if (objectFit === "contain") {
      if (canvasAspect > correctedSourceAspect) {
        drawH = rows;
        drawW = rows * correctedSourceAspect;
        drawX = (cols - drawW) / 2;
      } else {
        drawW = cols;
        drawH = cols / correctedSourceAspect;
        drawY = (rows - drawH) / 2;
      }
    } else if (objectFit === "cover") {
      if (canvasAspect > correctedSourceAspect) {
        drawW = cols;
        drawH = cols / correctedSourceAspect;
        drawY = (rows - drawH) / 2;
      } else {
        drawH = rows;
        drawW = rows * correctedSourceAspect;
        drawX = (cols - drawW) / 2;
      }
    }

    // Clear and draw to hidden canvas
    hiddenCtx.fillStyle = backgroundColor;
    hiddenCtx.fillRect(0, 0, cols, rows);
    hiddenCtx.drawImage(sourceElem, drawX, drawY, drawW, drawH);

    // Get pixel data
    const imageData = hiddenCtx.getImageData(0, 0, cols, rows);
    const pixels = imageData.data;

    // Clear main canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // OPTIMIZATION: If not colored, set fillStyle ONCE outside the loop
    if (!colored) {
      ctx.fillStyle = color;
    }

    // Render ASCII
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a === 0) continue;

        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const charIndex = Math.floor(luminance * (charSet.length - 1));
        const char = charSet[charIndex];

        if (char !== " ") {
          // If colored mode is on, update color for every single character
          if (colored) {
            ctx.fillStyle = `rgb(${r},${g},${b})`;
          }

          ctx.fillText(char, x * charWidth, y * charHeight);
        }
      }
    }
  }, [
    mediaType,
    asciiMode,
    charSet,
    objectFit,
    fontSize,
    color,
    backgroundColor,
    colored, // Added to dependency array
  ]);

  // Initialize and handle resize
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [draw]);

  // Handle source changes
  useEffect(() => {
    const video = videoRef.current;

    if (mediaType === "image" && source) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        draw();
      };
      img.src = source;
    }

    if (video) {
      if (mediaType === "video") {
        video.play().catch((e) => console.error(e));
      } else {
        video.pause();
      }
    }

    const loop = () => {
      if (mediaType === "video") draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    if (mediaType === "video") loop();

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mediaType, source, draw]);

  // Redraw on prop changes
  useEffect(() => {
    draw();
  }, [
    asciiMode,
    objectFit,
    fontSize,
    color,
    backgroundColor,
    inverted,
    colored,
    draw,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          backgroundColor,
        }}
      />
      <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />
      {mediaType === "video" && (
        <video
          ref={videoRef}
          src={source}
          crossOrigin="anonymous"
          loop
          muted
          playsInline
          style={{ display: "none" }}
          onLoadedData={draw}
        />
      )}
    </div>
  );
};

export default AsciiStudio;
