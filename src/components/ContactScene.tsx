import { Canvas, useFrame } from '@react-three/fiber'
import { memo, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferGeometry, CanvasTexture, Float32BufferAttribute } from 'three'
import type { Group, LineSegments, Mesh, Points as PointsType } from 'three'

type SceneProps = { mouse: { x: number; y: number }; sending: boolean }

type PanelSnippet = { title: string; lines: string[] }

const CONTACT_SNIPPETS: PanelSnippet[] = [
  {
    title: 'contact.ts',
    lines: ['const channel = secure()', 'channel.link("github")', 'channel.link("linkedin")', 'channel.send(payload)'],
  },
  {
    title: 'profile.json',
    lines: ['"role": "Software Engineer"', '"focus": "AI + Product"', '"status": "Open to collaborate"', '"response": "< 24h"'],
  },
  {
    title: 'pipeline.yaml',
    lines: ['discover: true', 'design: intentional', 'build: production-ready', 'ship: continuously'],
  },
]

const PANEL_LAYOUTS: { position: [number, number, number]; rotation: [number, number, number] }[] = [
  { position: [-2.7, 1.35, -2.35], rotation: [0.02, 0.42, 0.01] },
  { position: [2.75, -0.4, -2.65], rotation: [-0.01, -0.34, -0.01] },
  { position: [-1.6, -1.7, -3.25], rotation: [0.07, 0.19, 0.03] },
]

function buildPanelTexture(snippet: PanelSnippet): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 720
  canvas.height = 420
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height)
  bg.addColorStop(0, '#0a1422')
  bg.addColorStop(1, '#060d17')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#131f31'
  ctx.fillRect(0, 0, canvas.width, 46)
  ctx.fillStyle = 'rgba(130, 186, 228, 0.95)'
  ctx.font = '600 18px "JetBrains Mono", monospace'
  ctx.fillText(snippet.title, 18, 29)

  const dots = ['#6bc6ff', '#7ef0d4', '#f4c378']
  dots.forEach((color, i) => {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(canvas.width - 24 - i * 16, 23, 5, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.strokeStyle = 'rgba(115, 168, 210, 0.25)'
  ctx.lineWidth = 1
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

  ctx.font = '500 19px "JetBrains Mono", monospace'
  snippet.lines.forEach((line, i) => {
    const y = 88 + i * 64
    ctx.fillStyle = 'rgba(130, 160, 194, 0.78)'
    ctx.fillText(`${i + 1}`.padStart(2, '0'), 20, y)
    ctx.fillStyle = i % 2 === 0 ? '#9ac6e5' : '#8be6cf'
    ctx.fillText(line, 68, y)
    ctx.strokeStyle = 'rgba(95, 132, 166, 0.22)'
    ctx.beginPath()
    ctx.moveTo(18, y + 17)
    ctx.lineTo(canvas.width - 18, y + 17)
    ctx.stroke()
  })

  return canvas
}

function CoreHub({ mouse, sending }: SceneProps) {
  const rootRef = useRef<Group>(null)
  const frameRef = useRef<Mesh>(null)
  const spinRef = useRef<Mesh>(null)
  const coreRef = useRef<Mesh>(null)
  const beamRef = useRef<Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    if (rootRef.current) {
      rootRef.current.rotation.y = t * 0.09 + mouse.x * 0.2
      rootRef.current.rotation.x = mouse.y * 0.05
      rootRef.current.position.y = Math.sin(t * 0.45) * 0.04 + mouse.y * 0.08
    }

    if (frameRef.current) {
      frameRef.current.rotation.z = t * 0.14
    }

    if (spinRef.current) {
      spinRef.current.rotation.z = -t * 0.3
    }

    if (coreRef.current) {
      const pulse = sending ? 1.08 + Math.sin(t * 7) * 0.08 : 1 + Math.sin(t * 2.1) * 0.03
      coreRef.current.scale.setScalar(pulse)
    }

    if (beamRef.current) {
      beamRef.current.visible = sending
      if (sending) {
        beamRef.current.scale.y = 2 + Math.sin(t * 6.5) * 0.2
      }
    }
  })

  return (
    <group ref={rootRef} position={[0, 0.1, 0]}>
      <mesh ref={frameRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.28, 0.035, 16, 120]} />
        <meshStandardMaterial
          color="#95b7d1"
          emissive="#2f89c4"
          emissiveIntensity={0.35}
          roughness={0.3}
          metalness={0.75}
        />
      </mesh>

      <mesh ref={spinRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 0.95, 64]} />
        <meshBasicMaterial color="#67bfe9" transparent opacity={0.28} />
      </mesh>

      <mesh ref={coreRef}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial
          color={sending ? '#d6fff0' : '#dbe9f3'}
          emissive={sending ? '#4eeec2' : '#4ba7df'}
          emissiveIntensity={sending ? 1.6 : 0.9}
          roughness={0.24}
          metalness={0.55}
        />
      </mesh>

      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.48, 0.56, 0.2, 8]} />
        <meshStandardMaterial
          color="#1a2a3d"
          emissive="#12304d"
          emissiveIntensity={0.28}
          roughness={0.48}
          metalness={0.45}
        />
      </mesh>

      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.55, -0.15, Math.sin(a) * 0.55]}>
            <boxGeometry args={[0.08, 0.16, 0.08]} />
            <meshStandardMaterial
              color="#7ea6c4"
              emissive="#2d6f9f"
              emissiveIntensity={0.3}
              roughness={0.35}
              metalness={0.6}
            />
          </mesh>
        )
      })}

      <mesh ref={beamRef} position={[0, 1.25, 0]} visible={false}>
        <cylinderGeometry args={[0.02, 0.11, 2.5, 8]} />
        <meshStandardMaterial
          color="#86f5dc"
          emissive="#63efcf"
          emissiveIntensity={1.7}
          transparent
          opacity={0.45}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function ModuleRing({ sending }: { sending: boolean }) {
  const modulesRef = useRef<(Group | null)[]>([])
  const modules = useMemo(
    () => [
      { a: 0.0, r: 2.25, y: 0.4, speed: 0.1, color: '#7bc9f2' },
      { a: 1.2, r: 2.55, y: -0.2, speed: 0.08, color: '#85d3ff' },
      { a: 2.35, r: 2.1, y: 0.5, speed: 0.12, color: '#87f1d5' },
      { a: 3.5, r: 2.4, y: -0.35, speed: 0.09, color: '#9ebfe2' },
      { a: 4.8, r: 2.3, y: 0.18, speed: 0.1, color: '#f1c175' },
    ],
    [],
  )

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    modules.forEach((m, i) => {
      const mesh = modulesRef.current[i]
      if (!mesh) return
      const a = m.a + t * m.speed * (sending ? 1.8 : 1)
      mesh.position.x = Math.cos(a) * m.r
      mesh.position.z = Math.sin(a) * m.r
      mesh.position.y = m.y + Math.sin(t * 0.5 + i) * 0.08
      mesh.rotation.y = -a + Math.PI / 2
    })
  })

  return (
    <group>
      {modules.map((m, i) => (
        <group
          key={i}
          ref={(el) => {
            modulesRef.current[i] = el
          }}
          position={[Math.cos(m.a) * m.r, m.y, Math.sin(m.a) * m.r]}
        >
          <mesh>
            <boxGeometry args={[0.22, 0.12, 0.18]} />
            <meshStandardMaterial
              color="#ced8e3"
              emissive={m.color}
              emissiveIntensity={sending ? 0.75 : 0.35}
              roughness={0.3}
              metalness={0.58}
            />
          </mesh>
          <mesh position={[0, 0.085, 0]}>
            <boxGeometry args={[0.1, 0.02, 0.08]} />
            <meshBasicMaterial color={m.color} transparent opacity={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function TelemetryPoints({ sending }: { sending: boolean }) {
  const ref = useRef<PointsType>(null)

  const geometry = useMemo(() => {
    const count = 420
    const positions: number[] = []

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const band = i % 6
      const r = 2.9 + band * 0.55
      const y = -0.7 + (band % 3) * 0.45
      positions.push(Math.cos(a * (1 + band * 0.08)) * r, y, Math.sin(a * (1 + band * 0.08)) * r)
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.y = t * (sending ? 0.04 : 0.015)
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color={sending ? '#95ffe9' : '#78a9cc'}
        size={sending ? 0.018 : 0.013}
        sizeAttenuation
        transparent
        opacity={sending ? 0.42 : 0.22}
        blending={AdditiveBlending}
      />
    </points>
  )
}

function CircuitPlane() {
  const ref = useRef<LineSegments>(null)

  const geometry = useMemo(() => {
    const positions: number[] = []
    const size = 5.8
    const step = 0.6

    for (let x = -size; x <= size; x += step) {
      positions.push(x, -1.65, -size, x, -1.65, size)
    }

    for (let z = -size; z <= size; z += step) {
      positions.push(-size, -1.65, z, size, -1.65, z)
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.y = Math.sin(t * 0.12) * 0.05
  })

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#457199" transparent opacity={0.18} />
    </lineSegments>
  )
}

function DataRays({ sending }: { sending: boolean }) {
  const groupRef = useRef<Group>(null)
  const linesRef = useRef<LineSegments>(null)

  const geometry = useMemo(() => {
    const positions: number[] = []
    const rays = 18

    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2
      const inner = 0.35
      const outer = 3.5
      positions.push(
        Math.cos(a) * inner,
        0,
        Math.sin(a) * inner,
        Math.cos(a) * outer,
        -0.15 + Math.sin(i * 0.6) * 0.3,
        Math.sin(a) * outer,
      )
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (groupRef.current) groupRef.current.rotation.y = t * 0.11
    if (linesRef.current) {
      const mat = linesRef.current.material as { opacity: number }
      mat.opacity = sending ? 0.28 + Math.sin(t * 5) * 0.08 : 0.12 + Math.sin(t * 1.2) * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef} geometry={geometry}>
        <lineBasicMaterial color={sending ? '#7ff4dd' : '#6fa6cd'} transparent opacity={0.12} />
      </lineSegments>
    </group>
  )
}

function FloatingPanels({ mouse }: { mouse: { x: number; y: number } }) {
  const groupRef = useRef<Group>(null)
  const textures = useMemo(
    () => CONTACT_SNIPPETS.map((snippet) => new CanvasTexture(buildPanelTexture(snippet))),
    [],
  )

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!groupRef.current) return
    groupRef.current.rotation.y = mouse.x * 0.08
    groupRef.current.rotation.x = mouse.y * 0.04

    groupRef.current.children.forEach((child, i) => {
      child.position.y += Math.sin(t * 0.42 + i * 1.6) * 0.0007
    })
  })

  return (
    <group ref={groupRef}>
      {PANEL_LAYOUTS.map((panel, i) => (
        <mesh key={CONTACT_SNIPPETS[i].title} position={panel.position} rotation={panel.rotation}>
          <planeGeometry args={[2.05, 1.26]} />
          <meshBasicMaterial map={textures[i]} transparent opacity={0.56} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function ContactScene({ mouse, sending }: SceneProps) {
  const camera = useMemo(
    () => ({ position: [0, 0.15, 5.3] as [number, number, number], fov: 38 }),
    [],
  )

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={camera}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#060c14']} />
      <fog attach="fog" args={['#060c14', 4.5, 19]} />

      <ambientLight intensity={0.24} />
      <hemisphereLight args={['#b8d8ee', '#0d1a28', 0.45]} />
      <directionalLight position={[4.5, 4.2, 3]} intensity={0.82} color="#9cc9ea" />
      <pointLight position={[-3.8, 1.5, 1.2]} intensity={0.45} color="#67b6df" />
      <pointLight position={[2.6, 1, -2.4]} intensity={0.38} color="#7fb5db" />
      {sending && <pointLight position={[0, 1.4, 0.4]} intensity={1.2} color="#83f2d9" />}

      <CircuitPlane />
      <FloatingPanels mouse={mouse} />
      <TelemetryPoints sending={sending} />
      <DataRays sending={sending} />
      <ModuleRing sending={sending} />
      <CoreHub mouse={mouse} sending={sending} />
    </Canvas>
  )
}

export default memo(ContactScene)
