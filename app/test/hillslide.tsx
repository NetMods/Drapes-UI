//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const HillsideShader = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize WebGL 2 context (needed for tanh support)
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    // --- Shader Sources ---

    // A simple full-screen triangle strip vertex shader
    const vsSource = `#version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    // The Fragment shader containing your "Hillside" logic
    // We map the golf variables: r -> u_resolution, t -> u_time, FC -> gl_FragCoord
    const fsSource = `#version 300 es
      precision highp float;
      
      uniform vec2 r;
      uniform float t;
      out vec4 o;

      #define FC gl_FragCoord

      void main() {
        vec2 p = (FC.xy * 2. - r) / r.y;
        
        // The core logic
        o = tanh(.2 / abs(p.y + .3 * cos(t + .1 * fract(dot(FC, sin(FC.yxyx))) + p.x * vec4(.7, 1, 1.3, 0) + vec4(0, 1, 2, 0))));
        
        // Ensure alpha is 1.0 just in case logic results in transparency
        o.a = 1.0; 
      }
    `;

    // --- WebGL Boilerplate Setup ---

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
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
      console.error('Program link failed:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Set up a full-screen quad (2 triangles)
    // We use a large triangle that covers the screen to avoid diagonal issues
    const vertices = new Float32Array([
      -1, -1,
      3, -1,
      -1, 3,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform Locations
    const resolutionLocation = gl.getUniformLocation(program, 'r');
    const timeLocation = gl.getUniformLocation(program, 't');

    // --- Render Loop ---
    let startTime = performance.now();

    const render = () => {
      // Handle resize dynamically
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Only adjust buffer size if display size changes
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      // Update Uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      const currentTime = (performance.now() - startTime) / 1000; // Time in seconds
      gl.uniform1f(timeLocation, currentTime);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100vh', // Full viewport height
        backgroundColor: '#000',
      }}
    />
  );
};

export default HillsideShader;
