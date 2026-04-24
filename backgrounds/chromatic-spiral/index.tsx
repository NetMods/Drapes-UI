'use client'
import { useEffect, useRef } from 'react';

interface ChromaticSpiralProps {
  speed?: number;
  scale?: number;
  spiralDensity?: number;
  colorIntensity?: number;
  rotation?: number;
  translateX?: number;
  translateY?: number;
  backgroundColor?: string;
}

const ChromaticSpiral = ({
  speed = 1.0,
  scale = 0.2,
  spiralDensity = 0.2,
  colorIntensity = 1.0,
  rotation = 0,
  translateX = 0,
  translateY = 0,
  backgroundColor = '#000000',
}: ChromaticSpiralProps) => {
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

    const vsSource = `
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 r;
      uniform float t;
      uniform float u_scale;
      uniform float u_spiralDensity;
      uniform float u_colorIntensity;
      uniform float u_spiralTwist;
      uniform float u_rotation;
      uniform vec2 u_translate;
      uniform vec3 u_bgColor;

      vec2 rotate2D(vec2 p, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
      }

      void main() {
        vec2 FC = gl_FragCoord.xy;

        // Normalize and apply scale
        vec2 p = (FC.xy * 2.0 - r) / r.y / u_scale;

        // Apply translation
        p += u_translate;

        // Apply rotation
        p = rotate2D(p, u_rotation);

        // Calculate spiral pattern
        vec2 c = fract(p) - 0.5 - p * u_spiralDensity;

        // Calculate angle for color
        float angle = atan(c.y, c.x) + t;

        // Generate RGB colors (without alpha in the color offset)
        vec3 color = cos(angle + vec3(0.0, 1.0, 2.0)) * u_colorIntensity;

        // Apply spiral twist effect
        color *= (0.5 + 0.5 * cos(length(c) * u_spiralTwist * 10.0));

        // Normalize colors to 0-1 range
        color = color * 0.5 + 0.5;

        // Mix with background
        vec3 finalColor = mix(u_bgColor, color, length(color) / 1.732);

        // Output with solid alpha
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

    const positionLocation = gl.getAttribLocation(program, 'position');
    const resolutionLocation = gl.getUniformLocation(program, 'r');
    const timeLocation = gl.getUniformLocation(program, 't');
    const scaleLocation = gl.getUniformLocation(program, 'u_scale');
    const spiralDensityLocation = gl.getUniformLocation(program, 'u_spiralDensity');
    const colorIntensityLocation = gl.getUniformLocation(program, 'u_colorIntensity');
    const spiralTwistLocation = gl.getUniformLocation(program, 'u_spiralTwist');
    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
    const translateLocation = gl.getUniformLocation(program, 'u_translate');
    const bgColorLocation = gl.getUniformLocation(program, 'u_bgColor');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );

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

    const startTime = Date.now();

    const render = () => {
      const bgColor = hexToRgb(backgroundColor);

      gl.useProgram(program);

      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, ((Date.now() - startTime) * 0.001) * speed);
      gl.uniform1f(scaleLocation, scale);
      gl.uniform1f(spiralDensityLocation, spiralDensity);
      gl.uniform1f(colorIntensityLocation, colorIntensity);
      gl.uniform1f(spiralTwistLocation, 0);
      gl.uniform1f(rotationLocation, rotation);
      gl.uniform2f(translateLocation, translateX, translateY);
      gl.uniform3f(bgColorLocation, bgColor.r, bgColor.g, bgColor.b);

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
      gl.deleteBuffer(positionBuffer);
    };
  }, [speed, scale, spiralDensity, colorIntensity, rotation, translateX, translateY, backgroundColor]);

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

export default ChromaticSpiral;
