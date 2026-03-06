export type Project = {
  name: string
  summary: string
  stack: string[]
  impact: string
  gradient: string
  color: string
  year: string
  metric: string
  metricLabel: string
  architecture?: string[]
}

export type Experience = {
  company: string
  role: string
  period: string
  detail: string
}

export const identity = {
  name: 'Soujanya Gupta',
  title: 'Software Engineer | React Developer | Prompt Engineer | Full Stack Developer',
  tagline: 'Engineering Ideas Into Intelligent Systems',
  taglineWords: ['Engineering', 'Ideas', 'Into', 'Intelligent', 'Systems'],
  intro:
    'I engineer high-performance digital systems that refuse to be ignored. Blending cinematic interaction design with AI-driven architecture, I build platforms that feel alive. No fluff, just pure impact.',
}

export const philosophy = {
  title: 'Design Philosophy',
  principles: [
    { keyword: 'Precision', text: 'Every pixel is intentional. Every interaction is engineered.' },
    { keyword: 'Performance', text: 'Speed is a feature. Latency is the enemy.' },
    { keyword: 'Purpose', text: 'Code without impact is just noise.' },
  ],
}

export type SkillCategory = {
  category: string
  icon: string
  color: string
  items: { name: string; level: number }[]
}

export const skills: SkillCategory[] = [
  {
    category: 'Frontend',
    icon: '◇',
    color: '#66d7ff',
    items: [
      { name: 'React', level: 95 },
      { name: 'JavaScript', level: 92 },
      { name: 'TypeScript', level: 85 },
      { name: 'Tailwind CSS', level: 88 },
    ],
  },
  {
    category: 'Backend',
    icon: '⬡',
    color: '#9f63ff',
    items: [
      { name: 'Node.js', level: 90 },
      { name: 'MongoDB', level: 85 },
      { name: 'REST APIs', level: 92 },
      { name: 'Python', level: 78 },
    ],
  },
  {
    category: 'AI & Prompt Eng',
    icon: '◈',
    color: '#4bffcb',
    items: [
      { name: 'Prompt Architecture', level: 94 },
      { name: 'AI Integration', level: 88 },
      { name: 'LLM Pipelines', level: 82 },
      { name: 'RAG Systems', level: 76 },
    ],
  },
  {
    category: 'DevOps & Tools',
    icon: '△',
    color: '#ff6b8a',
    items: [
      { name: 'Git & CI/CD', level: 88 },
      { name: 'AWS Fundamentals', level: 72 },
      { name: 'Docker', level: 70 },
      { name: 'Vite & Webpack', level: 85 },
    ],
  },
]

export const skillHighlights = [
  { value: '11+', label: 'Technologies' },
  { value: '4', label: 'Domains' },
  { value: '95%', label: 'Top Proficiency' },
]

export const projects: Project[] = [
  {
    name: 'RideMate',
    summary:
      'An AI-powered ride sharing platform that predicts demand zones and optimizes matching between riders and drivers in real time.',
    stack: ['React', 'Node.js', 'MongoDB', 'REST APIs', 'AI Prompts'],
    impact: 'Reduced rider wait time and improved route utilization for high-density corridors.',
    gradient: 'linear-gradient(135deg, #31d3ff, #5f87ff, #a84cff)',
    color: '#5f87ff',
    year: '2024',
    metric: '1.2M+',
    metricLabel: 'Routes Optimized',
    architecture: ['User Request', 'AI Demand Engine', 'Route Optimizer', 'Driver Match', 'Live Tracking'],
  },
  {
    name: 'EventHub',
    summary:
      'A smart event networking platform using OCR card scanning and AI-driven attendee matchmaking to accelerate connections.',
    stack: ['React', 'Express', 'OCR Pipeline', 'MongoDB', 'Cloud'],
    impact: 'Accelerated contact exchange and increased post-event connection rates.',
    gradient: 'linear-gradient(135deg, #34f5a6, #2ec4ff, #8f6dff)',
    color: '#2ec4ff',
    year: '2023',
    metric: '50k+',
    metricLabel: 'Profiles Connected',
    architecture: ['Badge Scan', 'OCR Pipeline', 'AI Matchmaker', 'Profile Sync'],
  },
  {
    name: 'Resource Mgmt',
    summary:
      'Enterprise React platform to plan, allocate, and monitor team and infrastructure resources with real-time analytics.',
    stack: ['React', 'Node.js', 'Auth', 'Dashboards'],
    impact: 'Improved utilization visibility and reduced manual operations overhead.',
    gradient: 'linear-gradient(135deg, #ffa24b, #ff5fb3, #7c8bff)',
    color: '#ff5fb3',
    year: '2023',
    metric: '99.9%',
    metricLabel: 'Uptime Delivered',
  },
  {
    name: 'Aether Engine',
    summary:
      'A WebGL-based 3D rendering engine built to power immersive, browser-based cinematic experiences with photorealistic lighting.',
    stack: ['Three.js', 'WebGL', 'TypeScript', 'GLSL'],
    impact: 'Delivered console-quality rendering performance directly within the browser.',
    gradient: 'linear-gradient(135deg, #c154ff, #ea80fc, #ffb6ff)',
    color: '#c154ff',
    year: '2024',
    metric: '60fps',
    metricLabel: 'Render Target',
    architecture: ['Scene Graph', 'Shader Compile', 'GPU Dispatch', 'Frame Output'],
  },
  {
    name: 'Chronos Sync',
    summary:
      'High-frequency real-time data streaming pipeline engineered to handle massive throughput for financial market analytics.',
    stack: ['Go', 'Kafka', 'Redis', 'WebSockets'],
    impact: 'Provided sub-second data synchronization across distributed global nodes.',
    gradient: 'linear-gradient(135deg, #ffb732, #ffdd55, #f5ff7a)',
    color: '#ffb732',
    year: '2023',
    metric: '5M+',
    metricLabel: 'Events/Sec',
  },
  {
    name: 'Nexus Protocol',
    summary:
      'A decentralized identity verification network utilizing zero-knowledge proofs for instantaneous, privacy-preserving authentication.',
    stack: ['Rust', 'Solidity', 'React', 'Cryptography'],
    impact: 'Eliminated central points of failure and reduced authentication latency.',
    gradient: 'linear-gradient(135deg, #ff3366, #ff7a59, #ffb347)',
    color: '#ff3366',
    year: '2022',
    metric: '10ms',
    metricLabel: 'Verification Time',
    architecture: ['Identity Claim', 'ZK Proof Gen', 'Chain Verify', 'Access Grant'],
  },
]

export const experience: Experience[] = [
  {
    company: 'Green Rider Technology',
    role: 'Software Engineer',
    period: 'Current',
    detail:
      'Building scalable web modules, shipping user-facing experiences, and improving reliability across product surfaces.',
  },
  {
    company: 'CodeAlpha',
    role: 'Developer Intern',
    period: 'Previous',
    detail:
      'Delivered frontend features, collaborated on API integration, and improved interaction quality for core workflows.',
  },
  {
    company: 'Robrotronix India',
    role: 'Engineering Trainee',
    period: 'Earlier',
    detail:
      'Contributed to embedded and software experiments with a focus on practical problem-solving and prototyping.',
  },
]

export const timeline = [
  {
    era: 'Foundation',
    description: 'Mastered core systems thinking and the raw mechanics of software architecture.',
  },
  {
    era: 'Web Engineering',
    description: 'Architected scalable React applications and robust MERN stack platforms.',
  },
  {
    era: 'AI + Prompt Systems',
    description: 'Pioneered AI-first interaction models and advanced prompt engineering pipelines.',
  },
]

export const stats = [
  { value: '3+', label: 'Years Building' },
  { value: '15+', label: 'Systems Shipped' },
  { value: '10k+', label: 'Lines of Code' },
  { value: '100%', label: 'Impact Driven' },
]
