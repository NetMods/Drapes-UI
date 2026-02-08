"use client";

import { useEffect, useRef, useCallback } from "react";

export type MediaType = "image" | "video";
export type ObjectFit = "contain" | "cover" | "fill";
export type ColorTheme = 'colorful' | 'monochrome' | 'ink-paper' | 'amber-glow' | 'game-boy' | 'nes' | 'terminal' | 'blueprint' | 'neon-punk';
export type DotStyle = 'classic' | 'gooney';
export type GridType = 'hex' | 'square';

const THEME_COLORS: Record<ColorTheme, { fg: [number, number, number]; bg: [number, number, number]; useOriginalColors: boolean }> = {
  'colorful': { fg: [1, 1, 1], bg: [0, 0, 0], useOriginalColors: true },
  'monochrome': { fg: [1, 1, 1], bg: [0, 0, 0], useOriginalColors: false },
  'ink-paper': { fg: [0.11, 0.09, 0.08], bg: [0.96, 0.94, 0.91], useOriginalColors: false },
  'amber-glow': { fg: [1, 0.69, 0], bg: [0.1, 0.03, 0], useOriginalColors: false },
  'game-boy': { fg: [0.19, 0.38, 0.19], bg: [0.61, 0.74, 0.06], useOriginalColors: false },
  'nes': { fg: [0.97, 0.97, 0.97], bg: [0, 0.25, 0.66], useOriginalColors: false },
  'terminal': { fg: [0, 1, 0.25], bg: [0.05, 0.05, 0.05], useOriginalColors: false },
  'blueprint': { fg: [0.88, 0.93, 1], bg: [0.04, 0.09, 0.16], useOriginalColors: false },
  'neon-punk': { fg: [1, 0.08, 0.58], bg: [0.06, 0, 0.13], useOriginalColors: false },
};

interface HalftoneProps {
  mediaType: MediaType;
  source: string;
  objectFit: ObjectFit;
  inverted: boolean;
  colorTheme: ColorTheme;
  dotStyle: DotStyle;
  gridType: GridType;
  size: number;
  radius: number;
  contrast: number;
  grainMixer: number;
  grainOverlay: number;
  grainSize: number;
}

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_texCoord;

  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform vec2 u_textureSize;
  uniform int u_objectFit;
  uniform int u_inverted;
  uniform int u_useOriginalColors;
  uniform vec3 u_themeFg;
  uniform vec3 u_themeBg;
  uniform int u_dotStyle;       
  uniform int u_gridType;      
  uniform float u_size;
  uniform float u_radius;
  uniform float u_contrast;
  uniform float u_grainMixer;
  uniform float u_grainOverlay;
  uniform float u_grainSize;

  vec2 applyObjectFit(vec2 tc) {
    if (u_objectFit == 2) return tc;
    float canvasAspect = u_resolution.x / u_resolution.y;
    float textureAspect = u_textureSize.x / u_textureSize.y;
    vec2 scale = vec2(1.0);
    if (u_objectFit == 0) {
      if (canvasAspect > textureAspect) { scale.x = textureAspect / canvasAspect; }
      else { scale.y = canvasAspect / textureAspect; }
    } else if (u_objectFit == 1) {
      if (canvasAspect > textureAspect) { scale.y = canvasAspect / textureAspect; }
      else { scale.x = textureAspect / canvasAspect; }
    }
    return (tc - 0.5) / scale + 0.5;
  }

  bool isOutOfBounds(vec2 uv) {
    return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0;
  }

  vec2 pixelToUV(vec2 pixel) {
    vec2 norm = pixel / u_resolution;
    vec2 tc = vec2(norm.x, 1.0 - norm.y);
    return applyObjectFit(tc);
  }

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  vec2 getCellCenter(vec2 idx, float cellSz) {
    if (u_gridType == 0) {
      float rowHeight = cellSz * 0.866;
      float xOff = mod(idx.y, 2.0) * cellSz * 0.5;
      return vec2(idx.x * cellSz + xOff + cellSz * 0.5, idx.y * rowHeight + rowHeight * 0.5);
    } else {
      return idx * cellSz + cellSz * 0.5;
    }
  }

  void main() {
    vec2 pixelUV = applyObjectFit(v_texCoord);
    if (isOutOfBounds(pixelUV)) {
      gl_FragColor = vec4(u_themeBg, 1.0);
      return;
    }

    vec2 pixelPos = gl_FragCoord.xy;
    float cellSize = mix(4.0, 64.0, u_size);
    float halfCell = cellSize * 0.5;

    // Find base cell
    vec2 baseCellIndex;
    if (u_gridType == 0) {
      float rowHeight = cellSize * 0.866;
      float row = floor(pixelPos.y / rowHeight);
      float xOffset = mod(row, 2.0) * cellSize * 0.5;
      float col = floor((pixelPos.x - xOffset) / cellSize);
      baseCellIndex = vec2(col, row);
    } else {
      baseCellIndex = floor(pixelPos / cellSize);
    }

    float field = 0.0;
    vec3 dotColor = vec3(0.0);
    float dotColorW = 0.0;

    for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
      for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
        vec2 nIdx = baseCellIndex + vec2(dx, dy);
        vec2 center = getCellCenter(nIdx, cellSize);

        vec2 centerUV = pixelToUV(center);
        if (isOutOfBounds(centerUV)) continue;

        vec3 sampledColor = texture2D(u_image, centerUV).rgb;
        float lum = dot(sampledColor, vec3(0.299, 0.587, 0.114));

        float k = mix(1.0, 12.0, u_contrast);
        lum = 1.0 / (1.0 + exp(-k * (lum - 0.5)));

        float darkness = 1.0 - lum;
        if (u_inverted == 1) darkness = lum;
        if (u_useOriginalColors == 1) darkness = 1.0 - darkness;

        float dotRadius = darkness * u_radius;

        float dist = length(pixelPos - center);
        float normDist = dist / halfCell;

        if (u_grainMixer > 0.0) {
          float grainScale = mix(2.0, 40.0, u_grainSize);
          float noise = valueNoise(nIdx * 7.31 + pixelPos / grainScale);
          normDist += (noise - 0.5) * u_grainMixer * 0.8;
        }

        float t = normDist / max(dotRadius, 0.001);

        float steepness;
        if (u_dotStyle == 0) steepness = 10.0;     
        else steepness = 6.0;                       

        float contrib = 1.0 / (1.0 + exp(steepness * (t - 1.0)));

        field += contrib;
        dotColor += sampledColor * contrib;
        dotColorW += contrib;
      }
    }

    float shape = smoothstep(0.45, 0.55, field);

    vec3 finalColor;
    if (u_useOriginalColors == 1 && dotColorW > 0.0) {
      vec3 avgColor = dotColor / dotColorW;
      finalColor = mix(u_themeBg, avgColor, shape);
    } else {
      finalColor = mix(u_themeBg, u_themeFg, shape);
    }

    if (u_grainOverlay > 0.0) {
      float grainScale = mix(1.0, 8.0, u_grainSize);
      float grain = hash(floor(pixelPos / grainScale));
      finalColor += (grain - 0.5) * u_grainOverlay;
    }

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`;

const HalftoneStudio = ({
  mediaType = 'image',
  source,
  objectFit = 'cover',
  inverted = false,
  colorTheme = 'ink-paper',
  dotStyle = 'classic',
  gridType = 'hex',
  size = 0.3,
  radius = 1.0,
  contrast = 0.5,
  grainMixer = 0.0,
  grainOverlay = 0.0,
  grainSize = 0.5,
}: HalftoneProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});

  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
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
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    });

    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }

    glRef.current = gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return false;

    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return false;
    }

    programRef.current = program;

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    uniformLocationsRef.current = {
      u_image: gl.getUniformLocation(program, 'u_image'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_textureSize: gl.getUniformLocation(program, 'u_textureSize'),
      u_objectFit: gl.getUniformLocation(program, 'u_objectFit'),
      u_inverted: gl.getUniformLocation(program, 'u_inverted'),
      u_useOriginalColors: gl.getUniformLocation(program, 'u_useOriginalColors'),
      u_themeFg: gl.getUniformLocation(program, 'u_themeFg'),
      u_themeBg: gl.getUniformLocation(program, 'u_themeBg'),
      u_dotStyle: gl.getUniformLocation(program, 'u_dotStyle'),
      u_gridType: gl.getUniformLocation(program, 'u_gridType'),
      u_size: gl.getUniformLocation(program, 'u_size'),
      u_radius: gl.getUniformLocation(program, 'u_radius'),
      u_contrast: gl.getUniformLocation(program, 'u_contrast'),
      u_grainMixer: gl.getUniformLocation(program, 'u_grainMixer'),
      u_grainOverlay: gl.getUniformLocation(program, 'u_grainOverlay'),
      u_grainSize: gl.getUniformLocation(program, 'u_grainSize'),
    };

    textureRef.current = gl.createTexture();

    return true;
  }, [compileShader]);

  const draw = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    const texture = textureRef.current;
    const uniforms = uniformLocationsRef.current;

    if (!gl || !program || !canvas || !texture) return;

    const sourceElem = mediaType === 'video' ? videoRef.current : imageRef.current;
    if (!sourceElem) return;

    const srcW = sourceElem instanceof HTMLVideoElement ? sourceElem.videoWidth : sourceElem.width;
    const srcH = sourceElem instanceof HTMLVideoElement ? sourceElem.videoHeight : sourceElem.height;
    if (srcW === 0 || srcH === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * dpr;
    const height = rect.height * dpr;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElem);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1i(uniforms.u_image, 0);
    gl.uniform2f(uniforms.u_resolution, width, height);
    gl.uniform2f(uniforms.u_textureSize, srcW, srcH);
    gl.uniform1i(uniforms.u_objectFit, objectFit === 'contain' ? 0 : objectFit === 'cover' ? 1 : 2);
    gl.uniform1i(uniforms.u_inverted, inverted ? 1 : 0);

    const theme = THEME_COLORS[colorTheme];
    gl.uniform1i(uniforms.u_useOriginalColors, theme.useOriginalColors ? 1 : 0);
    gl.uniform3f(uniforms.u_themeFg, theme.fg[0], theme.fg[1], theme.fg[2]);
    gl.uniform3f(uniforms.u_themeBg, theme.bg[0], theme.bg[1], theme.bg[2]);

    gl.uniform1i(uniforms.u_dotStyle, dotStyle === 'classic' ? 0 : 1);
    gl.uniform1i(uniforms.u_gridType, gridType === 'hex' ? 0 : 1);
    gl.uniform1f(uniforms.u_size, size);
    gl.uniform1f(uniforms.u_radius, radius);
    gl.uniform1f(uniforms.u_contrast, contrast);
    gl.uniform1f(uniforms.u_grainMixer, grainMixer);
    gl.uniform1f(uniforms.u_grainOverlay, grainOverlay);
    gl.uniform1f(uniforms.u_grainSize, grainSize);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [mediaType, objectFit, inverted, colorTheme, dotStyle, gridType, size, radius, contrast, grainMixer, grainOverlay, grainSize]);

  useEffect(() => {
    initWebGL();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [initWebGL]);

  useEffect(() => {
    draw();
  }, [inverted, colorTheme, dotStyle, gridType, size, radius, contrast, grainMixer, grainOverlay, grainSize, objectFit, draw]);

  useEffect(() => {
    const video = videoRef.current;

    if (mediaType === 'image' && source) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        draw();
      };
      img.src = source;
    }

    if (video) {
      if (mediaType === 'video') {
        video.play().catch(e => console.error(e));
      } else {
        video.pause();
      }
    }

    const needsLoop = mediaType === 'video';

    const loop = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    if (needsLoop) loop();

    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [mediaType, source, draw]);

  return (
    <>
      <video
        ref={videoRef}
        src={mediaType === 'video' ? source : undefined}
        crossOrigin="anonymous"
        style={{ display: 'none' }}
        loop
        playsInline
      />
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
    </>
  );
};

export default HalftoneStudio;
