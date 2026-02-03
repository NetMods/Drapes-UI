'use client'
import React, { useRef, useEffect } from 'react';

const SwarmShaderOptimized = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false
    });

    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }


    const PIXEL_SCALE = 0.7;

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      uniform vec2 r;
      uniform float t;
      out vec4 fragColor;

      void main() {
        vec3 p;
        vec3 o = vec3(0.0);
        float z = 0.0;
        float f_val = 0.0; // Renamed to avoid confusion with loop var

        // OPTIMIZATION 1: Reduced iterations from 30 -> 18
        // Visually similar, much faster
        for(float i = 0.0; i < 18.0; i++) {
          
          // Setup Ray
          vec3 fc = vec3(gl_FragCoord.xy, 0.0);
          vec3 dir = normalize(fc * 2.0 - vec3(r.xy, r.y));
          
          p = z * dir;
          p.z += t;

          // OPTIMIZATION 2: Reduced inner loop from 6 -> 4
          // OPTIMIZATION 3: Pre-calculated constants
          for(float j = 1.0; j < 4.0; j++) {
            // Replaced / 6.0 with * 0.166
            p += sin(ceil(p.z * 20.0 + j * vec3(1.0, 2.0, 3.0)) * 0.166 * j) / j;
          }

          // Distance Field
          // Replaced / 5.0 with * 0.2
          f_val = (p.y - z * 0.5 - 2.0 - length(cos(p.xz + 0.5 * z))) * 0.2;
          
          z += f_val;

          // Accumulate Color
          // Using abs() prevents negative artifacts
          o += 9.0 / abs(f_val);
        }

        // Tone Mapping
        // 5000000.0 is the magic number from original golfed code
        vec3 finalColor = tanh(5000000.0 / (o * o));
        
        fragColor = vec4(finalColor, 1.0);
      }
    `;

    // --- Boilerplate ---
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
    gl.useProgram(program);

    // Geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const rLoc = gl.getUniformLocation(program, "r");
    const tLoc = gl.getUniformLocation(program, "t");

    let animationFrameId;
    const startTime = Date.now();

    const render = () => {
      // OPTIMIZATION 4: Smart Resizing
      // We calculate the required buffer size based on window size * PIXEL_SCALE
      const displayWidth = Math.floor(canvas.clientWidth * PIXEL_SCALE);
      const displayHeight = Math.floor(canvas.clientHeight * PIXEL_SCALE);

      // Only resize the GL context if the display size has changed
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      const time = (Date.now() - startTime) * 0.001;

      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.uniform1f(tLoc, time);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <canvas
        ref={canvasRef}
        // CSS ensures it fills the screen, even if internal resolution is lower
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default SwarmShaderOptimized;
