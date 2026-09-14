# Soujanya Lab — Code, Craft, Curiosity

## Art direction

A compact editorial introduction for a software engineer. Condensed headings sit alongside a bounded project panel, with diagrams explaining agent orchestration, a learning path, and conversational interfaces. These sketches connect directly to the projects below. The hero fits its content, and mobile puts Code and Craft on one line to reach the work sooner. Learning and interface previews use content-driven heights; section padding is tighter, and the contact postcard participates in normal layout.

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

1. A compact typographic introduction with an italic accent and an interactive panel explaining three real projects. The unrelated 3D experiment is removed.
2. A dark olive moving strip into selected work.
3. Three project worlds: the violet signal room, green learning studio, and orange interface lab. Layered artwork and interactive previews give each a distinct character.
4. A dark, personal identity exhibit with orbital graphics and a physical member card.
5. A cream experimental studio containing draggable toolkit objects and working gravity controls.
6. A career exhibition headed “Built by every chapter,” with four selectable stages. Lilac orbital connections, sage nested structures, peach concentric forms, and blue radial circuits give each role a distinct identity. The selected chapter synchronizes its artwork, perspective, and native role disclosure.
7. An orange contact finale with oversized type and a physical postcard email action.

## Motion and interaction

Project filters glide a lime indicator to the selected category. The outgoing collection fades upward before the selected projects rise into place, with a slightly delayed reveal of their scene artwork. Rapid selections resolve to the latest category, while motion-off, resizing, and hidden-tab changes settle the cards immediately. Animation uses separate CSS properties so the existing scroll and pointer artwork retains its own motion.

Headings enter as intact words with a 36px rise, restrained baseline hinge, and a short reveal; staggered hero lines finish in about a second. Hero words respond to hover with a terracotta ink sweep while staying in place. Navigation labels roll as a single unit. Project diagrams draw in phases as their solid panels rise from the board, then stop after completion. The caption and link always match the displayed project. Replay, pause, and reduced-motion controls preserve readable content. Career chapter transitions retain their selected role, palette, and keyboard navigation.

The cursor only runs while moving or settling, falls back to the native pointer for keyboard navigation and dialogs, and is disabled for touch or reduced motion. Playground and drawing animations pause offscreen and in hidden tabs. Motion preferences persist and system reduced-motion settings take priority. Explicit controls and keyboard movement remain usable when animation is off.

## Reference interpretation

The owner supplied the [Wall of Portfolios interactive collection](https://www.wallofportfolios.in/interactive-design-portfolios?company=All), including Oorja Kapoor, Akash Umang, and Florent Clanet. The direction takes inspiration from immersive openings, expressive typography, playful interaction, and a clear personal identity. All page compositions, project posters, and project diagrams are original to this implementation.

## Content

The redesign keeps the previously verified biography, project descriptions, company history, and contact destinations. Project posters remain labeled conceptual illustrations. No achievements, client lists, awards, metrics, or résumé dates were invented.

## Original graphic studies

The header uses an original lowercase sg pencil signature: a compact open s, a taller looped g, and a tapered finishing sweep. Slim strokes vary gently in pressure, with small dry-grain gaps and slightly irregular edges. The 82px mark (74px on mobile) replays a writing reveal on hover or keyboard focus. The matching browser-tab icon simplifies the same gestures for its smaller size. Editable curves and deterministic grain live in `scripts/generate-monogram.mjs`, which generates the standalone SVG and favicon. Touch and reduced-motion visitors see the complete signature immediately.

The visual system uses project diagrams as its main artwork. Each hero diagram is now a CSS 3D board with extruded panels, shaded edges, grounded shadows, and pointer-driven perspective. The diagrams retain their actual project relationships; the unrelated projected studies and contact ribbon remain removed. The identity card retains engraved organic contours around the monogram; the playground records actual drag gestures as a thin path that clears on reset. Contact heading and postcard share columns on wider screens, eliminating the extra vertical reserve.


Research references: [14islands — Blobmixer](https://www.14islands.com/work/blobmixer) informed the use of meaningful visitor-controlled parameters; [onformative — Pathfinder](https://onformative.com/work/pathfinder/) informed continuous transitions between related geometric forms; [Codrops — staggered grid animations](https://tympanus.net/codrops/2024/10/16/staggered-3d-grid-animations-with-scroll-triggered-effects/) informed restrained spatial layering. The drawings and implementation are original; source artwork and code were not copied.
