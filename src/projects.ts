export type Project = {
  category: string;
  title: string;
  subtitle: string;
  tags: string[];
  overview: string;
  approach: string;
  flow: string[];
  link?: { label: string; href: string };
  note?: string;
  context?: { text: string; label: string; href: string };
};

// Professional scope and project details come from the supplied October 2026 résumé.
// Project visuals on the homepage are original conceptual illustrations.
export const projects: Record<string, Project> = {
  morrow: {
    category: 'FEATURED PERSONAL BUILD / LOCAL BETA',
    title: 'Morrow',
    subtitle: 'A learning-first career workspace, built to run on your own computer.',
    tags: ['Python', 'React', 'TanStack Query', 'SQLite', 'Browser automation', 'Agent orchestration'],
    overview: 'I built Morrow to bring study, job preparation, and applications into one local workspace. It combines a 90-day learning plan, research and coding practice, résumé tailoring, job-board workflows, and a dashboard that makes each run visible.',
    approach: 'The frontend uses React at the route boundary and TanStack Query for data fetching, with Python services and an SQLite application ledger underneath. A crew of 18 specialized agents covers applications, profile updates, résumé preparation, research, and writing. The interface includes an action inbox, resumable daily flows, live run logs, browser previews, and daily reports. Screening answers and tailored résumés draw on saved profile facts; unresolved questions return to the user.',
    flow: ['Learn & research', 'Prepare the profile', 'Match opportunities', 'Follow agent runs', 'Review the record'],
    link: { label: 'Explore Morrow on GitHub', href: 'https://github.com/GuptaSoujanya/Morrow' },
    note: 'Personal project, currently distributed as a free local beta. The portfolio preview is an interactive illustration based on the public frontend, using original Morrow assets and sample content. It does not operate a live workspace.',
    context: {
      text: 'A local career workspace with Launchpad, Bot Crew, Learning, applications, reports, and visible agent activity. The visual preview follows the warm cream, burnt-orange, and illustrated-character system in the public frontend.',
      label: 'Morrow frontend source',
      href: 'https://github.com/GuptaSoujanya/Morrow-frontend',
    },
  },
  mymandi: {
    category: 'PROFESSIONAL WORK / ETHARA AI ENGINEERING TEAM',
    title: 'MyMandi',
    subtitle: 'Frontend engineering for commerce operations, from sales and stock to order fulfillment.',
    tags: ['Frontend engineering', 'Dashboards', 'API integrations', 'Shiprocket', 'AI features'],
    context: {
      text: 'MyMandi connects customers with local vendors through digital shopping, ordering, and delivery. Its public product listing describes support for local retail and last-mile commerce.',
      label: 'Official MyMandi product listing',
      href: 'https://play.google.com/store/apps/details?id=com.mandi.mandiweb',
    },
    overview: 'As a frontend engineer within Ethara AI’s engineering team, I built and maintained the dashboard for sales, inventory, and order management. This was part of a 10-month product engagement across MyMandi and Kuberha.',
    approach: 'I built the frontend workflows connecting product operations to external business applications. Across the two platforms, this work covered 100+ app integrations, including email and Google Sheets. Both products included Shiprocket order and delivery workflows and AI features integrated into the product interface.',
    flow: ['Sales dashboard', 'Inventory management', 'Order workflows', 'Shiprocket fulfillment', 'Apps & AI'],
    note: 'My scope was the dashboard frontend and connected workflows as part of the engineering team. The 100+ integrations are the combined scope across MyMandi and Kuberha, not a separate count for each product.',
  },
  kuberha: {
    category: 'PROFESSIONAL WORK / ETHARA AI ENGINEERING TEAM',
    title: 'Kuberha',
    subtitle: 'Frontend ownership for an AI-powered retail platform and its admin dashboard.',
    tags: ['Next.js', 'React', 'Tailwind CSS', 'shadcn/ui', 'Shiprocket', 'App integrations'],
    context: {
      text: 'Kuberha is retail software that uses AI-powered voice and image capabilities for billing, product cataloguing, and inventory. Its public listing describes real-time inventory updates and tools that reduce manual retail work.',
      label: 'Official Kuberha product listing',
      href: 'https://play.google.com/store/apps/details?id=com.kuberha.app',
    },
    overview: 'Within Ethara AI’s engineering team, I built the Kuberha website and admin dashboard using Next.js, Tailwind CSS, and shadcn/ui, including role-based access. I worked on sales, inventory, and order-management interfaces during the 10-month product engagement shared with MyMandi.',
    approach: 'The frontend connects business operations with app integrations, Shiprocket delivery workflows, and AI features. The integration work across Kuberha and MyMandi spans 100+ business applications, including email and Google Sheets. My focus was turning these capabilities into usable dashboard and product workflows.',
    flow: ['Admin & access', 'Sales & inventory', 'Orders & delivery', 'App connections', 'AI workflows'],
    note: 'Built as part of the Ethara AI engineering team. Product context comes from the official listing; the frontend contribution and integration scope are my professional experience. The integration count covers both products together.',
  },
  wildclaw: {
    category: 'PROFESSIONAL WORK / ETHARA AI',
    title: 'Agent evaluation platform',
    subtitle: 'A WildClawBench fork on the OpenClaw harness, expanded into an internal evaluation platform.',
    tags: ['Python', 'FastAPI', 'LiteLLM', 'AWS Bedrock', 'Docker', 'pytest'],
    overview: 'I built infrastructure to evaluate frontier models across realistic tool environments: Claude on AWS Bedrock with extended thinking, GPT-5.5, and OpenRouter, routed through a LiteLLM sidecar with prompt caching and cost tracking on every request.',
    approach: 'A three-judge council uses partial-coverage majority voting and separate evidence budgets, with weighted pytest suites providing a second scoring path. A host-side director silently changes backend state across 101 FastAPI mock services to test whether agents revisit assumptions. Runs support up to five concurrent sub-agents, each capped at 50 tool calls, 16k tokens, and 600 seconds. Delivery includes Docker sandboxing, offline dependencies, Whisper transcription, multimodal trajectories, and an EC2 pipeline with Git LFS.',
    flow: ['Route model requests', 'Run bounded agents', 'Inject state drift', 'Grade evidence', 'Audit cost and behavior'],
    note: 'Professional work at Ethara AI, formerly Green Rider Technology. The implementation is internal; this overview describes my engineering contributions to a fork of an existing open-source benchmark.',
  },
  evalagent: {
    category: '01 / AI ENGINEERING',
    title: 'EvalAgentFlow',
    subtitle: 'From raw evaluation data to a clearer picture of model performance.',
    tags: ['Python', 'LangChain', 'Multi-agent systems', 'LLM evaluation'],
    overview: 'An eight-agent pipeline that turns CSV evaluation data into benchmark reports. Each agent handles a distinct step, from ingesting and cleaning data to analyzing results and exporting insights.',
    approach: 'The pipeline combines human evaluation rubrics with automated code-similarity measures, including CodeBLEU, n-gram similarity, and dataflow matching. The workflow covers ingestion, cleaning, statistics, anomaly detection, insight extraction, and export.',
    flow: ['Ingest', 'Clean', 'Analyze', 'Detect anomalies', 'Extract insights', 'Export'],
    note: 'Project details are available in my résumé; a public implementation is not linked here.',
    link: { label: 'View résumé', href: '/resume.html' },
  },
  cohart: {
    category: '02 / WEB DEVELOPMENT',
    title: 'Cohart Study Guide',
    subtitle: 'An episode-based study platform for software and AI engineering.',
    tags: ['TypeScript', 'Next.js', 'Vercel', 'System design'],
    overview: 'A study platform covering React and Next.js architecture, Node.js and MongoDB backends, generative AI engineering, data structures and algorithms, and system design.',
    approach: 'I built the viewer application in TypeScript and Next.js and deployed it on Vercel. The episode-based organization gives learners a structured way to work through engineering topics and return to them for revision.',
    flow: ['Find a topic', 'Understand the concept', 'Practice', 'Prepare for interviews'],
    link: { label: 'Explore Cohart', href: 'https://course.soujanyalab.in/' },
    note: 'The live learning platform is linked below.',
  },
  ridemate: {
    category: '03 / FULL-STACK ENGINEERING',
    title: 'RideMate',
    subtitle: 'Geospatial ride matching with real-time updates.',
    tags: ['React', 'Node.js', 'Express', 'MongoDB', 'WebSockets', 'Redis'],
    overview: 'A MERN ride-matching application that uses location to connect riders with nearby rides. A dedicated women-to-women mode adds a safety-focused matching option.',
    approach: 'MongoDB provides geospatial matching, WebSockets carry live updates, Redis handles caching, and Node.js clustering supports concurrent processing. The project combines a React interface with backend APIs and real-time state.',
    flow: ['Request a ride', 'Match by location', 'Apply ride preferences', 'Receive live updates'],
    link: { label: 'View source on GitHub', href: 'https://github.com/GuptaSoujanya/Ridemate' },
    note: 'The public repository is linked for code review; no hosted ride service is implied.',
  },
};
