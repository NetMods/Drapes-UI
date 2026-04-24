'use client'
import { useEffect, useRef } from 'react';

interface VortexTwistProps {
  speed?: number;
  backgroundColor?: string;
  direction?: 'clockwise' | 'counter-clockwise' | 'none';
  rotation?: number;
  translateX?: number;
  translateY?: number;
  twist?: number;
  zoom?: number;
  intensity?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
  frequency?: number;
}

const hexToVec3 = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

const VortexTwist = ({
  speed = 1.0,
  backgroundColor = '#000000',
  direction = 'clockwise',
  rotation = 0,
  translateX = 0,
  translateY = 0,
  twist = 9,
  zoom = 5,
  intensity = 0.1,
  colorR = 0.0,
  colorG = 0.1,
  colorB = 0.2,
  frequency = 0.61,
}: VortexTwistProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {});
    if (!gl) return;

    const vsSource = `#version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      uniform vec2 r;
      uniform float t;
      uniform vec3 bgColor;
      uniform float uDirection;
      uniform vec2 uTranslate;
      uniform float uTwist;
      uniform float uZoom;
      uniform float uIntensity;
      uniform vec3 uColor;
      uniform float uFrequency;
      uniform float uRotation;
      out vec4 o;
      #define FC gl_FragCoord
      void main() {
        float tt = t * uDirection;
        vec2 p = (FC.xy * 2. - r) / r.y;
        p += uTranslate;
        float ca = cos(uRotation);
        float sa = sin(uRotation);
        p = mat2(ca, -sa, sa, ca) * p;
        float tw = uTwist;
        p = p * mat2(tw, -tw + 1., -tw + 1., tw) * uZoom / (4. + dot(p, p)) + fract(dot(FC, sin(FC.yxyx + tt))) + tt / .1;
        vec4 vortex = tanh(uIntensity * exp(sin(tt + p.x + p.y)) / (sin(dot(cos(p + p.x / 7.), sin(p.yx * uFrequency)) + (cos(p.x * .1) + 1.) * vec4(uColor.r, uColor.g, uColor.b, 0)) + 1.));
        o = vec4(mix(bgColor, vortex.rgb, vortex.a), 1.0);
      }
    `;

    const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'r');
    const timeUniformLocation = gl.getUniformLocation(program, 't');
    const bgColorLocation = gl.getUniformLocation(program, 'bgColor');
    const directionLocation = gl.getUniformLocation(program, 'uDirection');
    const translateLocation = gl.getUniformLocation(program, 'uTranslate');
    const twistLocation = gl.getUniformLocation(program, 'uTwist');
    const zoomLocation = gl.getUniformLocation(program, 'uZoom');
    const intensityLocation = gl.getUniformLocation(program, 'uIntensity');
    const colorLocation = gl.getUniformLocation(program, 'uColor');
    const frequencyLocation = gl.getUniformLocation(program, 'uFrequency');
    const rotationLocation = gl.getUniformLocation(program, 'uRotation');

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
      const dir = direction === 'clockwise' ? 1 : direction === 'counter-clockwise' ? -1 : 0;
      gl.uniform1f(directionLocation, dir);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform1f(twistLocation, twist);
      gl.uniform1f(zoomLocation, zoom);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform3f(colorLocation, colorR, colorG, colorB);
      gl.uniform1f(frequencyLocation, frequency);
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
  }, [speed, backgroundColor, direction, rotation, translateX, translateY, twist, zoom, intensity, colorR, colorG, colorB, frequency]);

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

export default VortexTwist;
