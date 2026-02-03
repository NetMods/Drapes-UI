'use client'
import React, { useRef, useEffect } from 'react';

const ShaderCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const RENDER_SCALE = 0.6;

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // FIX 1: Switched to highp float for better precision on mobile/desktop
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 r = u_resolution;
        float t = u_time;
        vec2 FC = gl_FragCoord.xy;
        vec4 o = vec4(0.0);

        float T = 754.0 / 60.0;
        
        for (float i = 0.0; i < 35.0; i++) {
            float s = 3.0 + i * 5.0; 
            float v = floor((2.0 + sin(i)) * 1.0 / (i + 1.0) * s * T) / T;
            
            vec2 p = (FC.xy / r.x) * s + vec2(sin(t + i), t * v);
            
            // FIX 2: Modulo the grid index to prevent large numbers.
            // This keeps the input to sin() small, preventing the "Matrix" artifact.
            vec2 grid = mod(floor(p), 100.0);

            // FIX 3: Replaced the quadratic dot product with a linear stable hash
            // This prevents overflow when time gets large.
            float h = fract(sin(dot(grid, vec2(12.9898, 78.233) + i)) * 43758.5453);
            
            if (h < 0.03) {
                o += smoothstep(0.2, 0.0, length(fract(p) - 0.5 + (h - 0.5) * 0.7));
            }
        }

        o += vec4(0.0, 0.25, 0.5, 1.0) * (1.0 - FC.y / r.y);
        gl_FragColor = vec4(o.rgb, 1.0); 
      }
    `;

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
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

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

    let animationFrameId;
    const startTime = performance.now();

    const render = () => {
      const displayWidth = Math.floor(canvas.clientWidth * RENDER_SCALE);
      const displayHeight = Math.floor(canvas.clientHeight * RENDER_SCALE);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }

      const currentTime = (performance.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100vw', height: '100vh', display: 'block' }}
    />
  );
};

export default ShaderCanvas;
