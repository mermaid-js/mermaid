# Testing ELK Interactive Demos Locally

After the import path fixes, the interactive ELK demos now work with explicit paths to the built Mermaid libraries. Here's how to test them locally.

## Prerequisites

Ensure you have built the mermaid libraries:

```bash
cd /Users/elw/mermaid
pnpm build:esbuild --filter mermaid-layout-elk
```

This creates the required dist files:
- `packages/mermaid/dist/mermaid.esm.mjs` (63K)
- `packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs` (541B)

## Option 1: Using a Local HTTP Server (Recommended)

The demos use ES modules which require HTTP protocol (not `file://`). Use a simple HTTP server:

```bash
# Using Python 3
cd /Users/elw/mermaid/demos
python3 -m http.server 8000

# Or using Node.js with http-server
npx http-server demos -p 8000
```

Then open in your browser:
- **Force Demo**: `http://localhost:8000/flowchart-elk-force.html`
- **Stress Demo**: `http://localhost:8000/flowchart-elk-stress.html`

## Option 2: Using the Mermaid Dev Server

If you're running the mermaid dev server:

```bash
pnpm dev
```

The demos will be available at:
- `http://localhost:5173/demos/flowchart-elk-force.html`
- `http://localhost:5173/demos/flowchart-elk-stress.html`

## What to Test

### Force-Directed Demo (`flowchart-elk-force.html`)

1. **Rendering**: Both example diagrams should render with proper node layout
2. **Parameter Controls** (in the control panel at top):
   - **Force Model**: Switch between `FRUCHTERMAN_REINGOLD` and `EADES`
   - **Force Repulsion**: Adjust with slider (0.1-10.0)
   - **Force Iterations**: Adjust with slider (1-1000)
   - **Force Temperature**: Adjust with slider (0.0001-0.1)
3. **Live Updates**: As you adjust sliders, diagrams should re-render with new layout
4. **Reset Button**: Should restore default parameters
5. **Copy Config**: Should copy current configuration to clipboard as JSON

### Stress-Minimization Demo (`flowchart-elk-stress.html`)

1. **Rendering**: All three example diagrams should render with compact layout
2. **Parameter Controls** (in the control panel at top):
   - **Desired Edge Length**: Adjust with slider (10-500)
   - **Iteration Limit**: Adjust with slider (0=unlimited, 1-2000)
   - **Epsilon (Convergence Threshold)**: Adjust with slider (0.00001-0.1)
3. **Live Updates**: As you adjust sliders, diagrams should re-render with new layout
4. **Reset Button**: Should restore default parameters  
5. **Copy Config**: Should copy current configuration to clipboard as JSON

## Import Path Details

The demos now use these explicit paths to the built libraries:

```javascript
import mermaid from '../packages/mermaid/dist/mermaid.esm.mjs';
import layouts from '../packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs';
```

From the `demos/` directory, this resolves to:
- `demos/../packages/mermaid/dist/mermaid.esm.mjs` → `packages/mermaid/dist/mermaid.esm.mjs`
- `demos/../packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs` → `packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs`

## Troubleshooting

### Diagrams Not Rendering

- **Check console for errors** (F12 or Cmd+Option+I)
- **Verify dist files exist**:
  ```bash
  ls -lh packages/mermaid/dist/mermaid.esm.mjs
  ls -lh packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs
  ```
- **Rebuild if needed**:
  ```bash
  pnpm build:esbuild
  ```

### CORS Errors

- Use `file://` protocol or an HTTP server
- Direct `file://` opens may have CORS restrictions on ES modules
- Always use `http://localhost:8000` for local testing

### Parameter Changes Don't Update Diagram

- Check browser console for JavaScript errors
- Verify mermaid has initialized (look for initialization logs)
- Try the reset button first, then adjust parameters

## Next Steps

Once verified locally:
1. Run full test suite: `pnpm test`
2. Build for production: `pnpm build`
3. Create a PR with the tested changes
