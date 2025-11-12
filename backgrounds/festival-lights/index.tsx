'use client';

import { useEffect, useRef } from 'react';


type Entrance = 'bottomRight' | 'bottomCenter' | 'bottomLeft';

function rndNum(max: number, min: number = 0, floor: boolean = false) {
  if (floor) return Math.floor(Math.random() * (max - min) + min);
  return Math.random() * (max - min) + min;
}

class Circle {
  public x: number = 0;
  public y: number = 0;
  public radius: number;
  public originalRadius: number;
  public perspectiveRate: number;

  public canvasWidth: number;
  public canvasHeight: number;
  public positionVars: any;
  public ctx: CanvasRenderingContext2D;

  constructor(
    private entrance: Entrance,
    radius: number,
    private gradientColors: [number, string][],
    canvasWidth: number,
    canvasHeight: number,
    originalRadius?: number,
    perspectiveRate: number = 0.1,
    ctx: CanvasRenderingContext2D | null = null
  ) {
    this.radius = radius;
    this.originalRadius = originalRadius ?? radius;
    this.perspectiveRate = perspectiveRate;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    if (!ctx) throw new Error('CanvasRenderingContext2D required');
    this.ctx = ctx;
    this.coordinateXY();
    this.generatePositionVars();
  }

  public coordinateXY(): void {
    switch (this.entrance) {
      case 'bottomRight':
        this.x = rndNum(this.canvasWidth, this.canvasWidth * 1.1);
        this.y = rndNum(this.canvasHeight * 1.1, this.canvasHeight * 1.2);
        break;
      case 'bottomCenter':
        this.x = rndNum(this.canvasWidth / 3, this.canvasWidth / 1.5);
        this.y = rndNum(this.canvasHeight * 1.2, this.canvasHeight * 1.3);
        break;
      case 'bottomLeft':
        this.x = rndNum(-this.canvasWidth * 0.02, -this.canvasWidth * 0.01);
        this.y = rndNum(this.canvasHeight * 1.2, this.canvasHeight * 1.3);
        break;
      default:
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight + this.radius;
    }
  }

  generatePositionVars() {
    this.positionVars = {
      bottomRight: {
        varY: rndNum(5, 2.5),
        varX: rndNum(4, 1.5),
        varR: rndNum(this.radius * 0.007, this.radius * 0.003),
      },
      bottomCenter: {
        varY: rndNum(7, 4.5),
        varX: rndNum(0.5, -0.5),
        varR: rndNum(this.radius * 0.007, this.radius * 0.003),
      },
      bottomLeft: {
        varY: rndNum(5, 2.5),
        varX: rndNum(-3, -6),
        varR: rndNum(this.radius * 0.007, this.radius * 0.003),
      },
    };
  }

  isOutOfView() {
    switch (this.entrance) {
      case 'bottomRight':
        return this.x + this.radius < 0 || this.y + this.radius < 0;
      case 'bottomCenter':
        return this.y + this.radius < 0 || (this.radius < 0 && this.x > this.canvasWidth);
      case 'bottomLeft':
        return this.x + this.radius * 2 < 0 || this.y + this.radius * 2 < 0;
      default:
        return false;
    }
  }

  generateGradient() {
    const circleFill = this.ctx.createRadialGradient(
      this.x,
      this.y,
      this.radius / 2,
      this.x,
      this.y,
      this.radius
    );
    for (const [offset, color] of this.gradientColors) {
      circleFill.addColorStop(offset, color);
    }
    return circleFill;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    this.ctx.strokeStyle = 'transparent';
    this.ctx.fillStyle = this.generateGradient();
    this.ctx.fill();
    this.ctx.stroke();
  }

  calcChangeRate(topOffset: number, rate: number) {
    if (topOffset === 100) return 1;
    return (((topOffset - 100) / 10) * rate) + 1;
  }

  animate() {
    const varY = this.positionVars[this.entrance].varY;
    const varX = this.positionVars[this.entrance].varX;
    const varR = this.positionVars[this.entrance].varR;
    let topOffset = 100;
    if (this.canvasHeight - this.y + this.radius > 0) {
      topOffset = (this.y * 100) / this.canvasHeight;
    }
    const changeRate = this.calcChangeRate(topOffset, this.perspectiveRate);

    this.x -= Math.max(varX * changeRate, varX * 0.3);
    this.y -= Math.max(varY * changeRate, varY * 0.4);

    if (topOffset > 50 && this.radius > this.originalRadius * 0.3) {
      this.radius -= Math.max(varR * changeRate, varR * rndNum(0.5, 0.2));
    } else {
      this.radius -= Math.min(varR * changeRate, varR * rndNum(0.2, 0.15));
    }

    if (this.isOutOfView() || this.radius < 1) {
      this.coordinateXY();
      this.radius = this.originalRadius;
    }
    this.draw();
  }
}


interface FestivalLightsProps {
  numberOfCircles: number;
  radiusMultiplier: number;
  backgroundGradientStart: string,
  backgroundGradientEnd: string
}


const FestivalLights = ({
  numberOfCircles = 50,
  radiusMultiplier = 9,
  backgroundGradientStart = "#1a0003",
  backgroundGradientEnd = '#d58801'
}: FestivalLightsProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas); // was canvas.addEventListener

    const circles: Circle[] = [];

    function drawBackground() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const mainGrd = ctx!.createRadialGradient(
        canvas!.width / 2,
        rndNum(-85, -100),
        1,
        canvas!.width / 2,
        Math.max(canvas!.width, canvas!.height) / 4,
        Math.min(canvas!.width, canvas!.height) * 1.8
      );
      mainGrd.addColorStop(0.4, backgroundGradientStart);
      mainGrd.addColorStop(0, backgroundGradientEnd);
      ctx!.fillStyle = mainGrd;
      ctx!.fillRect(0, 0, canvas!.offsetWidth, canvas!.offsetHeight);
    }

    function addNewCircle() {
      const entrances: Entrance[] = ['bottomRight', 'bottomCenter', 'bottomLeft'];
      const targetEntrance = entrances[rndNum(entrances.length, 0, true)];
      const possibleGradients: [number, string][][] = [
        [
          [0, 'rgba(238,31,148,0.14)'],
          [1, 'rgba(238,31,148,0)'],
        ],
        [
          [0, 'rgba(213,136,1,.2)'],
          [1, 'rgba(213,136,1,0)'],
        ],
        [
          [0.5, 'rgba(213,136,1,.2)'],
          [1, 'rgba(213,136,1,0)'],
        ],
        [
          [0.7, 'rgba(255,254,255,0.07)'],
          [1, 'rgba(255,254,255,0)'],
        ],
        [
          [0.8, 'rgba(255,254,255,0.05)'],
          [0.9, 'rgba(255,254,255,0)'],
        ],
      ];
      const targetGrd = possibleGradients[rndNum(possibleGradients.length, 0, true)];
      const radius = rndNum(Math.min(canvas!.offsetWidth, canvas!.offsetHeight) / radiusMultiplier, Math.min(canvas!.offsetWidth, canvas!.offsetHeight) / (radiusMultiplier + 1));

      const circle = new Circle(
        targetEntrance,
        radius,
        targetGrd,
        canvas!.offsetWidth,
        canvas!.offsetHeight,
        radius,
        0.1,
        ctx
      );
      circles.push(circle);
    }

    for (let i = 0; i < numberOfCircles; i++) addNewCircle();

    let addingInterval = window.setInterval(() => {
      if (circles.length < numberOfCircles) {
        addNewCircle();
      } else {
        clearInterval(addingInterval);
      }
    }, 300);

    let rafId = 0;
    function animateMyWallpaper() {
      rafId = requestAnimationFrame(animateMyWallpaper);
      drawBackground();
      for (let i = 0; i < circles.length; i++) {
        circles[i].animate();
      }
    }
    rafId = requestAnimationFrame(animateMyWallpaper);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafId);
      clearInterval(addingInterval);
    };
  }, [numberOfCircles, radiusMultiplier, backgroundGradientStart, backgroundGradientEnd]);



  return (
    <div className="h-screen w-screen">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: '70%'
        }}
      />
    </div>
  );
};

export default FestivalLights;
