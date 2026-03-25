'use client'
import { useEffect, useRef } from 'react';

const shapeMap: Record<string, number> = {
  circle: 0,
  square: 1,
  triangle: 2,
  diamond: 3,
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0.5, 0.5, 0.5];
};

const mat4 = {
  perspective: (fov: number, aspect: number, near: number, far: number) => {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ];
  },
  translate: (x: number, y: number, z: number) => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ]
};

const DottedSurface = ({
  dotColor = '#808080',
  shape = 'circle',
  speed = 0.1,
  waveAmplitude = 50.0,
  waveFreqX = 0.3,
  waveFreqY = 0.5,
  pointSize = 8.0,
  separation = 150,
  gridX = 40,
  gridY = 60,
  opacity = 0.8,
  cameraHeight = -355,
  cameraDistance = -1220,
  fov = 60,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const vsSource = `
    attribute vec3 position;
    attribute vec2 gridIndex;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform float uTime;
    uniform float uWaveAmplitude;
    uniform float uWaveFreqX;
    uniform float uWaveFreqY;
    uniform float uPointSize;

    void main() {
      vec3 pos = position;
      float y = sin((gridIndex.x + uTime) * uWaveFreqX) * uWaveAmplitude
              + sin((gridIndex.y + uTime) * uWaveFreqY) * uWaveAmplitude;
      pos.y = y;

      gl_Position = uProjectionMatrix * uViewMatrix * vec4(pos, 1.0);
      gl_PointSize = uPointSize * (1000.0 / gl_Position.w);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform int uShape;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);

      if (uShape == 0) {
        // Circle
        if (length(coord) > 0.5) discard;
      } else if (uShape == 1) {
        // Square
        if (max(abs(coord.x), abs(coord.y)) > 0.45) discard;
      } else if (uShape == 2) {
        // Triangle
        vec2 p = coord;
        p.y = -p.y + 0.15;
        float d = max(abs(p.x) * 1.732 + p.y, -p.y) / 1.5;
        if (d > 0.4) discard;
      } else if (uShape == 3) {
        // Diamond
        if (abs(coord.x) + abs(coord.y) > 0.45) discard;
      }

      gl_FragColor = vec4(uColor, uOpacity);
    }
  `;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) return;

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

    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
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

    const positions: number[] = [];
    const indices: number[] = [];

    for (let ix = 0; ix < gridX; ix++) {
      for (let iy = 0; iy < gridY; iy++) {
        const x = ix * separation - (gridX * separation) / 2;
        const z = iy * separation - (gridY * separation) / 2;
        positions.push(x, 0, z);
        indices.push(ix, iy);
      }
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);

    const indexLoc = gl.getAttribLocation(program, 'gridIndex');
    gl.enableVertexAttribArray(indexLoc);
    gl.vertexAttribPointer(indexLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'uTime');
    const projLoc = gl.getUniformLocation(program, 'uProjectionMatrix');
    const viewLoc = gl.getUniformLocation(program, 'uViewMatrix');
    const colorLoc = gl.getUniformLocation(program, 'uColor');
    const opacityLoc = gl.getUniformLocation(program, 'uOpacity');
    const shapeLoc = gl.getUniformLocation(program, 'uShape');
    const waveAmplitudeLoc = gl.getUniformLocation(program, 'uWaveAmplitude');
    const waveFreqXLoc = gl.getUniformLocation(program, 'uWaveFreqX');
    const waveFreqYLoc = gl.getUniformLocation(program, 'uWaveFreqY');
    const pointSizeLoc = gl.getUniformLocation(program, 'uPointSize');

    const rgb = hexToRgb(dotColor);
    gl.uniform3fv(colorLoc, rgb);
    gl.uniform1f(opacityLoc, opacity);
    gl.uniform1i(shapeLoc, shapeMap[shape] ?? 0);
    gl.uniform1f(waveAmplitudeLoc, waveAmplitude);
    gl.uniform1f(waveFreqXLoc, waveFreqX);
    gl.uniform1f(waveFreqYLoc, waveFreqY);
    gl.uniform1f(pointSizeLoc, pointSize);

    const viewMatrix = mat4.translate(0, cameraHeight, cameraDistance);
    gl.uniformMatrix4fv(viewLoc, false, new Float32Array(viewMatrix));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let count = 0;
    const pointCount = positions.length / 3;

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);

      const aspect = canvas.offsetWidth / canvas.offsetHeight;
      const projectionMatrix = mat4.perspective(fov * Math.PI / 180, aspect, 1, 10000);
      gl.uniformMatrix4fv(projLoc, false, new Float32Array(projectionMatrix));
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      count += speed;
      gl.uniform1f(timeLoc, count);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, pointCount);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(indexBuffer);
    };
  }, [
    dotColor, shape, speed, waveAmplitude, waveFreqX, waveFreqY,
    pointSize, separation, gridX, gridY, opacity,
    cameraHeight, cameraDistance, fov
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
        zIndex: -1,
      }}
    />
  )
};

export default DottedSurface
