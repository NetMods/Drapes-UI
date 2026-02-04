//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const BitmapShader = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // --- Shader Source Code ---

    // Standard vertex shader (renders a full-screen quad)
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader: Wraps your core logic
    const fragmentShaderSource = `
      precision highp float;
      
      uniform float t;       // Time
      uniform vec2 r;        // Resolution
      
      void main() {
        vec4 o = vec4(0.0);  // Output color
        vec2 FC = gl_FragCoord.xy; // Map FC to Fragment Coordinates

        // --- YOUR SHADER LOGIC START ---
        vec2 p = FC.xy / r.y / 0.1;
        p.x += t;
        o += fract(sin(dot(ceil(p + sin(p * 5.0)), vec2(79.0, 17.0))) * 4e4);
        // --- YOUR SHADER LOGIC END ---

        gl_FragColor = o;
      }
    `;

    // --- WebGL Boilerplate Setup ---

    // Helper to create shaders
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

    // Helper to create program
    const createProgram = (gl, vsSource, fsSource) => {
      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return null;

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    // Look up locations
    const positionLocation = gl.getAttribLocation(program, 'position');
    const timeLocation = gl.getUniformLocation(program, 't');
    const resolutionLocation = gl.getUniformLocation(program, 'r');

    // Create a buffer for the full-screen rectangle (2 triangles)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,  // Bottom Left
        1, -1,  // Bottom Right
        -1, 1,  // Top Left
        -1, 1,  // Top Left
        1, -1,  // Bottom Right
        1, 1,  // Top Right
      ]),
      gl.STATIC_DRAW
    );

    // --- Render Loop ---
    let startTime = performance.now();

    const render = () => {
      // Handle resizing
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);

      // Enable attribute
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Set Uniforms
      // t: Time in seconds
      const currentTime = (performance.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, currentTime);

      // r: Resolution
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
    />
  );
};

export default BitmapShader;
