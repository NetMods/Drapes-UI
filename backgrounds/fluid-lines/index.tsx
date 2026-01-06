'use client'
import { useEffect, useRef } from "react"

class PerlinNoise {
  private permutation: number[]
  private p: number[]

  constructor() {
    this.p = new Array(512)
    const permutation = new Array(256)
    for (let i = 0; i < 256; i++) {
      permutation[i] = i
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]]
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i % 256]
    }
    this.permutation = this.p
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)

    const u = x * x * x * (x * (x * 6 - 15) + 10)
    const v = y * y * y * (y * (y * 6 - 15) + 10)

    const A = this.permutation[X] + Y
    const B = this.permutation[X + 1] + Y

    return this.lerp(v,
      this.lerp(u, this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1))
    )
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
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
  rotation?: number // New: 0 to 180 (or 360)
  lineWidth?: number // New: thickness of the lines
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
  gap = 40,
  radius = 250,
  force = 4,
  gravity = 0.2,
  waveSpeed = 8000,
  rotation = 45,
  lineWidth = 0.5,
  mouseInteraction = 'smear',
  effects = "wind"
}: PageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<{ x: number, y: number }>({ x: -1000, y: -1000 })
  const prevMouseRef = useRef<{ x: number, y: number }>({ x: -1000, y: -1000 })
  const pointsRef = useRef<Point[][]>([])
  const noiseGenerator = useRef<PerlinNoise | null>(null)
  const canvasRectRef = useRef<DOMRect | null>(null)

  useEffect(() => {
    if (!noiseGenerator.current) {
      noiseGenerator.current = new PerlinNoise()
    }

    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const radiusSq = radius * radius
    let animationFrameId: number
    let resizeTimeout: NodeJS.Timeout

    // Helper: Degrees to Radians
    const toRad = (deg: number) => (deg * Math.PI) / 180

    const resizeCanvas = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      // Set actual render size (scaled for DPR)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)

      ctx.scale(dpr, dpr)
      canvasRectRef.current = canvas.getBoundingClientRect()

      const diagonal = Math.sqrt(width * width + height * height)
      initPoints(diagonal, diagonal)
    }

    const initPoints = (width: number, height: number) => {
      // Calculate grid relative to center
      const cols = Math.ceil(width / gap) + 2 // Add buffer
      const rows = Math.ceil(height / gap) + 2

      const startX = -(cols * gap) / 2
      const startY = -(rows * gap) / 2

      const newPoints: Point[][] = []

      for (let i = 0; i < cols; i++) {
        const column: Point[] = []
        for (let j = 0; j < rows; j++) {
          column.push({
            x: startX + i * gap,
            y: startY + j * gap,
            dx: 0,
            dy: 0,
            vx: 0,
            vy: 0
          })
        }
        newPoints.push(column)
      }
      pointsRef.current = newPoints
    }

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 200)
    }

    const handleScroll = () => {
      if (canvas) canvasRectRef.current = canvas.getBoundingClientRect()
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvasRectRef.current) return

      const rect = canvasRectRef.current
      const { width, height } = rect

      // 1. Get Mouse relative to center of canvas
      const centerX = width / 2
      const centerY = height / 2
      const rawX = (event.clientX - rect.left) - centerX
      const rawY = (event.clientY - rect.top) - centerY

      // 2. Inverse Rotate the mouse coordinates 
      // This ensures the mouse interacts with the grid as if the grid wasn't rotated visually
      const rad = -toRad(rotation) // Negative for inverse
      const rotatedX = rawX * Math.cos(rad) - rawY * Math.sin(rad)
      const rotatedY = rawX * Math.sin(rad) + rawY * Math.cos(rad)

      prevMouseRef.current = { ...mouseRef.current }
      mouseRef.current = { x: rotatedX, y: rotatedY }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
      prevMouseRef.current = { x: -1000, y: -1000 }
    }

    const updatePoints = () => {
      if (!noiseGenerator.current) return

      const mouseX = mouseRef.current.x
      const mouseY = mouseRef.current.y
      const prevX = prevMouseRef.current.x
      const prevY = prevMouseRef.current.y
      const mouseDeltaX = mouseX - prevX
      const mouseDeltaY = mouseY - prevY

      const now = performance.now()
      const noiseTime = now / waveSpeed
      const orogenyTime = Math.floor(now / 8000) * 8000
      const orogenyAmp = (now % 8000) / 8000

      const grid = pointsRef.current
      const cols = grid.length
      if (cols === 0) return

      const noiseGen = noiseGenerator.current

      for (let i = 0; i < cols; i++) {
        const column = grid[i]
        const rows = column.length
        for (let j = 0; j < rows; j++) {
          const point = column[j]

          // Physics & Noise Logic (Unchanged except using centered coords)
          let noiseValue = 0
          if (effects === "wind") {
            noiseValue = noiseGen.noise(
              (point.x + point.dx) * 0.005 + noiseTime,
              (point.y + point.dy) * 0.005 - noiseTime
            )
            point.vx += noiseValue * -3
            point.vy += noiseValue * 3
          } else if (effects === "waves") {
            noiseValue = noiseGen.noise(
              (point.x) * 0.01 + noiseTime,
              (point.y) * 0.00005 + noiseTime / 10
            )
            point.vx += noiseValue * -3
            point.vy += noiseValue * 3
          } else if (effects === "oregeny") {
            noiseValue = noiseGen.noise(
              point.x * 0.008 + orogenyTime,
              point.y * 0.008 + orogenyTime,
            )
            point.vx = noiseValue * -orogenyAmp
            point.vy = noiseValue * 5 * orogenyAmp
          }

          if (Math.abs(point.x - mouseX) < radius && Math.abs(point.y - mouseY) < radius) {
            const dx = point.x - mouseX
            const dy = point.y - mouseY
            const distSq = dx * dx + dy * dy

            if (distSq < radiusSq) {
              const distance = Math.sqrt(distSq)
              const ratio = 1 - distance / radius

              if (mouseInteraction === "diverge") {
                const ratio3 = ratio * ratio * ratio
                point.vx += (dx > 0 ? 1 : -1) * force * ratio3 * 0.1
                point.vy += (dy > 0 ? 1 : -1) * force * ratio3
              } else if (mouseInteraction === "converge") {
                const ratio2 = ratio * ratio
                point.vx += (mouseX - point.x) * gravity * ratio2
                point.vy += (mouseY - point.y) * gravity * ratio2
              } else if (mouseInteraction === "smear") {
                point.vx += mouseDeltaX * ratio
                point.vy += mouseDeltaY * ratio
                if (point.vx > force) point.vx = force
                if (point.vx < -force) point.vx = -force
                if (point.vy > force) point.vy = force
                if (point.vy < -force) point.vy = -force
              }
            }
          }

          point.vx *= 0.7
          point.vy *= 0.7
          point.vx += point.dx * -0.1
          point.vy += point.dy * -0.1
          point.dx += point.vx
          point.dy += point.vy
        }
      }
    }

    const render = () => {
      // Clear entire canvas (ignoring transform for now)
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform to clear full screen
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      updatePoints()

      ctx.strokeStyle = lineColor
      ctx.lineWidth = lineWidth // Apply custom line width

      // Translate to Center -> Rotate -> Draw
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate(toRad(rotation))

      // When drawing, 0,0 is now the center of the screen
      const grid = pointsRef.current
      if (grid.length > 0) {
        const numCols = grid.length
        const numRows = grid[0].length

        ctx.beginPath()
        for (let r = 0; r < numRows; r++) {
          let firstPoint = true
          for (let c = 0; c < numCols; c++) {
            const point = grid[c][r]
            // Points are already centered around 0,0 via initPoints
            const x = point.x + point.dx
            const y = point.y + point.dy

            if (firstPoint) {
              ctx.moveTo(x, y)
              firstPoint = false
            } else {
              const prevPoint = grid[c - 1][r]
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

      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    resizeCanvas()
    render()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)


    return () => {
      cancelAnimationFrame(animationFrameId)
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [backgroundColor, lineColor, gap, radius, force, gravity, waveSpeed, mouseInteraction, effects, rotation, lineWidth])

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
        backgroundColor
      }}
    />
  )
}

export default FluidLines
