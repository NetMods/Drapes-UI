'use client';

import { useEffect, useRef } from 'react';

interface BitmapProps {
  scale?: number;
  speed?: number;
  distortion?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

const Bitmap = ({
  scale = 0.1,
  speed = 1.0,
  distortion = 5.0,
  rotationX = 0.0,
  rotationY = 0.0,
  rotationZ = 0.0,
  autoRotate = false,
  autoRotateSpeed = 1.0,
}: BitmapProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const paramsRef = useRef({
    scale,
    speed,
    distortion,
    rotationX,
    rotationY,
    rotationZ,
    autoRotate,
    autoRotateSpeed
  });

  useEffect(() => {
    paramsRef.current = {
      scale,
      speed,
      distortion,
      rotationX,
      rotationY,
      rotationZ,
      autoRotate,
      autoRotateSpeed
    };
  }, [scale, speed, distortion, rotationX, rotationY, rotationZ, autoRotate, autoRotateSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      
      uniform float t;            // Time
      uniform vec2 r;             // Resolution
      uniform float uScale;       // Prop: Scale
      uniform float uSpeed;       // Prop: Speed
      uniform float uDistortion;  // Prop: Distortion
      uniform float uRotationX;   // Prop: Rotation X (radians)
      uniform float uRotationY;   // Prop: Rotation Y (radians)
      uniform float uRotationZ;   // Prop: Rotation Z (radians)
      
      // Rotation matrix around X axis
      mat3 rotateX(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat3(
          1.0, 0.0, 0.0,
          0.0, c, -s,
          0.0, s, c
        );
      }
      
      // Rotation matrix around Y axis
      mat3 rotateY(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat3(
          c, 0.0, s,
          0.0, 1.0, 0.0,
          -s, 0.0, c
        );
      }
      
      // Rotation matrix around Z axis
      mat3 rotateZ(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat3(
          c, -s, 0.0,
          s, c, 0.0,
          0.0, 0.0, 1.0
        );
      }
      
      void main() {
        vec4 o = vec4(0.0);
        vec2 FC = gl_FragCoord.xy;

        // Normalize coordinates to center
        vec2 uv = (FC.xy - r * 0.5) / r.y;
        
        // Create a 3D point from 2D UV (using z based on pattern)
        vec3 p3d = vec3(uv, 0.0);
        
        // Apply rotations (order: Z -> Y -> X)
        p3d = rotateZ(uRotationZ) * p3d;
        p3d = rotateY(uRotationY) * p3d;
        p3d = rotateX(uRotationX) * p3d;
        
        // Project back to 2D with perspective
        float perspective = 1.0 / (1.0 - p3d.z * 0.5);
        vec2 p = p3d.xy * perspective;
        
        // Apply scale
        p = p / max(uScale, 0.001);
        
        // Apply time-based movement with speed
        p.x += t * uSpeed;
        
        // Apply distortion and generate pattern
        o += fract(sin(dot(ceil(p + sin(p * uDistortion)), vec2(79.0, 17.0))) * 4e4);

        gl_FragColor = o;
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const createProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string) => {
      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return null;

      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    // Get Uniform Locations
    const positionLocation = gl.getAttribLocation(program, 'position');
    const timeLocation = gl.getUniformLocation(program, 't');
    const resolutionLocation = gl.getUniformLocation(program, 'r');
    const scaleLocation = gl.getUniformLocation(program, 'uScale');
    const speedLocation = gl.getUniformLocation(program, 'uSpeed');
    const distortionLocation = gl.getUniformLocation(program, 'uDistortion');
    const rotationXLocation = gl.getUniformLocation(program, 'uRotationX');
    const rotationYLocation = gl.getUniformLocation(program, 'uRotationY');
    const rotationZLocation = gl.getUniformLocation(program, 'uRotationZ');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW
    );

    const startTime = performance.now();

    const render = () => {
      if (!canvas) return;

      // Handle resize
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);

      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const currentTime = (performance.now() - startTime) / 1000;

      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      gl.uniform1f(scaleLocation, paramsRef.current.scale);
      gl.uniform1f(speedLocation, paramsRef.current.speed);
      gl.uniform1f(distortionLocation, paramsRef.current.distortion);

      let rotX = paramsRef.current.rotationX;
      let rotY = paramsRef.current.rotationY;
      let rotZ = paramsRef.current.rotationZ;

      if (paramsRef.current.autoRotate) {
        const autoSpeed = paramsRef.current.autoRotateSpeed;
        rotX += currentTime * autoSpeed * 0.3;
        rotY += currentTime * autoSpeed * 0.5;
        rotZ += currentTime * autoSpeed * 0.2;
      }

      gl.uniform1f(rotationXLocation, rotX);
      gl.uniform1f(rotationYLocation, rotY);
      gl.uniform1f(rotationZLocation, rotZ);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        display: 'block',
      }}
    />
  );
};

export default Bitmap;
