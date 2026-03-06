import { useCallback, useEffect, useRef, useState } from 'react'
import { experience } from '../data/portfolio'
import type { Experience } from '../data/portfolio'

type Particle = { x: number; y: number; speed: number; size: number; opacity: number }
type Ring = {
  x: number
  y: number
  radius: number
  collected: boolean
  pulsePhase: number
  exp: Experience
  expIndex: number
  glowIntensity: number
}
type Trail = { x: number; y: number; opacity: number; size: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string }

const PLANE_SIZE = 28
const RING_RADIUS = 65
const COLLECT_DIST = 75
const RING_SPACING = 800
const RING_COLORS = ['#66d7ff', '#9f63ff', '#4bffcb']

export default function CareerFlightGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const gameStateRef = useRef({
    planeX: 0,
    planeY: 0,
    targetX: 0,
    targetY: 0,
    tilt: 0,
    speed: 0,
    particles: [] as Particle[],
    rings: [] as Ring[],
    trails: [] as Trail[],
    sparks: [] as Spark[],
    collected: [] as number[],
    scrollX: 0,
    gameWidth: 0,
    started: false,
    paused: false,
    engineGlow: 0,
    time: 0,
    mouseInCanvas: false,
    canvasW: 0,
    canvasH: 0,
  })

  const [collectedCards, setCollectedCards] = useState<Experience[]>([])
  const [activeCard, setActiveCard] = useState<{ exp: Experience; index: number } | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [allCollected, setAllCollected] = useState(false)

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.width
    const h = canvas.height
    const gs = gameStateRef.current

    gs.canvasW = w
    gs.canvasH = h
    gs.planeX = 100
    gs.planeY = h / 2
    gs.targetX = 100
    gs.targetY = h / 2
    gs.scrollX = 0
    gs.collected = []
    gs.time = 0
    gs.paused = false
    gs.gameWidth = experience.length * RING_SPACING + 600

    gs.particles = []
    for (let i = 0; i < 250; i++) {
      gs.particles.push({
        x: Math.random() * gs.gameWidth * 1.5,
        y: Math.random() * h,
        speed: 0.2 + Math.random() * 1.2,
        size: 0.5 + Math.random() * 2.2,
        opacity: 0.15 + Math.random() * 0.55,
      })
    }

    gs.rings = experience.map((exp, i) => ({
      x: 500 + i * RING_SPACING,
      y: h * 0.25 + Math.sin(i * 2.1 + 0.5) * (h * 0.2) + h * 0.15,
      radius: RING_RADIUS,
      collected: false,
      pulsePhase: i * 0.9,
      exp,
      expIndex: i,
      glowIntensity: 0,
    }))

    gs.trails = []
    gs.sparks = []
    setCollectedCards([])
    setActiveCard(null)
    setAllCollected(false)
  }, [])

  const startGame = useCallback(() => {
    setGameStarted(true)
    gameStateRef.current.started = true
    initGame()
  }, [initGame])

  const dismissCard = useCallback(() => {
    gameStateRef.current.paused = false
    setActiveCard(null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      if (gameStateRef.current.started) initGame()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [initGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseMove = (e: MouseEvent) => {
      if (!gameStateRef.current.started) return
      const rect = canvas.getBoundingClientRect()
      gameStateRef.current.targetX = e.clientX - rect.left
      gameStateRef.current.targetY = e.clientY - rect.top
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!gameStateRef.current.started) return
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      gameStateRef.current.targetX = touch.clientX - rect.left
      gameStateRef.current.targetY = touch.clientY - rect.top
    }

    const onEnter = () => { gameStateRef.current.mouseInCanvas = true }
    const onLeave = () => { gameStateRef.current.mouseInCanvas = false }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('mouseenter', onEnter)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('touchstart', onEnter)
    canvas.addEventListener('touchend', onLeave)

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('mouseenter', onEnter)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('touchstart', onEnter)
      canvas.removeEventListener('touchend', onLeave)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawPlane = (x: number, y: number, tilt: number, glow: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(tilt * 0.15)

      const enginePulse = 0.6 + Math.sin(gameStateRef.current.time * 8) * 0.4
      ctx.shadowBlur = 18 + glow * 12
      ctx.shadowColor = `rgba(102, 215, 255, ${0.5 + enginePulse * 0.3})`

      ctx.beginPath()
      ctx.moveTo(PLANE_SIZE, 0)
      ctx.lineTo(-PLANE_SIZE * 0.7, -PLANE_SIZE * 0.55)
      ctx.lineTo(-PLANE_SIZE * 0.4, 0)
      ctx.lineTo(-PLANE_SIZE * 0.7, PLANE_SIZE * 0.55)
      ctx.closePath()

      const bodyGrad = ctx.createLinearGradient(-PLANE_SIZE, -PLANE_SIZE * 0.5, PLANE_SIZE, PLANE_SIZE * 0.5)
      bodyGrad.addColorStop(0, '#1a3a5c')
      bodyGrad.addColorStop(0.5, '#66d7ff')
      bodyGrad.addColorStop(1, '#9f63ff')
      ctx.fillStyle = bodyGrad
      ctx.fill()
      ctx.strokeStyle = 'rgba(102, 215, 255, 0.8)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-PLANE_SIZE * 0.4, 0)
      ctx.lineTo(-PLANE_SIZE * 0.55, -PLANE_SIZE * 0.22)
      ctx.lineTo(-PLANE_SIZE * 0.7, -PLANE_SIZE * 0.55)
      ctx.moveTo(-PLANE_SIZE * 0.4, 0)
      ctx.lineTo(-PLANE_SIZE * 0.55, PLANE_SIZE * 0.22)
      ctx.lineTo(-PLANE_SIZE * 0.7, PLANE_SIZE * 0.55)
      ctx.strokeStyle = 'rgba(159, 99, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.stroke()

      const thrustLen = (12 + glow * 15) * enginePulse
      const thrustGrad = ctx.createLinearGradient(-PLANE_SIZE * 0.4, 0, -PLANE_SIZE * 0.4 - thrustLen, 0)
      thrustGrad.addColorStop(0, 'rgba(102, 215, 255, 0.9)')
      thrustGrad.addColorStop(0.4, 'rgba(75, 255, 203, 0.6)')
      thrustGrad.addColorStop(1, 'rgba(75, 255, 203, 0)')
      ctx.beginPath()
      ctx.moveTo(-PLANE_SIZE * 0.4, -4)
      ctx.lineTo(-PLANE_SIZE * 0.4 - thrustLen, 0)
      ctx.lineTo(-PLANE_SIZE * 0.4, 4)
      ctx.fillStyle = thrustGrad
      ctx.shadowBlur = 20
      ctx.shadowColor = 'rgba(75, 255, 203, 0.6)'
      ctx.fill()

      ctx.restore()
    }

    const drawRing = (ring: Ring, screenX: number, t: number) => {
      const pulse = Math.sin(t * 2.5 + ring.pulsePhase) * 0.15 + 1
      const r = ring.radius * pulse
      const color = RING_COLORS[ring.expIndex % RING_COLORS.length]

      if (ring.collected) {
        ctx.save()
        ctx.globalAlpha = 0.12 + Math.sin(t * 3) * 0.04
        ctx.beginPath()
        ctx.arc(screenX, ring.y, r * 0.5, 0, Math.PI * 2)
        ctx.strokeStyle = '#4bffcb'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])

        ctx.font = '9px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(75, 255, 203, 0.4)'
        ctx.fillText('COLLECTED', screenX, ring.y + 4)
        ctx.restore()
        return
      }

      ctx.save()

      const glowGrad = ctx.createRadialGradient(screenX, ring.y, r * 0.2, screenX, ring.y, r * 1.6)
      glowGrad.addColorStop(0, `${color}18`)
      glowGrad.addColorStop(0.5, `${color}08`)
      glowGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = glowGrad
      ctx.fillRect(screenX - r * 1.8, ring.y - r * 1.8, r * 3.6, r * 3.6)

      ctx.beginPath()
      ctx.arc(screenX, ring.y, r, 0, Math.PI * 2)
      ctx.strokeStyle = `${color}`
      ctx.globalAlpha = 0.5 + ring.glowIntensity * 0.4
      ctx.lineWidth = 3 + ring.glowIntensity * 2.5
      ctx.shadowBlur = 15 + ring.glowIntensity * 25
      ctx.shadowColor = color
      ctx.stroke()
      ctx.globalAlpha = 1

      ctx.beginPath()
      ctx.arc(screenX, ring.y, r * 0.72, 0, Math.PI * 2)
      ctx.strokeStyle = `${color}55`
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 10
      ctx.shadowColor = `${color}88`
      ctx.stroke()

      for (let i = 0; i < 8; i++) {
        const angle = (t * 0.6 + ring.pulsePhase) + (i * Math.PI * 2) / 8
        const dotX = screenX + Math.cos(angle) * r * 0.86
        const dotY = ring.y + Math.sin(angle) * r * 0.86
        ctx.beginPath()
        ctx.arc(dotX, dotY, 2 + ring.glowIntensity, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(75, 255, 203, ${0.5 + Math.sin(t * 4 + i) * 0.3})`
        ctx.shadowBlur = 6
        ctx.shadowColor = 'rgba(75, 255, 203, 0.8)'
        ctx.fill()
      }

      ctx.shadowBlur = 0

      ctx.font = 'bold 12px "Space Grotesk", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(230, 236, 255, ${0.8 + Math.sin(t * 2) * 0.15})`
      ctx.fillText(ring.exp.company.toUpperCase(), screenX, ring.y - r - 20)

      ctx.font = '11px "Space Grotesk", system-ui, sans-serif'
      ctx.fillStyle = `${color}bb`
      ctx.fillText(ring.exp.role, screenX, ring.y - r - 6)

      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(141, 155, 196, 0.6)'
      ctx.fillText(ring.exp.period, screenX, ring.y + r + 20)

      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.fillStyle = `${color}66`
      ctx.fillText('FLY THROUGH TO UNLOCK', screenX, ring.y + r + 36)

      const arrowPulse = Math.sin(t * 3) * 4
      ctx.strokeStyle = `${color}55`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(screenX - r - 30 - arrowPulse, ring.y)
      ctx.lineTo(screenX - r - 15 - arrowPulse, ring.y - 7)
      ctx.moveTo(screenX - r - 30 - arrowPulse, ring.y)
      ctx.lineTo(screenX - r - 15 - arrowPulse, ring.y + 7)
      ctx.moveTo(screenX - r - 30 - arrowPulse, ring.y)
      ctx.lineTo(screenX - r - 10 - arrowPulse, ring.y)
      ctx.stroke()

      ctx.restore()
    }

    const drawNextIndicator = (gs: typeof gameStateRef.current, w: number, h: number) => {
      const nextRing = gs.rings.find((r) => !r.collected)
      if (!nextRing) return

      const screenX = nextRing.x - gs.scrollX

      if (screenX > w) {
        const t = gs.time
        const arrowX = w - 40
        const arrowY = Math.max(60, Math.min(h - 60, nextRing.y))
        const dist = Math.round((screenX - w) / 10)

        ctx.save()
        ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.2

        ctx.beginPath()
        ctx.moveTo(arrowX + 12, arrowY)
        ctx.lineTo(arrowX, arrowY - 8)
        ctx.lineTo(arrowX, arrowY + 8)
        ctx.closePath()
        ctx.fillStyle = RING_COLORS[nextRing.expIndex % RING_COLORS.length]
        ctx.shadowBlur = 10
        ctx.shadowColor = RING_COLORS[nextRing.expIndex % RING_COLORS.length]
        ctx.fill()

        ctx.shadowBlur = 0
        ctx.font = '9px "JetBrains Mono", monospace'
        ctx.textAlign = 'right'
        ctx.fillStyle = 'rgba(141, 155, 196, 0.7)'
        ctx.fillText(`${nextRing.exp.company}  ${dist}m`, arrowX - 8, arrowY + 4)

        ctx.restore()
      }
    }

    const drawHUD = (w: number, h: number, collected: number, total: number, speed: number, paused: boolean) => {
      ctx.save()

      ctx.fillStyle = 'rgba(4, 5, 11, 0.65)'
      ctx.fillRect(0, 0, w, 55)
      ctx.strokeStyle = 'rgba(102, 215, 255, 0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, 55)
      ctx.lineTo(w, 55)
      ctx.stroke()

      ctx.font = 'bold 11px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(102, 215, 255, 0.7)'
      ctx.textAlign = 'left'
      ctx.fillText('CAREER FLIGHT', 16, 22)

      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(141, 155, 196, 0.6)'
      ctx.fillText('INTERACTIVE EXPERIENCE EXPLORER', 16, 38)

      ctx.font = 'bold 11px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(230, 236, 255, 0.9)'
      ctx.textAlign = 'center'
      ctx.fillText(`MILESTONES: ${collected} / ${total}`, w / 2, 22)

      const barW = 180
      const barX = w / 2 - barW / 2
      const barY = 33
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.fillRect(barX, barY, barW, 7)
      ctx.strokeStyle = 'rgba(102, 215, 255, 0.15)'
      ctx.lineWidth = 0.5
      ctx.strokeRect(barX, barY, barW, 7)

      for (let i = 0; i < total; i++) {
        const segW = barW / total
        const sx = barX + i * segW
        if (i < collected) {
          const segGrad = ctx.createLinearGradient(sx, 0, sx + segW, 0)
          segGrad.addColorStop(0, RING_COLORS[i % RING_COLORS.length])
          segGrad.addColorStop(1, RING_COLORS[(i + 1) % RING_COLORS.length])
          ctx.fillStyle = segGrad
          ctx.fillRect(sx + 1, barY + 1, segW - 2, 5)
          ctx.shadowBlur = 6
          ctx.shadowColor = RING_COLORS[i % RING_COLORS.length]
          ctx.fillRect(sx + 1, barY + 1, segW - 2, 5)
          ctx.shadowBlur = 0
        }
      }

      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(75, 255, 203, 0.6)'
      ctx.textAlign = 'right'
      ctx.fillText(`SPD ${speed.toFixed(1)}x`, w - 16, 22)

      if (paused) {
        ctx.font = 'bold 9px "JetBrains Mono", monospace'
        ctx.fillStyle = 'rgba(255, 107, 138, 0.8)'
        ctx.fillText('PAUSED — READ MILESTONE', w - 16, 38)
      }

      ctx.fillStyle = 'rgba(4, 5, 11, 0.55)'
      ctx.fillRect(0, h - 30, w, 30)
      ctx.strokeStyle = 'rgba(102, 215, 255, 0.08)'
      ctx.beginPath()
      ctx.moveTo(0, h - 30)
      ctx.lineTo(w, h - 30)
      ctx.stroke()

      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(141, 155, 196, 0.45)'
      ctx.textAlign = 'center'
      ctx.fillText('MOVE MOUSE TO FLY  //  MOVE RIGHT TO ADVANCE  //  FLY THROUGH PORTALS TO UNLOCK', w / 2, h - 11)

      ctx.restore()
    }

    const loop = () => {
      const gs = gameStateRef.current
      const w = canvas.width
      const h = canvas.height

      if (!gs.started) {
        ctx.clearRect(0, 0, w, h)

        const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
        bgGrad.addColorStop(0, '#04050b')
        bgGrad.addColorStop(0.5, '#0a0f20')
        bgGrad.addColorStop(1, '#04050b')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, w, h)

        for (let i = 0; i < 80; i++) {
          const sx = (Math.sin(i * 7.3) * 0.5 + 0.5) * w
          const sy = (Math.cos(i * 4.1) * 0.5 + 0.5) * h
          ctx.beginPath()
          ctx.arc(sx, sy, 0.5 + (i % 3) * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(102, 215, 255, ${0.08 + (i % 5) * 0.06})`
          ctx.fill()
        }

        ctx.font = 'bold 26px "Space Grotesk", system-ui'
        ctx.fillStyle = '#66d7ff'
        ctx.textAlign = 'center'
        ctx.shadowBlur = 25
        ctx.shadowColor = 'rgba(102, 215, 255, 0.6)'
        ctx.fillText('CAREER FLIGHT', w / 2, h / 2 - 50)
        ctx.shadowBlur = 0

        ctx.font = '14px "Space Grotesk", system-ui'
        ctx.fillStyle = 'rgba(230, 236, 255, 0.75)'
        ctx.fillText('Pilot your ship through the portals', w / 2, h / 2 - 15)
        ctx.fillText('to unlock each career milestone', w / 2, h / 2 + 5)

        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillStyle = 'rgba(141, 155, 196, 0.55)'
        ctx.fillText(`${experience.length} milestones to discover`, w / 2, h / 2 + 35)

        ctx.font = 'bold 14px "Space Grotesk", system-ui'
        const blink = Math.sin(Date.now() * 0.004) > 0
        if (blink) {
          ctx.fillStyle = 'rgba(75, 255, 203, 0.85)'
          ctx.shadowBlur = 12
          ctx.shadowColor = 'rgba(75, 255, 203, 0.4)'
          ctx.fillText('[ CLICK TO LAUNCH ]', w / 2, h / 2 + 70)
          ctx.shadowBlur = 0
        }

        animRef.current = requestAnimationFrame(loop)
        return
      }

      gs.time += 0.016

      if (!gs.paused && gs.mouseInCanvas) {
        const mouseNormX = gs.targetX / w
        const forwardSpeed = Math.max(0, (mouseNormX - 0.2) * 3.5)
        gs.speed += (forwardSpeed - gs.speed) * 0.06
      } else if (gs.paused) {
        gs.speed *= 0.92
        if (gs.speed < 0.01) gs.speed = 0
      } else {
        gs.speed *= 0.96
      }

      gs.scrollX += gs.speed

      gs.planeX += (gs.targetX - gs.planeX) * 0.07
      gs.planeY += (gs.targetY - gs.planeY) * 0.07
      const dy = gs.targetY - gs.planeY
      gs.tilt += (dy * 0.018 - gs.tilt) * 0.08

      gs.engineGlow += ((gs.speed > 1.5 ? 1 : 0.2) - gs.engineGlow) * 0.08

      if (!gs.paused && gs.speed > 0.3) {
        gs.trails.push({
          x: gs.planeX - PLANE_SIZE * 0.4 + gs.scrollX,
          y: gs.planeY + (Math.random() - 0.5) * 6,
          opacity: 0.4 + gs.speed * 0.05,
          size: 2 + Math.random() * 3,
        })
      }

      gs.trails = gs.trails.filter((t) => {
        t.opacity -= 0.01
        t.size *= 0.985
        return t.opacity > 0
      })

      gs.sparks = gs.sparks.filter((s) => {
        s.x += s.vx
        s.y += s.vy
        s.life -= 0.018
        s.vy += 0.03
        return s.life > 0
      })

      if (!gs.paused) {
        gs.rings.forEach((ring, i) => {
          if (ring.collected) return
          const screenRingX = ring.x - gs.scrollX
          const dx = gs.planeX - screenRingX
          const dyR = gs.planeY - ring.y
          const dist = Math.sqrt(dx * dx + dyR * dyR)

          ring.glowIntensity += ((dist < COLLECT_DIST * 2.5 ? 1 : 0) - ring.glowIntensity) * 0.06

          if (dist < COLLECT_DIST) {
            ring.collected = true
            gs.collected.push(i)
            gs.paused = true

            for (let s = 0; s < 40; s++) {
              const angle = (s / 40) * Math.PI * 2
              const spd = 1.5 + Math.random() * 4
              gs.sparks.push({
                x: screenRingX + gs.scrollX,
                y: ring.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 0.7 + Math.random() * 0.6,
                color: [RING_COLORS[ring.expIndex % 3], '#4bffcb', '#ff6b8a', '#ffb732'][Math.floor(Math.random() * 4)],
              })
            }

            setCollectedCards((prev) => [...prev, ring.exp])
            setActiveCard({ exp: ring.exp, index: ring.expIndex })

            if (gs.collected.length === experience.length) {
              setTimeout(() => setAllCollected(true), 500)
            }
          }
        })
      }

      ctx.clearRect(0, 0, w, h)

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, '#04050b')
      bgGrad.addColorStop(0.3, '#08101f')
      bgGrad.addColorStop(0.7, '#0a0f24')
      bgGrad.addColorStop(1, '#04050b')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      gs.particles.forEach((p) => {
        let px = p.x - gs.scrollX * p.speed * 0.25
        px = ((px % w) + w) % w
        ctx.beginPath()
        ctx.arc(px, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(102, 215, 255, ${p.opacity * 0.35})`
        ctx.fill()
      })
      ctx.restore()

      const gridSpacing = 80
      ctx.save()
      ctx.globalAlpha = 0.035
      ctx.strokeStyle = '#66d7ff'
      ctx.lineWidth = 0.5
      const offsetX = -(gs.scrollX * 0.2) % gridSpacing
      for (let x = offsetX; x < w; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, h * 0.75)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = h * 0.75; y < h; y += gridSpacing * 0.5) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.restore()

      gs.trails.forEach((t) => {
        const tx = t.x - gs.scrollX
        if (tx > -10 && tx < w + 10) {
          ctx.beginPath()
          ctx.arc(tx, t.y, t.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(75, 255, 203, ${t.opacity * 0.35})`
          ctx.fill()
        }
      })

      gs.sparks.forEach((s) => {
        const sx = s.x - gs.scrollX
        if (sx > -10 && sx < w + 10) {
          ctx.beginPath()
          ctx.arc(sx, s.y, 2.5 * s.life, 0, Math.PI * 2)
          ctx.fillStyle = s.color
          ctx.globalAlpha = s.life
          ctx.shadowBlur = 8
          ctx.shadowColor = s.color
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.shadowBlur = 0
        }
      })

      gs.rings.forEach((ring) => {
        const screenX = ring.x - gs.scrollX
        if (screenX > -120 && screenX < w + 120) {
          drawRing(ring, screenX, gs.time)
        }
      })

      drawPlane(gs.planeX, gs.planeY, gs.tilt, gs.engineGlow)
      drawNextIndicator(gs, w, h)
      drawHUD(w, h, gs.collected.length, experience.length, gs.speed, gs.paused)

      if (gs.scrollX > gs.gameWidth) {
        gs.scrollX = gs.gameWidth
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="flight-game-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="flight-canvas"
        onClick={() => {
          if (!gameStarted) startGame()
          else if (activeCard) dismissCard()
        }}
      />

      {activeCard && (
        <div className="flight-card-popup glass" key={activeCard.exp.company}>
          <div className="flight-card-accent" />
          <span className="flight-card-tag">MILESTONE {activeCard.index + 1} OF {experience.length} UNLOCKED</span>
          <h4 className="flight-card-company">{activeCard.exp.company}</h4>
          <p className="flight-card-role">{activeCard.exp.role}</p>
          <p className="flight-card-period">{activeCard.exp.period}</p>
          <p className="flight-card-detail">{activeCard.exp.detail}</p>
          <button type="button" className="flight-card-continue" onClick={dismissCard}>
            Continue Flight &rarr;
          </button>
        </div>
      )}

      {allCollected && !activeCard && (
        <div className="flight-complete glass">
          <div className="flight-complete-glow" />
          <span className="flight-complete-tag">ALL MILESTONES COLLECTED</span>
          <h4 className="flight-complete-title">Journey Complete</h4>
          <div className="flight-complete-summary">
            {experience.map((exp, i) => (
              <div key={exp.company} className="flight-summary-item">
                <span className="flight-summary-dot" style={{ background: RING_COLORS[i % RING_COLORS.length] }} />
                <div>
                  <strong>{exp.company}</strong> — {exp.role}
                  <br />
                  <span className="flight-summary-detail">{exp.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {collectedCards.length > 0 && !activeCard && !allCollected && (
        <div className="flight-collected-bar">
          {collectedCards.map((c, i) => (
            <div key={c.company} className="flight-collected-chip">
              <span className="collected-dot" style={{ background: RING_COLORS[i % RING_COLORS.length] }} />
              {c.company}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
