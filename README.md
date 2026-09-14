# Soujanya Lab

An experimental portfolio with a bold “Code. Craft. Curiosity.” opening, interactive diagrams of the actual projects, three distinct project worlds, an orbital identity exhibit, and a tactile physics playground. A spring-driven cursor and scroll-responsive artwork connect the sections. Built with TypeScript, GSAP, and Vite. No backend or API keys are required.

## Run locally

```sh
npm install
npm run dev
```

Open the local address printed by Vite. To create the production site:

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static host (for example, Vercel, Netlify, or Cloudflare Pages). Use `npm run build` as the build command and `dist` as the output directory.

## Edit the content

- `index.html`: biography, experience, contact details, navigation, and homepage previews.
- `src/projects.ts`: the project descriptions shown in dialogs.
- `src/style.css` and `src/chapters.css`: base layouts and component styles.
- `src/hero-stage.*`: bold editorial opening, responsive layout, and chapter navigation.
- `src/idea-desk.*`: extruded 3D project boards, pointer perspective, ordered ink reveals, and replay controls.
- `src/idea-forms.ts`: authored diagrams of the agent pipeline, learning journey, and conversational interface.
- `src/kinetic-type.*`: readable word entrances, deliberate text replay, and whole-label navigation transitions.
- `src/pencil-mark.*`: the lowercase sg pencil signature and writing reveal; `scripts/generate-monogram.mjs` regenerates its textured vector artwork and matching favicon from editable curves.
- `src/pencil-type.css`: the pencil treatment for the italic hero text.
- `src/work-stage.*`: the three project worlds and their pointer/scroll depth.
- `src/work-filters.*`: animated project filtering, a sliding selection indicator, and transitions that respect motion preferences.
- `src/lower-chapters.*`: about, playground, and contact art direction.
- `src/section-density.css`: content-driven preview heights, tighter section spacing, and responsive contact layout.
- `src/career-stage.*`: four selectable career chapters, changing generative artwork, role disclosures, and keyboard navigation.
- `src/editorial-graphics.*`: engraved contours for the identity card.
- `src/motion-trace.*`: bounded SVG traces of actual playground drag gestures.
- `src/cursor.*`: contextual mouse cursor and magnetic interactions.
- `src/playground.ts`: draggable toolkit objects, collisions, gravity, and keyboard controls.
- `src/main.ts`: filters, dialogs, motion preferences, and other interactions.
- `DESIGN.md`: the visual direction, palette, typography, and interaction choices.

The hero connects each project to a 3D board: evaluation inputs and raised agent blocks, a layered learning path, and a conversation driving interface actions. CSS perspective, shaded side faces, and pointer-controlled tilt give the authored SVG content depth without WebGL. Visitors can switch projects, replay the drawing and assembly, or open the corresponding work. Headings reveal in staggered whole words; hero text responds with an ink sweep on hover. Motion preferences persist, and reduced-motion settings show complete, stationary boards immediately.

Experience is an interactive exhibition: chapter buttons, native role disclosures, and the next-chapter control stay synchronized. Each role has its own palette and geometric artwork. Chapter buttons support arrow keys, Home, and End. Text reveals preserve the original accessible phrases; the cursor expands into a contextual hover frame, responds to presses, and adds local button and arrow feedback. Every interaction remains usable with motion disabled.

Manrope, Anton, DM Sans, and Instrument Serif are hosted locally; their SIL Open Font Licenses are included in `public/fonts/`.

Contact actions use the verified email address and social links. Email opens the visitor's email app; no messages are stored or sent by the site. This new showcase does not include an AI chat backend.

## Content sources and review

Content was adapted from the owner-provided [portfolio](https://www.soujanyalab.in/) and [LinkedIn profile](https://www.linkedin.com/in/soujanya-gupta-0224621ba/). The public LinkedIn profile lists Ethara AI, while the earlier portfolio lists Green Rider Technology as current; the newer LinkedIn information is used for the current company. Exact employment dates were omitted because an updated résumé was not attached.

Projects featured: EvalAgentFlow, Cohart, and the earlier agent-driven portfolio. Homepage project previews are original conceptual illustrations, not screenshots of the live products. No unverified performance metrics or testimonials are included. An updated résumé can be placed in `public/` and linked once available.

Visual direction draws on the editorial, craft-focused approach of the supplied Wall of Portfolios references; their artwork and layouts are not copied.

## Browser checks

```sh
npx playwright install chromium
npm test
```

If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Set `PLAYWRIGHT_BASE_URL` to test a production preview without development reloads. Checks cover the project diagrams, filters, dialog keyboard behavior, contact links, experience entries, motion preferences, playground controls, and responsive layouts. Run `node scripts/capture-design-review.mjs http://127.0.0.1:5189` against a preview to save section screenshots and layout measurements in `artifacts/design-repair/`.
