import { useRef, useEffect } from 'react';

const vertexShaderSource = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// Animation / Speed Logic
uniform float u_cycleDuration;
uniform float u_delayTime;
uniform float u_speedRamp;

// Grid
uniform float u_gridSize;
uniform float u_gapPixels; 

// Burn/Ripple Shape
uniform float u_noiseScale;
uniform float u_noiseSpeed;
uniform float u_burnWidth;
uniform float u_distortionStart;
uniform float u_distortionEnd;

// Colors
uniform vec3 u_coreColor;
uniform vec3 u_glowColor;
uniform vec3 u_backgroundColor;

// --- NOISE FUNCTIONS ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 3; i++) {
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uvCorrected = uv;
    uvCorrected.x *= aspect;

    // --- 1. GRID LOGIC ---
    vec2 gridUV = uvCorrected * u_gridSize;
    vec2 gridCell = floor(gridUV);
    vec2 cellLocal = fract(gridUV);
    vec2 cellCenter = (gridCell + 0.5) / u_gridSize;

    // --- 2. BORDER LOGIC (Stepped) ---
    float gridWidth = u_gridSize * aspect;
    float gridHeight = u_gridSize;
    
    float distX = min(gridCell.x, gridWidth - 1.0 - gridCell.x);
    float distY = min(gridCell.y, gridHeight - 1.0 - gridCell.y);
    float minDistToEdge = min(distX, distY);

    float borderSize = 0.0;
    if (minDistToEdge < 1.0) borderSize = 1.0;
    else if (minDistToEdge < 2.0) borderSize = 0.6;
    else if (minDistToEdge < 3.0) borderSize = 0.3;
    else if (minDistToEdge < 4.0) borderSize = 0.1;

    // --- 3. RIPPLE LOGIC ---
    float totalTime = u_cycleDuration + u_delayTime;
    float cycleTime = mod(u_time, totalTime);
    
    // Linear Progress (0.0 to 1.0)
    float rawProgress = cycleTime / u_cycleDuration;
    float isAnimating = step(cycleTime, u_cycleDuration);

    // SPEED RAMP
    float easedProgress = pow(rawProgress, u_speedRamp);

    vec2 center = vec2(0.5 * aspect, 0.5);
    float distToCenter = length(cellCenter - center);

    // DISTORTION RAMP
    float currentDistortion = mix(u_distortionStart, u_distortionEnd, easedProgress);

    // Burning noise
    float noiseVal = fbm(cellCenter * u_noiseScale - u_time * u_noiseSpeed);
    
    // Apply dynamic distortion
    float irregularDist = distToCenter - noiseVal * currentDistortion;

    // Expanding radius
    float currentRadius = easedProgress * 1.5; 
    
    // Calculate distance to the ring "line"
    float distToRing = abs(irregularDist - currentRadius);
    
    // RIPPLE SIZE
    float rippleSize = smoothstep(u_burnWidth, 0.0, distToRing);
    
    // Add "Islands" (sparkles) near the ring
    float islandNoise = snoise(cellCenter * 10.0 + u_time);
    float islands = smoothstep(0.8, 1.0, islandNoise) * smoothstep(0.2, 0.0, abs(irregularDist - currentRadius * 1.1));
    
    rippleSize += islands;
    rippleSize = clamp(rippleSize, 0.0, 1.0);
    
    // --- OPACITY FADING LOGIC ---
    // Fade OUT at the end (from 1.0 to 0.85 progress)
    float fadeOut = smoothstep(1.0, 0.85, rawProgress);
    
    // NEW: Fade IN at the start (from 0.0 to 0.2 progress)
    // This ensures it starts invisible and ramps up to full visibility
    float fadeIn = smoothstep(0.0, 0.2, rawProgress);
    
    // Apply both fades
    rippleSize *= fadeOut * fadeIn * isAnimating;

    // --- 4. COMBINE & DRAW ---
    float targetDotSize = max(borderSize, rippleSize);

    float pixelsPerCell = u_resolution.x / (u_gridSize * aspect);
    float maxDotPixels = pixelsPerCell - u_gapPixels;
    float maxFraction = maxDotPixels / pixelsPerCell;
    maxFraction = clamp(maxFraction, 0.0, 0.95);
    
    float finalSize = targetDotSize * maxFraction;
    
    vec2 d = abs(cellLocal - 0.5);
    float shapeDist = max(d.x, d.y);
    
    float aa = 1.0 / pixelsPerCell;
    float halfSize = finalSize * 0.5;

    float alpha = 0.0;
    if (targetDotSize > 0.001) {
        alpha = smoothstep(halfSize + aa, halfSize, shapeDist);
    }

    // --- 5. COLOR ---
    vec3 color = mix(u_backgroundColor, u_glowColor, alpha * 0.3);
    color = mix(color, u_coreColor, alpha * targetDotSize);
    
    if (rippleSize > 0.1 && alpha > 0.0) {
        color += u_glowColor * 0.4;
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

interface DistortedRippleProps {
  cycleDuration?: number;
  delayTime?: number;
  gridSize?: number;
  gapPixels?: number;
  noiseScale?: number;
  speedRamp?: number;
  distortionStart?: number;
  distortionEnd?: number;
  burnWidth?: number;
  coreColor?: string;
  glowColor?: string;
  backgroundColor?: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ]
    : [0, 0, 0];
};

const DistortedRipple = ({
  cycleDuration = 4.0,
  delayTime = 0.0,
  gridSize = 150.0,
  gapPixels = 2.0,
  noiseScale = 3.0,
  speedRamp = 1.3,
  distortionStart = 0.2,
  distortionEnd = 0.3,
  burnWidth = 0.05,
  coreColor = '#349EE9',
  glowColor = '#01588E',
  backgroundColor = '#000000',
}: DistortedRippleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
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

    const vert = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const frag = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      cycleDuration: gl.getUniformLocation(program, 'u_cycleDuration'),
      delayTime: gl.getUniformLocation(program, 'u_delayTime'),
      speedRamp: gl.getUniformLocation(program, 'u_speedRamp'),
      gridSize: gl.getUniformLocation(program, 'u_gridSize'),
      gapPixels: gl.getUniformLocation(program, 'u_gapPixels'),
      noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
      noiseSpeed: gl.getUniformLocation(program, 'u_noiseSpeed'),
      distortionStart: gl.getUniformLocation(program, 'u_distortionStart'),
      distortionEnd: gl.getUniformLocation(program, 'u_distortionEnd'),
      burnWidth: gl.getUniformLocation(program, 'u_burnWidth'),
      coreColor: gl.getUniformLocation(program, 'u_coreColor'),
      glowColor: gl.getUniformLocation(program, 'u_glowColor'),
      bgColor: gl.getUniformLocation(program, 'u_backgroundColor'),
    };

    const startTime = Date.now();
    const coreRgb = hexToRgb(coreColor);
    const glowRgb = hexToRgb(glowColor);
    const bgRgb = hexToRgb(backgroundColor);

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      const now = (Date.now() - startTime) / 1000;

      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, now);
      gl.uniform1f(locs.cycleDuration, cycleDuration);
      gl.uniform1f(locs.delayTime, delayTime);
      gl.uniform1f(locs.speedRamp, speedRamp);
      gl.uniform1f(locs.gridSize, gridSize);
      gl.uniform1f(locs.gapPixels, gapPixels);
      gl.uniform1f(locs.noiseScale, noiseScale);
      gl.uniform1f(locs.noiseSpeed, 0.05);

      gl.uniform1f(locs.distortionStart, distortionStart);
      gl.uniform1f(locs.distortionEnd, distortionEnd);

      gl.uniform1f(locs.burnWidth, burnWidth);
      gl.uniform3f(locs.coreColor, coreRgb[0], coreRgb[1], coreRgb[2]);
      gl.uniform3f(locs.glowColor, glowRgb[0], glowRgb[1], glowRgb[2]);
      gl.uniform3f(locs.bgColor, bgRgb[0], bgRgb[1], bgRgb[2]);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
    };
  }, [cycleDuration, delayTime, speedRamp, gridSize, gapPixels, noiseScale, distortionStart, distortionEnd, burnWidth, coreColor, glowColor, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  )
};

export default DistortedRipple;
