# Slider Value Display Fix - Testing Guide

## Problem
When dragging sliders in the ELK force and stress demos (`flowchart-elk-force.html` and `flowchart-elk-stress.html`), the displayed parameter values did not update in real-time, even though the graph layouts were re-rendering correctly.

## Root Cause
The event listeners were being attached to the slider input elements, but the timing of attachment was causing them to fail to connect properly. The `updateForceConfig()` and `updateStressConfig()` functions were defined, but the event listeners weren't firing when sliders were adjusted.

## Solution
Wrapped the event listener attachment code in `setTimeout(0)` to ensure the DOM is fully ready before attaching listeners. This uses the JavaScript event loop to defer attachment until after the current script execution completes.

### Changes Made

#### `/demos/flowchart-elk-force.html`
- Replaced direct event listener attachment with `setTimeout(0)` wrapper
- Added error handling and console logging for debugging
- Event listeners now attach after DOM is fully ready

#### `/demos/flowchart-elk-stress.html`
- Applied identical fix to the stress demo
- Consistent error handling and logging

## Testing Steps

### Step 1: Start Local HTTP Server
```bash
cd /Users/elw/mermaid
python3 -m http.server 8000
# or: python -m http.server 8000
```

### Step 2: Test Force Demo
1. Open browser and navigate to `http://localhost:8000/demos/flowchart-elk-force.html`
2. Open browser console: F12 or right-click → Inspect → Console
3. Look for message: "Event listeners attached successfully"
4. Drag the **Force Repulsion** slider
   - ✅ Graph should re-render smoothly
   - ✅ Displayed value (e.g., "5.0") should update in real-time
5. Drag the **Force Temperature** slider
   - ✅ Graph should re-render
   - ✅ Displayed value (e.g., "0.001") should update
6. Drag the **Force Iterations** slider
   - ✅ Graph should re-render
   - ✅ Displayed value should update
7. Change **Force Model** dropdown
   - ✅ Graph should re-render with new model
   - ✅ Configuration should update
8. Click "↻ Reset to Defaults"
   - ✅ All sliders return to default positions
   - ✅ All displayed values reset
   - ✅ Graph re-renders with default configuration

### Step 3: Test Stress Demo
1. Navigate to `http://localhost:8000/demos/flowchart-elk-stress.html`
2. Check console for: "Stress demo event listeners attached successfully"
3. Drag the **Desired Edge Length** slider
   - ✅ Graph should re-render
   - ✅ Displayed value should update
4. Drag the **Epsilon** slider
   - ✅ Graph should re-render
   - ✅ Displayed value should update
5. Drag the **Iteration Limit** slider
   - ✅ Graph should re-render
   - ✅ Displayed value should update
6. Test Reset and Copy buttons

### Step 4: Verify Copy to Clipboard
- Click "📋 Copy Config" on either demo
- Paste into a text editor: the configuration JSON should appear
- Format should be valid JSON with all current parameter values

## Expected Console Output
```
Event listeners attached successfully
Stress demo event listeners attached successfully
```

If you see these messages, the fix is working correctly.

## Troubleshooting

### If console shows errors:
1. Check the browser's Network tab to ensure `mermaid.esm.mjs` and `mermaid-layout-elk.esm.mjs` loaded (should see 200 status)
2. If files return 404, verify your HTTP server is running from the correct directory
3. Check that dist files exist:
   - `packages/mermaid/dist/mermaid.esm.mjs` (should be ~63KB)
   - `packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs` (should be ~541B)

### If sliders still don't update values:
1. Open browser console (F12)
2. Type: `console.log(document.getElementById('forceRepulsionValue'))` 
   - Should return the DOM element
3. Try manually updating: `document.getElementById('forceRepulsionValue').textContent = '10.0'`
   - Value should appear on the page
4. If element doesn't exist or manual update fails, there may be a broader DOM issue

### If graph doesn't re-render:
1. Verify mermaid dist files loaded correctly (Network tab)
2. Check for JavaScript errors in console
3. Verify ELK layout plugin is registered: check Network tab for `mermaid-layout-elk.esm.mjs`

## Files Modified
- `/demos/flowchart-elk-force.html` - Added setTimeout wrapper for event listeners
- `/demos/flowchart-elk-stress.html` - Added setTimeout wrapper for event listeners

## Next Steps
After confirming the fix works:
1. Test with various diagrams to ensure performance is acceptable
2. Verify all four ELK demos work correctly
3. Consider documenting the interactive parameter feature in user-facing docs
4. Prepare PR for merge into main branch
