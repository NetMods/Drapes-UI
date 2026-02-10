'use client';

import { useRef, useEffect } from 'react';

// ===================== SHADERS =====================

const vertexShaderSource = `
  attribute vec2 position;
  varying vec2 vUv;
  
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  
  uniform float iTime;
  uniform vec2 iResolution;
  varying vec2 vUv;

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  // Polyfill for transpose() since it's missing in WebGL 1.0
  mat4 transpose(mat4 m) {
      return mat4(
          vec4(m[0].x, m[1].x, m[2].x, m[3].x),
          vec4(m[0].y, m[1].y, m[2].y, m[3].y),
          vec4(m[0].z, m[1].z, m[2].z, m[3].z),
          vec4(m[0].w, m[1].w, m[2].w, m[3].w)
      );
  }

  // Cosine Based Palette
  vec3 palette( in float t ) {
      vec3 a = vec3(0.5, 0.5, 0.5);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = vec3(1.0, 1.0, 1.0);
      vec3 d = vec3(0.263, 0.416, 0.557); 
      return a + b * cos( 6.28318 * (c * t + d) );
  }

  mat2 rot(float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c);
  }

  // ==========================================
  // NEURAL LAYER
  // ==========================================
  
  vec4 neural_layer(vec4 x, mat4 W, vec4 bias) {
      vec4 res = W * x; 
      res += bias; 
      return sin(res); 
  }

  void main() {
    vec2 uv = (vUv * 2.0 - 1.0);
    uv.x *= iResolution.x / iResolution.y;

    float t = iTime * 0.2;
    vec4 v = vec4(uv, length(uv), sin(t));

    // Create rotation matrices
    float t1 = t * 0.5;
    float t2 = t * 0.3;
    mat2 r1 = rot(t1);
    mat2 r2 = rot(t2);
    
    // Construct dynamic 4x4 matrix
    mat4 W1 = mat4(
        vec4(r1[0][0], r1[0][1], 0.0, 0.0),
        vec4(r1[1][0], r1[1][1], 0.0, 0.0),
        vec4(0.0, 0.0, r2[0][0], r2[0][1]),
        vec4(0.0, 0.0, r2[1][0], r2[1][1])
    );

    mat4 W2 = mat4(
         1.2,  0.5, -0.2,  0.0,
        -0.5,  1.1,  0.3,  0.0,
         0.2, -0.3,  1.0,  0.4,
         0.0,  0.0, -0.4,  1.0
    );

    // Layer 1
    v = neural_layer(v, W1, vec4(0.1));
    
    // Layer 2
    v = neural_layer(v, W2 * 1.5, vec4(-0.2));
    
    // Layer 3 (Using our manual transpose function)
    v = neural_layer(v, W1 * transpose(W2), vec4(sin(t)));
    
    // Layer 4
    v = neural_layer(v, W2, vec4(cos(t)));

    float value = v.x * v.y + v.z;
    float dist = length(uv);
    vec3 col = palette(value + dist * 0.5 + t);

    // Vignette
    col *= 1.0 - smoothstep(0.5, 1.5, dist);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function CPPNShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // --- Shader Compilation ---
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // --- Geometry ---
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

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Uniforms ---
    const timeLocation = gl.getUniformLocation(program, 'iTime');
    const resolutionLocation = gl.getUniformLocation(program, 'iResolution');

    // --- Resize Handler ---
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    // --- Render Loop ---
    let animationId: number;
    const startTime = performance.now();

    const render = () => {
      const currentTime = performance.now();
      const elapsedTime = (currentTime - startTime) / 1000;

      gl.uniform1f(timeLocation, elapsedTime);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full block bg-black"
    />
  );
}
