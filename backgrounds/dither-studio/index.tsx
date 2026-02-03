"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";

export type DitherMode = "none" | "bayer" | "floyd";
export type BayerLevel = 2 | 4 | 8 | 16;
export type MediaType = "image" | "video";
export type ObjectFit = "contain" | "cover" | "fill";

interface DitherProps {
  mediaType: MediaType;
  ditherMode: DitherMode;
  isGrayscale: boolean;
  bayerLevel: BayerLevel;
  source: string;
  brightness: number;
  contrast: number;
  highlights: number;
  midtones: number;
  blur: number;
  objectFit: ObjectFit;
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
  uniform sampler2D u_bayerMatrix;
  uniform vec2 u_resolution;
  uniform vec2 u_textureSize;
   
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_highlights;
  uniform float u_midtones;
  uniform float u_blur;
   
  uniform int u_ditherMode; // 0 = none, 1 = bayer, 2 = floyd (stochastic)
  uniform int u_isGrayscale;
  uniform float u_bayerSize;
  uniform int u_objectFit; // 0 = contain, 1 = cover, 2 = fill
   
  // --- UTILS ---

  // Standard Interleaved Gradient Noise for high quality stochastic dithering
  // This mimics error diffusion (Floyd) much better than random noise
  float interleavedGradientNoise(vec2 uv) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(uv, magic.xy)));
  }

  vec3 applyColorCorrection(vec3 color) {
    float b = u_brightness / 100.0;
    float c = (u_contrast + 100.0) / 100.0;
    float cSqu = c * c;
    
    float gamma = 1.0;
    if (u_midtones < 0.0) {
      gamma = 1.0 + u_midtones / -100.0;
    } else {
      gamma = 1.0 - u_midtones / 200.0;
    }
    
    float h = 1.0 + u_highlights / 200.0;
    
    vec3 val = color;
    val = (val - 0.5) * cSqu + 0.5;
    val += b;
    
    // Apply gamma
    val = max(val, vec3(0.0));
    val = pow(val, vec3(gamma));
    
    // Apply highlights
    val = mix(val, val * h, step(0.5, val));
    
    return clamp(val, 0.0, 1.0);
  }
   
  vec3 toGrayscale(vec3 color) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return vec3(gray);
  }
   
  vec2 calculateUV() {
    vec2 uv = v_texCoord;
    
    if (u_objectFit == 2) {
      return uv; // Fill
    }
    
    float canvasAspect = u_resolution.x / u_resolution.y;
    float textureAspect = u_textureSize.x / u_textureSize.y;
    
    vec2 scale = vec2(1.0);
    
    if (u_objectFit == 0) {
      // Contain
      if (canvasAspect > textureAspect) {
        scale.x = textureAspect / canvasAspect;
      } else {
        scale.y = canvasAspect / textureAspect;
      }
    } else if (u_objectFit == 1) {
      // Cover
      if (canvasAspect > textureAspect) {
        scale.y = canvasAspect / textureAspect;
      } else {
        scale.x = textureAspect / canvasAspect;
      }
    }
    
    uv = (uv - 0.5) / scale + 0.5;
    return uv;
  }
   
  bool isOutOfBounds(vec2 uv) {
    return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0;
  }
   
  vec3 applyBlur(vec2 uv, float radius) {
    if (radius <= 0.0) return texture2D(u_image, uv).rgb;
    
    vec3 color = vec3(0.0);
    float total = 0.0;
    float steps = min(radius, 5.0);
    
    for (float x = -5.0; x <= 5.0; x += 1.0) {
      for (float y = -5.0; y <= 5.0; y += 1.0) {
        if (abs(x) <= steps && abs(y) <= steps) {
          vec2 offset = vec2(x, y) * radius / steps / u_textureSize;
          vec2 sampleUV = uv + offset;
          if (!isOutOfBounds(sampleUV)) {
            color += texture2D(u_image, sampleUV).rgb;
            total += 1.0;
          }
        }
      }
    }
    return total > 0.0 ? color / total : vec3(0.0);
  }
   
  float getBayerThreshold(vec2 pos) {
    vec2 bayerCoord = mod(pos, u_bayerSize) / u_bayerSize;
    return texture2D(u_bayerMatrix, bayerCoord).r;
  }
   
  void main() {
    vec2 uv = calculateUV();
    
    // FIX 1: Return transparent (alpha 0) if out of bounds for "contain" mode
    if (isOutOfBounds(uv)) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }
    
    vec3 color = applyBlur(uv, u_blur);
    color = applyColorCorrection(color);
    
    // Dithering Logic
    if (u_ditherMode == 1) {
      // --- Bayer ---
      if (u_isGrayscale == 1) color = toGrayscale(color);
      
      vec2 pixelPos = gl_FragCoord.xy;
      float threshold = getBayerThreshold(pixelPos);
      color = step(threshold, color); // Multi-channel dither if color
      
    } else if (u_ditherMode == 2) {
      // --- Stochastic (Floyd replacement) ---
      // We force grayscale here because stochastic dither looks messy in RGB.
      // Ideally, Floyd-Steinberg is a 1-bit monochrome operation.
      vec3 gray = toGrayscale(color);
      
      // Generate Interleaved Gradient Noise
      float noise = interleavedGradientNoise(gl_FragCoord.xy);
      
      // Compare luminance to noise threshold
      // This creates a probabilistically accurate stippling effect
      color = vec3(step(noise, gray.r));
    } else {
       // --- None ---
       if (u_isGrayscale == 1) color = toGrayscale(color);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const DitherStudio = ({
  mediaType = 'image',
  ditherMode = 'bayer',
  isGrayscale = false,
  bayerLevel = 8,
  source,
  brightness = 0,
  contrast = 0,
  highlights = 0,
  midtones = 0,
  blur = 0,
  objectFit = 'contain',
}: DitherProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const bayerTextureRef = useRef<WebGLTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});

  const bayerMatrix = useMemo(() => {
    const createMatrix = (n: number): number[][] => {
      if (n === 2) return [[0, 2], [3, 1]];
      const lowerMatrix = createMatrix(n / 2);
      const size = lowerMatrix.length;
      const matrix = Array.from({ length: size * 2 }, () => new Array(size * 2));
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const value = lowerMatrix[y][x];
          matrix[y][x] = 4 * value;
          matrix[y][x + size] = 4 * value + 2;
          matrix[y + size][x] = 4 * value + 3;
          matrix[y + size][x + size] = 4 * value + 1;
        }
      }
      return matrix;
    };
    return createMatrix(bayerLevel);
  }, [bayerLevel]);

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
      alpha: true, // Enable transparency
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: true
    });

    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }

    glRef.current = gl;

    // Enable blending for transparency
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
      u_bayerMatrix: gl.getUniformLocation(program, 'u_bayerMatrix'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_textureSize: gl.getUniformLocation(program, 'u_textureSize'),
      u_brightness: gl.getUniformLocation(program, 'u_brightness'),
      u_contrast: gl.getUniformLocation(program, 'u_contrast'),
      u_highlights: gl.getUniformLocation(program, 'u_highlights'),
      u_midtones: gl.getUniformLocation(program, 'u_midtones'),
      u_blur: gl.getUniformLocation(program, 'u_blur'),
      u_ditherMode: gl.getUniformLocation(program, 'u_ditherMode'),
      u_isGrayscale: gl.getUniformLocation(program, 'u_isGrayscale'),
      u_bayerSize: gl.getUniformLocation(program, 'u_bayerSize'),
      u_objectFit: gl.getUniformLocation(program, 'u_objectFit'),
    };

    textureRef.current = gl.createTexture();
    bayerTextureRef.current = gl.createTexture();

    return true;
  }, [compileShader]);

  const updateBayerTexture = useCallback(() => {
    const gl = glRef.current;
    const bayerTexture = bayerTextureRef.current;
    if (!gl || !bayerTexture) return;

    const size = bayerLevel;
    const data = new Uint8Array(size * size);
    const maxVal = size * size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        data[y * size + x] = Math.floor((bayerMatrix[y][x] / maxVal) * 255);
      }
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bayerTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, size, size, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }, [bayerLevel, bayerMatrix]);

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

    // Clear canvas with transparent color
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
    gl.uniform1i(uniforms.u_bayerMatrix, 1);
    gl.uniform2f(uniforms.u_resolution, width, height);
    gl.uniform2f(uniforms.u_textureSize, srcW, srcH);
    gl.uniform1f(uniforms.u_brightness, brightness);
    gl.uniform1f(uniforms.u_contrast, contrast);
    gl.uniform1f(uniforms.u_highlights, highlights);
    gl.uniform1f(uniforms.u_midtones, midtones);
    gl.uniform1f(uniforms.u_blur, blur);
    gl.uniform1i(uniforms.u_ditherMode, ditherMode === 'none' ? 0 : ditherMode === 'bayer' ? 1 : 2);
    gl.uniform1i(uniforms.u_isGrayscale, isGrayscale ? 1 : 0);
    gl.uniform1f(uniforms.u_bayerSize, bayerLevel);
    gl.uniform1i(uniforms.u_objectFit, objectFit === 'contain' ? 0 : objectFit === 'cover' ? 1 : 2);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [mediaType, brightness, contrast, highlights, midtones, blur, ditherMode, isGrayscale, bayerLevel, objectFit]);

  useEffect(() => {
    initWebGL();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [initWebGL]);

  useEffect(() => {
    updateBayerTexture();
    draw();
  }, [bayerLevel, bayerMatrix, updateBayerTexture, draw]);

  useEffect(() => {
    draw();
  }, [ditherMode, isGrayscale, brightness, contrast, highlights, midtones, blur, objectFit, draw]);

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

    const loop = () => {
      if (mediaType === 'video') draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    if (mediaType === 'video') loop();

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
        muted
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

export default DitherStudio;
