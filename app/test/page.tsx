'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

type DottedSurfaceProps = React.ComponentProps<'div'> & {
  dotColor?: string;
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

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0.5, 0.5, 0.5];
};

function DottedSurface({ className, dotColor = '#808080', ...props }: DottedSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return;

    const vsSource = `
            attribute vec3 position;
            attribute vec2 gridIndex;
            
            uniform mat4 uProjectionMatrix;
            uniform mat4 uViewMatrix;
            uniform float uTime;
            
            void main() {
                vec3 pos = position;
                
                float y = sin((gridIndex.x + uTime) * 0.3) * 50.0 + sin((gridIndex.y + uTime) * 0.5) * 50.0;
                pos.y = y;

                gl_Position = uProjectionMatrix * uViewMatrix * vec4(pos, 1.0);
                
                gl_PointSize = 8.0 * (1000.0 / gl_Position.w); 
            }
        `;

    const fsSource = `
            precision mediump float;
            uniform vec3 uColor;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                if(length(coord) > 0.5) discard;
                
                gl_FragColor = vec4(uColor, 0.8)
            }
        `;

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
    gl.useProgram(program);

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
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

    const rgb = hexToRgb(dotColor);
    gl.uniform3fv(colorLoc, rgb);

    const viewMatrix = mat4.translate(0, -355, -1220);
    gl.uniformMatrix4fv(viewLoc, false, new Float32Array(viewMatrix));

    let count = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);

      const aspect = window.innerWidth / window.innerHeight;
      const projectionMatrix = mat4.perspective(60 * Math.PI / 180, aspect, 1, 10000);
      gl.uniformMatrix4fv(projLoc, false, new Float32Array(projectionMatrix));
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      count += 0.1;
      gl.uniform1f(timeLoc, count);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, positions.length / 3);

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
  }, [dotColor]);

  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-1', className)} {...props}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
export default DottedSurface;
