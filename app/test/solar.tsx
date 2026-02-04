//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const SolarShader = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use WebGL 2 for 'tanh' support
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    // --- Shader Sources ---

    const vsSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Mapped variables:
    // FC -> gl_FragCoord
    // r  -> u_resolution
    // t  -> u_time
    // o  -> fragColor
    const fsSource = `#version 300 es
      precision highp float;
      
      uniform vec2 r;
      uniform float t;
      out vec4 o;
      
      void main() {
        vec4 FC = gl_FragCoord;
        
        // Original logic
        vec2 p = (FC.xy * 2. - r) / r.y;
        float l = 2. - length(p - 1.);
        
        o = tanh(vec4(1, .4, .2, 0) / max(l, -l * 1e1) / exp(mod(dot(FC, sin(FC.yxyx)) + t, 2.) + sin(t + sin(t / .6 + p.y))));
        
        // Force alpha to 1.0 to ensure visibility on standard canvas
        o.a = 1.0;
      }
    `;

    // --- Boilerplate Compilation ---

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

    const program = gl.createProgram();
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    // --- Buffers (Full Screen Quad) ---

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Uniforms ---

    const rLocation = gl.getUniformLocation(program, 'r');
    const tLocation = gl.getUniformLocation(program, 't');

    // --- Render Loop ---

    let animationFrameId;
    const startTime = performance.now();

    const render = () => {
      // Update canvas size to match display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);

      // Pass Resolution (r)
      gl.uniform2f(rLocation, canvas.width, canvas.height);

      // Pass Time (t)
      const currentTime = (performance.now() - startTime) / 1000;
      gl.uniform1f(tLocation, currentTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', background: '#000', display: 'block' }}
    />
  );
};

export default SolarShader;
