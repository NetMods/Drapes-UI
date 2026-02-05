'use client';

import { useEffect, useRef, useMemo } from 'react';

export type ColorTheme =
  | 'custom'
  | 'rainbow'
  | 'monochrome'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'neon'
  | 'fire'
  | 'aurora'
  | 'candy'
  | 'ice'
  | 'lava'
  | 'synthwave'
  | 'gold'
  | 'matrix';

export type GradientShape = 'circle' | 'square' | 'triangle' | 'hexagon' | 'star';

const COLOR_THEMES: Record<ColorTheme, [number, number, number]> = {
  custom: [0, 2, 4],
  rainbow: [0, 2, 4],
  monochrome: [0, 0, 0],
  ocean: [4, 2.5, 2],
  sunset: [1, 3, 5],
  forest: [3, 1.5, 4],
  neon: [0, 3, 1.5],
  fire: [0.5, 1.5, 4],
  aurora: [3, 1, 4.5],
  candy: [0.5, 2.5, 1.5],
  ice: [4, 3, 2.5],
  lava: [0, 2, 5],
  synthwave: [1.5, 4, 2],
  gold: [0, 0.8, 3],
  matrix: [4, 0, 4],
};

const SHAPE_IDS: Record<GradientShape, number> = {
  circle: 0,
  square: 1,
  triangle: 2,
  hexagon: 3,
  star: 4,
};

interface AuraRingProps {
  speed?: number;
  frequency?: number;
  intensity?: number;
  theme?: ColorTheme;
  colorShift?: [number, number, number];
  shape?: GradientShape;
  backgroundColor?: string;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}

const AuraRing = ({
  speed = 1.0,
  frequency = 10.0,
  intensity = 200.0,
  theme = 'rainbow',
  colorShift = [0, 2, 4],
  shape = 'circle',
  backgroundColor = '#000',
  offsetX = 0,
  offsetY = 0,
  scale = 0.5,
}: AuraRingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const resolvedColorShift = useMemo(() => {
    if (theme === 'custom') {
      return colorShift;
    }
    return COLOR_THEMES[theme];
  }, [theme, colorShift]);

  const shapeId = SHAPE_IDS[shape];

  const settingsRef = useRef({ speed, frequency, intensity, colorShift: resolvedColorShift, offsetX, offsetY, shapeId, scale });

  useEffect(() => {
    settingsRef.current = { speed, frequency, intensity, colorShift: resolvedColorShift, offsetX, offsetY, shapeId, scale };
  }, [speed, frequency, intensity, resolvedColorShift, offsetX, offsetY, shapeId, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 is not supported by your browser.');
      return;
    }

    const vsSource = `#version 300 es
    in vec4 a_position;
    void main() {
      gl_Position = a_position;
    }`;

    const fsSource = `#version 300 es
    precision highp float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_freq;
    uniform float u_intensity;
    uniform vec3 u_color;
    uniform vec2 u_offset;
    uniform int u_shape;
    uniform float u_scale;

    out vec4 fragColor;

    // Distance function for circle (radius 1)
    float sdCircle(vec2 p) {
      return length(p) - 1.0;
    }

    // Distance function for square (side length 2, centered at origin)
    float sdSquare(vec2 p) {
      vec2 d = abs(p) - vec2(1.0);
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    // Distance function for equilateral triangle (normalized to fit in -1 to 1 range)
    float sdTriangle(vec2 p) {
      const float k = sqrt(3.0);
      // Normalize triangle to fit within unit bounds
      p.y += 0.33; // Center the triangle vertically
      p.x = abs(p.x) - 1.0;
      p.y = p.y + 1.0 / k;
      if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
      p.x -= clamp(p.x, -2.0, 0.0);
      return -length(p) * sign(p.y);
    }

    // Distance function for hexagon (normalized to fit in -1 to 1 range)
    float sdHexagon(vec2 p) {
      const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
      p = abs(p);
      p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
      p -= vec2(clamp(p.x, -k.z, k.z), 1.0);
      return length(p) * sign(p.y);
    }

    // Distance function for 5-pointed star (normalized to fit in -1 to 1 range)
    float sdStar(vec2 p) {
      const float an = 3.14159265 / 5.0;  // 36 degrees
      const float en = 3.14159265 / 3.0;  // 60 degrees (controls inner radius)
      vec2 acs = vec2(cos(an), sin(an));
      vec2 ecs = vec2(cos(en), sin(en));
      
      float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
      p = length(p) * vec2(cos(bn), abs(sin(bn)));
      p -= 1.0 * acs;
      p += ecs * clamp(-dot(p, ecs), 0.0, 1.0 * acs.y / ecs.y);
      return length(p) * sign(p.x);
    }

    // Get distance based on shape type
    float getDistance(vec2 p, int shape) {
      if (shape == 0) return sdCircle(p);
      if (shape == 1) return sdSquare(p);
      if (shape == 2) return sdTriangle(p);
      if (shape == 3) return sdHexagon(p);
      if (shape == 4) return sdStar(p);
      return sdCircle(p); // fallback
    }

    void main() {
      vec2 r = u_resolution;
      float t = u_time;
      vec4 FC = gl_FragCoord;

      // Normalize coordinates to -1 to 1 range (aspect corrected)
      vec2 p = (FC.xy * 2.0 - r.xy) / r.y;
      
      // Apply offset - multiply by aspect ratio for X to allow full movement
      float aspect = r.x / r.y;
      p.x -= u_offset.x * aspect;
      p.y -= u_offset.y;
      
      // Apply scale (divide to make larger scale = larger shape)
      p /= u_scale;
      
      // Get distance based on selected shape
      float dist = getDistance(p, u_shape);
      
      // Convert SDF to intensity (positive inside, negative outside)
      // Adding 1.0 shifts so center of shape has l ≈ 2.0
      float l = 1.0 - dist;
      
      // The math magic: tanh gives the sharp contrast, sin gives the waves
      vec4 col = tanh((1.1 + sin(p.x * u_freq + t + vec4(u_color, 0.0))) / u_intensity / max(l, -l * 0.1));

      fragColor = col;
      fragColor.a = 1.0; 
    }`;

    // --- Boilerplate ---
    const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    const freqLocation = gl.getUniformLocation(program, "u_freq");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");
    const colorLocation = gl.getUniformLocation(program, "u_color");
    const offsetLocation = gl.getUniformLocation(program, "u_offset");
    const shapeLocation = gl.getUniformLocation(program, "u_shape");
    const scaleLocation = gl.getUniformLocation(program, "u_scale");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    let startTime = performance.now();

    const render = (now: number) => {
      // Handle resizing inside the loop for responsiveness
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      const needResize = canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr;

      if (needResize) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

      const { speed, frequency, intensity, colorShift, offsetX, offsetY, shapeId, scale } = settingsRef.current;

      // Calculate elapsed time
      const elapsed = (now - startTime) * 0.001;

      gl.uniform1f(timeUniformLocation, elapsed * speed);
      gl.uniform1f(freqLocation, frequency);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform3fv(colorLocation, colorShift);
      gl.uniform2f(offsetLocation, offsetX, offsetY);
      gl.uniform1i(shapeLocation, shapeId);
      gl.uniform1f(scaleLocation, scale);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor
      }}
    />
  );
};

export default AuraRing;
