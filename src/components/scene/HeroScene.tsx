import { Canvas, useFrame } from '@react-three/fiber'
import { memo, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  RingGeometry,
} from 'three'
import type { Group, Mesh, Points as PointsType } from 'three'

type SceneProps = { mouse: { x: number; y: number } }

function prng(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const KW = new Set([
  'const', 'let', 'var', 'function', 'return', 'async', 'await',
  'import', 'from', 'export', 'default', 'if', 'else', 'new',
  'def', 'class', 'for', 'in', 'True', 'False', 'None',
])

const BUILTIN = new Set([
  'useState', 'useEffect', 'console', 'require', 'app', 'model',
  'Dense', 'Sequential', 'Dropout', 'json', 'post', 'compile',
  'fit', 'predict', 'res', 'req', 'engine', 'analyze',
])

type Token = { text: string; color: string }

function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  const parts = line.match(/[a-zA-Z_]\w*|"[^"]*"|'[^']*'|\d+\.?\d*|\/\/.*|#.*|[^\s\w"']+|\s+/g)
  if (!parts) return tokens

  for (const p of parts) {
    if (/^\s+$/.test(p)) {
      tokens.push({ text: p, color: '' })
    } else if (/^(\/\/|#)/.test(p)) {
      tokens.push({ text: p, color: '#546e7a' })
    } else if (KW.has(p)) {
      tokens.push({ text: p, color: '#c792ea' })
    } else if (BUILTIN.has(p)) {
      tokens.push({ text: p, color: '#82aaff' })
    } else if (/^["']/.test(p)) {
      tokens.push({ text: p, color: '#c3e88d' })
    } else if (/^\d/.test(p)) {
      tokens.push({ text: p, color: '#f78c6c' })
    } else if (/^[({[\]}).,;:=<>+\-*/&|!?@]/.test(p)) {
      tokens.push({ text: p, color: '#89ddff' })
    } else {
      tokens.push({ text: p, color: '#eeffff' })
    }
  }
  return tokens
}

type SnippetDef = { filename: string; lines: string[] }

const SNIPPETS: SnippetDef[] = [
  {
    filename: 'app.tsx',
    lines: [
      'const App = () => {',
      '  const [ai, setAI] =',
      '    useState(null)',
      '',
      '  useEffect(() => {',
      '    model.predict(input)',
      '      .then(setAI)',
      '  }, [input])',
      '',
      '  return (',
      '    <Dashboard data={ai} />',
      '  )',
      '}',
    ],
  },
  {
    filename: 'server.js',
    lines: [
      'app.post("/api/match",',
      '  async (req, res) => {',
      '',
      '  const prediction =',
      '    await engine',
      '      .analyze(req.body)',
      '',
      '  res.json({',
      '    result: prediction,',
      '    confidence: 0.97,',
      '    model: "v2.1"',
      '  })',
      '})',
    ],
  },
  {
    filename: 'model.py',
    lines: [
      'def train(data):',
      '  model = Sequential([',
      '    Dense(256, "relu"),',
      '    Dropout(0.3),',
      '    Dense(128, "relu"),',
      '    Dense(64, "relu"),',
      '    Dense(1, "sigmoid")',
      '  ])',
      '  model.compile(',
      '    optimizer="adam",',
      '    loss="binary_ce"',
      '  )',
      '  model.fit(data)',
    ],
  },
]

function buildIDECanvas(snippet: SnippetDef): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 600
  c.height = 520
  const ctx = c.getContext('2d')!

  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, 600, 520)

  ctx.fillStyle = '#161b22'
  ctx.fillRect(0, 0, 600, 36)

  ctx.fillStyle = '#ff5f57'
  ctx.beginPath(); ctx.arc(18, 18, 5.5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#febc2e'
  ctx.beginPath(); ctx.arc(36, 18, 5.5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#28c840'
  ctx.beginPath(); ctx.arc(54, 18, 5.5, 0, Math.PI * 2); ctx.fill()

  ctx.font = '13px monospace'
  ctx.fillStyle = '#8b949e'
  ctx.fillText(snippet.filename, 72, 22)

  ctx.strokeStyle = '#30363d'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, 36); ctx.lineTo(600, 36); ctx.stroke()

  const lineH = 24
  const codeY = 52
  const codeFont = '15px monospace'
  ctx.font = codeFont

  snippet.lines.forEach((line, i) => {
    const y = codeY + i * lineH

    ctx.fillStyle = '#484f58'
    ctx.fillText(`${String(i + 1).padStart(2, ' ')}`, 8, y)

    ctx.fillStyle = '#21262d'
    ctx.fillRect(32, y - 14, 1, lineH)

    let curX = 40
    const tokens = tokenize(line)
    for (const tok of tokens) {
      if (tok.color) ctx.fillStyle = tok.color
      if (tok.color) ctx.fillText(tok.text, curX, y)
      curX += ctx.measureText(tok.text).width
    }
  })

  ctx.fillStyle = 'rgba(139,233,253,0.012)'
  for (let y = 36; y < 520; y += 3) {
    ctx.fillRect(0, y, 600, 1)
  }

  ctx.strokeStyle = '#30363d'
  ctx.lineWidth = 1.5
  ctx.strokeRect(1, 1, 598, 518)

  return c
}

function CentralCore({ mouse }: SceneProps) {
  const outerRef = useRef<Mesh>(null)
  const innerRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.position.x = 1.8 + mouse.x * 0.3
      groupRef.current.position.y = 0.15 + mouse.y * 0.15 + Math.sin(t * 0.4) * 0.1
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.15
      outerRef.current.rotation.x = t * 0.08
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.25
      innerRef.current.rotation.z = t * 0.12
      innerRef.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.06)
    }
  })

  const ringGeo = useMemo(() => new RingGeometry(1.8, 1.82, 80), [])

  return (
    <group ref={groupRef} position={[1.8, 0.15, -0.5]}>
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          color="#4ac8ff"
          emissive="#2266cc"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>

      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial
          color="#7c5cff"
          emissive="#5533ee"
          emissiveIntensity={1.6}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.25, 20, 20]} />
        <meshStandardMaterial color="#88ddff" emissive="#44aaff" emissiveIntensity={3.0} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#1a2040" emissive="#223388" emissiveIntensity={0.4} transparent opacity={0.15} />
      </mesh>

      <mesh geometry={ringGeo} rotation={[Math.PI * 0.52, 0, 0.2]}>
        <meshBasicMaterial color="#4488cc" transparent opacity={0.12} side={DoubleSide} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[1.1, 0.6, 0]}>
        <meshBasicMaterial color="#7755bb" transparent opacity={0.09} side={DoubleSide} />
      </mesh>
    </group>
  )
}

const PANEL_CFGS: { pos: [number, number, number]; rot: [number, number, number]; idx: number }[] = [
  { pos: [-3.6, 1.2, -2.0], rot: [0.03, 0.28, 0.01], idx: 0 },
  { pos: [4.0, -0.6, -2.8], rot: [-0.02, -0.22, -0.01], idx: 1 },
  { pos: [-2.2, -2.0, -3.2], rot: [0.1, 0.12, 0.02], idx: 2 },
]

function CodeWindows() {
  const groupRef = useRef<Group>(null)

  const textures = useMemo(
    () => SNIPPETS.map((s) => new CanvasTexture(buildIDECanvas(s))),
    [],
  )

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      child.position.y += Math.sin(t * 0.45 + i * 2.2) * 0.0005
    })
  })

  return (
    <group ref={groupRef}>
      {PANEL_CFGS.map((cfg) => (
        <mesh key={cfg.idx} position={cfg.pos} rotation={cfg.rot}>
          <planeGeometry args={[2.8, 2.4]} />
          <meshBasicMaterial map={textures[cfg.idx]} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

const SYMBOLS: { text: string; color: string; pos: [number, number, number]; scale: number }[] = [
  { text: '{ }', color: '#c792ea', pos: [-1.8, 2.2, -1.5], scale: 0.6 },
  { text: '</>', color: '#82aaff', pos: [3.5, 2.0, -2.2], scale: 0.55 },
  { text: '=>', color: '#89ddff', pos: [-3.0, -0.2, -0.8], scale: 0.5 },
  { text: '( )', color: '#c3e88d', pos: [0.5, -2.5, -1.8], scale: 0.45 },
  { text: '[ ]', color: '#f78c6c', pos: [-4.2, 0.6, -3.0], scale: 0.4 },
  { text: '//', color: '#546e7a', pos: [2.8, 1.8, -3.5], scale: 0.35 },
  { text: '&&', color: '#ff5370', pos: [-1.0, -1.6, -2.5], scale: 0.4 },
  { text: '::',  color: '#ffcb6b', pos: [4.5, 0.8, -1.0], scale: 0.38 },
]

function buildSymbolCanvas(text: string, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.font = 'bold 52px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, 64, 64)
  return c
}

function FloatingSymbols() {
  const refs = useRef<(Mesh | null)[]>([])

  const textures = useMemo(
    () => SYMBOLS.map((s) => new CanvasTexture(buildSymbolCanvas(s.text, s.color))),
    [],
  )

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.y = SYMBOLS[i].pos[1] + Math.sin(t * 0.35 + i * 1.6) * 0.2
      mesh.rotation.z = Math.sin(t * 0.2 + i * 2.0) * 0.08
    })
  })

  return (
    <group>
      {SYMBOLS.map((sym, i) => (
        <mesh
          key={sym.text}
          ref={(el) => { refs.current[i] = el }}
          position={sym.pos}
          scale={sym.scale}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={textures[i]}
            transparent
            opacity={0.55}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

function GridFloor() {
  return (
    <group>
      <gridHelper args={[100, 80, '#0b3050', '#071a28']} position={[0, -3.5, 0]} />
      <mesh position={[0, -3.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#030710" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

function DataRain() {
  const ref = useRef<PointsType>(null)

  const geometry = useMemo(() => {
    const count = 800
    const positions: number[] = []
    for (let i = 0; i < count; i++) {
      positions.push((prng(i * 1.7) - 0.5) * 44)
      positions.push((prng(i * 2.3) - 0.5) * 38)
      positions.push((prng(i * 3.1) - 0.5) * 44)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position
    const arr = pos.array as Float32Array
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] -= delta * 2.0
      if (arr[i] < -19) arr[i] = 19
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#4499bb" size={0.028} sizeAttenuation transparent opacity={0.35} blending={AdditiveBlending} />
    </points>
  )
}

function AmbientStars() {
  const ref = useRef<Group>(null)

  const geometry = useMemo(() => {
    const count = 1200
    const positions: number[] = []
    for (let i = 0; i < count; i++) {
      positions.push((prng(i * 1.1 + 100) - 0.5) * 70)
      positions.push((prng(i * 1.9 + 200) - 0.5) * 70)
      positions.push((prng(i * 2.5 + 300) - 0.5) * 70)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.008
  })

  return (
    <group ref={ref}>
      <points geometry={geometry}>
        <pointsMaterial color="#6a8aaa" size={0.035} sizeAttenuation transparent opacity={0.45} blending={AdditiveBlending} />
      </points>
    </group>
  )
}

const ORBIT_ITEMS = [
  { label: 'React', angle: 0, r: 3.8, speed: 0.14, y: 0.5, color: '#61dafb', size: 0.11 },
  { label: 'Node', angle: 1.0, r: 4.1, speed: 0.1, y: -0.7, color: '#68d391', size: 0.1 },
  { label: 'AI', angle: 2.0, r: 3.3, speed: 0.18, y: 1.0, color: '#f6ad55', size: 0.13 },
  { label: 'Python', angle: 3.0, r: 3.9, speed: 0.12, y: -0.4, color: '#4299e1', size: 0.1 },
  { label: 'Mongo', angle: 4.0, r: 3.5, speed: 0.15, y: 0.2, color: '#48bb78', size: 0.09 },
  { label: 'AWS', angle: 5.0, r: 4.3, speed: 0.09, y: -1.0, color: '#f687b3', size: 0.08 },
  { label: 'JS', angle: 0.6, r: 4.5, speed: 0.07, y: 0.8, color: '#ecc94b', size: 0.09 },
]

function TechOrbit() {
  const refs = useRef<(Mesh | null)[]>([])
  const orbitRingGeo = useMemo(() => new RingGeometry(1, 1.008, 90), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    ORBIT_ITEMS.forEach((item, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      const a = item.angle + t * item.speed
      mesh.position.x = Math.cos(a) * item.r + 1.8
      mesh.position.z = Math.sin(a) * item.r
      mesh.position.y = item.y + Math.sin(t * 0.35 + i * 1.3) * 0.18
      mesh.scale.setScalar(1 + Math.sin(t * 2 + i * 1.5) * 0.15)
    })
  })

  return (
    <group>
      {[3.3, 3.8, 4.1, 4.5].map((r) => (
        <mesh key={r} geometry={orbitRingGeo} scale={[r, r, r]} position={[1.8, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#1a3050" transparent opacity={0.06} side={DoubleSide} />
        </mesh>
      ))}
      {ORBIT_ITEMS.map((item, i) => (
        <mesh
          key={item.label}
          ref={(el) => { refs.current[i] = el }}
          position={[Math.cos(item.angle) * item.r + 1.8, item.y, Math.sin(item.angle) * item.r]}
        >
          <sphereGeometry args={[item.size, 14, 14]} />
          <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={2.5} />
        </mesh>
      ))}
    </group>
  )
}

function EnergyBeams() {
  const ref = useRef<Group>(null)

  const geo = useMemo(() => {
    const positions: number[] = []
    const beams = [
      { from: [1.8, 0.15, -0.5], to: [-3.6, 1.2, -2.0] },
      { from: [1.8, 0.15, -0.5], to: [4.0, -0.6, -2.8] },
      { from: [1.8, 0.15, -0.5], to: [-2.2, -2.0, -3.2] },
    ]
    beams.forEach((b) => { positions.push(...b.from, ...b.to) })
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return g
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const child = ref.current.children[0] as Mesh
    if (child && 'material' in child) {
      const mat = child.material as { opacity: number }
      mat.opacity = 0.06 + Math.sin(state.clock.getElapsedTime() * 1.2) * 0.04
    }
  })

  return (
    <group ref={ref}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#4488bb" transparent opacity={0.08} blending={AdditiveBlending} />
      </lineSegments>
    </group>
  )
}

function WireframeAccents() {
  const ref = useRef<Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.children.forEach((child, i) => {
      child.rotation.x = t * 0.2 * (i % 2 === 0 ? 1 : -1)
      child.rotation.y = t * 0.15 * (i % 2 === 0 ? -1 : 1)
    })
  })

  return (
    <group ref={ref}>
      <mesh position={[-4.8, 2.5, -4]} scale={0.35}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5588bb" emissive="#224466" emissiveIntensity={0.6} wireframe />
      </mesh>
      <mesh position={[5.0, 1.5, -5]} scale={0.28}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8866cc" emissive="#443388" emissiveIntensity={0.5} wireframe />
      </mesh>
      <mesh position={[-5.2, -1.5, -3.5]} scale={0.22}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#55aa88" emissive="#226644" emissiveIntensity={0.5} wireframe />
      </mesh>
      <mesh position={[4.8, -2.2, -4.5]} scale={0.3}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#cc7755" emissive="#884422" emissiveIntensity={0.4} wireframe />
      </mesh>
    </group>
  )
}

function HeroScene({ mouse }: SceneProps) {
  const camera = useMemo(
    () => ({ position: [0, 0.4, 6.8] as [number, number, number], fov: 50 }),
    [],
  )

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={camera}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#020408']} />
      <fog attach="fog" args={['#020408', 5, 30]} />

      <ambientLight intensity={0.18} />
      <directionalLight position={[5, 6, 4]} intensity={1.0} color="#4488cc" />
      <pointLight position={[-5, 3, 3]} intensity={0.8} color="#6644aa" />
      <pointLight position={[2, -3, 5]} intensity={0.3} color="#33aa88" />
      <pointLight position={[1.8, 0.15, 2]} intensity={0.7} color="#55bbee" />

      <AmbientStars />
      <DataRain />
      <CentralCore mouse={mouse} />
      <CodeWindows />
      <FloatingSymbols />
      <TechOrbit />
      <EnergyBeams />
      <WireframeAccents />
      <GridFloor />
    </Canvas>
  )
}

export default memo(HeroScene)
