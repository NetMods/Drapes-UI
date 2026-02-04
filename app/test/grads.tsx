//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const ShaderCanvas = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error('WebGL2 is not supported by your browser.');
      return;
    }

    // --- Shader Sources ---

    // Vertex Shader: Renders a simple full-screen quad (2 triangles)
    const vsSource = `#version 300 es
    in vec4 a_position;
    void main() {
      gl_Position = a_position;
    }`;

    // Fragment Shader: Your logic implementation
    const fsSource = `#version 300 es
    precision highp float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 fragColor;

    void main() {
      vec2 r = u_resolution;
      float t = u_time;
      vec4 FC = gl_FragCoord;

      // Your Logic:
      // Normalized coordinates centered on screen
      // Note: Changed r.x to r.xy in the subtraction to center the circle perfectly on screen.
      // If you prefer the original offset, change r.xy back to r.x
      vec2 p = (FC.xy * 2.0 - r.xy) / r.y;
      
      float l = 1.0 - length(p);
      
      // The Logic:
      // 1. Calculate the Sine wave pattern based on X position and time
      // 2. Divide by 200 (2e2)
      // 3. Divide by the distance field 'l' to create the glowing ring effect
      vec4 col = tanh((1.1 + sin(p.x * 10.0 + t + vec4(0, 2, 4, 0))) / 2e2 / max(l, -l * 0.1));

      fragColor = col;
      
      // Ensure alpha is 1.0 so it renders on web
      fragColor.a = 1.0; 
    }`;

    // --- WebGL Boilerplate ---

    // 1. Compile Shaders
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

    // 2. Create Program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    // 3. Setup Buffers (Full screen triangle strip)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, 1.0,
      1.0, 1.0,
      -1.0, -1.0,
      1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // 4. Get Uniform Locations
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    // 5. Setup Vertex Array Object (VAO)
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Render Loop ---

    const render = (time) => {
      // Resize canvas to match display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      // Update Uniforms
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, time * 0.001); // Convert ms to seconds

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100vh', display: 'block', background: '#000' }}
    />
  );
};

export default ShaderCanvas;
