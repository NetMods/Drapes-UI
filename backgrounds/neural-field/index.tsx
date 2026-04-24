'use client'
import { useEffect, useRef, useMemo } from 'react';

const variantMap: Record<string, number> = {
  classic: 0,
  fluid: 1,
  geometric: 2,
  minimal: 3,
};

const COLOR_THEMES: Record<string, [number, number, number]> = {
  custom: [0.263, 0.416, 0.557],
  rainbow: [0.263, 0.416, 0.557],
  ocean: [0.50, 0.62, 0.77],
  sunset: [0.00, 0.15, 0.20],
  forest: [0.30, 0.20, 0.20],
  neon: [0.00, 0.33, 0.67],
  fire: [0.00, 0.10, 0.20],
  ice: [0.55, 0.70, 0.80],
  synthwave: [0.75, 0.33, 0.67],
  gold: [0.00, 0.05, 0.15],
  monochrome: [0.00, 0.00, 0.00],
  candy: [0.85, 0.25, 0.65],
  aurora: [0.35, 0.15, 0.65],
  lava: [0.00, 0.08, 0.30],
};

const NeuralField = ({
  variant = 'classic',
  theme = 'sunset',
  speed = 0.2,
  zoom = 1.0,
  rotSpeed1 = 0.5,
  rotSpeed2 = 0.3,
  matrixScale = 1.5,
  colorShiftR = 0.263,
  colorShiftG = 0.416,
  colorShiftB = 0.557,
  distMix = 0.5,
  vignetteStart = 0.5,
  vignetteEnd = 1.5,
  brightness = 1.0,
  vignette = false,
  className = ""
}) => {
  const resolvedColor = useMemo(() => {
    if (theme === 'custom') return [colorShiftR, colorShiftG, colorShiftB];
    return COLOR_THEMES[theme] ?? COLOR_THEMES.rainbow;
  }, [theme, colorShiftR, colorShiftG, colorShiftB]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const vsSource = `
    attribute vec2 aVertexPosition;
    varying vec2 vUv;
    void main() {
      vUv = aVertexPosition * 0.5 + 0.5;
      gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    }
  `;

  const createFragmentShader = (): string => `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform float u_speed;
    uniform float u_zoom;
    uniform float u_rotSpeed1;
    uniform float u_rotSpeed2;
    uniform float u_matrixScale;
    uniform float u_colorShiftR;
    uniform float u_colorShiftG;
    uniform float u_colorShiftB;
    uniform float u_distMix;
    uniform float u_vignetteStart;
    uniform float u_vignetteEnd;
    uniform float u_brightness;
    uniform int u_variant;
    uniform bool u_vignette;
    varying vec2 vUv;

    mat4 transpose4(mat4 m) {
      return mat4(
        vec4(m[0].x, m[1].x, m[2].x, m[3].x),
        vec4(m[0].y, m[1].y, m[2].y, m[3].y),
        vec4(m[0].z, m[1].z, m[2].z, m[3].z),
        vec4(m[0].w, m[1].w, m[2].w, m[3].w)
      );
    }

    vec3 palette(in float t) {
      vec3 a = vec3(0.5, 0.5, 0.5);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = vec3(1.0, 1.0, 1.0);
      vec3 d = vec3(u_colorShiftR, u_colorShiftG, u_colorShiftB);
      return a + b * cos(6.28318 * (c * t + d));
    }

    mat2 rot(float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c);
    }

    vec4 neural_layer(vec4 x, mat4 W, vec4 bias) {
      vec4 res = W * x;
      res += bias;
      return sin(res);
    }

    void main() {
      vec2 uv = (vUv * 2.0 - 1.0);
      uv.x *= iResolution.x / iResolution.y;
      uv /= u_zoom;

      float t = iTime * u_speed;
      float t1 = t * u_rotSpeed1;
      float t2 = t * u_rotSpeed2;
      mat2 r1 = rot(t1);
      mat2 r2 = rot(t2);

      mat4 W1 = mat4(
        vec4(r1[0][0], r1[0][1], 0.0, 0.0),
        vec4(r1[1][0], r1[1][1], 0.0, 0.0),
        vec4(0.0, 0.0, r2[0][0], r2[0][1]),
        vec4(0.0, 0.0, r2[1][0], r2[1][1])
      );

      vec4 v;
      float value;

      if (u_variant == 0) {
        // Classic — balanced layers with transpose mix
        mat4 W2 = mat4(
           1.2,  0.5, -0.2,  0.0,
          -0.5,  1.1,  0.3,  0.0,
           0.2, -0.3,  1.0,  0.4,
           0.0,  0.0, -0.4,  1.0
        );
        v = vec4(uv, length(uv), sin(t));
        v = neural_layer(v, W1, vec4(0.1));
        v = neural_layer(v, W2 * u_matrixScale, vec4(-0.2));
        v = neural_layer(v, W1 * transpose4(W2), vec4(sin(t)));
        v = neural_layer(v, W2, vec4(cos(t)));
        value = v.x * v.y + v.z;

      } else if (u_variant == 1) {
        // Fluid — symmetric matrix, smooth organic blobs
        mat4 W2 = mat4(
           1.0,  0.8, -0.3,  0.2,
           0.8,  1.0,  0.2, -0.3,
          -0.3,  0.2,  1.0,  0.8,
           0.2, -0.3,  0.8,  1.0
        );
        v = vec4(uv, sin(length(uv) * 2.0), cos(t));
        v = neural_layer(v, W1, vec4(0.0));
        v = neural_layer(v, W2 * u_matrixScale, vec4(sin(t * 0.5)));
        v = neural_layer(v, transpose4(W2) * W1, vec4(0.1));
        v = neural_layer(v, W2, vec4(cos(t * 0.7)));
        value = v.x + v.y * v.z;

      } else if (u_variant == 2) {
        // Geometric — diagonal-heavy, sharp angular patterns
        mat4 W2 = mat4(
           1.5,  0.0,  0.0,  0.7,
           0.0,  1.5, -0.7,  0.0,
           0.0,  0.7,  1.5,  0.0,
          -0.7,  0.0,  0.0,  1.5
        );
        v = vec4(uv, uv.x * uv.y, sin(t));
        v = neural_layer(v, W2 * u_matrixScale, vec4(0.2));
        v = neural_layer(v, W1, vec4(-0.1));
        v = neural_layer(v, W2 * W1, vec4(cos(t)));
        v = neural_layer(v, transpose4(W2), vec4(sin(t * 0.3)));
        value = abs(v.x * v.z) + v.y * v.w;

      } else {
        // Minimal — only 2 layers, clean simple forms
        mat4 W2 = mat4(
           1.0,  0.3,  0.0,  0.0,
          -0.3,  1.0,  0.0,  0.0,
           0.0,  0.0,  1.0,  0.3,
           0.0,  0.0, -0.3,  1.0
        );
        v = vec4(uv, length(uv), t);
        v = neural_layer(v, W1 * u_matrixScale, vec4(0.05));
        v = neural_layer(v, W2, vec4(sin(t * 0.5)));
        value = v.x + v.y;
      }

      float dist = length(uv);
      vec3 col = palette(value + dist * u_distMix + t);

      col *= u_brightness;
      if (u_vignette) {
        col *= 1.0 - smoothstep(u_vignetteStart, u_vignetteEnd, dist);
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const loadShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error: ', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return null;

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return null;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Shader program link error: ', gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {});
    if (!gl) {
      console.warn('WebGL not supported.');
      return;
    }

    const fsSource = createFragmentShader();
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        time: gl.getUniformLocation(shaderProgram, 'iTime'),
        speed: gl.getUniformLocation(shaderProgram, 'u_speed'),
        zoom: gl.getUniformLocation(shaderProgram, 'u_zoom'),
        rotSpeed1: gl.getUniformLocation(shaderProgram, 'u_rotSpeed1'),
        rotSpeed2: gl.getUniformLocation(shaderProgram, 'u_rotSpeed2'),
        matrixScale: gl.getUniformLocation(shaderProgram, 'u_matrixScale'),
        colorShiftR: gl.getUniformLocation(shaderProgram, 'u_colorShiftR'),
        colorShiftG: gl.getUniformLocation(shaderProgram, 'u_colorShiftG'),
        colorShiftB: gl.getUniformLocation(shaderProgram, 'u_colorShiftB'),
        distMix: gl.getUniformLocation(shaderProgram, 'u_distMix'),
        vignetteStart: gl.getUniformLocation(shaderProgram, 'u_vignetteStart'),
        vignetteEnd: gl.getUniformLocation(shaderProgram, 'u_vignetteEnd'),
        brightness: gl.getUniformLocation(shaderProgram, 'u_brightness'),
        variant: gl.getUniformLocation(shaderProgram, 'u_variant'),
        vignette: gl.getUniformLocation(shaderProgram, 'u_vignette'),
      },
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = performance.now();
    const render = () => {
      const currentTime = (performance.now() - startTime) / 1000;

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(programInfo.program);

      gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
      gl.uniform1f(programInfo.uniformLocations.time, currentTime);
      gl.uniform1f(programInfo.uniformLocations.speed, speed);
      gl.uniform1f(programInfo.uniformLocations.zoom, zoom);
      gl.uniform1f(programInfo.uniformLocations.rotSpeed1, rotSpeed1);
      gl.uniform1f(programInfo.uniformLocations.rotSpeed2, rotSpeed2);
      gl.uniform1f(programInfo.uniformLocations.matrixScale, matrixScale);
      gl.uniform1f(programInfo.uniformLocations.colorShiftR, resolvedColor[0]);
      gl.uniform1f(programInfo.uniformLocations.colorShiftG, resolvedColor[1]);
      gl.uniform1f(programInfo.uniformLocations.colorShiftB, resolvedColor[2]);
      gl.uniform1f(programInfo.uniformLocations.distMix, distMix);
      gl.uniform1f(programInfo.uniformLocations.vignetteStart, vignetteStart);
      gl.uniform1f(programInfo.uniformLocations.vignetteEnd, vignetteEnd);
      gl.uniform1f(programInfo.uniformLocations.brightness, brightness);
      gl.uniform1i(programInfo.uniformLocations.variant, variantMap[variant] ?? 0);
      gl.uniform1i(programInfo.uniformLocations.vignette, vignette ? 1 : 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    variant, speed, zoom, rotSpeed1, rotSpeed2, matrixScale,
    resolvedColor,
    distMix, vignetteStart, vignetteEnd, brightness, vignette
  ]);

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
      }}
    />
  )
};

export default NeuralField
