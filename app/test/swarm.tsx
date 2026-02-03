'use client'
import React, { useRef, useEffect } from 'react';

const SwarmShader = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Prefer WebGL2 for better performance, fallback to WebGL1
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) return;

    // --- Shader Sources ---

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // OPTIMIZED FRAGMENT SHADER
    const fragmentShaderSource = `
      precision highp float;
      uniform float time;
      uniform vec2 resolution;

      void main() {
        vec2 r = resolution;
        float t = time;
        vec3 p;
        vec4 o = vec4(0.0);
        
        float z = 0.0;
        float f = 0.0;

        // OPTIMIZATION 1: Reduced loop count from 100 -> 50
        for(int i = 0; i < 50; i++) {
          
          vec2 uv = (gl_FragCoord.xy * 2.0 - r) / r.y;
          p = vec3(uv, 1.0) * z;

          float f_inner = 1.0;
          
          // OPTIMIZATION 2: Reduced inner distortion loop from 9 -> 4
          // This drastically reduces the trig calculations per pixel
          for(int j = 0; j < 4; j++) {
             f_inner += 1.0;
             vec3 p_swiz = p.zxy;
             vec3 rounded = floor(p_swiz / 0.1 - z + 0.5);
             p += sin(rounded * 0.1 * f_inner - t) / f_inner;
          }

          f = 0.1 * abs(dot(cos(p * 0.5), cos(p / 0.7)));

          z += f;
          
          // OPTIMIZATION 3: Increased brightness multiplier (0.1 -> 0.2)
          // to compensate for fewer loop iterations
          o += 0.2 * f;
        }

        gl_FragColor = vec4(o.rgb, 1.0);
      }
    `;

    // --- WebGL Boilerplate ---

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');

    // --- Render Loop ---
    let frameId;
    const startTime = performance.now();

    const render = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      // OPTIMIZATION 4: Render at 50% resolution
      // Most high-end screens have DPR > 2. Rendering this shader 1:1 is wasteful.
      // 0.5 scale looks almost identical for this specific "noisy" visual.
      const scale = 0.6;
      const needWidth = Math.floor(displayWidth * scale);
      const needHeight = Math.floor(displayHeight * scale);

      if (canvas.width !== needWidth || canvas.height !== needHeight) {
        canvas.width = needWidth;
        canvas.height = needHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      const currentTime = (performance.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100vh',
        display: 'block',
        background: '#000',
        // Optional: Ensures the scaled-up canvas doesn't look blurry
        // imageRendering: 'pixelated' 
      }}
    />
  );
};

export default SwarmShader;
