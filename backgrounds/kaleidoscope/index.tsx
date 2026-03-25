'use client'
import { useEffect, useRef } from 'react';

interface KaleidoscopeProps {
  speed?: number;
  backgroundColor?: string;
  zoom?: number;
  complexity?: number;
  intensity?: number;
  frequencyX?: number;
  frequencyY?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
  softness?: number;
  rotation?: number;
}

const hexToVec3 = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

const Kaleidoscope = ({
  speed = 1.0,
  backgroundColor = '#000000',
  zoom = 3,
  complexity = 5,
  intensity = 0.8,
  frequencyX = 0.6,
  frequencyY = 0.3,
  colorR = 0,
  colorG = 1,
  colorB = 2,
  softness = 0.9,
  rotation = 0,
}: KaleidoscopeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    if (!gl) return;

    const vsSource = `#version 300 es
      in vec4 a_position;
      void main() {
        gl_Position = a_position;
      }`;

    const fsSource = `#version 300 es
      precision highp float;
      uniform vec2 r;
      uniform float t;
      uniform vec3 u_bgColor;
      uniform float u_zoom;
      uniform float u_complexity;
      uniform float u_intensity;
      uniform float u_freqX;
      uniform float u_freqY;
      uniform vec3 u_color;
      uniform float u_softness;
      uniform float u_rotation;
      out vec4 o;
      void main() {
        vec4 FC = gl_FragCoord;
        vec2 p = u_zoom * (FC.xy * 2. - r) / r.y;
        float ca = cos(u_rotation);
        float sa = sin(u_rotation);
        p = mat2(ca, -sa, sa, ca) * p;
        vec2 v = p + p + (t + r) * cos(r + ceil(p + sin(p * u_complexity))).yx;
        vec4 kaleid = tanh(u_intensity * (cos(u_freqX * p.x + u_freqY * sin(v.y) + vec4(u_color.r, u_color.g, u_color.b, 3)) + 1.) / length(u_softness + sin(v)));
        o = vec4(mix(u_bgColor, kaleid.rgb, kaleid.a), 1.0);
      }`;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'r');
    const timeUniformLocation = gl.getUniformLocation(program, 't');
    const bgColorLocation = gl.getUniformLocation(program, 'u_bgColor');
    const zoomLocation = gl.getUniformLocation(program, 'u_zoom');
    const complexityLocation = gl.getUniformLocation(program, 'u_complexity');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const freqXLocation = gl.getUniformLocation(program, 'u_freqX');
    const freqYLocation = gl.getUniformLocation(program, 'u_freqY');
    const colorLocation = gl.getUniformLocation(program, 'u_color');
    const softnessLocation = gl.getUniformLocation(program, 'u_softness');
    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

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
    const bg = hexToVec3(backgroundColor);

    const render = () => {
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, ((performance.now() - startTime) / 1000) * speed);
      gl.uniform3f(bgColorLocation, bg[0], bg[1], bg[2]);
      gl.uniform1f(zoomLocation, zoom);
      gl.uniform1f(complexityLocation, complexity);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(freqXLocation, frequencyX);
      gl.uniform1f(freqYLocation, frequencyY);
      gl.uniform3f(colorLocation, colorR, colorG, colorB);
      gl.uniform1f(softnessLocation, softness);
      gl.uniform1f(rotationLocation, rotation);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteVertexArray(vao);
    };
  }, [speed, backgroundColor, zoom, complexity, intensity, frequencyX, frequencyY, colorR, colorG, colorB, softness, rotation]);

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
  );
};

export default Kaleidoscope;
