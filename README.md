# Soujanya Lab

A portfolio focused on Soujanya Gupta’s frontend product engineering, AI agent evaluation, and LLM tooling work. Built with TypeScript, GSAP, and Vite, with locally hosted fonts and no backend or API keys.

## Run locally

```sh
npm install
npm run dev
npm run build
```

The production output is `dist/`, suitable for static hosting. This repository update does not deploy the site.

## Content and structure

The original editorial template is retained: oversized typography, the pencil signature, animated 3D project boards, interactive project previews, career artwork, the identity card, and the contact postcard. Product additions use the same colors and typography. The opening introduces frontend and AI evaluation work, links to the résumé, and includes direct jumps to Morrow, MyMandi, and Kuberha. The page then presents:

1. Morrow as a featured personal build with original artwork and three interactive preview views. MyMandi and Kuberha frontend contributions follow, with official product icons, layered dashboard illustrations, and a scrolling integration strip. The internal WildClawBench platform uses the OpenClaw harness.
2. Three résumé projects: EvalAgentFlow, Cohart Study Guide, and RideMate.
3. Experience at Ethara AI (formerly Green Rider Technology), organized into evaluation, dataset quality, and frontend ownership, followed by the Robotronix Engineering Tech internship.
4. A captured public GitHub profile, four verified achievement badges, and selected repositories with source and author-filtered commit-history links.
5. Biography, skills, education, certifications, and contact details.

Project diagrams are authored architecture illustrations. Morrow’s preview uses sample content and does not operate its local workspace. The evaluation preview does not execute model requests. The GitHub section is a curated snapshot, not a live activity counter.

## Content sources and verification

Updated on 28 October 2026 from the résumé supplied by the owner and the public [GitHub profile](https://github.com/GuptaSoujanya). The supplied résumé takes precedence for the name, current role, employment dates, location, and email. Ethara AI and Green Rider Technology describe one continuous role, not two employers. CodeAlpha and the earlier agent-driven portfolio were removed from the featured narrative.

Professional implementation details and résumé project capabilities are owner-supplied. The internal WildClawBench implementation has no public source link; this portfolio does not claim authorship of the upstream benchmark. EvalAgentFlow likewise has no verified public implementation link. `Agents-flow` contains only a license at review time and is not presented as its source code.

The owner confirmed a 10-month product engagement on MyMandi and Kuberha within Ethara AI’s engineering team. Scope includes sales, inventory, admin, and order dashboards, Shiprocket delivery workflows and AI features in both products. The 100+ figure refers to business-app integrations across the two products together, including email apps and Google Sheets. It is not an order count or a separate count per product. Frontend ownership is distinguished from ownership of the entire product or backend.

Public product context comes from the official [MyMandi listing](https://play.google.com/store/apps/details?id=com.mandi.mandiweb) and [Kuberha listing](https://play.google.com/store/apps/details?id=com.kuberha.app). These describe the products; the owner's contribution comes from the supplied professional history. The conceptual workflow diagrams do not represent screenshots of the private dashboards.

Public repositories were checked using the GitHub REST API and source files:

- [Morrow](https://github.com/GuptaSoujanya/Morrow): a personal career-workspace beta. The README at `e626fbddbc5a9ad582963fff5cad769a9490f307` and [frontend](https://github.com/GuptaSoujanya/Morrow-frontend) at `85f6be68a4eae4ea26c9ea6504fc8e4a88a6bc02` establish the 90-day learning plan, 18 specialist agents, React/TanStack Query interface, Python services, and SQLite ledger. Original logo and character assets come from the frontend. Workflows have not been independently executed.
- [llm-eval-harness](https://github.com/GuptaSoujanya/llm-eval-harness): the CLI uses `MockLLMProvider`; presented as a prototype with task and metric interfaces.
- [agentic-rag-benchmark](https://github.com/GuptaSoujanya/agentic-rag-benchmark): a small in-memory retrieval and metrics prototype.
- [inference-latency-profiler](https://github.com/GuptaSoujanya/inference-latency-profiler): the engine simulates token delays; presented as a timing simulation.
- [RideMate](https://github.com/GuptaSoujanya/Ridemate) and [Cohart](https://github.com/GuptaSoujanya/Cohart-Study-guide): repository existence verified; detailed project scope follows the supplied résumé. Cohart’s live URL is owner-supplied.

No benchmark performance tables, contribution streaks, upstream contribution counts, or adoption claims were inferred from repository descriptions. Authored-PR and commit links let readers inspect the underlying activity. The displayed public repositories are the owner’s own projects.

The public GitHub profile was captured on 28 October 2026 (India time) in a signed-out browser. Its achievement sidebar confirms Pull Shark, Pair Extraordinaire, Quickdraw, and YOLO. The displayed screenshot is unedited; badge images are the originals served by GitHub. The résumé remains the authority for the portfolio’s name, location, and role title, even where profile text differs. `scripts/capture-github-profile.mjs` refreshes the screenshot and records capture metadata; review it before updating the displayed date.

MyMandi and Kuberha icons come from their official Google Play listings. Google Sheets and Shiprocket represent named workflows; Gmail is labeled as an illustration of the owner-confirmed email-app category. Other strip entries describe workflow categories rather than claiming additional named integrations. Asset provenance is recorded in `public/assets/*/SOURCE.txt`.

## Editing

- `index.html`: homepage, flagship work, experience, GitHub selection, skills, and contact.
- `public/resume.html`: standalone résumé, with print styles for the browser’s Print / Save as PDF command. Keep it aligned with experience and skills edits.
- `src/projects.ts`: project-dialog content.
- `src/recruiter-content.css`: additive styles for product contributions, the flagship, repository list, skills, and updated copy. The existing template styles and interactive modules remain active.
- `src/product-showcase.ts` and `src/product-showcase.css`: Morrow tabs and agent descriptions, finite illustration replays, pointer depth, and integration-strip motion. The strip pauses on hover, its own pause control, global motion-off, reduced-motion preferences, hidden tabs, and leaving the viewport.
- `src/showcase-polish.css`: branded product cards, readable contribution-button hover states, integration strip, and GitHub profile, badge, and repository layouts.
- `src/idea-desk.ts` and `src/idea-forms.ts`: hero architecture diagrams and destinations.
- `src/career-stage.ts`: experience chapter labels, artwork, and navigation.
- `src/chapters.ts`: evaluation illustration and curriculum preview interactions.
- `src/main.ts`: dialogs, contact actions, navigation, and motion preferences.

The design retains the original editorial typography, pencil signature, project boards, and accessible motion controls. The former playground has been replaced with skills and education. Dormant artwork modules are not imported into the application.

## Checks

```sh
npm run build
npm test
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a local Chromium executable if needed. `PLAYWRIGHT_BASE_URL` can target an existing preview server. Tests cover content destinations, filters, dialogs, career navigation, Morrow keyboard tabs and replay behavior, stable contribution controls, marquee pause behavior, brand assets, GitHub badges, motion preferences, and responsive layouts.

```sh
node scripts/capture-design-review.mjs http://127.0.0.1:5189 artifacts/review
```

This captures desktop/mobile screenshots and layout measurements. Browser tooling must be available on the host.
