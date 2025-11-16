'use client'
import { useEffect, useRef } from 'react';

const PlasmaWave = ({
  overallSpeed = 0.2,
  lineSpeed = 1.0,
  warpSpeed = 0.2,
  offsetSpeed = 1.33,
  gridSmoothWidth = 0.015,
  axisWidth = 0.05,
  majorLineWidth = 0.025,
  minorLineWidth = 0.0125,
  majorLineFrequency = 5.0,
  minorLineFrequency = 1.0,
  minLineWidth = 0.01,
  maxLineWidth = 0.2,
  lineAmplitude = 1.0,
  lineFrequency = 0.2,
  linesPerGroup = 16,
  warpFrequency = 0.5,
  warpAmplitude = 1.0,
  offsetFrequency = 0.5,
  minOffsetSpread = 0.6,
  maxOffsetSpread = 2.0,
  lineColor = [0.4, 0.2, 0.8, 1.0],
  bgColor1 = [0.1, 0.1, 0.3, 1.0],
  bgColor2 = [0.3, 0.1, 0.5, 1.0],
  gridColor = [0.5, 0.5, 0.5, 0.5],
  scale = 5.0,
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
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uOverallSpeed;
    uniform float uGridSmoothWidth;
    uniform float uAxisWidth;
    uniform float uMajorLineWidth;
    uniform float uMinorLineWidth;
    uniform float uMajorLineFrequency;
    uniform float uMinorLineFrequency;
    uniform vec4 uGridColor;
    uniform float uScale;
    uniform vec4 uLineColor;
    uniform float uMinLineWidth;
    uniform float uMaxLineWidth;
    uniform float uLineSpeed;
    uniform float uLineAmplitude;
    uniform float uLineFrequency;
    uniform float uWarpSpeed;
    uniform float uWarpFrequency;
    uniform float uWarpAmplitude;
    uniform float uOffsetFrequency;
    uniform float uOffsetSpeed;
    uniform float uMinOffsetSpread;
    uniform float uMaxOffsetSpread;
    uniform int uLinesPerGroup;
    uniform vec4 uBgColor1;
    uniform vec4 uBgColor2;

    #define drawCircle(pos, radius, coord) smoothstep(radius + uGridSmoothWidth, radius, length(coord - (pos)))
    #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
    #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + uGridSmoothWidth, halfWidth, abs(pos - (t)))
    #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

    float drawGridLines(float axis) {
      return drawCrispLine(0.0, uAxisWidth, axis)
            + drawPeriodicLine(uMajorLineFrequency, uMajorLineWidth, axis)
            + drawPeriodicLine(uMinorLineFrequency, uMinorLineWidth, axis);
    }

    float drawGrid(vec2 space) {
      return min(1.0, drawGridLines(space.x) + drawGridLines(space.y));
    }

    float random(float t) {
      return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
    }

    float getPlasmaY(float x, float horizontalFade, float offset) {
      return random(x * uLineFrequency + iTime * uLineSpeed) * horizontalFade * uLineAmplitude + offset;
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec4 fragColor;
      vec2 uv = fragCoord.xy / iResolution.xy;
      vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * uScale;

      float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
      float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

      space.y += random(space.x * uWarpFrequency + iTime * uWarpSpeed) * uWarpAmplitude * (0.5 + horizontalFade);
      space.x += random(space.y * uWarpFrequency + iTime * uWarpSpeed + 2.0) * uWarpAmplitude * horizontalFade;

      vec4 lines = vec4(0.0);

      for(int l = 0; l < 32; l++) {
        if(l >= uLinesPerGroup) break;
        
        float normalizedLineIndex = float(l) / float(uLinesPerGroup);
        float offsetTime = iTime * uOffsetSpeed;
        float offsetPosition = float(l) + space.x * uOffsetFrequency;
        float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
        float halfWidth = mix(uMinLineWidth, uMaxLineWidth, rand * horizontalFade) / 2.0;
        float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(uMinOffsetSpread, uMaxOffsetSpread, horizontalFade);
        float linePosition = getPlasmaY(space.x, horizontalFade, offset);
        float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);

        float circleX = mod(float(l) + iTime * uLineSpeed, 25.0) - 12.0;
        vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
        float circle = drawCircle(circlePosition, 0.01, space) * 4.0;

        line = line + circle;
        lines += line * uLineColor * rand;
      }

      fragColor = mix(uBgColor1, uBgColor2, uv.x);
      fragColor *= verticalFade;
      fragColor.a = 1.0;
      fragColor += lines;

      gl_FragColor = fragColor;
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
        resolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        time: gl.getUniformLocation(shaderProgram, 'iTime'),
        overallSpeed: gl.getUniformLocation(shaderProgram, 'uOverallSpeed'),
        gridSmoothWidth: gl.getUniformLocation(shaderProgram, 'uGridSmoothWidth'),
        axisWidth: gl.getUniformLocation(shaderProgram, 'uAxisWidth'),
        majorLineWidth: gl.getUniformLocation(shaderProgram, 'uMajorLineWidth'),
        minorLineWidth: gl.getUniformLocation(shaderProgram, 'uMinorLineWidth'),
        majorLineFrequency: gl.getUniformLocation(shaderProgram, 'uMajorLineFrequency'),
        minorLineFrequency: gl.getUniformLocation(shaderProgram, 'uMinorLineFrequency'),
        gridColor: gl.getUniformLocation(shaderProgram, 'uGridColor'),
        scale: gl.getUniformLocation(shaderProgram, 'uScale'),
        lineColor: gl.getUniformLocation(shaderProgram, 'uLineColor'),
        minLineWidth: gl.getUniformLocation(shaderProgram, 'uMinLineWidth'),
        maxLineWidth: gl.getUniformLocation(shaderProgram, 'uMaxLineWidth'),
        lineSpeed: gl.getUniformLocation(shaderProgram, 'uLineSpeed'),
        lineAmplitude: gl.getUniformLocation(shaderProgram, 'uLineAmplitude'),
        lineFrequency: gl.getUniformLocation(shaderProgram, 'uLineFrequency'),
        warpSpeed: gl.getUniformLocation(shaderProgram, 'uWarpSpeed'),
        warpFrequency: gl.getUniformLocation(shaderProgram, 'uWarpFrequency'),
        warpAmplitude: gl.getUniformLocation(shaderProgram, 'uWarpAmplitude'),
        offsetFrequency: gl.getUniformLocation(shaderProgram, 'uOffsetFrequency'),
        offsetSpeed: gl.getUniformLocation(shaderProgram, 'uOffsetSpeed'),
        minOffsetSpread: gl.getUniformLocation(shaderProgram, 'uMinOffsetSpread'),
        maxOffsetSpread: gl.getUniformLocation(shaderProgram, 'uMaxOffsetSpread'),
        linesPerGroup: gl.getUniformLocation(shaderProgram, 'uLinesPerGroup'),
        bgColor1: gl.getUniformLocation(shaderProgram, 'uBgColor1'),
        bgColor2: gl.getUniformLocation(shaderProgram, 'uBgColor2'),
      },
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
      gl.uniform1f(programInfo.uniformLocations.overallSpeed, overallSpeed);
      gl.uniform1f(programInfo.uniformLocations.gridSmoothWidth, gridSmoothWidth);
      gl.uniform1f(programInfo.uniformLocations.axisWidth, axisWidth);
      gl.uniform1f(programInfo.uniformLocations.majorLineWidth, majorLineWidth);
      gl.uniform1f(programInfo.uniformLocations.minorLineWidth, minorLineWidth);
      gl.uniform1f(programInfo.uniformLocations.majorLineFrequency, majorLineFrequency);
      gl.uniform1f(programInfo.uniformLocations.minorLineFrequency, minorLineFrequency);
      gl.uniform4fv(programInfo.uniformLocations.gridColor, gridColor);
      gl.uniform1f(programInfo.uniformLocations.scale, scale);
      gl.uniform4fv(programInfo.uniformLocations.lineColor, lineColor);
      gl.uniform1f(programInfo.uniformLocations.minLineWidth, minLineWidth);
      gl.uniform1f(programInfo.uniformLocations.maxLineWidth, maxLineWidth);
      gl.uniform1f(programInfo.uniformLocations.lineSpeed, lineSpeed * overallSpeed);
      gl.uniform1f(programInfo.uniformLocations.lineAmplitude, lineAmplitude);
      gl.uniform1f(programInfo.uniformLocations.lineFrequency, lineFrequency);
      gl.uniform1f(programInfo.uniformLocations.warpSpeed, warpSpeed * overallSpeed);
      gl.uniform1f(programInfo.uniformLocations.warpFrequency, warpFrequency);
      gl.uniform1f(programInfo.uniformLocations.warpAmplitude, warpAmplitude);
      gl.uniform1f(programInfo.uniformLocations.offsetFrequency, offsetFrequency);
      gl.uniform1f(programInfo.uniformLocations.offsetSpeed, offsetSpeed * overallSpeed);
      gl.uniform1f(programInfo.uniformLocations.minOffsetSpread, minOffsetSpread);
      gl.uniform1f(programInfo.uniformLocations.maxOffsetSpread, maxOffsetSpread);
      gl.uniform1i(programInfo.uniformLocations.linesPerGroup, linesPerGroup);
      gl.uniform4fv(programInfo.uniformLocations.bgColor1, bgColor1);
      gl.uniform4fv(programInfo.uniformLocations.bgColor2, bgColor2);

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
    overallSpeed, lineSpeed, warpSpeed, offsetSpeed,
    gridSmoothWidth, axisWidth, majorLineWidth, minorLineWidth,
    majorLineFrequency, minorLineFrequency, minLineWidth, maxLineWidth,
    lineAmplitude, lineFrequency, linesPerGroup, warpFrequency,
    warpAmplitude, offsetFrequency, minOffsetSpread, maxOffsetSpread,
    lineColor, bgColor1, bgColor2, gridColor, scale
  ]);

  return <canvas ref={canvasRef} className={className} />;
};

export default PlasmaWave
