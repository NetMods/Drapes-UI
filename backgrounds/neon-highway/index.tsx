'use client'
import { useEffect, useRef } from 'react';

interface NeonHighwayProps {
  speed?: number;
  backgroundColor?: string;
  translateX?: number;
  translateY?: number;
  zoom?: number;
  intensity?: number;
  roadWidth?: number;
  waveFrequency?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
  rotation?: number;
}

const hexToVec3 = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

const NeonHighway = ({
  speed = 1.0,
  backgroundColor = '#000000',
  translateX = 0,
  translateY = 0,
  zoom = 0.1,
  intensity = 0.4,
  roadWidth = 0.3,
  waveFrequency = 0.6,
  colorR = 0.0,
  colorG = 0.3,
  colorB = 0.6,
  rotation = 0,
}: NeonHighwayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    const vsSource = `#version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_bgColor;
      uniform vec2 u_translate;
      uniform float u_zoom;
      uniform float u_intensity;
      uniform float u_roadWidth;
      uniform float u_waveFreq;
      uniform vec3 u_color;
      uniform float u_rotation;
      out vec4 fragColor;

      void main() {
        vec2 r = u_resolution;
        float t = u_time;
        vec2 p = (gl_FragCoord.xy * 2.0 - r) / r.y / u_zoom;
        p += u_translate;
        float ca = cos(u_rotation);
        float sa = sin(u_rotation);
        p = mat2(ca, -sa, sa, ca) * p;
        vec4 neon = tanh(u_intensity / abs(min(p.y, p.y / u_roadWidth) / cos(p.x + cos(p.x * u_waveFreq - t) + vec4(u_color.r, u_color.g, u_color.b, 1.0)) / sin(p.x * 0.4 - t)));
        fragColor = vec4(mix(u_bgColor, neon.rgb, neon.a), 1.0);
      }
    `;

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

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
      3.0, -1.0,
      -1.0, 3.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const bgColorLocation = gl.getUniformLocation(program, 'u_bgColor');
    const translateLocation = gl.getUniformLocation(program, 'u_translate');
    const zoomLocation = gl.getUniformLocation(program, 'u_zoom');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const roadWidthLocation = gl.getUniformLocation(program, 'u_roadWidth');
    const waveFreqLocation = gl.getUniformLocation(program, 'u_waveFreq');
    const colorLocation = gl.getUniformLocation(program, 'u_color');
    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');

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

    const bg = hexToVec3(backgroundColor);

    const render = (time: number) => {
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time * 0.001 * speed);
      gl.uniform3f(bgColorLocation, bg[0], bg[1], bg[2]);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform1f(zoomLocation, zoom);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(roadWidthLocation, roadWidth);
      gl.uniform1f(waveFreqLocation, waveFrequency);
      gl.uniform3f(colorLocation, colorR, colorG, colorB);
      gl.uniform1f(rotationLocation, rotation);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [speed, backgroundColor, translateX, translateY, zoom, intensity, roadWidth, waveFrequency, colorR, colorG, colorB, rotation]);

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

export default NeonHighway;
