---
name: 21st-extractor
description: Extracts exact React/Three.js source code, demo code, dependencies, and styles from any 21st.dev component URL or identifier, supporting both official authenticated registry API and zero-auth autonomous live extraction.
---

# 21st.dev Exact Component Code Extractor

Use this skill whenever you need to extract the exact source code, demo code, dependencies, CSS styles, or 3D/canvas implementations from a [21st.dev](https://21st.dev) component URL (e.g. `https://21st.dev/@author/components/slug`).

## Capabilities

1. **Dual Extraction Architecture**:
   - **Authenticated Engine**: Uses official 21st.dev registry endpoints (`/api/v1/components/install/{username}/{slug}`) when `API_KEY_21ST`, `TWENTYFIRST_TOKEN`, or `~/.config/21st/auth.json` is available.
   - **Autonomous Reverse-Engineering Engine**: Zero-auth public extraction pipeline that queries Next.js RSC payload (`self.__next_f`), extracts exact CDN assets (`bundle.html`, `code.demo.tsx`, styles, and assets), and unpacks complete React/Three.js components.
2. **Deterministic Output**:
   - `component.tsx` / `<ComponentName>.tsx`: Fully reconstructed, idiomatic React component with TypeScript types.
   - `demo.tsx`: Exact usage demo with imports.
   - `<slug>.css`: Extracted CSS styles (when applicable).
   - `package.json`: Complete dependency map (e.g., `three`, `@react-three/fiber`, `framer-motion`).
   - `bundle.html`: Standalone interactive live sandbox executable in browser.
   - `metadata.json`: Full component metadata (author, description, CDN URLs, preview media).

## CLI Execution

Run the bundled Python script (defaults automatically to `/opt/lyai/app/lyai-shared/components/<slug>`):

```bash
python .agents/skills/21st-extractor/scripts/extract_21st.py "<21st_url_or_slug>" [output_directory]
```

### Supported Input Formats
- `https://21st.dev/@author/components/slug`
- `https://21st.dev/@author/slug`
- `https://21st.dev/r/author/slug`
- `@author/slug`
- `author/slug`

### Examples
```bash
# Extract Agentic Factory 3D (stores into /opt/lyai/app/lyai-shared/components/agentic-factory-3d)
python .agents/skills/21st-extractor/scripts/extract_21st.py "https://21st.dev/@eugeneshilow/components/agentic-factory-3d"

# Extract Robot Hero (stores into /opt/lyai/app/lyai-shared/components/robot-hero)
python .agents/skills/21st-extractor/scripts/extract_21st.py "https://21st.dev/@alexperezcedeno/components/robot-hero"
```

## Workflow for the Agent

When a user provides a 21st.dev URL:
1. Run `python .agents/skills/21st-extractor/scripts/extract_21st.py "<url>" "<target_folder>"`.
2. Inspect the generated files in `<target_folder>`.
3. Provide the user with direct clickable links to the extracted code and demo files.
