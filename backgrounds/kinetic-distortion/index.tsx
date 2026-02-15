'use client';

import { useRef, useEffect } from 'react';

interface KineticDistortionProps {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  sliceHeight?: number;
  textOffsetX?: number;
  textOffsetY?: number;
  sensitivity?: number;
  stripWidth?: number;
  sliceGap?: number;
}

const KineticDistortion = ({
  text = 'DRAPES',
  fontSize = 280,
  fontFamily = 'Inter, sans-serif',
  textColor = '#f5f5f5',
  backgroundColor = '#0e0e0e',
  sliceHeight = 8,
  textOffsetX = 0,
  textOffsetY = 0,
  sensitivity = 1,
  stripWidth = 2,
  sliceGap = 0,
}: KineticDistortionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const mouse = useRef({ x: -9999, y: -9999 });
  const prevMouse = useRef({ x: -9999, y: -9999 });
  const smoothedVel = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);

  const dims = useRef({ w: 0, h: 0, dpr: 1 });

  const rowSprings = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const renderDispX = useRef<Float32Array>(new Float32Array(0));
  const renderDispY = useRef<Float32Array>(new Float32Array(0));
  const rowSpringFactor = useRef<Float32Array>(new Float32Array(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offscreenCanvas = document.createElement('canvas');
    const offCtx = offscreenCanvas.getContext('2d');
    if (!offCtx) return;

    let rows = 0;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      dims.current = { w, h, dpr };

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      offscreenCanvas.width = w * dpr;
      offscreenCanvas.height = h * dpr;
      offCtx.scale(dpr, dpr);

      offCtx.fillStyle = backgroundColor;
      offCtx.fillRect(0, 0, w, h);

      offCtx.fillStyle = textColor;
      offCtx.font = `900 ${fontSize}px ${fontFamily}`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(text, w / 2 + textOffsetX, h / 2 + textOffsetY);

      rows = Math.ceil(h / sliceHeight);
      rowSprings.current = Array.from({ length: rows }, () => ({
        x: 0, y: 0, vx: 0, vy: 0,
      }));
      renderDispX.current = new Float32Array(rows);
      renderDispY.current = new Float32Array(rows);

      rowSpringFactor.current = new Float32Array(rows);
      for (let i = 0; i < rows; i++) {
        rowSpringFactor.current[i] = 0.3 + Math.random() * 1.5;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      isHovering.current = true;
    };

    const handlePointerReset = () => {
      isHovering.current = false;
      mouse.current = { x: -9999, y: -9999 };
      prevMouse.current = { x: -9999, y: -9999 };
      smoothedVel.current = { x: 0, y: 0 };
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      isHovering.current = true;
    };

    const animate = () => {
      const { w, h, dpr } = dims.current;

      // --- VELOCITY ---
      let targetVx = 0;
      let targetVy = 0;
      if (isHovering.current && prevMouse.current.x > -9000) {
        targetVx = mouse.current.x - prevMouse.current.x;
        targetVy = mouse.current.y - prevMouse.current.y;
      }
      prevMouse.current = { ...mouse.current };

      smoothedVel.current.x += (targetVx - smoothedVel.current.x) * 0.15;
      smoothedVel.current.y += (targetVy - smoothedVel.current.y) * 0.15;

      // --- CONFIG ---
      const radiusX = 300;
      const radiusY = 160;
      const stretchStrength = 10.0 * sensitivity;
      const baseStiffness = 0.04;
      const baseDamping = 0.85;

      // --- UPDATE PER-ROW SPRINGS ---
      const springs = rowSprings.current;
      const factors = rowSpringFactor.current;
      const mouseX = mouse.current.x;
      const mouseY = mouse.current.y;

      for (let r = 0; r < rows; r++) {
        const rowCenterY = r * sliceHeight + sliceHeight / 2;
        const dy = Math.abs(mouseY - rowCenterY);
        const s = springs[r];
        const f = factors[r];

        if (isHovering.current && dy < radiusY) {
          const yInfluence = Math.pow((radiusY - dy) / radiusY, 2.5);
          const targetX = smoothedVel.current.x * yInfluence * stretchStrength;
          const targetY = smoothedVel.current.y * yInfluence * stretchStrength * 0.4;
          const lerpSpeed = 0.12 + yInfluence * 0.2;

          s.x += (targetX - s.x) * lerpSpeed;
          s.y += (targetY - s.y) * lerpSpeed;
          s.vx = 0;
          s.vy = 0;
        } else {
          const stiff = baseStiffness * f;
          const damp = baseDamping + (1.0 - f) * 0.08;

          s.vx += -stiff * s.x;
          s.vy += -stiff * s.y;
          s.vx *= damp;
          s.vy *= damp;
          s.x += s.vx;
          s.y += s.vy;

          if (Math.abs(s.x) < 0.01 && Math.abs(s.vx) < 0.01) { s.x = 0; s.vx = 0; }
          if (Math.abs(s.y) < 0.01 && Math.abs(s.vy) < 0.01) { s.y = 0; s.vy = 0; }
        }
      }

      // --- PROPAGATE: pushed slices push neighbors ---
      const rx = renderDispX.current;
      const ry = renderDispY.current;
      const push = 0.7;

      for (let r = 0; r < rows; r++) {
        rx[r] = springs[r].x;
        ry[r] = springs[r].y;
      }

      for (let r = 1; r < rows; r++) {
        const pushedX = rx[r - 1] * push;
        const pushedY = ry[r - 1] * push;
        if (Math.abs(pushedX) > Math.abs(rx[r])) rx[r] = pushedX;
        if (Math.abs(pushedY) > Math.abs(ry[r])) ry[r] = pushedY;
      }

      for (let r = rows - 2; r >= 0; r--) {
        const pushedX = rx[r + 1] * push;
        const pushedY = ry[r + 1] * push;
        if (Math.abs(pushedX) > Math.abs(rx[r])) rx[r] = pushedX;
        if (Math.abs(pushedY) > Math.abs(ry[r])) ry[r] = pushedY;
      }

      // --- RENDER ---
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      for (let r = 0; r < rows; r++) {
        const sy = r * sliceHeight;
        const rowDispX = rx[r];
        const rowDispY = ry[r];
        const hasDisp = Math.abs(rowDispX) > 0.1 || Math.abs(rowDispY) > 0.1;
        const drawSliceH = sliceHeight - sliceGap;

        if (!hasDisp) {
          ctx.drawImage(
            offscreenCanvas,
            0, sy * dpr, w * dpr, drawSliceH * dpr,
            0, sy, w, drawSliceH,
          );
          continue;
        }

        const leftEnd = Math.max(0, Math.floor(mouseX - radiusX));
        if (leftEnd > 0) {
          ctx.drawImage(
            offscreenCanvas,
            0, sy * dpr, leftEnd * dpr, drawSliceH * dpr,
            0, sy, leftEnd, drawSliceH,
          );
        }

        const rightStart = Math.min(w, Math.ceil(mouseX + radiusX));
        if (rightStart < w) {
          ctx.drawImage(
            offscreenCanvas,
            rightStart * dpr, sy * dpr, (w - rightStart) * dpr, drawSliceH * dpr,
            rightStart, sy, w - rightStart, drawSliceH,
          );
        }

        for (let dx = leftEnd; dx < rightStart; dx += stripWidth) {
          const colCenter = dx + stripWidth / 2;
          const xDist = Math.abs(mouseX - colCenter);

          let xInfluence = 0;
          if (xDist < radiusX) {
            xInfluence = Math.pow((radiusX - xDist) / radiusX, 2.5);
          }

          const dispX = rowDispX * xInfluence;
          const dispY = rowDispY * xInfluence;

          const sourceX = dx - dispX;
          const sw = Math.min(stripWidth, rightStart - dx);
          const clampedSrcX = Math.max(0, Math.min(w - sw, sourceX));

          ctx.drawImage(
            offscreenCanvas,
            clampedSrcX * dpr, sy * dpr, sw * dpr, drawSliceH * dpr,
            dx, sy + dispY, sw, drawSliceH,
          );
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handlePointerReset);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerReset);
    canvas.addEventListener('touchcancel', handlePointerReset);

    handleResize();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handlePointerReset);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handlePointerReset);
      canvas.removeEventListener('touchcancel', handlePointerReset);
      cancelAnimationFrame(requestRef.current);
    };
  }, [text, fontSize, fontFamily, textColor, backgroundColor, sliceHeight, textOffsetX, textOffsetY, sensitivity, stripWidth, sliceGap]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor,
        touchAction: 'none',
      }}
    />
  );
};

export default KineticDistortion;
