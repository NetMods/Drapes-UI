"use client";

import { useEffect, useRef } from "react";

const colors = ["#fbf8cc", "#fdd835", "#fff176", "#ffeb3b"];

const config = {
  circleCount: 1500,
  speedFactor: 0.8,
  minRadius: 1,
  maxRadius: 10,
  focusRadius: 150,
};

const Background = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let circles: Circle[] = [];

    class Circle {
      x: number;
      y: number;
      baseRadius: number;
      baseDx: number;
      baseDy: number;
      ctx: CanvasRenderingContext2D;
      color: string;

      constructor(
        x: number,
        y: number,
        radius: number,
        context: CanvasRenderingContext2D
      ) {
        this.x = x;
        this.y = y;
        this.baseRadius = radius;

        this.baseDx = (Math.random() - 0.5) * 1.5;
        this.baseDy = (Math.random() - 0.5) * 1.5;
        this.ctx = context;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      draw(mouseX: number | null, mouseY: number | null) {
        if (mouseX === null || mouseY === null) return;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Add noise/randomness to the distance to break the circular pattern
        const noiseOffset = Math.sin(this.x * 0.01 + this.y * 0.01) * 30 + Math.cos(this.x * 0.02 - this.y * 0.015) * 25;
        const adjustedDistance = distance + noiseOffset;

        if (adjustedDistance < config.focusRadius) {
          // Calculate intensity (0 to 1) based on proximity to center
          const proximity = 1 - adjustedDistance / config.focusRadius;

          // Add more randomness to intensity - some particles are just dimmer/brighter
          const randomFactor = 0.7 + Math.sin(this.x * 0.05) * 0.3;

          // Apply an easing function but with the random factor
          const intensity = Math.pow(proximity, 2.5) * randomFactor;

          // Dynamic styling based on intensity
          const renderRadius = this.baseRadius + (config.maxRadius * intensity);
          const opacity = Math.max(0.05, intensity * 0.9);

          this.ctx.save();
          this.ctx.beginPath();

          // GLOW EFFECT with variation
          this.ctx.shadowBlur = 15 * intensity + Math.random() * 10;
          this.ctx.shadowColor = this.color;

          this.ctx.globalAlpha = opacity;
          this.ctx.fillStyle = this.color;

          this.ctx.arc(this.x, this.y, renderRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }

      update() {
        const { speedFactor } = config;

        this.x += this.baseDx * speedFactor;
        this.y += this.baseDy * speedFactor;

        if (this.x + this.baseRadius > window.innerWidth || this.x - this.baseRadius < 0) {
          this.baseDx = -this.baseDx;
        }

        if (this.y + this.baseRadius > window.innerHeight || this.y - this.baseRadius < 0) {
          this.baseDy = -this.baseDy;
        }

        this.draw(mouseRef.current.x, mouseRef.current.y);
      }
    }

    const resizeCanvas = () => {
      const dpi = window.devicePixelRatio || 1;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.width = window.innerWidth * dpi;
      canvas.height = window.innerHeight * dpi;
      ctx.scale(dpi, dpi);
    };

    const init = () => {
      circles = [];
      const { circleCount, minRadius } = config;
      for (let i = 0; i < circleCount; i++) {
        const radius = Math.random() * 2 + minRadius;
        const x = Math.random() * (window.innerWidth - radius * 2) + radius;
        const y = Math.random() * (window.innerHeight - radius * 2) + radius;
        circles.push(new Circle(x, y, radius, ctx));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      circles.forEach((circle) => circle.update());
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    }

    const handleResize = () => {
      resizeCanvas();
      init();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    resizeCanvas();
    init();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 bg-black"
    />
  );
};

export default Background;
