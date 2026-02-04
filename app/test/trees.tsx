//@ts-nocheck
'use client'
import React, { useRef, useEffect } from 'react';

const WinterScene = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set explicit canvas size for the algorithm to work correctly
    // Dwitter sketches usually target 1920x1080
    canvas.width = 1920;
    canvas.height = 1080;

    let animationFrameId;
    let t = 0;

    const render = () => {
      // Time increment (approx 60fps)
      t += 1 / 60;

      const c = canvas;
      const x = ctx;
      const S = Math.sin;

      // --- Core Logic Start ---

      // "c.width|=j=47" does two things:
      // 1. Resets j to 47 for the loop.
      // 2. Clears the canvas and resets the transformation matrix by modifying width.
      let j = 47;
      c.width |= 0;

      // Loop J (The distinct layers/trees)
      while (j--) {
        // Setup variables for this layer
        let T = 170;
        let s = 1.02;

        // Accumulate scale (zoom effect)
        x.scale(s, s);

        // Loop I (Drawing the parts of the tree and snow)
        // h = base height offset
        // i = iterator
        let h = T + (j ** 6) % T;
        let i = h;
        let w;

        // The inner loop: while w = i-- / 3 is truthy
        while ((w = i-- / 3)) {
          let y = h - i;

          // X Position Calculation
          // Note: The original logic relies heavily on modulo for wrapping
          let X = (j ** 5 - t * T);

          // 1. Draw the Tree (Black Rects)
          // The code uses fillRect implicitly with default black color
          // Math: (X % 2500) - h * y % w - T
          x.fillRect(
            (X % 2500) - (h * y % w) - T,
            460 - y,
            w,
            3 / (j ** 0.6)
          );

          // 2. Draw the Snow (Clear Rects)
          // clearRect erases pixels, making them transparent
          // This creates "white" snow if the CSS background is white
          let r = (i % 5) + 2; // radius/size of snow

          x.clearRect(
            (X + i * T) % 2500 + S(t * 3 + i) * 9,
            (t * 99 + i ** 5) % 460,
            r,
            r
          );
        }
      }
      // --- Core Logic End ---

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#f5f5f5' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          // Important: clearRect makes pixels transparent, so this CSS color 
          // becomes the "snow" and background color.
          backgroundColor: '#f8f9fa'
        }}
      />
    </div>
  );
};

export default WinterScene;
