'use client';
import { useEffect, useRef } from 'react';

interface LunarRingProps {
  frequency?: number;
  amplitude?: number;
  intensity?: number;
  rotation?: number;
  translateX?: number;
  translateY?: number;
  color?: string;
}

const LunarRing = ({
  frequency = 1.0,
  amplitude = 1.0,
  intensity = 1.0,
  rotation = 0,
  translateX = 0,
  translateY = 0,
  color = '#000000',
}: LunarRingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const hexToRgb = (hex: string): [number, number, number] => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return [r, g, b];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

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
      uniform vec3 u_bg;        
      uniform float u_freq;     
      uniform float u_amp;      
      uniform float u_int;      
      uniform float u_rot;      
      uniform vec2 u_trans;     

      out vec4 fragColor;

      // 2D Rotation Matrix
      mat2 rotate2d(float _angle){
          return mat2(cos(_angle),-sin(_angle),
                      sin(_angle),cos(_angle));
      }

      void main() {
        vec2 FC = gl_FragCoord.xy;
        // Normalize coordinates
        vec2 p = (FC.xy * 2. - r) / r.y;
        
        // Apply Translation
        p -= u_trans;

        // Apply Rotation
        p = rotate2d(u_rot) * p;

        // Apply Frequency (Scaling the coordinate space makes pattern denser)
        // We apply it selectively to the noise components usually, but scaling p 
        // works well for geometric distortions.
        // For this specific shader, scaling 'p' changes the ring size. 
        // To change 'frequency' of the noise without changing ring size, we might 
        // scale the input to the trig functions, but let's scale p for a zoom/freq effect.
        // Or better, let's inject freq into the detailed calculation below.

        vec2 v = vec2(0.);
        
        // The Ring Shape
        // length(p) - .5 defines the circle radius.
        v += vec2(length(p) - 0.5);

        // Calculate the pattern
        // We inject u_freq into the 'abs' term to create more "interference" lines
        // We inject u_amp into the multiplier for the tanh input
        vec4 o = tanh(
            (0.03 * u_amp) * vec4(2., 1., 1. + p)
            / (.05 + max(v, -v / .1)).x
            / (.1 + abs(p.x - p.y) * u_freq) 
        );

        // Apply Intensity to the calculated ring color
        vec3 ringColor = o.rgb * u_int;

        // Additive blending with Background Color
        // Using screen or additive blend math:
        fragColor = vec4(u_bg + ringColor, 1.0);
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

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform Locations
    const locs = {
      resolution: gl.getUniformLocation(program, 'r'),
      time: gl.getUniformLocation(program, 't'),
      bg: gl.getUniformLocation(program, 'u_bg'),
      freq: gl.getUniformLocation(program, 'u_freq'),
      amp: gl.getUniformLocation(program, 'u_amp'),
      intensity: gl.getUniformLocation(program, 'u_int'),
      rot: gl.getUniformLocation(program, 'u_rot'),
      trans: gl.getUniformLocation(program, 'u_trans'),
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
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(locs.resolution, canvas.width, canvas.height);
      gl.uniform1f(locs.time, time * 0.001);

      // Pass new props
      const rgb = hexToRgb(color);
      gl.uniform3f(locs.bg, rgb[0], rgb[1], rgb[2]);
      gl.uniform1f(locs.freq, frequency);
      gl.uniform1f(locs.amp, amplitude);
      gl.uniform1f(locs.intensity, intensity);
      gl.uniform1f(locs.rot, rotation);
      gl.uniform2f(locs.trans, translateX, translateY);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(positionBuffer);
    };
  }, [frequency, amplitude, intensity, rotation, translateX, translateY, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    />
  );
};

export default LunarRing;
