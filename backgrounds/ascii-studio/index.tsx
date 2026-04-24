"use client";
import React, { useEffect, useRef } from "react";

export type AsciiMode =
  | "standard"
  | "technical"
  | "dense"
  | "minimal"
  | "blocks"
  | "braille"
  | "hatching";

export type MediaType = "image" | "video";
export type ObjectFit = "contain" | "cover" | "fill";
export type ColorTheme = 'colorful' | 'monochrome' | 'ink-paper' | 'amber-glow' | 'game-boy' | 'nes' | 'terminal' | 'blueprint' | 'neon-punk';

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

interface AsciiProps {
  mediaType: MediaType;
  asciiMode: AsciiMode;
  source: string;
  objectFit?: ObjectFit;
  fontSize?: number;
  colorTheme?: ColorTheme;
  filledBlocks?: boolean;
  contrast?: number;
  highlights?: number;
  midtones?: number;
}

const ASCII_CHARS: Record<AsciiMode, string> = {
  standard: " .:-=+*#%@",
  technical: " ._-~:;=!*#$@",
  dense: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  minimal: " .-+*#",
  blocks: " ░▒▓█",
  braille: " ⠁⠃⠇⠏⠟⠿⡿⣿",
  hatching: " -=≡≣",
};

// --- Shaders ---

const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_mediaTexture;
uniform sampler2D u_charTexture; // Texture containing the font atlas

uniform float u_numChars;      // Total number of characters in the set
uniform vec2 u_resolution;     // Canvas resolution in pixels
uniform vec2 u_gridSize;       // Size of one grid cell (font width, font height)
uniform bool u_colored;
uniform bool u_filledBlocks;   // true: colored squares with character cutout, false: colored characters on bg
uniform vec3 u_solidColor;     // RGB color if not colored
uniform vec3 u_bgColor;        // Background color
uniform vec2 u_mediaResolution; // Resolution of the source media
uniform int u_objectFit;       // 0: fill, 1: contain, 2: cover

uniform float u_contrast;
uniform float u_highlights;
uniform float u_midtones;

vec3 applyColorCorrection(vec3 color) {
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
    val = max(val, vec3(0.0));
    val = pow(val, vec3(gamma));
    val = mix(val, val * h, step(0.5, val));

    return clamp(val, 0.0, 1.0);
}

// Convert RGB to luminance
float getLuminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

// Calculate UVs based on ObjectFit
vec2 getMediaUV(vec2 uv, float mediaAspect, float canvasAspect) {
    vec2 mediaUV = uv;
    if (u_objectFit == 0) { // Fill
        return vec2(uv.x, 1.0 - uv.y); // Flip Y for GL coords
    }
    
    float ratioX = 1.0;
    float ratioY = 1.0;
    
    // Scale Logic
    if (u_objectFit == 1) { // Contain
        if (canvasAspect > mediaAspect) {
            ratioX = mediaAspect / canvasAspect;
        } else {
            ratioY = canvasAspect / mediaAspect;
        }
    } else { // Cover
         if (canvasAspect > mediaAspect) {
            ratioY = canvasAspect / mediaAspect;
        } else {
            ratioX = mediaAspect / canvasAspect;
        }
    }
    
    // Center the texture
    mediaUV = (uv - 0.5) * vec2(1.0/ratioX, 1.0/ratioY) + 0.5;
    
    // Discard out of bounds pixels (for contain mode)
    if (mediaUV.x < 0.0 || mediaUV.x > 1.0 || mediaUV.y < 0.0 || mediaUV.y > 1.0) {
        return vec2(-1.0);
    }
    
    return vec2(mediaUV.x, 1.0 - mediaUV.y); // Flip Y
}

void main() {
    // 1. Grid Calculation
    vec2 pixelCoord = v_texCoord * u_resolution;
    vec2 gridIndex = floor(pixelCoord / u_gridSize);
    vec2 cellUV = fract(pixelCoord / u_gridSize); // UV within the single character block
    
    // Center of the grid cell in pixel coords for sampling the image
    vec2 cellCenterPixel = (gridIndex * u_gridSize) + (u_gridSize * 0.5);
    vec2 cellCenterUV = cellCenterPixel / u_resolution;
    
    // 2. Sample Media
    float canvasAspect = u_resolution.x / u_resolution.y;
    float mediaAspect = u_mediaResolution.x / u_mediaResolution.y;
    
    vec2 mediaUV = getMediaUV(cellCenterUV, mediaAspect, canvasAspect);
    
    if (mediaUV.x == -1.0) {
        outColor = vec4(u_bgColor, 1.0);
        return;
    }
    
    vec4 mediaColor = texture(u_mediaTexture, mediaUV);
    mediaColor.rgb = applyColorCorrection(mediaColor.rgb);

    // 3. Determine Character
    float luminance = getLuminance(mediaColor.rgb);
    luminance = clamp(luminance, 0.0, 0.99);
    
    float charIndex = floor(luminance * u_numChars);
    
    // 4. Sample Character Atlas
    // Map the current cellUV (0-1) to the specific slice of the atlas texture
    float charStep = 1.0 / u_numChars;
    float atlasU = (charIndex * charStep) + (cellUV.x * charStep);
    float atlasV = cellUV.y; 
    
    vec4 charSample = texture(u_charTexture, vec2(atlasU, atlasV));
    
    // Use alpha channel of text atlas as the shape
    float shape = charSample.a; 
    
    // 5. Final Color
    vec3 fgColor = u_colored ? mediaColor.rgb : u_solidColor;
    vec3 finalColor;
    if (u_filledBlocks) {
        finalColor = mix(fgColor, u_bgColor, shape);
    } else {
        finalColor = mix(u_bgColor, fgColor, shape);
    }
    
    outColor = vec4(finalColor, 1.0);
}
`;

// --- Helpers ---

const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const createProgram = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) => {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
};

const AsciiStudio = ({
  mediaType = "image",
  asciiMode = "standard",
  source,
  objectFit = "contain",
  fontSize = 14,
  colorTheme = "colorful",
  filledBlocks = true,
  contrast = 0,
  highlights = 0,
  midtones = 0,
}: AsciiProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const reqIdRef = useRef<number>(0);

  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const mediaTextureRef = useRef<WebGLTexture | null>(null);
  const charTextureRef = useRef<WebGLTexture | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const charDataRef = useRef<{ width: number; height: number; numChars: number }>({
    width: 0,
    height: 0,
    numChars: 0,
  });
  const renderFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const chars = ASCII_CHARS[asciiMode];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = 1;
    const scaledFontSize = fontSize * dpr;
    ctx.font = `${scaledFontSize}px "Courier New", monospace`;

    const charWidth = ctx.measureText("M").width;
    const charHeight = scaledFontSize * 1.2;

    const totalWidth = Math.ceil(charWidth * chars.length);
    const totalHeight = Math.ceil(charHeight);

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.font = `${scaledFontSize}px "Courier New", monospace`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "white";
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], i * charWidth, 0);
    }

    charDataRef.current = {
      width: charWidth,
      height: charHeight,
      numChars: chars.length
    };

    // Upload to WebGL if ready
    const gl = glRef.current;
    if (gl) {
      if (charTextureRef.current) gl.deleteTexture(charTextureRef.current);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      charTextureRef.current = tex;
    }
  }, [asciiMode, fontSize]);

  // 2. Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { alpha: false });
    if (!gl) return;
    glRef.current = gl;

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;
    programRef.current = program;

    // Cache Uniform Locations
    gl.useProgram(program);
    uniformsRef.current = {
      u_mediaTexture: gl.getUniformLocation(program, "u_mediaTexture"),
      u_charTexture: gl.getUniformLocation(program, "u_charTexture"),
      u_numChars: gl.getUniformLocation(program, "u_numChars"),
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_gridSize: gl.getUniformLocation(program, "u_gridSize"),
      u_colored: gl.getUniformLocation(program, "u_colored"),
      u_filledBlocks: gl.getUniformLocation(program, "u_filledBlocks"),
      u_solidColor: gl.getUniformLocation(program, "u_solidColor"),
      u_bgColor: gl.getUniformLocation(program, "u_bgColor"),
      u_mediaResolution: gl.getUniformLocation(program, "u_mediaResolution"),
      u_objectFit: gl.getUniformLocation(program, "u_objectFit"),
      u_contrast: gl.getUniformLocation(program, "u_contrast"),
      u_highlights: gl.getUniformLocation(program, "u_highlights"),
      u_midtones: gl.getUniformLocation(program, "u_midtones"),
    };

    // Geometry (Fullscreen Quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const texCoordLoc = gl.getAttribLocation(program, "a_texCoord");

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Initial Media Texture
    const mediaTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, mediaTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    mediaTextureRef.current = mediaTex;

    return () => {
      if (gl && program) gl.deleteProgram(program);
    };
  }, []);

  // 3. Render Loop
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const render = () => {
      const program = programRef.current;
      if (!program || !gl) return;

      // --- Upload Media Texture ---
      const sourceElem = mediaType === "video" ? videoRef.current : imageRef.current;
      let mediaW = 1;
      let mediaH = 1;

      if (sourceElem) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, mediaTextureRef.current);

        try {
          if (sourceElem instanceof HTMLVideoElement && sourceElem.readyState >= 2) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElem);
            mediaW = sourceElem.videoWidth;
            mediaH = sourceElem.videoHeight;
          } else if (sourceElem instanceof HTMLImageElement && sourceElem.complete && sourceElem.naturalHeight !== 0) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceElem);
            mediaW = sourceElem.naturalWidth;
            mediaH = sourceElem.naturalHeight;
          }
        } catch (e) {
          // Ignore cross-origin errors during render
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = 1;
        const { width, height } = canvas.getBoundingClientRect();
        const w = width * dpr;
        const h = height * dpr;

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }

      gl.useProgram(program);
      const u = uniformsRef.current;

      gl.uniform1i(u.u_mediaTexture, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, charTextureRef.current);
      gl.uniform1i(u.u_charTexture, 1);

      gl.uniform1f(u.u_numChars, charDataRef.current.numChars);
      gl.uniform2f(u.u_resolution, canvasRef.current!.width, canvasRef.current!.height);
      gl.uniform2f(u.u_gridSize, charDataRef.current.width, charDataRef.current.height);

      const theme = THEME_COLORS[colorTheme];
      gl.uniform1i(u.u_colored, theme.useOriginalColors ? 1 : 0);
      gl.uniform3f(u.u_solidColor, theme.fg[0], theme.fg[1], theme.fg[2]);
      gl.uniform3f(u.u_bgColor, theme.bg[0], theme.bg[1], theme.bg[2]);
      gl.uniform1i(u.u_filledBlocks, filledBlocks ? 1 : 0);

      gl.uniform1f(u.u_contrast, contrast);
      gl.uniform1f(u.u_highlights, highlights);
      gl.uniform1f(u.u_midtones, midtones);
      gl.uniform2f(u.u_mediaResolution, mediaW, mediaH);

      let fitMode = 1; // Contain
      if (objectFit === "fill") fitMode = 0;
      if (objectFit === "cover") fitMode = 2;
      gl.uniform1i(u.u_objectFit, fitMode);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (mediaType === "video") {
        reqIdRef.current = requestAnimationFrame(render);
      }
    };

    // Store render function in ref so it can be called from image onload
    renderFnRef.current = render;

    if (mediaType === "video") {
      render();
    } else {
      // Render once immediately, and hopefully again when image loads via its handler
      render();
    }

    return () => {
      cancelAnimationFrame(reqIdRef.current);
    }
  }, [mediaType, asciiMode, objectFit, fontSize, colorTheme, filledBlocks, contrast, highlights, midtones, source]);

  // 4. Source Handling
  useEffect(() => {
    const video = videoRef.current;

    if (mediaType === "image" && source) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = source;
      img.onload = () => {
        imageRef.current = img;
        // Trigger a redraw after image loads
        renderFnRef.current?.();
      }
    } else {
      imageRef.current = null;
    }

    if (video && mediaType === "video") {
      video.src = source;
      video.play().catch(e => console.log("Autoplay prevented:", e));
    }

  }, [source, mediaType]);

  return (
    <>
      {mediaType === "video" && (
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          loop
          playsInline
          style={{ display: "none" }}
        />
      )}
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

export default AsciiStudio;
