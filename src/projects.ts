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
};

// Content is based on Soujanya's supplied portfolio and public LinkedIn profile.
// Project visuals on the homepage are original conceptual illustrations.
export const projects: Record<string, Project> = {
  evalagent: {
    category: '01 / AI ENGINEERING',
    title: 'EvalAgentFlow',
    subtitle: 'From raw evaluation data to a clearer picture of model performance.',
    tags: ['Python', 'LangChain', 'Multi-agent systems', 'LLM evaluation'],
    overview: 'An eight-agent pipeline that turns CSV evaluation data into benchmark reports. Each agent handles a distinct step, from ingesting and cleaning data to analyzing results and exporting insights.',
    approach: 'The pipeline combines human evaluation rubrics with automated code-similarity measures, including CodeBLEU, n-gram similarity, and dataflow matching. Its agents can be swapped independently, so the workflow can adapt to new evaluation formats.',
    flow: ['Ingest', 'Clean', 'Analyze', 'Detect anomalies', 'Extract insights', 'Export'],
    note: 'The homepage visual illustrates the pipeline concept. Learn more about this project on my LinkedIn profile.',
    link: { label: 'View project background', href: 'https://www.linkedin.com/in/soujanya-gupta-0224621ba/' },
  },
  cohart: {
    category: '02 / WEB DEVELOPMENT',
    title: 'Cohart',
    subtitle: 'A structured, open-access path to preparing for a career in tech.',
    tags: ['Learning platform', 'Web fundamentals', 'Generative AI', 'System design'],
    overview: 'A free learning platform that brings technical concepts and interview preparation into one place. Cohart covers web fundamentals, frontend and backend development, generative AI, infrastructure, data structures, aptitude, and system design.',
    approach: 'Learning is organized into episodes with explanations, diagrams, practice exercises, interview questions, and revision notes. The idea is to make it easier to learn a concept, put it into practice, and come back to it before an interview.',
    flow: ['Find a topic', 'Understand the concept', 'Practice', 'Prepare for interviews'],
    link: { label: 'Explore Cohart', href: 'https://course.soujanyalab.in/' },
    note: 'The homepage preview is a visual concept; the linked learning platform has its own interface.',
  },
  agui: {
    category: '03 / EXPERIMENTAL WEB',
    title: 'Agent-Driven Portfolio',
    subtitle: 'A portfolio that responds to intent, not just clicks.',
    tags: ['Agent-driven UI', 'AI integration', 'Retrieval-grounded assistant'],
    overview: 'An exploration of a conversational interface: natural-language prompts can change the live portfolio, from adjusting its theme to changing how much motion it uses.',
    approach: 'The original project connects user intent with component and theme state. It also includes a retrieval-grounded assistant that answers questions about my work and experience.',
    flow: ['Describe a change', 'Interpret intent', 'Update the interface'],
    link: { label: 'Visit the original portfolio', href: 'https://www.soujanyalab.in/' },
    note: 'This project describes my earlier AI-enabled portfolio. The site you are browsing is a new interactive showcase; it does not send prompts to an AI service.',
  },
};
