'use client'
import React, { useRef, useEffect } from 'react';

const Halo = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // We need WebGL2 for functions like tanh()
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // --- Shader Sources ---

    const vertexShaderSource = `#version 300 es
      in vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    // Your shader logic injected here
    const fragmentShaderSource = `#version 300 es
      precision highp float;

      uniform vec2 u_resolution;
      uniform float u_time;
      out vec4 fragColor;

      void main() {
        vec4 FC = gl_FragCoord;
        vec2 r = u_resolution;
        float t = u_time;

        // --- Core Logic Start ---
        vec2 p = (FC.xy * 2. - r) / r.y / 0.6;
        float l = length(p) - 1.;
        float a = atan(p.y, p.x);
        
        // Broken down for readability, but mathematically identical to your snippet
        vec4 o = tanh(
          (cos(p.x + 0.5 * t + vec4(1, 2, 3, 3)) + 1.5) * max(0.2 / l, -0.02 - 0.02 / l) / 
          (2. + cos(a * 8. + cos(a * 5. + t)) * sin(a * 4. - t))
        );
        // --- Core Logic End ---

        fragColor = o;
      }
    `;

    // --- Compilation Helpers ---

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
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
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    // --- Attributes & Uniforms ---

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Full screen quad (2 triangles)
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

    // --- Render Loop ---

    let animationFrameId;
    const startTime = performance.now();

    const render = () => {
      // Handle resize
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      // Update uniforms
      const currentTime = (performance.now() - startTime) / 1000;
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, currentTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  // Standard full-screen style, customizable via className
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block bg-black"
    />
  );
};

export default Halo;
