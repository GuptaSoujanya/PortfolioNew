// ── Patch Action Types ──────────────────────────────────────────────

export type PatchActionType = "remove" | "hide" | "style" | "replace" | "text";

export interface RemoveAction {
  action: "remove";
  selector: string;
}

export interface HideAction {
  action: "hide";
  selector: string;
}

export interface StyleAction {
  action: "style";
  selector: string;
  styles: Record<string, string>;
}

export interface ReplaceAction {
  action: "replace";
  selector: string;
  html: string;
}

export interface TextAction {
  action: "text";
  selector: string;
  content: string;
}

export type PatchAction =
  | RemoveAction
  | HideAction
  | StyleAction
  | ReplaceAction
  | TextAction;

// ── API Types ───────────────────────────────────────────────────────

export interface PatchRequest {
  prompt: string;
}

export interface PatchResponse {
  actions: PatchAction[];
}

// ── DOM Scanner Types ───────────────────────────────────────────────

export interface DOMSection {
  name: string;
  selector: string;
  tag: string;
  classes: string[];
  children: string[];
}

export interface DOMStructure {
  sections: DOMSection[];
}
