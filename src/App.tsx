import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CareerFlightGame from './components/CareerFlightGame'
import { identity, philosophy, projects, skillHighlights, skills, stats, timeline } from './data/portfolio'

gsap.registerPlugin(ScrollTrigger)

const HeroScene = lazy(() => import('./components/scene/HeroScene'))
const ContactScene = lazy(() => import('./components/ContactScene'))

const SECTION_IDS = ['hero', 'about', 'projects', 'skills', 'experience', 'contact'] as const

function App() {
  const shouldReduceMotion = useReducedMotion()
  const [loading, setLoading] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [cursorHover, setCursorHover] = useState(false)
  const [sceneMouse, setSceneMouse] = useState({ x: 0, y: 0 })
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [contactMouse, setContactMouse] = useState({ x: 0, y: 0 })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const appRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const cursorRingRef = useRef<HTMLDivElement>(null)
  const loadingBarRef = useRef<HTMLDivElement>(null)

  const commandItems = useMemo(
    () => [
      { id: 'hero', label: 'Jump to Hero' },
      { id: 'about', label: 'About Universe' },
      { id: 'projects', label: 'Project Worlds' },
      { id: 'skills', label: 'Skill Galaxy' },
      { id: 'experience', label: 'Career Timeline' },
      { id: 'contact', label: 'Contact Terminal' },
    ],
    [],
  )

  useEffect(() => {
    if (shouldReduceMotion) return

    const tween = gsap.to(loadingBarRef.current, {
      width: '100%',
      duration: 1.6,
      ease: 'power2.inOut',
      onComplete: () => setLoading(false),
    })

    return () => { tween.kill() }
  }, [shouldReduceMotion])

  useEffect(() => {
    if (shouldReduceMotion) return

    const lenis = new Lenis({ duration: 1.2, smoothWheel: true })

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(lenis.raf)
      lenis.destroy()
    }
  }, [shouldReduceMotion])

  useEffect(() => {
    if (shouldReduceMotion) return

    let dotXTo: gsap.QuickToFunc | null = null
    let dotYTo: gsap.QuickToFunc | null = null
    let ringXTo: gsap.QuickToFunc | null = null
    let ringYTo: gsap.QuickToFunc | null = null

    if (cursorDotRef.current && cursorRingRef.current) {
      dotXTo = gsap.quickTo(cursorDotRef.current, 'x', { duration: 0.15, ease: 'power3' })
      dotYTo = gsap.quickTo(cursorDotRef.current, 'y', { duration: 0.15, ease: 'power3' })
      ringXTo = gsap.quickTo(cursorRingRef.current, 'x', { duration: 0.55, ease: 'power3' })
      ringYTo = gsap.quickTo(cursorRingRef.current, 'y', { duration: 0.55, ease: 'power3' })
    }

    let rafPending = false
    const onMove = (e: MouseEvent) => {
      if (!rafPending) {
        rafPending = true
        requestAnimationFrame(() => {
          setSceneMouse({
            x: (e.clientX / window.innerWidth - 0.5) * 2,
            y: (e.clientY / window.innerHeight - 0.5) * 2,
          })
          rafPending = false
        })
      }
      dotXTo?.(e.clientX)
      dotYTo?.(e.clientY)
      ringXTo?.(e.clientX)
      ringYTo?.(e.clientY)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => { window.removeEventListener('mousemove', onMove) }
  }, [shouldReduceMotion])

  useGSAP(() => {
    if (loading || shouldReduceMotion) return

    gsap.from('.hero-name', {
      y: 50,
      opacity: 0,
      scale: 0.94,
      filter: 'blur(10px)',
      duration: 1.4,
      ease: 'power3.out',
      delay: 0.15,
    })

    gsap.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8, delay: 0.9, ease: 'power2.out' })
    gsap.fromTo('.hero-eyebrow', { y: 16 }, { y: 0, duration: 0.8, delay: 0.9, ease: 'power2.out' })

    const words = appRef.current?.querySelectorAll('.hero-tagline .word-inner')
    if (words?.length) {
      gsap.from(words, {
        y: '110%',
        rotateX: -45,
        opacity: 0,
        stagger: 0.07,
        duration: 1.0,
        ease: 'power3.out',
        delay: 1.2,
      })
    }

    gsap.to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.9, delay: 1.7, ease: 'power2.out' })
    gsap.fromTo('.hero-subtitle', { y: 20 }, { y: 0, duration: 0.9, delay: 1.7, ease: 'power2.out' })
    gsap.to('.hero-cta', { opacity: 1, y: 0, duration: 0.8, delay: 2.0, ease: 'power2.out' })
    gsap.fromTo('.hero-cta', { y: 18 }, { y: 0, duration: 0.8, delay: 2.0, ease: 'power2.out' })
  }, { scope: appRef, dependencies: [loading, shouldReduceMotion] })

  useGSAP(() => {
    if (loading || shouldReduceMotion) return

    gsap.utils.toArray<HTMLElement>('.section').forEach((section) => {
      const heading = section.querySelector('.section-title')
      const label = section.querySelector('.section-label')

      if (heading) {
        gsap.from(heading, {
          y: 50,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none none' },
        })
      }

      if (label) {
        gsap.from(label, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          delay: 0.15,
          ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 78%', toggleActions: 'play none none none' },
        })
      }
    })

    gsap.utils.toArray<HTMLElement>('.chapter-card').forEach((card, i) => {
      gsap.fromTo(card, 
        { x: i % 2 === 0 ? -40 : 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.bento-cell:not(.chapter-card)').forEach((cell, i) => {
      gsap.fromTo(cell, 
        { y: 30, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: i * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: cell, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.bento-project-wrapper').forEach((wrapper, i) => {
      gsap.fromTo(wrapper,
        { y: 50, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: wrapper, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.flow-node').forEach((node, i) => {
      gsap.fromTo(node,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          delay: i * 0.08,
          ease: 'back.out(1.7)',
          scrollTrigger: { trigger: node, start: 'top 88%', toggleActions: 'play none none none' },
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.flow-connector').forEach((conn) => {
      gsap.fromTo(conn,
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 0.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: conn, start: 'top 88%', toggleActions: 'play none none none' },
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.skill-category-card').forEach((card, i) => {
      gsap.fromTo(card,
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          delay: i * 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.skill-bar-fill').forEach((bar) => {
      gsap.fromTo(bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: bar, start: 'top 90%', toggleActions: 'play none none none' },
        }
      )
    })

    gsap.fromTo('.skills-hero-cell',
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.skills-hero-cell', start: 'top 85%', toggleActions: 'play none none none' },
      }
    )
  }, { scope: appRef, dependencies: [loading, shouldReduceMotion] })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((p) => !p)
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false)
        setTerminalOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [])

  const goTo = useCallback((id: string) => {
    setPaletteOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [shouldReduceMotion])

  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return
    const card = e.currentTarget
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (e.clientX - left) / width
    const y = (e.clientY - top) / height
    
    card.style.setProperty('--mouse-x', `${e.clientX - left}px`)
    card.style.setProperty('--mouse-y', `${e.clientY - top}px`)

    gsap.to(card, {
      rotateX: (y - 0.5) * -12,
      rotateY: (x - 0.5) * 12,
      transformPerspective: 900,
      duration: 0.45,
      ease: 'power2.out',
    })
  }, [shouldReduceMotion])

  const handleTiltLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  }, [])

  const handleMagnetic = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion) return
    const el = e.currentTarget
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = e.clientX - (left + width / 2)
    const y = e.clientY - (top + height / 2)
    gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  }, [shouldReduceMotion])

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  }, [])

  return (
    <div className="app-shell" ref={appRef}>
      <div className="noise-overlay" aria-hidden="true" />
      <div className="ambient-bg" aria-hidden="true" />

      {!shouldReduceMotion && (
        <>
          <div ref={cursorDotRef} className="cursor-dot" />
          <div ref={cursorRingRef} className={`cursor-ring${cursorHover ? ' hovering' : ''}`} />
        </>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            className="loading-screen"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          >
            <p className="loading-name">{identity.name}</p>
            <div className="loading-bar-track">
              <div ref={loadingBarRef} className="loading-bar-fill" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header
        className="top-nav glass"
        onMouseEnter={() => setCursorHover(true)}
        onMouseLeave={() => setCursorHover(false)}
      >
        <span className="nav-name">{identity.name}</span>
        <div className="nav-actions">
          <button
            type="button"
            className="btn"
            onMouseMove={handleMagnetic}
            onMouseLeave={handleMagneticLeave}
            onClick={() => setPaletteOpen(true)}
          >
            Cmd+K
          </button>
          <button
            type="button"
            className="btn"
            onMouseMove={handleMagnetic}
            onMouseLeave={handleMagneticLeave}
            onClick={() => setTerminalOpen((p) => !p)}
          >
            Console
          </button>
        </div>
      </header>

      <main>
        <section id="hero" className="hero">
          <div className="hero-bg" aria-hidden="true">
            <Suspense fallback={<div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 40%, #0e1a42, #04050b 70%)' }} />}>
              <HeroScene mouse={sceneMouse} />
            </Suspense>
          </div>
          <div className="hero-vignette" aria-hidden="true" />

          <div className="hero-content">
            <h1 className="hero-name" aria-label={identity.name}>
              <span className="name-first">Soujanya</span>
              <span className="name-last">Gupta</span>
            </h1>
            <p className="hero-eyebrow">Software Engineer + Prompt Engineer</p>
            <p className="hero-tagline">
              {identity.taglineWords.map((word) => (
                <span key={word} className="word">
                  <span className="word-inner">{word}</span>
                </span>
              ))}
            </p>
            <p className="hero-subtitle">{identity.title}</p>
            <div className="hero-cta">
              <button
                type="button"
                className="btn btn-primary"
                onMouseMove={handleMagnetic}
                onMouseLeave={handleMagneticLeave}
                onMouseEnter={() => setCursorHover(true)}
                onFocus={() => setCursorHover(true)}
                onBlur={() => setCursorHover(false)}
                onClick={() => goTo('projects')}
              >
                Explore Projects
              </button>
              <button
                type="button"
                className="btn"
                onMouseMove={handleMagnetic}
                onMouseLeave={handleMagneticLeave}
                onMouseEnter={() => setCursorHover(true)}
                onFocus={() => setCursorHover(true)}
                onBlur={() => setCursorHover(false)}
                onClick={() => goTo('contact')}
              >
                Start Collaboration
              </button>
            </div>
          </div>

          <div className="scroll-hint" aria-hidden="true">
            <span>Scroll</span>
            <div className="scroll-line" />
          </div>
        </section>

        <section id="about" className="section">
          <div className="about-bg-glow" aria-hidden="true" />
          <div className="section-inner">
            <p className="section-label">01 — About</p>
            <h2 className="section-title">A Digital Timeline <span className="title-gradient">of Growth</span></h2>
            <p className="section-subtitle">The journey from curiosity to craft</p>

            <div className="about-bento">
              <div className="bento-cell story-cell glass">
                <div className="about-accent-line" aria-hidden="true" />
                <div className="story-content">
                  <p className="story-lead">
                    <span className="highlight">I engineer high-performance</span>
                    {identity.intro.replace('I engineer high-performance', '')}
                  </p>
                  <div className="story-signals">
                    <span className="signal-tag">React</span>
                    <span className="signal-tag">AI Systems</span>
                    <span className="signal-tag">Full Stack</span>
                    <span className="signal-tag">Prompt Eng</span>
                  </div>
                </div>
                <div className="story-orbit" aria-hidden="true">
                  <div className="orbit-ring" />
                  <div className="orbit-ring" />
                  <div className="orbit-dot" />
                </div>
              </div>
              
              <div className="bento-cell stats-cell glass">
                <div className="stats-grid">
                  {stats.map((stat, i) => (
                    <div key={stat.label} className="stat-item" style={{ animationDelay: `${i * 0.15}s` }}>
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bento-cell philosophy-cell glass">
                <p className="philosophy-title">{philosophy.title}</p>
                <div className="philosophy-list">
                  {philosophy.principles.map((p, i) => (
                    <div key={p.keyword} className="philosophy-item" style={{ animationDelay: `${i * 0.2}s` }}>
                      <span className="philosophy-keyword">{p.keyword}</span>
                      <span className="philosophy-text">{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {timeline.map((item, index) => {
                const borderColors = ['var(--neon-blue)', 'var(--neon-purple)', 'var(--neon-green)'];
                const borderColor = borderColors[index % borderColors.length];
                return (
                  <article 
                    key={item.era} 
                    className="bento-cell chapter-card glass"
                    style={{ borderTopColor: borderColor, borderTopWidth: '3px', borderTopStyle: 'solid' }}
                  >
                    <p className="chapter-era">{item.era}</p>
                    <p className="chapter-text">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="projects" className="section">
          <div className="projects-header section-inner">
            <p className="section-label">02 — Projects</p>
            <h2 className="section-title">Built for <span className="title-gradient">Impact</span></h2>
            <p className="section-subtitle">Systems engineered from the ground up</p>
          </div>

          <div className="projects-viewport">
            <div className="projects-bento">
              {projects.map((project, index) => (
                <div key={project.name} className="bento-project-wrapper">
                  <div
                    className="project-card-inner glass"
                    onMouseMove={handleTiltMove}
                    onMouseLeave={handleTiltLeave}
                    onMouseEnter={() => setCursorHover(true)}
                  >
                    <div className="project-border-glow" style={{ background: project.gradient }} aria-hidden="true" />
                    
                    <div className="project-visual">
                      <div className="project-index" aria-hidden="true">0{index + 1}</div>
                      <div className="holo-ring outer" style={{ borderColor: project.color }} />
                      <div className="holo-ring inner" style={{ borderColor: project.color }} />
                      <div className="holo-core" style={{ background: project.gradient, boxShadow: `0 0 40px ${project.color}` }} />
                      <h3 className="project-name">{project.name}</h3>
                    </div>

                    <div className="project-body">
                      <div className="project-header">
                        <span className="project-status">
                          <span className="status-dot" style={{ backgroundColor: project.color, boxShadow: `0 0 10px ${project.color}` }} /> 
                          SYSTEM ONLINE
                        </span>
                        <span className="project-year">{project.year}</span>
                      </div>
                      
                      <p className="project-summary">{project.summary}</p>
                      
                      <div className="project-metric-row">
                        <div className="metric-value" style={{ color: project.color }}>{project.metric}</div>
                        <div className="metric-label">{project.metricLabel}</div>
                      </div>

                      {project.architecture && (
                        <div className="project-flow">
                          <p className="flow-title">ARCHITECTURE FLOW</p>
                          <div className="flow-pipeline">
                            {project.architecture.map((node, nodeIdx) => (
                              <div key={node} className="flow-step" style={{ animationDelay: `${nodeIdx * 0.12}s` }}>
                                {nodeIdx > 0 && (
                                  <div className="flow-connector" style={{ background: `linear-gradient(90deg, transparent, ${project.color})` }} aria-hidden="true" />
                                )}
                                <div className="flow-node" style={{ borderColor: project.color, boxShadow: `0 0 8px ${project.color}33` }}>
                                  <span className="flow-node-text">{node}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="chip-row">
                        {project.stack.map((tech) => (
                          <span key={tech} className="chip">{tech}</span>
                        ))}
                      </div>

                      <div className="project-cta">
                        <span className="cta-text">INITIALIZE SEQUENCE</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={project.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="section">
          <div className="section-inner">
            <p className="section-label">03 — Skills</p>
            <h2 className="section-title">Technical <span className="title-gradient">Ecosystem</span></h2>
            <p className="section-subtitle">Mission control systems proficiency</p>

            <div className="skills-bento">
              <div className="skills-hero-cell glass">
                <div className="skills-hero-header">
                  <span className="skills-hero-tag">CORE STACK ANALYSIS</span>
                  <span className="skills-hero-status">
                    <span className="skills-status-dot" />
                    {activeSkill ? `SCANNING: ${activeSkill.toUpperCase()}` : 'ALL SYSTEMS NOMINAL'}
                  </span>
                </div>
                <div className="skills-hero-metrics">
                  {skillHighlights.map((h) => (
                    <div key={h.label} className="skills-metric">
                      <span className="skills-metric-value">{h.value}</span>
                      <span className="skills-metric-label">{h.label}</span>
                    </div>
                  ))}
                </div>
                <div className="skills-hero-visual" aria-hidden="true">
                  <div className="radar-ring r1" />
                  <div className="radar-ring r2" />
                  <div className="radar-ring r3" />
                  <div className={`radar-sweep${activeSkill ? ' scanning' : ''}`} />
                  <div className="radar-center" />
                  {activeSkill && <div className="radar-ping" />}
                </div>
              </div>

              {skills.map((group) => {
                const isActive = activeSkill === group.category;
                return (
                  <div 
                    key={group.category} 
                    className={`skill-category-card glass${isActive ? ' skill-active' : ''}`}
                    style={{ '--skill-color': group.color } as React.CSSProperties}
                    onMouseMove={(e) => {
                      handleTiltMove(e)
                      setCursorHover(true)
                    }}
                    onMouseLeave={(e) => {
                      handleTiltLeave(e)
                      setCursorHover(false)
                    }}
                    onClick={() => setActiveSkill(isActive ? null : group.category)}
                  >
                    <div className="skill-card-spotlight" aria-hidden="true" />
                    <div className="skill-cat-header">
                      <span className={`skill-cat-icon${isActive ? ' icon-spin' : ''}`} style={{ color: group.color }}>{group.icon}</span>
                      <span className="skill-cat-name">{group.category}</span>
                      <span className={`skill-cat-toggle${isActive ? ' toggled' : ''}`} style={{ borderColor: group.color }}>
                        {isActive ? '✕' : '⟐'}
                      </span>
                    </div>
                    <div className="skill-bars">
                      {group.items.map((skill, si) => (
                        <div key={skill.name} className="skill-bar-row" style={{ animationDelay: `${si * 0.1}s` }}>
                          <div className="skill-bar-info">
                            <span className="skill-bar-name">{skill.name}</span>
                            <span className="skill-bar-pct" style={{ color: group.color }}>{skill.level}%</span>
                          </div>
                          <div className="skill-bar-track">
                            <div
                              className={`skill-bar-fill${isActive ? ' bar-charged' : ''}`}
                              style={{ 
                                width: `${skill.level}%`, 
                                background: `linear-gradient(90deg, ${group.color}33, ${group.color})`,
                                boxShadow: `0 0 12px ${group.color}44`,
                              }}
                            >
                              <span className="bar-glow-tip" style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {isActive && (
                      <div className="skill-expanded">
                        <div className="skill-power-ring" style={{ borderColor: group.color }}>
                          <span className="skill-power-value" style={{ color: group.color }}>
                            {Math.round(group.items.reduce((sum, s) => sum + s.level, 0) / group.items.length)}%
                          </span>
                          <span className="skill-power-label">AVG POWER</span>
                        </div>
                        <p className="skill-expanded-hint">Click to collapse</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="experience" className="section">
          <div className="section-inner">
            <p className="section-label">04 — Experience</p>
            <h2 className="section-title">Career <span className="title-gradient">Milestones</span></h2>
            <p className="section-subtitle">Fly through the portals to discover my journey</p>

            <CareerFlightGame />
          </div>
        </section>

        <section id="contact" className="section">
          <div className="section-inner">
            <p className="section-label">05 — Contact</p>
            <h2 className="section-title">Launch a <span className="title-gradient">Transmission</span></h2>
            <p className="section-subtitle">Let&apos;s build the next thing together</p>

            <div className="contact-split">
              <div
                className="contact-scene-wrap"
                onMouseMove={(e) => {
                  if (shouldReduceMotion) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  setContactMouse({
                    x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
                    y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
                  })
                }}
              >
                <Suspense fallback={<div className="contact-scene-fallback" />}>
                  <ContactScene mouse={contactMouse} sending={sending} />
                </Suspense>
                <div className="contact-scene-topbar" aria-hidden="true">
                  <span className="scene-pill">ENGINEERING PROFILE</span>
                  <span className="scene-pill scene-pill-soft">REAL-TIME SIGNAL</span>
                  <span className="scene-pill scene-pill-warm">{sending ? 'SYNCING' : 'IDLE'}</span>
                </div>
                <div className="contact-scene-overlay">
                  <div className="contact-signal-status">
                    <span className={`contact-signal-dot${sending ? ' transmitting' : ''}`} />
                    <span className="contact-signal-text">
                      {sent ? 'TRANSMISSION COMPLETE' : sending ? 'TRANSMITTING...' : 'SIGNAL READY'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="contact-form-wrap">
                <form
                  className="contact-form glass"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSending(true)
                    setTimeout(() => {
                      setSending(false)
                      setSent(true)
                      setTimeout(() => setSent(false), 4000)
                    }, 2500)
                  }}
                >
                  <div className="contact-form-header">
                    <span className="contact-form-tag">PROJECT INQUIRY</span>
                    <p className="terminal-prompt">
                      start_collaboration<span className="blink">_</span>
                    </p>
                  </div>

                  <div className="contact-field">
                    <label className="contact-label" htmlFor="contact-name">
                      <span className="contact-label-icon">01</span>
                      Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      className="contact-input"
                      placeholder="Your name"
                      autoComplete="name"
                      required
                      onFocus={() => setCursorHover(true)}
                      onBlur={() => setCursorHover(false)}
                    />
                  </div>

                  <div className="contact-field">
                    <label className="contact-label" htmlFor="contact-email">
                      <span className="contact-label-icon">02</span>
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      className="contact-input"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      onFocus={() => setCursorHover(true)}
                      onBlur={() => setCursorHover(false)}
                    />
                  </div>

                  <div className="contact-field">
                    <label className="contact-label" htmlFor="contact-message">
                      <span className="contact-label-icon">03</span>
                      Project Details
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      className="contact-input contact-textarea"
                      rows={4}
                      placeholder="Tell me what we are building..."
                      required
                      onFocus={() => setCursorHover(true)}
                      onBlur={() => setCursorHover(false)}
                    />
                  </div>

                  <div className="contact-actions">
                    <button
                      type="submit"
                      className={`contact-send-btn${sending ? ' is-sending' : ''}${sent ? ' is-sent' : ''}`}
                      disabled={sending}
                      onMouseMove={handleMagnetic}
                      onMouseLeave={handleMagneticLeave}
                    >
                      <span className="contact-send-text">
                        {sent ? 'Message Sent!' : sending ? 'Sending...' : 'Send Message'}
                      </span>
                      <span className="contact-send-icon">{sent ? '✓' : '→'}</span>
                    </button>
                    <a
                      className="contact-direct-link"
                      href="mailto:soujanyagupta.dev@gmail.com"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      or email directly →
                    </a>
                  </div>
                </form>

                <div className="contact-channels">
                  <a className="contact-channel contact-channel-link glass" href="mailto:soujanyagupta.dev@gmail.com">
                    <span className="channel-dot" style={{ background: '#8ad6ff' }} />
                    <span className="channel-label">Email</span>
                    <span className="channel-value">soujanyagupta.dev@gmail.com</span>
                  </a>
                  <a
                    className="contact-channel contact-channel-link glass"
                    href="https://github.com/GuptaSoujanya"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="channel-dot" style={{ background: '#ffc977' }} />
                    <span className="channel-label">GitHub</span>
                    <span className="channel-value">github.com/GuptaSoujanya</span>
                  </a>
                  <a
                    className="contact-channel contact-channel-link glass"
                    href="https://www.linkedin.com/in/soujanya-gupta-0224621ba/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="channel-dot" style={{ background: '#7effde' }} />
                    <span className="channel-label">LinkedIn</span>
                    <span className="channel-value">linkedin.com/in/soujanya-gupta-0224621ba</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        Designed as a cinematic developer universe · {identity.name}
      </footer>

      <AnimatePresence>
        {terminalOpen && (
          <motion.aside
            className="assistant-drawer glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3>AI Portfolio Assistant</h3>
            <p>Try: &quot;Show AI projects&quot;, &quot;Jump to contact&quot;, or &quot;What stack do you use?&quot;</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => goTo('projects')}
            >
              Open Project Showcase
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            className="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaletteOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <motion.div
              className="palette-box glass"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="palette-title">Command Palette</p>
              {commandItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="palette-item"
                  onClick={() => goTo(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="dock glass" aria-label="Section navigation">
        {SECTION_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="dock-item"
            onClick={() => goTo(id)}
          >
            {id}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
