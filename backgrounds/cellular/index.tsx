'use client'
import { useEffect, useRef } from 'react';

interface CellularProps {
  speed?: number;
  scale?: number;
  cellSize?: number;
  intensity?: number;
  distortion?: number;
  rotation?: number;
  translateX?: number;
  translateY?: number;
  colorShift?: number;
  backgroundColor?: string;
}

const Cellular = ({
  speed = 1.0,
  scale = 3.0,
  cellSize = 4.0,
  intensity = 0.2,
  distortion = 0.6,
  rotation = 0,
  translateX = 0,
  translateY = 0,
  colorShift = 0.1,
  backgroundColor = '#000000',
}: CellularProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {});
    if (!gl) {
      console.error('WebGL 2 is not supported by your browser.');
      return;
    }

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_scale;
      uniform float u_cellSize;
      uniform float u_intensity;
      uniform float u_distortion;
      uniform float u_rotation;
      uniform vec2 u_translate;
      uniform float u_colorShift;
      uniform vec3 u_bgColor;
      out vec4 outColor;

      vec2 rotate2D(vec2 p, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
      }

      void main() {
        vec4 FC = gl_FragCoord;
        vec2 r = u_resolution;
        float t = u_time;

        // Apply scale and center
        vec2 p = u_scale * (FC.xy * 2.0 - r) / r.y;

        // Apply translation
        p += u_translate;

        // Apply rotation
        p = rotate2D(p, u_rotation);

        // Core cellular logic with controllable parameters
        vec2 v = p / dot(p, p) * (u_cellSize + fract(dot(FC, cos(t + FC.yxyx))));
        v.x += t;

        // Apply distortion control
        vec2 distorted = v + cos(u_distortion * v).yx;

        // Calculate color with intensity and color shift
        vec4 o = tanh(u_intensity / cos(vec4(0.0, u_colorShift, 0.0, 0.0) + 4.0 * length(cos(distorted))));
        o *= o;

        // Mix with background color
        vec3 finalColor = mix(u_bgColor, o.rgb, length(o.rgb));

        outColor = vec4(finalColor, 1.0);
      }
    `;

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

    const vertices = new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      1.0, 1.0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get all uniform locations
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const scaleLocation = gl.getUniformLocation(program, 'u_scale');
    const cellSizeLocation = gl.getUniformLocation(program, 'u_cellSize');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const distortionLocation = gl.getUniformLocation(program, 'u_distortion');
    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
    const translateLocation = gl.getUniformLocation(program, 'u_translate');
    const colorShiftLocation = gl.getUniformLocation(program, 'u_colorShift');
    const bgColorLocation = gl.getUniformLocation(program, 'u_bgColor');

    // Parse background color
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0, g: 0, b: 0 };
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

    const render = (time: number) => {
      const t = time * 0.001 * speed;
      const bgColor = hexToRgb(backgroundColor);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, t);
      gl.uniform1f(scaleLocation, scale);
      gl.uniform1f(cellSizeLocation, cellSize);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(distortionLocation, distortion);
      gl.uniform1f(rotationLocation, rotation);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform1f(colorShiftLocation, colorShift);
      gl.uniform3f(bgColorLocation, bgColor.r, bgColor.g, bgColor.b);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

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
  }, [speed, scale, cellSize, intensity, distortion, rotation, translateX, translateY, colorShift, backgroundColor]);

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

export default Cellular;
