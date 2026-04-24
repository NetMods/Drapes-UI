'use client'
import { useEffect, useRef } from 'react';

interface MosaicFlowProps {
  speed?: number;
  scale?: number;
  tileSize?: number;
  perspective?: number;
  colorIntensity?: number;
  noiseFrequency?: number;
  rotation?: number;
  translateX?: number;
  translateY?: number;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const MosaicFlow = ({
  speed = 1.0,
  scale = 0.1,
  tileSize = 3.0,
  perspective = 3.0,
  colorIntensity = 1.0,
  noiseFrequency = 7000.0,
  rotation = 0,
  translateX = 0,
  translateY = 0,
  backgroundColor = '#000000',
  primaryColor = '#8c00ff',
  secondaryColor = '#00eaff',
}: MosaicFlowProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {});
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 r;
      uniform float t;
      uniform float u_scale;
      uniform float u_tileSize;
      uniform float u_perspective;
      uniform float u_colorIntensity;
      uniform float u_noiseFrequency;
      uniform float u_rotation;
      uniform vec2 u_translate;
      uniform vec3 u_bgColor;
      uniform vec3 u_color1; 
      uniform vec3 u_color2;

      vec2 rotate2D(vec2 p, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
      }

      void main() {
        vec2 FC = gl_FragCoord.xy;

        vec2 p = (2.0 * FC.xy - r) / r.y;

        p += u_translate;

        p = rotate2D(p, u_rotation);

        p = p / u_scale / (u_perspective - p.y) + t;

        vec2 tiled = ceil(p + sin(p * u_tileSize).yx);
        
        float noise = sin(dot(tiled, vec2(17.0, 79.0))) * u_noiseFrequency;
        
        float mixFactor = 0.5 + 0.5 * sin(noise);

        vec3 color = mix(u_color1, u_color2, mixFactor);
        
        color = color * u_colorIntensity;

        float fade = smoothstep(0.0, 1.0, length(color)); 
        vec3 finalColor = mix(u_bgColor, color, fade);

        gl_FragColor = vec4(finalColor, 1.0);
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

    const vertices = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const resolutionLocation = gl.getUniformLocation(program, 'r');
    const timeLocation = gl.getUniformLocation(program, 't');
    const scaleLocation = gl.getUniformLocation(program, 'u_scale');
    const tileSizeLocation = gl.getUniformLocation(program, 'u_tileSize');
    const perspectiveLocation = gl.getUniformLocation(program, 'u_perspective');
    const colorIntensityLocation = gl.getUniformLocation(program, 'u_colorIntensity');
    const noiseFrequencyLocation = gl.getUniformLocation(program, 'u_noiseFrequency');
    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
    const translateLocation = gl.getUniformLocation(program, 'u_translate');
    const bgColorLocation = gl.getUniformLocation(program, 'u_bgColor');
    const color1Location = gl.getUniformLocation(program, 'u_color1');
    const color2Location = gl.getUniformLocation(program, 'u_color2');

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

    const startTime = performance.now();

    const render = () => {
      const currentTime = ((performance.now() - startTime) / 1000) * speed;
      const bgColor = hexToRgb(backgroundColor);
      const c1 = hexToRgb(primaryColor);
      const c2 = hexToRgb(secondaryColor);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform1f(scaleLocation, scale);
      gl.uniform1f(tileSizeLocation, tileSize);
      gl.uniform1f(perspectiveLocation, perspective);
      gl.uniform1f(colorIntensityLocation, colorIntensity);
      gl.uniform1f(noiseFrequencyLocation, noiseFrequency);
      gl.uniform1f(rotationLocation, rotation);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform3f(bgColorLocation, bgColor.r, bgColor.g, bgColor.b);
      gl.uniform3f(color1Location, c1.r, c1.g, c1.b);
      gl.uniform3f(color2Location, c2.r, c2.g, c2.b);

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
      gl.deleteBuffer(buffer);
    };
  }, [
    speed, scale, tileSize, perspective, colorIntensity, noiseFrequency,
    rotation, translateX, translateY, backgroundColor,
    primaryColor, secondaryColor // Added to dependency array
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
  );
};

export default MosaicFlow;
