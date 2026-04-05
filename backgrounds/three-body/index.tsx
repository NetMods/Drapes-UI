'use client'

import { useEffect, useRef } from 'react'

type Rgb = [number, number, number]

type BodyIndex = 0 | 1 | 2

type Triple<T> = [T, T, T]

interface Body {
  x: number
  y: number
  vx: number
  vy: number
  m: number
}

interface Point {
  x: number
  y: number
}

export interface CometConfig {
  color?: string
  mass?: number
  tailWidth?: number
  coreColor?: string
}

export interface ThreeBodyCanvasProps {
  backgroundColor?: string
  speed?: number
  cometWidth?: number
  tailLength?: number
  comets?: Partial<Triple<CometConfig>>
  coreWidth?: number
  coreLength?: number
  coreFade?: number
  mouseAttract?: boolean
  className?: string
  style?: React.CSSProperties
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  const parse = (s: string): number => parseInt(s, 16) || 0
  if (h.length === 3) {
    return [parse(h[0] + h[0]), parse(h[1] + h[1]), parse(h[2] + h[2])]
  }
  return [parse(h.slice(0, 2)), parse(h.slice(2, 4)), parse(h.slice(4, 6))]
}

function hsl2rgb(h: number, s: number, l: number): Rgb {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

function resolveColor(cfg: CometConfig | undefined, baseHue: number, sat: number, lit: number, i: BodyIndex): Rgb {
  return cfg?.color ? hexToRgb(cfg.color) : hsl2rgb(baseHue + i * 120, sat, lit)
}

function resolveMass(cfg: CometConfig | undefined): number {
  const m = cfg?.mass ?? (0.4 + Math.random() * 1.8)
  return Math.min(2.2, Math.max(0.4, m))
}

const BODY_INDICES: Triple<BodyIndex> = [0, 1, 2]

export default function ThreeBody({
  backgroundColor = '#000000',
  speed = 1,
  cometWidth = 14,
  tailLength = 180,
  comets = [],
  coreWidth = 2,
  coreLength = 1,
  coreFade = 0.8,
  mouseAttract = true,
  className,
  style,
}: ThreeBodyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const cometsKey = JSON.stringify(comets)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxOrNull = canvas.getContext('2d')
    if (!ctxOrNull) return
    const ctx: CanvasRenderingContext2D = ctxOrNull
    const G = 3200
    const SOFT2 = 2500
    const PERTURB = 0.06
    const SPEEDMUL = 2.2
    const DT = 0.17 * Math.max(0.1, speed)
    const NSUB = 3
    const TMAX = Math.max(20, Math.round(tailLength * 2))
    const baseHue = Math.random() * 360
    const sat = 0.82 + Math.random() * 0.15
    const lit = 0.58 + Math.random() * 0.14

    const colors: Triple<Rgb> = [
      resolveColor(comets[0], baseHue, sat, lit, 0),
      resolveColor(comets[1], baseHue, sat, lit, 1),
      resolveColor(comets[2], baseHue, sat, lit, 2),
    ]

    const masses: Triple<number> = [
      resolveMass(comets[0]),
      resolveMass(comets[1]),
      resolveMass(comets[2]),
    ]

    const tailWidths: Triple<number> = [
      comets[0]?.tailWidth ?? cometWidth,
      comets[1]?.tailWidth ?? cometWidth,
      comets[2]?.tailWidth ?? cometWidth,
    ]

    const coreColors: Triple<Rgb> = [
      comets[0]?.coreColor ? hexToRgb(comets[0].coreColor) : colors[0],
      comets[1]?.coreColor ? hexToRgb(comets[1].coreColor) : colors[1],
      comets[2]?.coreColor ? hexToRgb(comets[2].coreColor) : colors[2],
    ]

    let W = 0
    let H = 0
    let maxSpd = 0
    let bodies: Triple<Body>
    let trails: Triple<Point[]> = [[], [], []]
    let animId: number | undefined
    let mx = -9999
    let my = -9999

    const onMouseMove = (e: MouseEvent): void => { mx = e.clientX; my = e.clientY }
    if (mouseAttract) document.addEventListener('mousemove', onMouseMove)

    function init(): void {
      if (!canvas) return
      W = canvas.width = canvas.offsetWidth || canvas.clientWidth || 800
      H = canvas.height = canvas.offsetHeight || canvas.clientHeight || 600

      const M = masses[0] + masses[1] + masses[2]
      const a = Math.min(W, H) * (0.30 + Math.random() * 0.22)
      const R = a / 1.732
      const phi = Math.random() * Math.PI * 2
      const omega = Math.sqrt(G * M / (a * a * a))

      const pos: Triple<Point> = [
        { x: W / 2 + R * Math.cos(phi + 0 * 2.094395), y: H / 2 + R * Math.sin(phi + 0 * 2.094395) },
        { x: W / 2 + R * Math.cos(phi + 1 * 2.094395), y: H / 2 + R * Math.sin(phi + 1 * 2.094395) },
        { x: W / 2 + R * Math.cos(phi + 2 * 2.094395), y: H / 2 + R * Math.sin(phi + 2 * 2.094395) },
      ]

      const comX = (pos[0].x * masses[0] + pos[1].x * masses[1] + pos[2].x * masses[2]) / M
      const comY = (pos[0].y * masses[0] + pos[1].y * masses[1] + pos[2].y * masses[2]) / M

      bodies = BODY_INDICES.map((i) => ({
        x: pos[i].x, y: pos[i].y, m: masses[i],
        vx: -omega * (pos[i].y - comY) * (1 + (Math.random() - 0.5) * PERTURB),
        vy: omega * (pos[i].x - comX) * (1 + (Math.random() - 0.5) * PERTURB),
      })) as Triple<Body>

      maxSpd = Math.max(...bodies.map(b => Math.hypot(b.vx, b.vy))) * SPEEDMUL

      const cvx = (bodies[0].vx * masses[0] + bodies[1].vx * masses[1] + bodies[2].vx * masses[2]) / M
      const cvy = (bodies[0].vy * masses[0] + bodies[1].vy * masses[1] + bodies[2].vy * masses[2]) / M
      for (const i of BODY_INDICES) { bodies[i].vx -= cvx; bodies[i].vy -= cvy }

      trails = [[], [], []]
    }

    function physics(): void {
      for (let s = 0; s < NSUB; s++) {
        const ax: Triple<number> = [0, 0, 0]
        const ay: Triple<number> = [0, 0, 0]

        for (const i of BODY_INDICES) {
          for (let j: BodyIndex = (i + 1) as BodyIndex; j < 3; j++) {
            const dx = bodies[j].x - bodies[i].x
            const dy = bodies[j].y - bodies[i].y
            const r2 = dx * dx + dy * dy + SOFT2
            const inv = G / (r2 * Math.sqrt(r2))
            ax[i] += inv * dx * bodies[j].m
            ay[i] += inv * dy * bodies[j].m
            ax[j] -= inv * dx * bodies[i].m
            ay[j] -= inv * dy * bodies[i].m
          }

          const confineR = Math.min(W, H) * 0.42
          const cdx = bodies[i].x - W / 2
          const cdy = bodies[i].y - H / 2
          const cr = Math.hypot(cdx, cdy)
          if (cr > confineR) {
            const overshoot = (cr - confineR) / cr
            ax[i] -= 0.4 * cdx * overshoot * overshoot
            ay[i] -= 0.4 * cdy * overshoot * overshoot
          }

          if (mouseAttract) {
            const mdx = mx - bodies[i].x
            const mdy = my - bodies[i].y
            const mr2 = mdx * mdx + mdy * mdy + 5000
            const mf = G * 0.04 / (mr2 * Math.sqrt(mr2))
            ax[i] += mf * mdx
            ay[i] += mf * mdy
          }
        }

        for (const i of BODY_INDICES) {
          bodies[i].vx += ax[i] * DT
          bodies[i].vy += ay[i] * DT
          bodies[i].x += bodies[i].vx * DT
          bodies[i].y += bodies[i].vy * DT
        }
      }

      for (const b of bodies) {
        const spd = Math.hypot(b.vx, b.vy)
        if (spd > maxSpd) { b.vx = (b.vx / spd) * maxSpd; b.vy = (b.vy / spd) * maxSpd }
      }
      const M = masses[0] + masses[1] + masses[2]
      const comx = (bodies[0].x * bodies[0].m + bodies[1].x * bodies[1].m + bodies[2].x * bodies[2].m) / M
      const comy = (bodies[0].y * bodies[0].m + bodies[1].y * bodies[1].m + bodies[2].y * bodies[2].m) / M
      const cvx = (bodies[0].vx * bodies[0].m + bodies[1].vx * bodies[1].m + bodies[2].vx * bodies[2].m) / M
      const cvy = (bodies[0].vy * bodies[0].m + bodies[1].vy * bodies[1].m + bodies[2].vy * bodies[2].m) / M
      const sx = W / 2 - comx
      const sy = H / 2 - comy
      for (const b of bodies) { b.x += sx; b.y += sy; b.vx -= cvx; b.vy -= cvy }
      for (const t of trails) for (const p of t) { p.x += sx; p.y += sy }

    }

    function draw(): void {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, W, H)

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const i of BODY_INDICES) {
        const t = trails[i]
        if (t.length < 2) continue
        const [r, g, b] = colors[i]
        const n = t.length
        const maxW = tailWidths[i]

        for (let j = 1; j < n; j++) {
          const age = j / n
          const headFade = age > 0.85 ? 1.0 - (age - 0.85) / 0.15 : 1.0
          ctx.globalAlpha = Math.pow(age, 2.5) * 0.45 * headFade
          ctx.lineWidth = maxW
          ctx.strokeStyle = '#ffffff'
          ctx.beginPath()
          ctx.moveTo(t[j - 1]!.x, t[j - 1]!.y)
          ctx.lineTo(t[j]!.x, t[j]!.y)
          ctx.stroke()
        }

        const coreStart = Math.floor(n * (1 - Math.min(1, Math.max(0, coreLength))))
        const [cr, cg, cb] = coreColors[i]
        for (let j = Math.max(coreStart, 1); j < n; j++) {
          const age = (j - coreStart) / (n - coreStart)
          const headAge = j / n
          const headFade = headAge > 0.85 ? 1.0 - (headAge - 0.85) / 0.15 : 1.0
          ctx.globalAlpha = Math.pow(age, coreFade) * headFade
          ctx.lineWidth = coreWidth
          ctx.strokeStyle = `rgb(${cr},${cg},${cb})`
          ctx.beginPath()
          ctx.moveTo(t[j - 1]!.x, t[j - 1]!.y)
          ctx.lineTo(t[j]!.x, t[j]!.y)
          ctx.stroke()
        }
      }

      ctx.globalAlpha = 1
    }

    function frame(): void {
      physics()
      for (const i of BODY_INDICES) {
        trails[i].push({ x: bodies[i].x, y: bodies[i].y })
        if (trails[i].length > TMAX) trails[i].shift()
      }
      draw()
      animId = requestAnimationFrame(frame)
    }
    const ro = new ResizeObserver(() => { init() })
    ro.observe(canvas)

    init()
    animId = requestAnimationFrame(frame)

    return () => {
      if (animId !== undefined) cancelAnimationFrame(animId)
      ro.disconnect()
      if (mouseAttract) document.removeEventListener('mousemove', onMouseMove)
    }
  }, [backgroundColor, speed, cometWidth, tailLength, coreWidth, coreLength, coreFade, mouseAttract, cometsKey]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  )
}
