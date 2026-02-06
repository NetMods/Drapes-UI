'use client';

import { useRef, useEffect } from 'react';

interface SnowfallProps {
  snowflakeCount?: number;
  speed?: number;
  windSpeed?: number;
  color?: string;
  gradientColorTop?: string;
  gradientColorBottom?: string;
  renderScale?: number;
}

const Snowfall = ({
  snowflakeCount = 20,
  speed = 0.4,
  windSpeed = 0.5,
  color = '#ffffff',
  gradientColorTop = '#000000',
  gradientColorBottom = '#0b1026',
  renderScale = 1,
}: SnowfallProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
      : [0, 0, 0];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Removed hardcoded const RENDER_SCALE = 1;

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec3 u_color;
      uniform vec3 u_grad_top;    
      uniform vec3 u_grad_bottom;
      uniform float u_count;
      uniform float u_speed;
      uniform float u_wind;

      void main() {
        vec2 r = u_resolution;
        float t = u_time * u_speed;
        vec2 FC = gl_FragCoord.xy;
        
        // Calculate vertical position (0.0 at bottom, 1.0 at top)
        float v_pos = FC.y / r.y;

        // Mix the two colors based on vertical position
        vec3 bg = mix(u_grad_bottom, u_grad_top, v_pos);
        
        vec4 o = vec4(bg, 1.0);

        float T = 754.0 / 60.0;
        
        for (float i = 0.0; i < 100.0; i++) {
            if (i >= u_count) break;

            float s = 3.0 + i * 5.0; 
            float v = floor((2.0 + sin(i)) * 1.0 / (i + 1.0) * s * T) / T;
            
            vec2 p = (FC.xy / r.x) * s + vec2(sin(t + i) + (t * u_wind), t * v);
            
            vec2 grid = mod(floor(p), 100.0);
            float h = fract(sin(dot(grid, vec2(12.9898, 78.233) + i)) * 43758.5453);
            
            if (h < 0.03) {
                float intensity = smoothstep(0.2, 0.0, length(fract(p) - 0.5 + (h - 0.5) * 0.7));
                if (intensity > 0.0) {
                  o = mix(o, vec4(u_color, 1.0), intensity);
                }
            }
        }

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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

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

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const colorLocation = gl.getUniformLocation(program, 'u_color');

    const gradTopLocation = gl.getUniformLocation(program, 'u_grad_top');
    const gradBottomLocation = gl.getUniformLocation(program, 'u_grad_bottom');

    const countLocation = gl.getUniformLocation(program, 'u_count');
    const speedLocation = gl.getUniformLocation(program, 'u_speed');
    const windLocation = gl.getUniformLocation(program, 'u_wind');

    let animationFrameId: number;
    const startTime = performance.now();

    const render = () => {
      const displayWidth = Math.floor(canvas.clientWidth * renderScale);
      const displayHeight = Math.floor(canvas.clientHeight * renderScale);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }

      const currentTime = (performance.now() - startTime) / 1000;

      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      const rgbColor = hexToRgb(color);
      gl.uniform3f(colorLocation, rgbColor[0], rgbColor[1], rgbColor[2]);

      const rgbTop = hexToRgb(gradientColorTop);
      const rgbBottom = hexToRgb(gradientColorBottom);
      gl.uniform3f(gradTopLocation, rgbTop[0], rgbTop[1], rgbTop[2]);
      gl.uniform3f(gradBottomLocation, rgbBottom[0], rgbBottom[1], rgbBottom[2]);

      gl.uniform1f(countLocation, snowflakeCount);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(windLocation, windSpeed);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [
    color,
    gradientColorTop,
    gradientColorBottom,
    snowflakeCount,
    speed,
    windSpeed,
    renderScale,
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
  );
};

export default Snowfall;
