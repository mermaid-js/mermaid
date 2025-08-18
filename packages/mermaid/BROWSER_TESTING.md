# Browser Performance Testing

## ANTLR vs Jison Performance Comparison

This directory contains tools for comprehensive browser-based performance testing of the ANTLR parser vs the original Jison parser.

### Quick Start

1. **Build ANTLR version:**
   ```bash
   pnpm run build:antlr
   ```

2. **Start test server:**
   ```bash
   pnpm run test:browser
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

### Test Features

- **Real-time Performance Comparison**: Side-by-side rendering with timing metrics
- **Comprehensive Test Suite**: Multiple diagram types and complexity levels
- **Visual Results**: See both performance metrics and rendered diagrams
- **Detailed Analytics**: Parse time, render time, success rates, and error analysis

### Test Cases

- **Basic**: Simple flowcharts
- **Complex**: Multi-path decision trees with styling
- **Shapes**: All node shape types
- **Styling**: CSS styling and themes
- **Subgraphs**: Nested diagram structures
- **Large**: Performance stress testing

### Metrics Tracked

- Parse Time (ms)
- Render Time (ms)
- Total Time (ms)
- Success Rate (%)
- Error Analysis
- Performance Ratios

### Expected Results

Based on our Node.js testing:
- ANTLR: 100% success rate
- Jison: ~80% success rate
- Performance: ANTLR ~3x slower but acceptable
- Reliability: ANTLR superior error handling

### Files

- `browser-performance-test.html` - Main test interface
- `mermaid-antlr.js` - Local ANTLR build
- `test-server.js` - Simple HTTP server
- `build-antlr-version.js` - Build script

### Troubleshooting

If the ANTLR version fails to load, the test will fall back to comparing two instances of the Jison version for baseline performance measurement.
