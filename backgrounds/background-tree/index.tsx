'use client'
import { useRef, useEffect, useMemo } from "react";

type RNG = () => number;

interface TreeDef {
  originX: number;
  originY: number;
  angle: number;
  length: number;
  thickness: number;
  seed: number;
  maxDepth: number;
  depthLayer: number;
}

export interface BackgroundTreeProps {
  transparent?: boolean;
  backgroundColor?: string;
  branchCount?: number;
  branchWidth?: number;
  shadowOpacity?: number;
  windStrength?: number;
  windSpeed?: number;
  position?: 'top-right' | 'top-left';
}


const createRNG = (seed: number): RNG => {
  let s = seed;
  return (): number => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const generateCornerTrees = (
  count: number,
  baseSeed: number,
  position: 'top-right' | 'top-left',
  widthMultiplier: number
): TreeDef[] => {
  const trees: TreeDef[] = [];
  const rand = createRNG(baseSeed);
  const isRight = position === 'top-right';

  const diagCount = Math.ceil(count * 0.5);
  for (let i = 0; i < diagCount; i++) {
    const t = i / Math.max(diagCount - 1, 1);
    const rawX = 1.05 - t * 0.9 + (rand() - 0.5) * 0.08;
    const x = isRight ? rawX : 1 - rawX;
    const y = -0.03 - rand() * 0.03;

    const rawAngle = Math.PI * (0.35 + t * 0.3 + (rand() - 0.5) * 0.12);
    const angle = isRight ? rawAngle : Math.PI - rawAngle;

    trees.push({
      originX: x,
      originY: y,
      angle,
      length: 0.4 + rand() * 0.35,
      thickness: (14 + rand() * 16) * widthMultiplier,
      seed: baseSeed + i * 197,
      maxDepth: 3 + Math.floor(rand() * 2),
      depthLayer: Math.floor(rand() * 3),
    });
  }

  const vertCount = Math.ceil(count * 0.35);
  for (let i = 0; i < vertCount; i++) {
    const t = i / Math.max(vertCount - 1, 1);
    const rawX = 0.95 - t * 0.75 + (rand() - 0.5) * 0.1;
    const x = isRight ? rawX : 1 - rawX;
    const y = -0.02 - rand() * 0.02;
    const rawAngle = Math.PI * (0.45 + (rand() - 0.5) * 0.12);
    const angle = isRight ? rawAngle : Math.PI - rawAngle;

    trees.push({
      originX: x,
      originY: y,
      angle,
      length: 0.3 + rand() * 0.3,
      thickness: (10 + rand() * 14) * widthMultiplier,
      seed: baseSeed + 2000 + i * 163,
      maxDepth: 3 + Math.floor(rand() * 2),
      depthLayer: Math.floor(rand() * 3),
    });
  }

  const sideCount = Math.max(2, Math.ceil(count * 0.15));
  for (let i = 0; i < sideCount; i++) {
    const t = i / Math.max(sideCount - 1, 1);
    const x = isRight ? 1.02 + rand() * 0.02 : -0.02 - rand() * 0.02;
    const y = -0.02 + t * 0.35 + rand() * 0.08;

    const rawAngle = Math.PI + (0.08 + t * 0.35 + (rand() - 0.5) * 0.15);
    const angle = isRight ? rawAngle : -rawAngle;

    trees.push({
      originX: x,
      originY: y,
      angle,
      length: 0.4 + rand() * 0.3,
      thickness: (14 + rand() * 14) * widthMultiplier,
      seed: baseSeed + 1000 + i * 211,
      maxDepth: 3 + Math.floor(rand() * 2),
      depthLayer: Math.floor(rand() * 3),
    });
  }

  return trees;
};


const drawLeafSilhouette = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number,
  size: number
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const w = size * 0.55;
  const h = size;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(w, -h * 0.25, w * 0.8, -h * 0.7, 0, -h);
  ctx.bezierCurveTo(-w * 0.8, -h * 0.7, -w, -h * 0.25, 0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};


const drawBranchSilhouette = (
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  angle: number,
  length: number,
  thickness: number,
  depth: number,
  maxDepth: number,
  rand: RNG,
  time: number,
  windStrength: number,
  windSpeed: number
): void => {
  if (depth > maxDepth || length < 6 || thickness < 0.8) return;

  const depthRatio = depth / maxDepth;
  const phase = rand() * Math.PI * 2;
  const freqBase = 0.25 + rand() * 0.15;
  const freqSlow = 0.08 + rand() * 0.06;

  const sway = windStrength * 0.035 * depthRatio * depthRatio * (
    Math.sin(time * windSpeed * freqBase + phase) +
    0.4 * Math.sin(time * windSpeed * freqBase * 2.3 + phase * 1.5) +
    0.25 * Math.sin(time * windSpeed * freqSlow + phase * 2.1)
  );

  const swayedAngle = angle + sway;

  const curveMag = (rand() - 0.5) * 0.2 * length;
  const secondaryCurve = (rand() - 0.5) * 0.08 * length;
  const segments = Math.max(8, Math.floor(length / 6));

  const pts: Array<{ x: number; y: number }> = [{ x: x1, y: y1 }];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const primaryOffset = Math.sin(t * Math.PI) * curveMag;
    const secondaryOffset = Math.sin(t * Math.PI * 2) * secondaryCurve;
    const curveOffset = primaryOffset + secondaryOffset;
    const perpAngle = swayedAngle + Math.PI / 2;
    const baseX = x1 + Math.cos(swayedAngle) * length * t;
    const baseY = y1 + Math.sin(swayedAngle) * length * t;
    pts.push({
      x: baseX + Math.cos(perpAngle) * curveOffset,
      y: baseY + Math.sin(perpAngle) * curveOffset,
    });
  }

  const leftEdge: Array<{ x: number; y: number }> = [];
  const rightEdge: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    const halfW = (thickness * (1 - t * 0.7)) / 2;

    let perpA: number;
    if (i < pts.length - 1) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      perpA = Math.atan2(dy, dx) + Math.PI / 2;
    } else {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      perpA = Math.atan2(dy, dx) + Math.PI / 2;
    }

    leftEdge.push({
      x: pts[i].x + Math.cos(perpA) * halfW,
      y: pts[i].y + Math.sin(perpA) * halfW,
    });
    rightEdge.push({
      x: pts[i].x - Math.cos(perpA) * halfW,
      y: pts[i].y - Math.sin(perpA) * halfW,
    });
  }

  const tipPt = pts[pts.length - 1];
  ctx.beginPath();
  ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let i = 1; i < leftEdge.length; i++) {
    ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
  }
  ctx.lineTo(tipPt.x, tipPt.y);
  for (let i = rightEdge.length - 1; i >= 0; i--) {
    ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
  }
  ctx.closePath();
  ctx.fill();

  const endPt = pts[pts.length - 1];
  const endAngle = Math.atan2(
    endPt.y - pts[pts.length - 2].y,
    endPt.x - pts[pts.length - 2].x
  );

  const forkCount = depth === 0
    ? 2 + Math.floor(rand() * 2)
    : 1 + Math.floor(rand() * 2);

  for (let i = 0; i < forkCount; i++) {
    const forkBase = depth === 0 ? 0.3 : 0.5;
    const forkSpread = 0.5 / Math.max(forkCount, 1);
    const forkT = forkBase + i * forkSpread + rand() * forkSpread * 0.5;
    const forkIdx = Math.min(Math.floor(forkT * (pts.length - 1)), pts.length - 2);
    const forkPt = pts[forkIdx];

    const localAngle = Math.atan2(
      pts[forkIdx + 1].y - pts[forkIdx].y,
      pts[forkIdx + 1].x - pts[forkIdx].x
    );

    const spread = (0.3 + rand() * 0.4) * (rand() > 0.5 ? 1 : -1);
    const childAngle = localAngle + spread;
    const lengthDecay = 0.5 + rand() * 0.2;
    const thicknessDecay = 0.55 + rand() * 0.2;

    drawBranchSilhouette(
      ctx,
      forkPt.x, forkPt.y,
      childAngle,
      length * lengthDecay,
      thickness * thicknessDecay,
      depth + 1,
      maxDepth,
      rand,
      time, windStrength, windSpeed
    );
  }
  if (depth < maxDepth && rand() > 0.3) {
    const contAngle = endAngle + (rand() - 0.5) * 0.25;
    const contLength = length * (0.45 + rand() * 0.2);
    const contThick = thickness * (0.6 + rand() * 0.15);

    drawBranchSilhouette(
      ctx,
      endPt.x, endPt.y,
      contAngle,
      contLength,
      contThick,
      depth + 1,
      maxDepth,
      rand,
      time, windStrength, windSpeed
    );
  }

  if (depth >= maxDepth - 1 && thickness < 6) {
    const leafCount = 2 + Math.floor(rand() * 4);
    for (let i = 0; i < leafCount; i++) {
      const leafAngle = endAngle + (rand() - 0.5) * 2.5;
      const leafDist = 3 + rand() * 10;
      const lx = endPt.x + Math.cos(leafAngle) * leafDist;
      const ly = endPt.y + Math.sin(leafAngle) * leafDist;
      const leafSize = 6 + rand() * 10;

      const leafPhase = rand() * Math.PI * 2;
      const flutter = windStrength * 0.05 * (
        Math.sin(time * windSpeed * 1.4 + leafPhase) +
        0.4 * Math.sin(time * windSpeed * 2.6 + leafPhase * 1.3)
      );

      drawLeafSilhouette(ctx, lx, ly, leafAngle + flutter, leafSize);
    }
  }
};


const applyPass = (
  ctx: CanvasRenderingContext2D,
  offCanvas: HTMLCanvasElement,
  offCtx: CanvasRenderingContext2D,
  blur: number,
  opacity: number,
  fn: (ctx: CanvasRenderingContext2D) => void
): void => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  if (offCanvas.width !== w || offCanvas.height !== h) {
    offCanvas.width = w;
    offCanvas.height = h;
  }

  offCtx.clearRect(0, 0, w, h);

  const dpr = window.devicePixelRatio || 1;
  offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const color = `rgba(0,0,0,${opacity})`;
  offCtx.fillStyle = color;
  offCtx.strokeStyle = color;
  fn(offCtx);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(offCanvas, 0, 0);
  ctx.filter = "none";
  ctx.restore();
};

const paintScene = (
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  trees: TreeDef[],
  time: number,
  windStrength: number,
  windSpeed: number
): void => {
  for (const tree of trees) {
    const rand = createRNG(tree.seed);
    drawBranchSilhouette(
      ctx,
      tree.originX * w,
      tree.originY * h,
      tree.angle,
      tree.length * Math.min(w, h),
      tree.thickness,
      0,
      tree.maxDepth,
      rand,
      time, windStrength, windSpeed
    );
  }
};


interface TreeLayers {
  far: TreeDef[];
  mid: TreeDef[];
  near: TreeDef[];
}

const splitTreeLayers = (trees: TreeDef[]): TreeLayers => ({
  far: trees.filter(t => t.depthLayer === 0),
  mid: trees.filter(t => t.depthLayer === 1),
  near: trees.filter(t => t.depthLayer === 2),
});

const paint = (
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  transparent: boolean,
  backgroundColor: string,
  layers: TreeLayers,
  time: number,
  windStrength: number,
  windSpeed: number,
  shadowOpacity: number,
  offCanvas: HTMLCanvasElement,
  offCtx: CanvasRenderingContext2D,
): void => {
  ctx.clearRect(0, 0, w, h);

  if (!transparent) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);

    const spots: Array<[number, number, number]> = [
      [0.25, 0.30, 0.30],
      [0.55, 0.50, 0.28],
      [0.15, 0.65, 0.22],
      [0.40, 0.20, 0.25],
      [0.50, 0.75, 0.20],
    ];
    for (const [sx, sy, sr] of spots) {
      const g = ctx.createRadialGradient(w * sx, h * sy, 0, w * sx, h * sy, w * sr);
      g.addColorStop(0, "rgba(255,255,255,0.30)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  const o = shadowOpacity;

  applyPass(ctx, offCanvas, offCtx, 40, 0.06 * o, (c) => {
    paintScene(c, w, h, layers.far, time, windStrength, windSpeed);
  });
  applyPass(ctx, offCanvas, offCtx, 24, 0.05 * o, (c) => {
    paintScene(c, w, h, layers.far, time, windStrength, windSpeed);
  });

  applyPass(ctx, offCanvas, offCtx, 28, 0.05 * o, (c) => {
    paintScene(c, w, h, layers.mid, time, windStrength, windSpeed);
  });
  applyPass(ctx, offCanvas, offCtx, 14, 0.08 * o, (c) => {
    paintScene(c, w, h, layers.mid, time, windStrength, windSpeed);
  });

  applyPass(ctx, offCanvas, offCtx, 8, 0.06 * o, (c) => {
    paintScene(c, w, h, layers.mid, time, windStrength, windSpeed);
  });

  applyPass(ctx, offCanvas, offCtx, 18, 0.05 * o, (c) => {
    paintScene(c, w, h, layers.near, time, windStrength, windSpeed);
  });
  applyPass(ctx, offCanvas, offCtx, 10, 0.08 * o, (c) => {
    paintScene(c, w, h, layers.near, time, windStrength, windSpeed);
  });
  applyPass(ctx, offCanvas, offCtx, 6, 0.06 * o, (c) => {
    paintScene(c, w, h, layers.near, time, windStrength, windSpeed);
  });

};


const BackgroundTree = ({
  transparent = false,
  backgroundColor = '#e8e4e0',
  branchCount = 8,
  branchWidth = 1,
  shadowOpacity = 1,
  windStrength = 3,
  windSpeed = 2,
  position = 'top-right',
}: BackgroundTreeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);

  const propsRef = useRef({ transparent, backgroundColor, shadowOpacity, windStrength, windSpeed });
  propsRef.current = { transparent, backgroundColor, shadowOpacity, windStrength, windSpeed };

  const { trees, layers } = useMemo(() => {
    const allTrees = generateCornerTrees(branchCount, 500, position, branchWidth);
    return { trees: allTrees, layers: splitTreeLayers(allTrees) };
  }, [branchCount, branchWidth, position]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    let w = 0;
    let h = 0;

    const resize = (): void => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (w === 0 || h === 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();

    const dpr = window.devicePixelRatio || 1;

    const animate = (timestamp: number): void => {
      if (w === 0 || h === 0) { resize(); }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const time = timestamp / 1000;
      const p = propsRef.current;
      paint(ctx, w, h, p.transparent, p.backgroundColor, layers, time, p.windStrength, p.windSpeed, p.shadowOpacity, offCanvas, offCtx);

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    const observer = new ResizeObserver(resize);
    const parent = canvas.parentElement;
    if (parent) observer.observe(parent);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [trees, layers]);


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
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        touchAction: 'none',
      }}
    />
  );
};

export default BackgroundTree;
