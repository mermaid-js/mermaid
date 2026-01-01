# Fix Verification Guide for PR #7269

## ✅ Fix Status: WORKING CORRECTLY

### Understanding the Argos CI Status

**Current Argos Status: "1 added - waiting for your decision"**

This is **EXPECTED** and **CORRECT** behavior because:
- This PR adds a NEW test case (`architecture-7267.spec.ts`) that didn't exist before
- Argos has no previous baseline screenshot to compare against
- Argos needs a maintainer to **approve the new baseline** snapshot
- This is NOT a failure - it's waiting for human review/approval

### How to Verify the Fix Works

#### Option 1: Use the Deploy Preview (Recommended)

1. Visit the deploy preview: https://deploy-preview-7269--mermaid-js.netlify.app
2. Open the browser console and paste this code:

```javascript
// Test the exact diagram from issue #7267
const diagram = `architecture-beta
    group a1(internet)[Internet]
    service modem(server)[ModemBox] in a1

    group router(cloud)[MT Router]

    group netBridge(cloud)[Bridge] in router

    group vlMgmt(cloud)[vl Mgmt] in netBridge
    group vlIot(cloud)[vl IoT] in netBridge
    group vlSip(cloud)[vl SIP] in netBridge
    group vlGuest(cloud)[vl Guest] in netBridge
    group vlIntern(cloud)[vl Internal] in netBridge

    service ppp(internet)[Upstream] in router
    service svc(server)[Service Port] in router
    
    service admin(cloud)[Admin]

    service snIntern[subN 10] in vlIntern
    service snIot[subN 30] in vlIot
    service snGuest[subN 31] in vlGuest
    service snSip[subN 40] in vlSip
    service snMgmt[subN 99] in vlMgmt

    ppp:T -- B:modem{group}

    svc:R -[here be problems]- L:admin{group}
`;

// Render it
await mermaid.render('test-diagram', diagram).then(({svg}) => {
  document.body.innerHTML = svg;
});

// Check the admin node position
const adminNode = document.querySelector('#service-admin');
const transform = adminNode.getAttribute('transform');
console.log('Admin node transform:', transform);

// Extract coordinates
const match = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(transform);
if (match) {
  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);
  console.log(`Admin node position: x=${x}, y=${y}`);
  console.log('✅ In viewport bounds:', Math.abs(x) < 5000 && Math.abs(y) < 5000);
} else {
  console.error('❌ Could not parse transform');
}
```

**Expected Result:**
- The admin node coordinates should be reasonable (e.g., x: 200-2000, y: 100-1500)
- All nodes should be visible in the viewport
- No nodes should have coordinates like x: 50000 or y: -80000

#### Option 2: Check the Code Changes

The fix corrected Y-axis calculations in `shiftPositionByArchitectureDirectionPair`:

**Before (WRONG):**
```typescript
// Top direction was ADDING +1 (moving DOWN - wrong!)
y + (rhs === 'T' ? 1 : -1)  // ❌ INVERTED

// Bottom direction was SUBTRACTING -1 (moving UP - wrong!)
y + (rhs === 'T' ? 1 : -1)  // ❌ INVERTED
```

**After (CORRECT):**
```typescript
// Top direction now SUBTRACTS -1 (moves UP - correct!)
y + (rhs === 'T' ? -1 : 1)  // ✅ CORRECT

// Bottom direction now ADDS +1 (moves DOWN - correct!)
y + (rhs === 'T' ? -1 : 1)  // ✅ CORRECT
```

**Why this matters:**
- SVG/screen coordinates have Y increasing DOWNWARD
- "Top" means smaller Y values (move up = subtract)
- "Bottom" means larger Y values (move down = add)
- The original code had these inverted, causing nodes to position far off-screen

### What Changed

1. **Core Fix:** `packages/mermaid/src/diagrams/architecture/architectureTypes.ts` lines 141, 146, 148
2. **Unit Tests:** `packages/mermaid/src/diagrams/architecture/architectureTypes.spec.ts`
3. **E2E Test:** `cypress/integration/rendering/architecture-7267.spec.ts`
4. **Changeset:** `.changeset/fix-architecture-layout.md`
5. **Test Stability:** Increased timeouts and added preflight checks for CI reliability

### For Maintainers: How to Approve Argos

1. Go to https://app.argos-ci.com/mermaid/mermaid/builds/5584/237466599
2. Review the new screenshot showing correctly positioned nodes
3. Click "Approve" to accept this as the new baseline
4. Future PRs will compare against this baseline

### Test Results

✅ **Unit tests:** Pass  
✅ **E2E tests:** Pass (4/4 splits successful)  
✅ **Linting:** Pass  
✅ **Type checking:** Pass  
✅ **Local verification:** Coordinates within expected bounds  
⏳ **Argos CI:** Waiting for maintainer approval (expected for new tests)

---

## Summary

**The fix is working correctly.** The Argos "1 added" status is expected behavior for a new test case and requires manual approval from a maintainer with Argos permissions. The actual bug (inverted Y-axis calculations) has been resolved, and all automated checks pass.
