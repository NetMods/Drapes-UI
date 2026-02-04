//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const SplitShader = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // We need WebGL 2 for 'tanh' and 'round'
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error("WebGL 2 not supported in this browser");
      return;
    }

    // --- Shader Sources ---

    // A simple vertex shader that renders a full-screen quad (2 triangles)
    const vsSource = `#version 300 es
    in vec4 a_position;
    void main() {
      gl_Position = a_position;
    }`;

    // Your fragment shader logic wrapped in GLSL 3.0 boilerplate
    const fsSource = `#version 300 es
    precision highp float;

    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 fragColor;

    void main() {
      // Map standard uniforms to the short variable names used in the snippet
      vec2 r = u_resolution;
      float t = u_time;
      vec4 FC = gl_FragCoord;
      vec4 o = vec4(0.0); // Output color

      // --- START USER SNIPPET ---
      vec2 p=(2.*FC.xy-r)/r.y,c=4.*p/(3.-p.y)+t;p=5.*p/(2.+fract(dot(cos(round(c)+r),sin(ceil(c+cos(c/.1)))))-p.y)+t;o=tanh(.2/abs(sin(p.x+p.y+vec4(1,.7,.6,0)*sin(p.y))));o*=o;
      // --- END USER SNIPPET ---

      // Fix alpha to 1.0 just in case
      o.a = 1.0;
      fragColor = o;
    }`;

    // --- WebGL Boilerplate Helpers ---

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

    const createProgram = (gl, vs, fs) => {
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

    // --- Initialization ---

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) return;

    // Look up uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    // Create a buffer for the full-screen quad (2 triangles covering -1 to 1)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a Vertex Array Object (VAO) to keep state organized
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Render Loop ---

    const render = (time) => {
      // Handle resizing
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      // Resize canvas buffer if it doesn't match display size
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // Convert time to seconds
      const t = time * 0.001;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      // Upload uniforms
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, t);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    // Start loop
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

export default SplitShader;
