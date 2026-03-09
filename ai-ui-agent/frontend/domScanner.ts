import type { DOMSection, DOMStructure } from "../types/patchTypes";

/**
 * Scans the current page DOM and produces a simplified structure map.
 * This structure is sent to the AI so it can generate accurate selectors.
 */
export function scanDOM(): DOMStructure {
  const sections: DOMSection[] = [];

  // Scan semantic landmarks: sections, header, footer, nav, main, aside
  const landmarks = document.querySelectorAll(
    "section, header, footer, nav, main, aside, [role='banner'], [role='navigation'], [role='main'], [role='contentinfo']"
  );

  landmarks.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const tag = htmlEl.tagName.toLowerCase();

    // Build a meaningful selector
    let selector = tag;
    if (htmlEl.id) {
      selector = `#${htmlEl.id}`;
    } else if (htmlEl.className && typeof htmlEl.className === "string") {
      const firstClass = htmlEl.className.trim().split(/\s+/)[0];
      if (firstClass) selector = `.${firstClass}`;
    }

    // Derive a human-readable name
    let name = htmlEl.id || "";
    if (!name) {
      const heading = htmlEl.querySelector("h1, h2, h3");
      if (heading) {
        name = heading.textContent?.trim().slice(0, 40) || "";
      }
    }
    if (!name) {
      name = htmlEl.getAttribute("aria-label") || tag;
    }

    // Collect direct child selectors (first 10 only)
    const children: string[] = [];
    const directChildren = htmlEl.children;
    for (let i = 0; i < Math.min(directChildren.length, 10); i++) {
      const child = directChildren[i] as HTMLElement;
      if (child.id) {
        children.push(`#${child.id}`);
      } else if (child.className && typeof child.className === "string") {
        const cls = child.className.trim().split(/\s+/)[0];
        if (cls) children.push(`.${cls}`);
      }
    }

    sections.push({
      name,
      selector,
      tag,
      classes: htmlEl.className && typeof htmlEl.className === "string"
        ? htmlEl.className.trim().split(/\s+/).filter(Boolean)
        : [],
      children,
    });
  });

  return { sections };
}
