'use client'
import { useEffect, useRef } from "react"

class PerlinNoise {
  private permutation: number[]
  constructor() {
    const p = []
    for (let i = 0; i < 256; i++) {
      p[i] = Math.floor(Math.random() * 256)
    }
    this.permutation = [...p, ...p]
  }
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v)
  }
  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const a = this.permutation[X] + Y
    const aa = this.permutation[a]
    const ab = this.permutation[a + 1]
    const b = this.permutation[X + 1] + Y
    const ba = this.permutation[b]
    const bb = this.permutation[b + 1]
    return this.lerp(v,
      this.lerp(u, this.grad(this.permutation[aa], x, y),
        this.grad(this.permutation[ba], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[ab], x, y - 1),
        this.grad(this.permutation[bb], x - 1, y - 1))
    )
  }
}

interface PageProps {
  backgroundColor?: string
  lineColor?: string
  gap?: number
  radius?: number
  force?: number
  gravity?: number
  waveSpeed?: number
  mouseInteraction?: "diverge" | "converge" | "smear" | "none"
  effects?: "wind" | "waves" | "oregeny" | "none"
}

interface Point {
  x: number
  y: number
  dx: number
  dy: number
  vx: number
  vy: number
}

const FluidLines = ({
  backgroundColor = '#000000',
  lineColor = '#FFFFFF',
  gap = 25,
  radius = 250,
  force = 6,
  gravity = 0.3,
  waveSpeed = 8000,
  mouseInteraction = 'smear',
  effects = "wind"
}: PageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number, y: number }>({ x: -1000, y: -1000 })
  const prevMouseRef = useRef<{ x: number, y: number }>({ x: -1000, y: -1000 })
  const pointsRef = useRef<Point[][]>([])
  const animationRef = useRef<number>(0)
  const noiseGenerator = useRef(new PerlinNoise())

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window
      const dpr = window.devicePixelRatio || 1
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      canvas.style.width = `${innerWidth}px`
      canvas.style.height = `${innerHeight}px`
      ctx.scale(dpr, dpr)
      initPoints()
    }

    const initPoints = () => {
      const { innerWidth, innerHeight } = window
      const cols = Math.ceil(innerWidth / gap)
      const rows = Math.ceil(innerHeight / gap)
      pointsRef.current = []
      for (let i = 0; i <= cols; i++) {
        const column: Point[] = []
        for (let j = 0; j <= rows; j++) {
          column.push({
            x: i * gap,
            y: j * gap,
            dx: 0,
            dy: 0,
            vx: 0,
            vy: 0
          })
        }
        pointsRef.current.push(column)
      }
    }

    resizeCanvas()

    const setMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      prevMouseRef.current = { ...mouseRef.current }
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }

    const setMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
      prevMouseRef.current = { x: -1000, y: -1000 }
    }

    function clamp(value: number, options: { min?: number; max?: number }): number {
      if (options.min !== undefined && value < options.min) return options.min;
      if (options.max !== undefined && value > options.max) return options.max;
      return value;
    }

    const updatePoints = () => {
      const mouseX = mouseRef.current.x
      const mouseY = mouseRef.current.y
      const prevX = prevMouseRef.current.x
      const prevY = prevMouseRef.current.y
      pointsRef.current.forEach((column) => {
        column.forEach((point) => {
          let now = performance.now() / waveSpeed
          let noiseValue;
          switch (effects) {
            case "wind":
              noiseValue = noiseGenerator.current.noise(
                (point.x + point.dx) * 0.005 + now,
                (point.y + point.dy) * 0.005 - now
              )
              point.vx += noiseValue * -3
              point.vy += noiseValue * 3
              break;
            case "waves":
              noiseValue = noiseGenerator.current.noise(
                (point.x) * 0.01 + now,
                (point.y) * 0.00005 + now / 10
              )
              point.vx += noiseValue * -3
              point.vy += noiseValue * 3
              break;
            case "oregeny":
              const timing = 8000
              now = Math.floor(performance.now() / timing) * timing
              const amplitude = (performance.now() % timing) / timing
              noiseValue = noiseGenerator.current.noise(
                point.x * 0.008 + now,
                point.y * 0.008 + now,
              )
              point.vx = noiseValue * -amplitude
              point.vy = noiseValue * 5 * amplitude
              break;
          }
          const dx = point.x - mouseX
          const dy = point.y - mouseY
          const distance = Math.sqrt(dx ** 2 + dy ** 2)
          if (distance < radius) {
            const ratio = 1 - distance / radius
            switch (mouseInteraction) {
              case "diverge":
                const ratio3 = Math.pow(ratio, 3)
                point.vx += Math.sign(point.x - mouseX) * force * ratio3 * 0.1
                point.vy += Math.sign(point.y - mouseY) * force * ratio3
                break
              case "converge":
                const ratio2 = Math.pow(ratio, 2)
                point.vx += (mouseX - point.x) * gravity * ratio2
                point.vy += (mouseY - point.y) * gravity * ratio2
                break
              case "smear":
                const mouseDeltaX = mouseX - prevX
                const mouseDeltaY = mouseY - prevY
                point.vx += clamp(mouseDeltaX * ratio, { min: -force, max: force })
                point.vy += clamp(mouseDeltaY * ratio, { min: -force, max: force })
                break
            }
          }
          point.vx *= 0.7
          point.vy *= 0.7
          point.vx += point.dx * -0.1
          point.vy += point.dy * -0.1
          point.dx += point.vx
          point.dy += point.vy
        })
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      updatePoints()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1
      if (pointsRef.current[0]) {
        for (let rowIndex = 0; rowIndex < pointsRef.current[0].length; rowIndex++) {
          ctx.beginPath()
          for (let colIndex = 0; colIndex < pointsRef.current.length; colIndex++) {
            const point = pointsRef.current[colIndex][rowIndex]
            if (!point) continue
            const x = point.x + point.dx
            const y = point.y + point.dy
            if (colIndex === 0) {
              ctx.moveTo(x, y)
            } else {
              const prevPoint = pointsRef.current[colIndex - 1][rowIndex]
              if (prevPoint) {
                const px = prevPoint.x + prevPoint.dx
                const py = prevPoint.y + prevPoint.dy
                const cx = (px + x) / 2
                const cy = (py + y) / 2
                ctx.quadraticCurveTo(px, py, cx, cy)
              }
            }
          }
          ctx.stroke()
        }
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', setMouseMove)
    window.addEventListener('mouseleave', setMouseLeave)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', setMouseMove)
      window.removeEventListener('mouseleave', setMouseLeave)
    }
  }, [backgroundColor, lineColor, gap, radius, force, gravity, waveSpeed, mouseInteraction, effects]);

  return (
    <canvas
      ref={canvasRef}
    />
  )
}

export default FluidLines
