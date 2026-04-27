'use client'
import { useEffect, useRef } from 'react';

const LiquidWarp = ({
  speed = 0.1,
  warpIntensity = 1.5,
  warpFrequency = 10.0,
  iterations = 10,
  colorSpeed = 0.1,
  colorOffsetR = 0.0,
  colorOffsetG = 2.0,
  colorOffsetB = 4.0,
  brightness = 0.5,
  saturation = 0.5,
  zoom = 1.0,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  const createFragmentShader = (): string => `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_speed;
    uniform float u_warpIntensity;
    uniform float u_warpFrequency;
    uniform float u_iterations;
    uniform float u_colorSpeed;
    uniform float u_colorOffsetR;
    uniform float u_colorOffsetG;
    uniform float u_colorOffsetB;
    uniform float u_brightness;
    uniform float u_saturation;
    uniform float u_zoom;

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
      p /= u_zoom;
      vec3 c = vec3(0.0);
      for (float i = 1.0; i < 31.0; i++) {
        if (i > u_iterations) break;
        float t = u_time * (u_speed / i);
        p.x += u_warpIntensity / i * sin(i * p.y + t * u_warpFrequency + cos((t / (u_warpFrequency * i)) * i));
        p.y += u_warpIntensity / i * cos(i * p.x + t * u_warpFrequency + sin((t / (u_warpFrequency * i)) * i));
      }
      c += u_brightness + u_saturation * sin(u_time * u_colorSpeed + p.xyx + vec3(u_colorOffsetR, u_colorOffsetG, u_colorOffsetB));
      gl_FragColor = vec4(c, 1.0);
    }
  `;

  const loadShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error: ', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return null;

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return null;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Shader program link error: ', gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.warn('WebGL not supported.');
      return;
    }

    const fsSource = createFragmentShader();
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
        time: gl.getUniformLocation(shaderProgram, 'u_time'),
        speed: gl.getUniformLocation(shaderProgram, 'u_speed'),
        warpIntensity: gl.getUniformLocation(shaderProgram, 'u_warpIntensity'),
        warpFrequency: gl.getUniformLocation(shaderProgram, 'u_warpFrequency'),
        iterations: gl.getUniformLocation(shaderProgram, 'u_iterations'),
        colorSpeed: gl.getUniformLocation(shaderProgram, 'u_colorSpeed'),
        colorOffsetR: gl.getUniformLocation(shaderProgram, 'u_colorOffsetR'),
        colorOffsetG: gl.getUniformLocation(shaderProgram, 'u_colorOffsetG'),
        colorOffsetB: gl.getUniformLocation(shaderProgram, 'u_colorOffsetB'),
        brightness: gl.getUniformLocation(shaderProgram, 'u_brightness'),
        saturation: gl.getUniformLocation(shaderProgram, 'u_saturation'),
        zoom: gl.getUniformLocation(shaderProgram, 'u_zoom'),
      },
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = Date.now();
    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000;

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(programInfo.program);

      gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
      gl.uniform1f(programInfo.uniformLocations.time, currentTime);
      gl.uniform1f(programInfo.uniformLocations.speed, speed);
      gl.uniform1f(programInfo.uniformLocations.warpIntensity, warpIntensity);
      gl.uniform1f(programInfo.uniformLocations.warpFrequency, warpFrequency);
      gl.uniform1f(programInfo.uniformLocations.iterations, iterations);
      gl.uniform1f(programInfo.uniformLocations.colorSpeed, colorSpeed);
      gl.uniform1f(programInfo.uniformLocations.colorOffsetR, colorOffsetR);
      gl.uniform1f(programInfo.uniformLocations.colorOffsetG, colorOffsetG);
      gl.uniform1f(programInfo.uniformLocations.colorOffsetB, colorOffsetB);
      gl.uniform1f(programInfo.uniformLocations.brightness, brightness);
      gl.uniform1f(programInfo.uniformLocations.saturation, saturation);
      gl.uniform1f(programInfo.uniformLocations.zoom, zoom);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    speed, warpIntensity, warpFrequency, iterations,
    colorSpeed, colorOffsetR, colorOffsetG, colorOffsetB,
    brightness, saturation, zoom
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10,
      }}
    />
  )
};

export default LiquidWarp
