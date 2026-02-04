//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const PaintedShader = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // --- Shader Source Code ---

    // A simple vertex shader that passes coordinates through
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Your fragment shader logic
    // We map 'r' to resolution, 't' to time, 'FC' to gl_FragCoord, 'o' to gl_FragColor
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 r;
      uniform float t;

      void main() {
        vec2 FC = gl_FragCoord.xy;
        vec4 o = vec4(0.0); // Initialize output color

        // --- CORE LOGIC START ---
        vec2 p = (2. * FC.xy - r) / r.y;
        p = p / 0.1 / (3. - p.y) + t;
        o += sin(sin(dot(ceil(p + sin(p * 3.).yx), vec2(17, 79))) * 7e3 + vec4(0, 1, 2, 0)) + 0.5;
        // --- CORE LOGIC END ---

        gl_FragColor = o;
      }
    `;

    // --- WebGL Boilerplate ---

    // Helper to compile shaders
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

    // Compile shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Create a buffer for a full-screen quad (2 triangles)
    // Coordinates: [-1, -1] to [1, 1]
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

    // Bind 'position' attribute
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform Locations
    const resolutionLocation = gl.getUniformLocation(program, 'r');
    const timeLocation = gl.getUniformLocation(program, 't');

    // --- Render Loop ---
    let animationFrameId;
    const startTime = performance.now();

    const render = () => {
      // Handle resize
      // We set the canvas internal resolution to match its display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // Update uniforms
      const currentTime = (performance.now() - startTime) / 1000; // Time in seconds
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, currentTime);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
    />
  );
};

export default PaintedShader;
