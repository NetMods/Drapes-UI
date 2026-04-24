'use client'
import { useEffect, useRef } from 'react';

interface NebulaProps {
  speed?: number;
  brightness?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  density?: number;
  turbulence?: number;
  intensity?: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
  renderScale?: number;
}

const Nebula = ({
  speed = 1.0,
  brightness = 1.0,
  translateX = 0.0,
  translateY = 0.0,
  scale = 1.0,
  density = 0.1,
  turbulence = 0.5,
  intensity = 0.2,
  colorR = 1.0,
  colorG = 1.0,
  colorB = 1.0,
  renderScale = 0.6,
}: NebulaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {}) || canvas.getContext('webgl', {});
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform float time;
      uniform vec2 resolution;
      uniform float brightness;
      uniform vec2 translate;
      uniform float scale;
      uniform float density;
      uniform float turbulence;
      uniform float intensity;
      uniform vec3 color;

      void main() {
        vec2 r = resolution;
        float t = time;
        vec3 p;
        vec4 o = vec4(0.0);

        float z = 0.0;
        float f = 0.0;

        for(int i = 0; i < 50; i++) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - r) / r.y * scale + translate;
          p = vec3(uv, 1.0) * z;

          float f_inner = 1.0;

          for(int j = 0; j < 4; j++) {
             f_inner += 1.0;
             vec3 p_swiz = p.zxy;
             vec3 rounded = floor(p_swiz / density - z + 0.5);
             p += sin(rounded * density * f_inner - t) / f_inner;
          }

          f = 0.1 * abs(dot(cos(p * turbulence), cos(p / (turbulence + 0.2))));

          z += f;

          o += vec4(color, 1.0) * intensity * f * brightness;
        }

        gl_FragColor = vec4(o.rgb, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
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

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const brightnessLocation = gl.getUniformLocation(program, 'brightness');
    const translateLocation = gl.getUniformLocation(program, 'translate');
    const scaleLocation = gl.getUniformLocation(program, 'scale');
    const densityLocation = gl.getUniformLocation(program, 'density');
    const turbulenceLocation = gl.getUniformLocation(program, 'turbulence');
    const intensityLocation = gl.getUniformLocation(program, 'intensity');
    const colorLocation = gl.getUniformLocation(program, 'color');

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const resScale = renderScale;
      canvas.width = Math.round(w * dpr * resScale);
      canvas.height = Math.round(h * dpr * resScale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = performance.now();

    const render = () => {
      const currentTime = ((performance.now() - startTime) / 1000) * speed;
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(brightnessLocation, brightness);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform1f(scaleLocation, scale);
      gl.uniform1f(densityLocation, density);
      gl.uniform1f(turbulenceLocation, turbulence);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform3f(colorLocation, colorR, colorG, colorB);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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
      gl.deleteBuffer(buffer);
    };
  }, [speed, brightness, translateX, translateY, scale, density, turbulence, intensity, colorR, colorG, colorB, renderScale]);

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

export default Nebula;
