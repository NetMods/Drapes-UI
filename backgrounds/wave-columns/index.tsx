'use client'
import { useEffect, useRef, useMemo } from 'react';

export type WaveColumnsTheme = 'default' | 'ocean' | 'sunset' | 'neon' | 'monochrome' | 'aurora' | 'fire' | 'synthwave' | 'ice' | 'forest';

const THEMES: Record<WaveColumnsTheme, [number, number, number]> = {
  default: [0.0, 1.0, 2.0],
  ocean: [3.5, 4.0, 5.0],
  sunset: [0.0, 0.7, 1.8],
  neon: [0.5, 2.5, 4.5],
  monochrome: [0.0, 0.0, 0.0],
  aurora: [2.0, 3.5, 5.0],
  fire: [0.0, 0.4, 1.2],
  synthwave: [5.5, 3.8, 5.0],
  ice: [3.0, 4.2, 5.5],
  forest: [2.5, 1.5, 3.8],
};

interface WaveColumnsProps {
  speed?: number;
  theme?: WaveColumnsTheme;
  rotation?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  amplitude?: number;
  waveCount?: number;
}

const WaveColumns = ({
  speed = 1.0,
  theme = 'default',
  rotation = 0,
  translateX = 0,
  translateY = 0,
  scale = 0.3,
  amplitude = 1.0,
  waveCount = 1.0,
}: WaveColumnsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const colorOffsets = useMemo(() => {
    return THEMES[theme] ?? THEMES.default;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_colorOffsets;
      uniform float u_rotation;
      uniform vec2 u_translate;
      uniform float u_scale;
      uniform float u_frequency;
      uniform float u_amplitude;
      uniform float u_waveCount;

      #define PI 3.14159265359

      void main() {
        vec2 r = u_resolution;
        float t = u_time;
        vec2 FC = gl_FragCoord.xy;

        // Apply translation (in normalized screen space)
        vec2 uv = (FC.xy * 2.0 - r) / r.y;
        uv -= u_translate;

        // Apply rotation
        float cosR = cos(u_rotation);
        float sinR = sin(u_rotation);
        uv = mat2(cosR, -sinR, sinR, cosR) * uv;

        // Apply scale and time scroll
        vec2 p = uv / u_scale + t * vec2(2.0 / PI, 1.0);
        vec2 w = mod(p, 2.0) - 1.0;

        vec4 o = sin(
          p.y * u_waveCount -
          sqrt(max(0.0, 1.0 - w.x * w.x)) * u_amplitude * cos(ceil(p.x * u_frequency) * PI) +
          vec4(u_colorOffsets, 0.0)
        );

        gl_FragColor = vec4(o.rgb, 1.0);
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

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

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const colorOffsetsLocation = gl.getUniformLocation(program, 'u_colorOffsets');
    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
    const translateLocation = gl.getUniformLocation(program, 'u_translate');
    const scaleLocation = gl.getUniformLocation(program, 'u_scale');
    const frequencyLocation = gl.getUniformLocation(program, 'u_frequency');
    const amplitudeLocation = gl.getUniformLocation(program, 'u_amplitude');
    const waveCountLocation = gl.getUniformLocation(program, 'u_waveCount');

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
      const timeInSeconds = ((performance.now() - startTime) * 0.001) * speed;

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, timeInSeconds);
      gl.uniform3fv(colorOffsetsLocation, colorOffsets);
      gl.uniform1f(rotationLocation, rotation * PI_RAD);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform1f(scaleLocation, scale);
      gl.uniform1f(frequencyLocation, 0.5);
      gl.uniform1f(amplitudeLocation, amplitude);
      gl.uniform1f(waveCountLocation, waveCount);

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
    };
  }, [speed, colorOffsets, rotation, translateX, translateY, scale, amplitude, waveCount]);

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

const PI_RAD = Math.PI / 180;

export default WaveColumns;
