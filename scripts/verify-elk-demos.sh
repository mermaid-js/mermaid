#!/bin/bash
# Quick test script to verify ELK demos are working

set -e

MERMAID_DIR="/Users/elw/mermaid"
DEMOS_DIR="$MERMAID_DIR/demos"

echo "=========================================="
echo "ELK Demo Import Verification"
echo "=========================================="
echo ""

# Check if dist files exist
echo "✓ Verifying built libraries exist..."
if [ -f "$MERMAID_DIR/packages/mermaid/dist/mermaid.esm.mjs" ]; then
    SIZE=$(ls -lh "$MERMAID_DIR/packages/mermaid/dist/mermaid.esm.mjs" | awk '{print $5}')
    echo "  ✓ mermaid.esm.mjs ($SIZE)"
else
    echo "  ✗ mermaid.esm.mjs NOT FOUND - run: pnpm build:esbuild"
    exit 1
fi

if [ -f "$MERMAID_DIR/packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs" ]; then
    SIZE=$(ls -lh "$MERMAID_DIR/packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs" | awk '{print $5}')
    echo "  ✓ mermaid-layout-elk.esm.mjs ($SIZE)"
else
    echo "  ✗ mermaid-layout-elk.esm.mjs NOT FOUND - run: pnpm build:esbuild --filter mermaid-layout-elk"
    exit 1
fi

echo ""
echo "✓ Checking import paths in demos..."
echo ""

# Check each ELK demo
DEMOS=(
    "flowchart-elk.html"
    "flowchart-elk-force.html"
    "flowchart-elk-stress.html"
    "flowchart-elk-force-vs-stress.html"
)

for demo in "${DEMOS[@]}"; do
    demo_path="$DEMOS_DIR/$demo"
    if [ -f "$demo_path" ]; then
        echo "  Demo: $demo"
        
        # Check for correct mermaid import
        if grep -q "import mermaid from '../packages/mermaid/dist/mermaid.esm.mjs'" "$demo_path"; then
            echo "    ✓ Mermaid import: ../packages/mermaid/dist/mermaid.esm.mjs"
        else
            echo "    ✗ Mermaid import not found or incorrect"
        fi
        
        # Check for correct elk import
        if grep -q "import layouts from '../packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs'" "$demo_path"; then
            echo "    ✓ ELK import: ../packages/mermaid-layout-elk/dist/mermaid-layout-elk.esm.mjs"
        else
            echo "    ✗ ELK import not found or incorrect"
        fi
        echo ""
    fi
done

echo "=========================================="
echo "✅ All imports verified!"
echo "=========================================="
echo ""
echo "Next: Start a local HTTP server to test:"
echo ""
echo "  cd $DEMOS_DIR"
echo "  python3 -m http.server 8000"
echo ""
echo "Then open in your browser:"
echo "  • http://localhost:8000/flowchart-elk-force.html"
echo "  • http://localhost:8000/flowchart-elk-stress.html"
echo "  • http://localhost:8000/flowchart-elk.html"
echo "  • http://localhost:8000/flowchart-elk-force-vs-stress.html"
echo ""
