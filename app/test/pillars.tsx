//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const PillarsShader = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // --- Shader Sources ---

    const vertexShaderSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      
      #define PI 3.14159265359

      void main() {
        vec2 r = u_resolution;
        float t = u_time;
        vec2 FC = gl_FragCoord.xy;

        // Core "Pillars" Logic
        // p: coordinate space transformed for scrolling and scaling
        // w: domain repetition (modulus)
        vec2 p = (FC.xy * 2. - r) / r.y / 0.3 + t * vec2(2. / PI, 1.0);
        vec2 w = mod(p, 2.0) - 1.0;

        // Calculate color
        // We use max(0.0, ...) inside sqrt to prevent NaN artifacts from precision errors
        vec4 o = sin(
          p.y - 
          sqrt(max(0.0, 1.0 - w.x * w.x)) * cos(ceil(p.x * 0.5) * PI) + 
          vec4(0.0, 1.0, 2.0, 0.0)
        );

        // Output final color with solid alpha
        gl_FragColor = vec4(o.rgb, 1.0);
      }
    `;

    // --- Compilation Helpers ---

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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // --- Buffer Setup (Full Screen Quad) ---

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Two triangles covering the clip space (-1 to 1)
    const positions = [
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Uniforms ---

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');

    // --- Resize Handler ---

    const resize = () => {
      // Lookup the size the browser is displaying the canvas in CSS pixels.
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      // Check if the canvas is not the same size.
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    // --- Render Loop ---

    let animationFrameId;
    const startTime = performance.now();

    const render = () => {
      resize(); // Check for resize every frame

      const currentTime = performance.now();
      const timeInSeconds = (currentTime - startTime) * 0.001; // Convert ms to seconds

      // Pass uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, timeInSeconds);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup
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
      style={{
        width: '100%',
        height: '100vh',
        display: 'block',
        background: '#000'
      }}
    />
  );
};

export default PillarsShader;
