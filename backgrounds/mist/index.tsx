"use client"
import { useRef, useEffect } from 'react';

const vertexShaderSource = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_scale;
uniform float u_speed;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}
#define NUM_OCTAVES 5
float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}
void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy*u_scale;
    vec3 color = vec3(0.0);
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*u_time*u_speed);
    q.y = fbm( st + vec2(1.0));
    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*u_time*u_speed );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time*u_speed);
    float f = fbm(st+r);
    color = mix(u_color1,
                u_color2,
                clamp((f*f)*4.0,0.0,1.0));
    color = mix(color,
                u_color3,
                clamp(length(q),0.0,1.0));
    color = mix(color,
                u_color4,
                clamp(length(r.x),0.0,1.0));
    gl_FragColor = vec4((f*f*f+.6*f*f+.5*f)*color,1.);
}
`;

interface ShaderProgram {
  program: WebGLProgram;
  locations: {
    position: number;
    resolution: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    scale: WebGLUniformLocation | null;
    speed: WebGLUniformLocation | null;
    color1: WebGLUniformLocation | null;
    color2: WebGLUniformLocation | null;
    color3: WebGLUniformLocation | null;
    color4: WebGLUniformLocation | null;
  };
}

interface ShaderCanvasProps {
  scale?: number;
  speed?: number;
  autoPlay?: boolean;
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
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

const Mist = ({
  scale = 3.0,
  speed = 1.0,
  autoPlay = true,
  color1 = '#1a9eaa',
  color2 = '#aaaaaa',
  color3 = '#00002a',
  color4 = '#aaffff',
}: ShaderCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const shaderProgramRef = useRef<ShaderProgram | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    const createShader = (
      gl: WebGLRenderingContext,
      type: number,
      source: string
    ): WebGLShader | null => {
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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      console.error('Failed to create program');
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    shaderProgramRef.current = {
      program,
      locations: {
        position: positionLocation,
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        mouse: gl.getUniformLocation(program, 'u_mouse'),
        time: gl.getUniformLocation(program, 'u_time'),
        scale: gl.getUniformLocation(program, 'u_scale'),
        speed: gl.getUniformLocation(program, 'u_speed'),
        color1: gl.getUniformLocation(program, 'u_color1'),
        color2: gl.getUniformLocation(program, 'u_color2'),
        color3: gl.getUniformLocation(program, 'u_color3'),
        color4: gl.getUniformLocation(program, 'u_color4'),
      },
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height * 2 - 1);
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

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

    startTimeRef.current = Date.now();

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const rgb3 = hexToRgb(color3);
    const rgb4 = hexToRgb(color4);

    const animate = () => {
      if (!glRef.current || !shaderProgramRef.current) return;

      const gl = glRef.current;
      const { locations } = shaderProgramRef.current;
      const currentTime = autoPlay ? (Date.now() - startTimeRef.current) / 1000 : pausedTimeRef.current;

      if (locations.resolution) {
        gl.uniform2f(locations.resolution, canvas.width, canvas.height);
      }
      if (locations.mouse) {
        gl.uniform2f(locations.mouse, mouseRef.current.x, mouseRef.current.y);
      }
      if (locations.time) {
        gl.uniform1f(locations.time, currentTime);
      }
      if (locations.scale) {
        gl.uniform1f(locations.scale, scale);
      }
      if (locations.speed) {
        gl.uniform1f(locations.speed, speed);
      }
      if (locations.color1) {
        gl.uniform3f(locations.color1, rgb1[0], rgb1[1], rgb1[2]);
      }
      if (locations.color2) {
        gl.uniform3f(locations.color2, rgb2[0], rgb2[1], rgb2[2]);
      }
      if (locations.color3) {
        gl.uniform3f(locations.color3, rgb3[0], rgb3[1], rgb3[2]);
      }
      if (locations.color4) {
        gl.uniform3f(locations.color4, rgb4[0], rgb4[1], rgb4[2]);
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resizeCanvas);
      if (gl && program) {
        gl.deleteProgram(program);
      }
      if (gl && positionBuffer) {
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [scale, speed, autoPlay, color1, color2, color3, color4]);

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
  );
};

export default Mist;
