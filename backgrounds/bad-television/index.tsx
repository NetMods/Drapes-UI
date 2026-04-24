"use client";

import { useEffect, useRef, useEffectEvent } from "react";

export type MediaType = "image" | "video";
export type ObjectFit = "contain" | "cover" | "fill";

interface BadTelevisionProps {
  mediaType: MediaType;
  source: string;
  objectFit: ObjectFit;
  effectIntensity: number;
  distortion: number;
  noise: number;
  speed: number;
  scanlines: number;
  rgbShift: number;
  vignette: number;
  flicker: number;
  rollingBar: number;
  brightness: number;
  contrast: number;
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

  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform vec2 u_textureSize;
  uniform float u_time;
  uniform int u_objectFit;
  uniform float u_effectIntensity;
  uniform float u_distortion;
  uniform float u_noise;
  uniform float u_speed;
  uniform float u_scanlines;
  uniform float u_rgbShift;
  uniform float u_vignette;
  uniform float u_flicker;
  uniform float u_rollingBar;
  uniform float u_brightness;
  uniform float u_contrast;

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

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise2d(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float t = u_time * u_speed;
    vec2 uv = v_texCoord;

    // Apply object fit
    vec2 fitUV = applyObjectFit(uv);

    // Distortion: wavy horizontal displacement
    float distAmt = u_distortion * u_effectIntensity * 0.03;
    float wave1 = sin(uv.y * 15.0 + t * 3.0) * distAmt;
    float wave2 = sin(uv.y * 30.0 + t * 5.0) * distAmt * 0.5;
    float wave3 = sin(uv.y * 80.0 + t * 7.0) * distAmt * 0.25;

    // Occasional glitch jumps
    float glitchLine = step(0.98, hash(vec2(floor(t * 4.0), floor(uv.y * 20.0))));
    float glitchOffset = glitchLine * (hash(vec2(floor(t * 8.0), 1.0)) - 0.5) * 0.08 * u_distortion * u_effectIntensity;

    vec2 distortedUV = fitUV + vec2(wave1 + wave2 + wave3 + glitchOffset, 0.0);

    // Out of bounds check - show black
    if (isOutOfBounds(fitUV)) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // RGB shift / chromatic aberration
    float shiftAmt = u_rgbShift * u_effectIntensity * 0.008;
    float shiftVar = sin(t * 2.0) * 0.5 + 0.5;
    float shift = shiftAmt * (0.5 + shiftVar * 0.5);

    vec2 rUV = distortedUV + vec2(shift, 0.0);
    vec2 gUV = distortedUV;
    vec2 bUV = distortedUV - vec2(shift, 0.0);

    float r = texture2D(u_texture, clamp(rUV, 0.0, 1.0)).r;
    float g = texture2D(u_texture, clamp(gUV, 0.0, 1.0)).g;
    float b = texture2D(u_texture, clamp(bUV, 0.0, 1.0)).b;

    vec3 color = vec3(r, g, b);

    // Brightness & contrast
    float br = u_brightness / 100.0;
    color += br;
    float ct = (u_contrast / 100.0) + 1.0;
    color = (color - 0.5) * ct + 0.5;

    // Scanlines
    float scanFreq = u_resolution.y * 0.5;
    float scanline = sin(gl_FragCoord.y * 3.14159 * 2.0 / max(scanFreq * 0.01, 1.0)) * 0.5 + 0.5;
    color *= 1.0 - u_scanlines * u_effectIntensity * scanline * 0.4;

    // Rolling bar
    if (u_rollingBar > 0.0) {
      float barPos = fract(t * 0.15);
      float barY = 1.0 - uv.y;
      float barDist = abs(barY - barPos);
      barDist = min(barDist, 1.0 - barDist);
      float bar = smoothstep(0.05, 0.0, barDist);
      color *= 1.0 - bar * u_rollingBar * u_effectIntensity * 0.6;
    }

    // Flicker
    float flickerVal = sin(t * 12.0) * sin(t * 7.3) * sin(t * 3.7);
    color *= 1.0 + flickerVal * u_flicker * u_effectIntensity * 0.08;

    // Noise / static grain
    float noiseVal = hash(uv * u_resolution + vec2(t * 100.0, t * 57.0));
    float noiseStrength = u_noise * u_effectIntensity;
    color += (noiseVal - 0.5) * noiseStrength * 0.3;

    // Occasional horizontal noise bands
    float noiseBand = step(0.97, hash(vec2(floor(t * 6.0), floor(uv.y * 40.0))));
    color += noiseBand * (hash(vec2(uv.x * 100.0, t)) - 0.5) * noiseStrength * 0.5;

    // Vignette
    vec2 vigUV = uv - 0.5;
    float vig = 1.0 - dot(vigUV, vigUV) * 2.0;
    vig = clamp(vig, 0.0, 1.0);
    vig = pow(vig, 0.6);
    color *= mix(1.0, vig, u_vignette * u_effectIntensity);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

const BadTelevision = ({
  mediaType = 'image',
  source,
  objectFit = 'cover',
  effectIntensity = 0.5,
  distortion = 0.5,
  noise = 0.5,
  speed = 1,
  scanlines = 0.3,
  rgbShift = 0.3,
  vignette = 0.3,
  flicker = 0.2,
  rollingBar = 0.0,
  brightness = 0,
  contrast = 0,
}: BadTelevisionProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const startTimeRef = useRef<number>(0);
  const mediaTypeRef = useRef(mediaType);
  mediaTypeRef.current = mediaType;

  const onDraw = useEffectEvent(() => {
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

    const dpr = 1;
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

    const elapsed = (performance.now() - startTimeRef.current) / 1000.0;

    gl.uniform1i(uniforms.u_texture, 0);
    gl.uniform2f(uniforms.u_resolution, width, height);
    gl.uniform2f(uniforms.u_textureSize, srcW, srcH);
    gl.uniform1f(uniforms.u_time, elapsed);
    gl.uniform1i(uniforms.u_objectFit, objectFit === 'contain' ? 0 : objectFit === 'cover' ? 1 : 2);
    gl.uniform1f(uniforms.u_effectIntensity, effectIntensity);
    gl.uniform1f(uniforms.u_distortion, distortion);
    gl.uniform1f(uniforms.u_noise, noise);
    gl.uniform1f(uniforms.u_speed, speed);
    gl.uniform1f(uniforms.u_scanlines, scanlines);
    gl.uniform1f(uniforms.u_rgbShift, rgbShift);
    gl.uniform1f(uniforms.u_vignette, vignette);
    gl.uniform1f(uniforms.u_flicker, flicker);
    gl.uniform1f(uniforms.u_rollingBar, rollingBar);
    gl.uniform1f(uniforms.u_brightness, brightness);
    gl.uniform1f(uniforms.u_contrast, contrast);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });

  const onResize = useEffectEvent(() => { });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const compileShader = (type: number, source: string) => {
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

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
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
      u_texture: gl.getUniformLocation(program, 'u_texture'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_textureSize: gl.getUniformLocation(program, 'u_textureSize'),
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_objectFit: gl.getUniformLocation(program, 'u_objectFit'),
      u_effectIntensity: gl.getUniformLocation(program, 'u_effectIntensity'),
      u_distortion: gl.getUniformLocation(program, 'u_distortion'),
      u_noise: gl.getUniformLocation(program, 'u_noise'),
      u_speed: gl.getUniformLocation(program, 'u_speed'),
      u_scanlines: gl.getUniformLocation(program, 'u_scanlines'),
      u_rgbShift: gl.getUniformLocation(program, 'u_rgbShift'),
      u_vignette: gl.getUniformLocation(program, 'u_vignette'),
      u_flicker: gl.getUniformLocation(program, 'u_flicker'),
      u_rollingBar: gl.getUniformLocation(program, 'u_rollingBar'),
      u_brightness: gl.getUniformLocation(program, 'u_brightness'),
      u_contrast: gl.getUniformLocation(program, 'u_contrast'),
    };

    textureRef.current = gl.createTexture();
    startTimeRef.current = performance.now();

    const handleResize = () => onResize();
    window.addEventListener('resize', handleResize);

    // Always animate - the CRT effect needs continuous time updates
    const loop = () => {
      onDraw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Source loading effect
  useEffect(() => {
    const video = videoRef.current;

    if (mediaType === 'image' && source) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
      };
      img.src = source;

      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    }

    if (mediaType === 'video' && source && video) {
      video.src = source;
      video.load();
      const handleLoadedData = () => {
        video.play().catch(e => console.error(e));
      };
      video.addEventListener('loadeddata', handleLoadedData, { once: true });
      if (video.readyState >= 2) {
        video.play().catch(e => console.error(e));
      }
      return () => video.removeEventListener('loadeddata', handleLoadedData);
    }
  }, [mediaType, source]);

  return (
    <>
      <video
        ref={videoRef}
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

export default BadTelevision;
