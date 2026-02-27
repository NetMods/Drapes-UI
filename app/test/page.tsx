"use client";
import { useEffect, useRef, useState } from "react";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface OrbitalBackgroundProps {
  centerX?: number;
  centerY?: number;
  seed?: number;
  sizeRatio?: number;
}

const vsPoints = `
  attribute vec2 a_position;
  attribute vec4 a_color;
  attribute float a_size;
  uniform vec2 u_resolution;
  varying vec4 v_color;

  void main() {
    // Convert pixels to clip space (-1 to +1)
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    // Flip Y to match standard canvas/screen orientation
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = a_size;
    v_color = a_color;
  }
`;

const fsPoints = `
  precision mediump float;
  varying vec4 v_color;

  void main() {
    // Draw a circle instead of a square point
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (length(coord) > 0.5) discard;
    gl_FragColor = v_color;
  }
`;

const vsQuad = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = (a_position + 1.0) / 2.0;
  }
`;

const fsQuad = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_texture;
  uniform float u_seed;

  // Pseudo-random noise function
  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    
    // Scale brightness to 0-255 to match the original JS logic seamlessly
    float brightness = ((color.r + color.g + color.b) / 3.0) * 255.0;

    // Use fragment coordinates + seed offset for perfect pixel-level noise
    vec2 co = gl_FragCoord.xy + u_seed;
    float noiseVal = rand(co);
    float rand2 = rand(co + 10.0);
    float rand3 = rand(co + 20.0);
    float rand4 = rand(co + 30.0);
    float rand5 = rand(co + 40.0);

    if (brightness < 200.0) {
      float grainIntensity = ((200.0 - brightness) / 200.0) * 70.0;
      float noise = (noiseVal - 0.5) * grainIntensity;
      float toothSkip = rand2 < 0.18 ? 22.0 + rand3 * 45.0 : 0.0;
      float speck = rand4 < 0.02 ? -(12.0 + rand5 * 25.0) : 0.0;
      float adj = (noise + toothSkip + speck) / 255.0;
      
      color.rgb = clamp(color.rgb + vec3(adj), 0.0, 1.0);
    } else {
      float paperNoise = (noiseVal - 0.5) * 10.0 / 255.0;
      color.rgb = clamp(color.rgb + vec3(paperNoise), 0.0, 1.0);
    }

    gl_FragColor = vec4(color.rgb, 1.0);
  }
`;

const OrbitalBackground = ({
  centerX = 0.5,
  centerY = 1.1,
  seed = 42,
  sizeRatio = 1.5,
}: OrbitalBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) return;

    const dpr = window.devicePixelRatio || 1;
    const w = dimensions.width;
    const h = dimensions.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vsP = createShader(gl.VERTEX_SHADER, vsPoints)!;
    const fsP = createShader(gl.FRAGMENT_SHADER, fsPoints)!;
    const vsQ = createShader(gl.VERTEX_SHADER, vsQuad)!;
    const fsQ = createShader(gl.FRAGMENT_SHADER, fsQuad)!;

    const pointProgram = gl.createProgram()!;
    gl.attachShader(pointProgram, vsP);
    gl.attachShader(pointProgram, fsP);
    gl.linkProgram(pointProgram);

    const quadProgram = gl.createProgram()!;
    gl.attachShader(quadProgram, vsQ);
    gl.attachShader(quadProgram, fsQ);
    gl.linkProgram(quadProgram);

    const rand = seededRandom(seed);
    const cx = w * centerX;
    const cy = h * centerY;
    const maxRadius = (Math.min(w, h) * sizeRatio) / 2;
    const ringCount = 160;

    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    for (let i = 0; i < ringCount; i++) {
      const t = i / ringCount;
      const radius = 8 + t * maxRadius;
      const spacingNudge = (rand() - 0.5) * 3;

      let darkness: number, alpha: number, lineWidth: number;

      if (t < 0.12) {
        darkness = 12 + rand() * 12;
        alpha = 0.6 + rand() * 0.2;
        lineWidth = 3.5 + rand() * 3.5;
      } else if (t < 0.35) {
        const lt = (t - 0.12) / 0.23;
        darkness = 18 + lt * 35 + rand() * 18;
        alpha = 0.5 + (1 - lt) * 0.12 + rand() * 0.1;
        lineWidth = 2.5 + (1 - lt) * 2 + rand() * 2;
      } else if (t < 0.6) {
        const lt = (t - 0.35) / 0.25;
        darkness = 50 + lt * 45 + rand() * 28;
        alpha = 0.3 + (1 - lt) * 0.15 + rand() * 0.08;
        lineWidth = 1.8 + (1 - lt) * 1 + rand() * 1.5;
      } else if (t < 0.82) {
        const lt = (t - 0.6) / 0.22;
        darkness = 90 + lt * 50 + rand() * 30;
        alpha = 0.15 + (1 - lt) * 0.12 + rand() * 0.05;
        lineWidth = 1 + (1 - lt) * 0.8 + rand() * 0.8;
      } else {
        const lt = (t - 0.82) / 0.18;
        darkness = 130 + lt * 40 + rand() * 25;
        alpha = Math.max(0, 0.08 * (1 - lt * lt) + rand() * 0.02);
        lineWidth = 0.5 + (1 - lt) * 0.5 + rand() * 0.4;
        if (rand() < lt * 0.65) continue;
      }

      const r = Math.floor(darkness);
      const g = Math.floor(Math.max(0, darkness - 3));
      const b = Math.floor(Math.max(0, darkness - 6));

      const circumference = 2 * Math.PI * radius;
      const dotDensity = 1.2;
      const numDots = Math.floor(circumference * dotDensity);

      for (let j = 0; j < numDots; j++) {
        if (rand() < 0.15) continue;

        const angle = (j / numDots) * Math.PI * 2 + (rand() - 0.5) * 0.02;
        const spread = (rand() - 0.5) * (rand() * lineWidth * 2.5);
        const currentRadius = radius + spacingNudge + spread;

        const x = cx + Math.cos(angle) * currentRadius;
        const y = cy + Math.sin(angle) * currentRadius;

        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) continue;

        const dotRadius = (lineWidth * (0.2 + rand() * 0.5)) / 2;
        const size = Math.max(0.5, dotRadius) * 2.0;

        positions.push(x * dpr, y * dpr);
        colors.push(r / 255, g / 255, b / 255, alpha);
        sizes.push(size * dpr);

        if (rand() < 0.05) {
          const straySpread = (rand() - 0.5) * lineWidth * 4.5;
          const strayRadius = radius + spacingNudge + straySpread;
          const sx = cx + Math.cos(angle) * strayRadius;
          const sy = cy + Math.sin(angle) * strayRadius;

          const strayDarkness = Math.max(0, darkness - 40);
          const sSize = Math.max(0.5, dotRadius * 1.2) * 2.0;

          positions.push(sx * dpr, sy * dpr);
          colors.push(
            strayDarkness / 255,
            strayDarkness / 255,
            strayDarkness / 255,
            Math.min(1, alpha * 1.8)
          );
          sizes.push(sSize * dpr);
        }
      }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w * dpr, h * dpr, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);

    const quadPositions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, w * dpr, h * dpr);
    gl.clearColor(245 / 255, 242 / 255, 237 / 255, 1.0); // #f5f2ed background
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(pointProgram);
    gl.uniform2f(gl.getUniformLocation(pointProgram, "u_resolution"), w * dpr, h * dpr);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const aPosition = gl.getAttribLocation(pointProgram, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const aColor = gl.getAttribLocation(pointProgram, "a_color");
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    const aSize = gl.getAttribLocation(pointProgram, "a_size");
    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS, 0, positions.length / 2);
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w * dpr, h * dpr);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(quadProgram);
    gl.uniform1f(gl.getUniformLocation(quadProgram, "u_seed"), seed);

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    const aQuadPosition = gl.getAttribLocation(quadProgram, "a_position");
    gl.enableVertexAttribArray(aQuadPosition);
    gl.vertexAttribPointer(aQuadPosition, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(quadProgram, "u_texture"), 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return () => {
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(colorBuffer);
      gl.deleteBuffer(sizeBuffer);
      gl.deleteBuffer(quadBuffer);
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(fbo);
      gl.deleteProgram(pointProgram);
      gl.deleteProgram(quadProgram);
      gl.deleteShader(vsP);
      gl.deleteShader(fsP);
      gl.deleteShader(vsQ);
      gl.deleteShader(fsQ);
    };
  }, [dimensions, centerX, centerY, seed, sizeRatio]);

  (async () => {
    const { captureCanvasScreenshot } = await import('@/lib/utils');
    await captureCanvasScreenshot(canvasRef, "orbital.webp");
  })()


  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#f5f2ed",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default OrbitalBackground
