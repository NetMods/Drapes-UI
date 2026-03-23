"use client";

import { useEffect, useRef } from "react";

export interface WebGLFloaterProps {
  topColor?: string;
  bottomColor?: string;
  speed?: number;
  scale?: number;
  density?: number;
  thickness?: number;
  showClouds?: boolean;
  cloudColor?: string;
  cloudOpacity?: number;
}

const hexToRgb = (hex: string) => {
  let cleaned = hex.replace(/^#/, "");
  if (cleaned.length === 3) cleaned = cleaned.split("").map(c => c + c).join("");
  const int = parseInt(cleaned, 16);
  return [(int >> 16 & 255) / 255, (int >> 8 & 255) / 255, (int & 255) / 255];
};

const FloaterWorms = ({
  topColor = "#8caae6",
  bottomColor = "#a4c4ed",
  speed = 0.4,
  scale = 2,
  density = 1,
  thickness = 0.8,
  showClouds = true,
  cloudColor = "#ffffff",
  cloudOpacity = 2,
}: WebGLFloaterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform float u_speed;
      uniform float u_scale;
      uniform float u_density;
      uniform float u_thickness;

      uniform float u_showClouds;
      uniform vec3 u_cloudColor;
      uniform float u_cloudOpacity;

      // -- Noise Functions --
      float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
      }

      float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }

      float fbm(vec2 p) {
          float v = 0.0; float a = 0.5;
          for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
          return v;
      }

      // -- SDF Utilities --
      float smin(float a, float b, float k) {
          float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
          return mix( b, a, h ) - k*h*(1.0-h);
      }

      float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h) - r;
      }

      // -- Complex Floater Shapes --
      float sdOrganicFloater(vec2 p, float seed) {
          float t = u_time * u_speed;
          vec2 w = p;

          // 1. Domain warping: Gives a continuous "microscopic" living wiggle to the whole structure
          w.x += sin(w.y * 18.0 + t * 3.0 + seed * 10.0) * 0.015;
          w.y += cos(w.x * 18.0 + t * 2.5 + seed * 20.0) * 0.015;

          // 2. Generate random static angles for the joints based on the seed
          float a1 = seed * 123.45;
          // Allowing tight bends (up to +/- 135 degrees) for tangled shapes
          float a2 = a1 + (fract(seed * 45.67) - 0.5) * 4.7;
          float a3 = a2 + (fract(seed * 89.12) - 0.5) * 4.7;

          // --- MODIFIED: Increased segment length here ---
          // The base length is larger, and the random variation is wider.
          float len = 0.14 + fract(seed * 11.11) * 0.12;

          // 3. Build the polymer chain (4 points = 3 segments)
          vec2 p1 = vec2(0.0, 0.0);
          vec2 p2 = p1 + vec2(cos(a1), sin(a1)) * len;
          vec2 p3 = p2 + vec2(cos(a2), sin(a2)) * len;
          vec2 p4 = p3 + vec2(cos(a3), sin(a3)) * len;

          // Center the shape so it doesn't clip outside its grid cell
          vec2 center = (p1 + p2 + p3 + p4) / 4.0;
          p1 -= center;
          p2 -= center;
          p3 -= center;
          p4 -= center;

          float r = 0.045 * u_thickness;

          // 4. Draw the tangled body segments
          float d1 = sdCapsule(w, p1, p2, r);
          float d2 = sdCapsule(w, p2, p3, r);
          float d3 = sdCapsule(w, p3, p4, r);

          // 5. Blend everything smoothly together so joints form an organic blob
          float k = 0.1;
          float d = smin(d1, d2, k);
          d = smin(d, d3, k);

          // 6. Add soft bulges at the extreme ends
          float head = length(w - p4) - (0.055 * u_thickness);
          float tail = length(w - p1) - (0.050 * u_thickness);
          d = smin(d, head, k);
          d = smin(d, tail, k);

          return d;
      }

      float map(vec2 p) {
          p *= u_scale;
          vec2 id = floor(p);
          vec2 g = fract(p) - 0.5;

          float n = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);

          // Local random drifting for the grid position
          float t = u_time * u_speed;
          g.x += sin(t * 0.8 + n * 20.0) * 0.15;
          g.y += cos(t * 0.6 + n * 15.0) * 0.15;

          float d = 100.0;

          if (n < u_density) {
              float type = n / max(u_density, 0.001);

              if (type < 0.4) {
                  // Unique tangled polymers
                  d = sdOrganicFloater(g, n);
              } else if (type < 0.6) {
                  d = length(g) - (0.08 * u_thickness);
              } else if (type < 0.8) {
                  vec2 gBent = g;
                  gBent.x += sin(gBent.y * 10.0) * 0.02;
                  d = length(gBent - vec2(0.08, 0.08)) - (0.055 * u_thickness);
                  float d2 = length(gBent - vec2(-0.04, -0.08)) - (0.065 * u_thickness);
                  d = smin(d, d2, 0.08);
              } else {
                  d = length(g) - (0.045 * u_thickness);
              }
          }

          return d;
      }

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 p = uv * 2.0 - 1.0;
          p.x *= u_resolution.x / u_resolution.y;

          vec3 bg = mix(u_color2, u_color1, uv.y);

          if (u_showClouds > 0.5) {
              vec2 cloudUV = uv * 3.0;
              cloudUV.x -= u_time * u_speed * 0.05;
              float cloudVal = fbm(cloudUV);
              cloudVal = smoothstep(0.4, 0.8, cloudVal);
              bg = mix(bg, u_cloudColor, cloudVal * u_cloudOpacity);
          }

          vec3 col = bg;
          float val = map(p);

          // --- Truly Transparent, Refractive Look ---

          // 1. Soft diffraction boundary (outer shadow of the membrane)
          float refractionEdge = smoothstep(0.025, 0.0, abs(val + 0.005));
          col = mix(col, bg * 0.75, refractionEdge * 0.35);

          // 2. The main body fluid (val < 0)
          float bodyFluid = smoothstep(0.01, -0.02, val);
          col = mix(col, bg * 1.15, bodyFluid * 0.25);

          // 3. Inner dense core
          float innerCore = smoothstep(-0.01, -0.06, val);
          col = mix(col, bg * 1.25, innerCore * 0.15);

          gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    if (!program || !vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResLoc = gl.getUniformLocation(program, "u_resolution");
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uCol1Loc = gl.getUniformLocation(program, "u_color1");
    const uCol2Loc = gl.getUniformLocation(program, "u_color2");
    const uSpeedLoc = gl.getUniformLocation(program, "u_speed");
    const uScaleLoc = gl.getUniformLocation(program, "u_scale");
    const uDensityLoc = gl.getUniformLocation(program, "u_density");
    const uThicknessLoc = gl.getUniformLocation(program, "u_thickness");
    const uShowCloudsLoc = gl.getUniformLocation(program, "u_showClouds");
    const uCloudColLoc = gl.getUniformLocation(program, "u_cloudColor");
    const uCloudOpLoc = gl.getUniformLocation(program, "u_cloudOpacity");

    let animationFrameId: number;
    const startTime = performance.now();

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    const render = (time: number) => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, (time - startTime) / 1000.0);
      gl.uniform3fv(uCol1Loc, hexToRgb(topColor));
      gl.uniform3fv(uCol2Loc, hexToRgb(bottomColor));
      gl.uniform1f(uSpeedLoc, speed);
      gl.uniform1f(uScaleLoc, scale);
      gl.uniform1f(uDensityLoc, clamp(density, 0.0, 1.0));
      gl.uniform1f(uThicknessLoc, thickness);

      gl.uniform1f(uShowCloudsLoc, showClouds ? 1.0 : 0.0);
      gl.uniform3fv(uCloudColLoc, hexToRgb(cloudColor));
      gl.uniform1f(uCloudOpLoc, cloudOpacity);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [
    topColor, bottomColor, speed, scale, density, thickness,
    showClouds, cloudColor, cloudOpacity
  ]);

  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -10,
      }}
    />
  );
}

export default FloaterWorms;
