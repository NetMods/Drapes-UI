'use client'
import { useEffect, useRef } from 'react';

interface CyberGridProps {
  speed?: number;
  translateX?: number;
  translateY?: number;
  perspective?: number;
  depth?: number;
  gridDensity?: number;
  lineGlow?: number;
  distortion?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
}

const CyberGrid = ({
  speed = 1.0,
  translateX = 0.0,
  translateY = 0.0,
  perspective = 4.0,
  depth = 3.0,
  gridDensity = 5.0,
  lineGlow = 0.2,
  distortion = 0.1,
  colorR = 1.0,
  colorG = 0.7,
  colorB = 0.6,
}: CyberGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error("WebGL 2 not supported in this browser");
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
    uniform vec2 u_translate;
    uniform float u_perspective;
    uniform float u_depth;
    uniform float u_gridDensity;
    uniform float u_lineGlow;
    uniform float u_distortion;
    uniform vec3 u_color;
    out vec4 fragColor;

    void main() {
      vec2 r = u_resolution;
      float t = u_time;
      vec4 FC = gl_FragCoord;
      vec4 o = vec4(0.0);

      vec2 uv = (2.0 * FC.xy - r) / r.y - u_translate;
      vec2 c = u_perspective * uv / (u_depth - uv.y) + t;
      vec2 p = u_gridDensity * uv / (2.0 + fract(dot(cos(round(c) + r), sin(ceil(c + cos(c / u_distortion))))) - uv.y) + t;
      o = tanh(u_lineGlow / abs(sin(p.x + p.y + vec4(u_color, 0.0) * sin(p.y))));
      o *= o;

      o.a = 1.0;
      fragColor = o;
    }`;

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

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const translateLocation = gl.getUniformLocation(program, "u_translate");
    const perspectiveLocation = gl.getUniformLocation(program, "u_perspective");
    const depthLocation = gl.getUniformLocation(program, "u_depth");
    const gridDensityLocation = gl.getUniformLocation(program, "u_gridDensity");
    const lineGlowLocation = gl.getUniformLocation(program, "u_lineGlow");
    const distortionLocation = gl.getUniformLocation(program, "u_distortion");
    const colorLocation = gl.getUniformLocation(program, "u_color");

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

    const render = (time: number) => {
      const t = time * 0.001 * speed;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, t);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform1f(perspectiveLocation, perspective);
      gl.uniform1f(depthLocation, depth);
      gl.uniform1f(gridDensityLocation, gridDensity);
      gl.uniform1f(lineGlowLocation, lineGlow);
      gl.uniform1f(distortionLocation, distortion);
      gl.uniform3f(colorLocation, colorR, colorG, colorB);

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
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(positionBuffer);
    };
  }, [speed, translateX, translateY, perspective, depth, gridDensity, lineGlow, distortion, colorR, colorG, colorB]);

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

export default CyberGrid;
