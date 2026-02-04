//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const MicrobeShader = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // We need WebGL2 for functions like tanh used in the shader logic
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      console.error('WebGL 2 is not supported by your browser.');
      return;
    }

    // --- Shader Sources ---

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      uniform vec2 u_resolution;
      uniform float u_time;
      out vec4 outColor;

      void main() {
        // Mapping the original golfed variables to standard GLSL
        // r = u_resolution
        // t = u_time
        // FC = gl_FragCoord
        
        vec4 FC = gl_FragCoord;
        vec2 r = u_resolution;
        float t = u_time;
        
        // Original logic: vec2 p=3.*(FC.xy*2.-r)/r.y
        vec2 p = 3.0 * (FC.xy * 2.0 - r) / r.y;
        
        // Original logic: v=p/dot(p,p)*(4.+fract(dot(FC,cos(t+FC.yxyx))))
        // Note: FC is a vec4 (x,y,z,w). in 2D shaders z is depth, w is 1/clip_w.
        // We use the full vec4 for the dot product to match the "golf" style randomness.
        vec2 v = p / dot(p, p) * (4.0 + fract(dot(FC, cos(t + FC.yxyx))));
        
        // Original logic: v.x+=t
        v.x += t;
        
        // Original logic: o=tanh(.2/cos(vec4(0,.1,0,0)+4.*length(cos(v+cos(.6*v).yx))))
        // Calculating the color vector
        vec4 o = tanh(0.2 / cos(vec4(0.0, 0.1, 0.0, 0.0) + 4.0 * length(cos(v + cos(0.6 * v).yx))));
        
        // Original logic: o*=o
        o *= o;
        
        // Output final color (swapping rgba to match standard output if needed, 
        // but o is likely vec4(r,g,b,a) here)
        outColor = vec4(o.rgb, 1.0);
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

    // Two triangles covering the clip space: (-1,-1) to (1,1)
    const vertices = new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      1.0, 1.0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Uniform Locations ---

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');

    // --- Render Loop ---

    let animationFrameId;

    const render = (time) => {
      // Resize handling: ensure internal canvas resolution matches display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // Convert time to seconds
      const t = time * 0.001;

      // Update Uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, t);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

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
        display: 'block',
        width: '100%',
        height: '100vh', // Adjust height as needed
        background: '#000'
      }}
    />
  );
};

export default MicrobeShader;
