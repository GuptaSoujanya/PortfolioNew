import type { DOMStructure } from "../types/patchTypes.js";

/**
 * Formats the DOM structure into a concise string representation
 * that Gemini can use to generate accurate selectors.
 */
export function buildDOMContext(structure: DOMStructure): string {
  if (!structure.sections || structure.sections.length === 0) {
    return "No DOM structure provided.";
  }

  const lines = structure.sections.map((section) => {
    const childrenStr =
      section.children.length > 0
        ? `\n    children: ${section.children.join(", ")}`
        : "";

    return `  - ${section.name}
    selector: "${section.selector}"
    tag: <${section.tag}>
    classes: [${section.classes.join(", ")}]${childrenStr}`;
  });

  return `Page sections:\n${lines.join("\n\n")}`;
}
