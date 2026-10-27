# Soujanya Lab — Build, Test, Understand

## Art direction

The established editorial template for a software engineer working across frontend platforms and AI agent evaluation. Preserve its large display type, paper and ink palette, pencil signature, 3D project boards, illustrated case studies, and motion language when adding content. The opening states the engineering focus, offers a résumé link, and provides short routes to Morrow, MyMandi, and Kuberha. Three architecture boards introduce the internal evaluation platform, EvalAgentFlow, and Cohart. Content and project provenance follow the owner-supplied résumé and reviewed public code.

- Charcoal: `#171719`
- Warm ivory: `#f1eee7`
- Electric orange: `#ff6b45`
- Lilac: `#c8bce6`
- Acid lime: `#dafb8d`
- Hero display type: Anton
- Hero accent: Vermilion `#ce4527`
- Supporting name type: Manrope
- Chapter display type: Anton
- Body and interface type: DM Sans
- Italic accents: Instrument Serif

All fonts are served locally with their licenses in `public/fonts/`. No external image or font requests are needed to render the site.

## Composition

1. A “Build. Test. Understand.” opening with a résumé action and three architecture boards.
2. An olive strip naming agent evaluation, LLM tooling, and full-stack engineering.
3. A work jump menu and featured Morrow build in its original warm cream and burnt-orange palette, with its sunrise logo, character illustrations, and Launchpad, Bot Crew, and Learning views. Two product features for MyMandi and Kuberha in the existing sage and lilac palette, with raised official logo tiles, layered dashboard artwork, and frontend responsibilities. Their shared 100+ integration highlight is a deep green panel with a continuous app-logo strip. The sage evaluation feature follows, explaining provider routing, state drift, grading, and cost tracking. The résumé’s three personal projects retain their large illustrated previews, including the blue RideMate architecture diagram.
4. The existing animated career exhibition, with three areas of ownership within one Ethara AI role and a fourth panel for the Robotronix internship. The frontend panel includes both products and the confirmed 10-month engagement.
5. A paper-colored GitHub section with the profile avatar, four original achievement badges, a framed screenshot of the public profile, and a compact repository grid. Direct code and commit-history links remain available. Prototype and simulation labels make current implementation scope clear.
6. A dark biography, skills, education, and certification section.
7. An orange contact section with the résumé email and a second résumé link.

## Motion and interaction

Project filters glide a lime indicator to the selected category. The outgoing collection fades upward before the selected projects rise into place, with a slightly delayed reveal of their scene artwork. Rapid selections resolve to the latest category, while motion-off, resizing, and hidden-tab changes settle the cards immediately. Animation uses separate CSS properties so the existing scroll and pointer artwork retains its own motion.

Headings enter as intact words with a 36px rise, restrained baseline hinge, and a short reveal; staggered hero lines finish in about a second. Hero words respond to hover with a terracotta ink sweep while staying in place. Navigation labels roll as a single unit. Project diagrams draw in phases as their solid panels rise from the board, then stop after completion. The caption and link always match the displayed project. Replay, pause, and reduced-motion controls preserve readable content. Career chapter transitions retain their selected role, palette, and keyboard navigation.

The cursor only runs while moving or settling, falls back to the native pointer for keyboard navigation and dialogs, and is disabled for touch or reduced motion. Drawing animations pause offscreen and in hidden tabs. Motion preferences persist and system reduced-motion settings take priority. Explicit controls and keyboard navigation remain usable when animation is off.

The added contribution buttons retain dark ink, stable hit areas, a light tint, and a small arrow movement on hover; they use the native pointer to avoid an overlapping cursor label. Morrow tabs support arrow keys, Home, and End. Preview cards and chart strokes animate once and can replay the selected view. Product artwork responds to pointer depth while surrounding controls stay fixed. Animations settle immediately when disabled or hidden.

The integration strip scrolls continuously only while visible, with a dedicated pause control and hover pause. Reduced motion replaces it with a wrapped static list and hides the duplicate visual track. Familiar logos identify named workflows; Gmail illustrates the email-app category. No additional business integration claims are implied by generic API, AI, and inventory symbols.

## Reference interpretation

The owner supplied the [Wall of Portfolios interactive collection](https://www.wallofportfolios.in/interactive-design-portfolios?company=All), including Oorja Kapoor, Akash Umang, and Florent Clanet. The direction takes inspiration from immersive openings, expressive typography, playful interaction, and a clear personal identity. All page compositions, project posters, and project diagrams are original to this implementation.

## Content

The owner’s October 2026 résumé is the authority for employment dates, role scope, and contact details. Public repositories are checked separately; mock implementations are called prototypes and timing simulations are labeled as such. No aggregate activity count, streak, benchmark score, or external contribution is inferred. See README.md for the source review and maintenance notes.

## Original graphic studies

The header uses an original lowercase sg pencil signature: a compact open s, a taller looped g, and a tapered finishing sweep. Slim strokes vary gently in pressure, with small dry-grain gaps and slightly irregular edges. The 82px mark (74px on mobile) replays a writing reveal on hover or keyboard focus. The matching browser-tab icon simplifies the same gestures for its smaller size. Editable curves and deterministic grain live in `scripts/generate-monogram.mjs`, which generates the standalone SVG and favicon. Touch and reduced-motion visitors see the complete signature immediately.

The visual system uses project diagrams as its main artwork. Each hero diagram is now a CSS 3D board with extruded panels, shaded edges, grounded shadows, and pointer-driven perspective. The diagrams retain their actual project relationships; the unrelated projected studies and contact ribbon remain removed. The identity card retains engraved organic contours around the monogram; skills and education replace the former playground. Contact heading and postcard share columns on wider screens, eliminating the extra vertical reserve.


Research references: [14islands — Blobmixer](https://www.14islands.com/work/blobmixer) informed the use of meaningful visitor-controlled parameters; [onformative — Pathfinder](https://onformative.com/work/pathfinder/) informed continuous transitions between related geometric forms; [Codrops — staggered grid animations](https://tympanus.net/codrops/2024/10/16/staggered-3d-grid-animations-with-scroll-triggered-effects/) informed restrained spatial layering. The architectural drawings and implementation are original. Product logos, Morrow brand artwork, GitHub badges, and the profile screenshot are sourced assets with provenance recorded under `public/assets/`.
