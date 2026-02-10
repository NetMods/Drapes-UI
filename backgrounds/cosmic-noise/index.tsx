'use client'
import { useEffect, useRef } from 'react';

const CosmicNoise = ({
  speed = 0.1,
  scale = 2.0,
  octaves = 7,
  colorFreqR = 10.0,
  colorFreqG = 11.0,
  colorFreqB = 12.0,
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
    uniform float u_scale;
    uniform float u_octaves;
    uniform float u_colorFreqR;
    uniform float u_colorFreqG;
    uniform float u_colorFreqB;
    uniform float u_colorOffsetR;
    uniform float u_colorOffsetG;
    uniform float u_colorOffsetB;
    uniform float u_brightness;
    uniform float u_saturation;
    uniform float u_zoom;

    vec3 random3(vec3 c) {
      float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
      vec3 r;
      r.z = fract(512.0 * j);
      j *= .125;
      r.x = fract(512.0 * j);
      j *= .125;
      r.y = fract(512.0 * j);
      return r - 0.5;
    }

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);

      return mix(mix(mix(dot(random3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                         dot(random3(i + vec3(1,0,0)), f - vec3(1,0,0)), f.x),
                     mix(dot(random3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                         dot(random3(i + vec3(1,1,0)), f - vec3(1,1,0)), f.x), f.y),
                 mix(mix(dot(random3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                         dot(random3(i + vec3(1,0,1)), f - vec3(1,0,1)), f.x),
                     mix(dot(random3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                         dot(random3(i + vec3(1,1,1)), f - vec3(1,1,1)), f.x), f.y), f.z);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
      uv /= u_zoom;

      float n = 0.0;
      for (float i = 1.0; i < 8.0; i++) {
        if (i > u_octaves) break;
        float t = u_time * u_speed / i;
        n += noise(vec3(uv * i * u_scale, t)) / i;
      }

      vec3 color = vec3(
        u_brightness + u_saturation * sin(n * u_colorFreqR + u_time + u_colorOffsetR),
        u_brightness + u_saturation * sin(n * u_colorFreqG + u_time + u_colorOffsetG),
        u_brightness + u_saturation * sin(n * u_colorFreqB + u_time + u_colorOffsetB)
      );

      gl_FragColor = vec4(color, 1.0);
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

    const gl = canvas.getContext('webgl');
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
        scale: gl.getUniformLocation(shaderProgram, 'u_scale'),
        octaves: gl.getUniformLocation(shaderProgram, 'u_octaves'),
        colorFreqR: gl.getUniformLocation(shaderProgram, 'u_colorFreqR'),
        colorFreqG: gl.getUniformLocation(shaderProgram, 'u_colorFreqG'),
        colorFreqB: gl.getUniformLocation(shaderProgram, 'u_colorFreqB'),
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
      gl.uniform1f(programInfo.uniformLocations.scale, scale);
      gl.uniform1f(programInfo.uniformLocations.octaves, octaves);
      gl.uniform1f(programInfo.uniformLocations.colorFreqR, colorFreqR);
      gl.uniform1f(programInfo.uniformLocations.colorFreqG, colorFreqG);
      gl.uniform1f(programInfo.uniformLocations.colorFreqB, colorFreqB);
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
    speed, scale, octaves,
    colorFreqR, colorFreqG, colorFreqB,
    colorOffsetR, colorOffsetG, colorOffsetB,
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

export default CosmicNoise
