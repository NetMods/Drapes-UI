'use client'
import React, { useRef, useEffect } from 'react';

const ShaderCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Initialize WebGL 2 Context (Required for tanh)
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    // 2. Define Shaders
    const vsSource = `#version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    // Your core logic adapted for strict GLSL 3.0
    const fsSource = `#version 300 es
      precision highp float;
      
      uniform vec2 r; // Resolution
      uniform float t; // Time (optional, for future animation)
      out vec4 fragColor;

      void main() {
        // Standardizing coordinate input
        vec2 FC = gl_FragCoord.xy;
        
        // --- YOUR LOGIC START ---
        // 'v' initialized to 0. 
        // Cast length(p)-.5 to vec2 to match type of v (strict GLSL requirement)
        vec2 p = (FC.xy * 2. - r) / r.y;
        vec2 v = vec2(0.); 
        
        v += vec2(length(p) - .5);

        // Calculate output
        // The term (.05 + max(...)) returns a vec2, we access .x
        vec4 o = tanh(
            .03 * vec4(2., 1., 1. + p) 
            / (.05 + max(v, -v / .1)).x 
            / (.1 + abs(p.x - p.y))
        );
        // --- YOUR LOGIC END ---

        fragColor = o;
      }
    `;

    // 3. Compile Helper
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

    // 4. Create Program
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

    // 5. Setup Geometry (Full screen triangle strip)
    // A generic screen-covering quad
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // 6. Uniform Locations
    const resolutionLocation = gl.getUniformLocation(program, 'r');
    const timeLocation = gl.getUniformLocation(program, 't');

    // 7. Resize Handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    // 8. Render Loop
    let animationFrameId;
    const render = (time) => {
      // Clear
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use Program
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      // Update Uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time * 0.001); // Time in seconds

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100vw', height: '100vh' }}
    />
  );
};

export default ShaderCanvas;
