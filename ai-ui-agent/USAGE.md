# AI UI Agent — Usage Guide

## Quick Start

### 1. Set your Gemini API key

In the project root `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8788
```

### 2. Start the backend server

```bash
cd ai-ui-agent
npm run dev
```

The server runs at `http://localhost:8788`.

### 3. Connect the frontend

Add this single line in your app's entry point (e.g. `src/main.tsx`) **after** the app mounts:

```tsx
// At the bottom of main.tsx, after ReactDOM render
import('../ai-ui-agent/frontend/agentClient').then(({ mountAGUIPanel }) => {
  mountAGUIPanel()
})
```

### 4. Use it

- Press **Ctrl+Shift+A** (or **Cmd+Shift+A** on Mac) to open the panel
- Type a prompt like "Make the navbar dark"
- Click **Apply** or press **Enter**
- **Refresh the page** to reset all changes

---

## Programmatic Usage

You can also use the agent directly in code:

```ts
import { askUIAgent } from '../ai-ui-agent/frontend/agentClient'

// Apply a UI change
const result = await askUIAgent("Hide the 3D hero animation")
console.log(result.patchResult) // { applied: 1, skipped: 0, errors: [] }
```

---

## API Reference

### POST `/api/ai-ui-agent`

**Request:**
```json
{
  "prompt": "Remove 3D element from hero section",
  "domStructure": { "sections": [...] }
}
```

**Response:**
```json
{
  "actions": [
    { "action": "remove", "selector": ".hero-bg" }
  ]
}
```

### GET `/api/ai-ui-agent/health`

Returns `{ "status": "ok" }`.

---

## Test Prompts

Try these:

- "Remove the 3D hero animation"
- "Make navbar background black"
- "Increase hero padding"
- "Hide testimonial section"
- "Change hero title to Hello World"
- "Make all section titles red"
- "Hide the footer"

---

## Architecture

```
User Prompt → Backend API → Gemini AI → JSON UI Patch → Patch Engine → DOM Modified
                                                                         ↓
                                                              Refresh = Reset
```

All changes are **runtime-only**. No database, no localStorage, no file modifications.
