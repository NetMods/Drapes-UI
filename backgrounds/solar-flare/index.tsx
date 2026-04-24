'use client'
import { useEffect, useRef } from 'react';

interface SolarFlareProps {
  speed?: number;
  translateX?: number;
  translateY?: number;
  intensity?: number;
  spread?: number;
  pulseRate?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
}

const SolarFlare = ({
  speed = 1.0,
  translateX = 1.0,
  translateY = 1.0,
  intensity = 2.0,
  spread = 10.0,
  pulseRate = 0.6,
  colorR = 1.0,
  colorG = 0.4,
  colorB = 0.2,
}: SolarFlareProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {});
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    const vsSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;

      uniform vec2 r;
      uniform float t;
      uniform vec2 u_translate;
      uniform float u_intensity;
      uniform float u_spread;
      uniform float u_pulseRate;
      uniform vec3 u_color;
      out vec4 o;

      void main() {
        vec4 FC = gl_FragCoord;

        vec2 p = (FC.xy * 2. - r) / r.y;
        float l = u_intensity - length(p - u_translate);

        o = tanh(vec4(u_color, 0.0) / max(l, -l * u_spread) / exp(mod(dot(FC, sin(FC.yxyx)) + t, 2.) + sin(t + sin(t / u_pulseRate + p.y))));

        o.a = 1.0;
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

    const program = gl.createProgram();
    if (!program) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

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

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const rLocation = gl.getUniformLocation(program, 'r');
    const tLocation = gl.getUniformLocation(program, 't');
    const translateLocation = gl.getUniformLocation(program, 'u_translate');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const spreadLocation = gl.getUniformLocation(program, 'u_spread');
    const pulseRateLocation = gl.getUniformLocation(program, 'u_pulseRate');
    const colorLocation = gl.getUniformLocation(program, 'u_color');

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
      gl.useProgram(program);

      gl.uniform2f(rLocation, canvas.width, canvas.height);

      const currentTime = ((performance.now() - startTime) / 1000) * speed;
      gl.uniform1f(tLocation, currentTime);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(spreadLocation, spread);
      gl.uniform1f(pulseRateLocation, pulseRate);
      gl.uniform3f(colorLocation, colorR, colorG, colorB);

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
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, [speed, translateX, translateY, intensity, spread, pulseRate, colorR, colorG, colorB]);

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

export default SolarFlare;
