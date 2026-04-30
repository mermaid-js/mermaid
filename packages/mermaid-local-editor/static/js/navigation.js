export function createNavigation({ state, preview, srcPanel, applyTransform }) {
  let navNodes = [];
  let navIndex = 0;

  function rebuildNavNodes() {
    navNodes = [];
    navIndex = 0;

    const svg = state.iframeRef?.contentDocument?.querySelector('svg');
    if (!svg) {
      return;
    }

    navNodes = [...svg.querySelectorAll('g.node')];
    navIndex = 0;

    if (navNodes.length) {
      highlightCurrentNode();
      centerCurrentNode();
    }
  }

  function highlightCurrentNode() {
    const svg = state.iframeRef?.contentDocument?.querySelector('svg');
    if (!svg) {
      return;
    }

    svg
      .querySelectorAll('g.node.selected-node')
      .forEach((n) => n.classList.remove('selected-node'));

    const node = navNodes[navIndex];
    if (node) {
      node.classList.add('selected-node');
    }
  }

  function centerCurrentNode() {
    const node = navNodes[navIndex];
    if (!node) {
      return;
    }

    const nodeRect = node.getBoundingClientRect();
    const contRect = preview.getBoundingClientRect();

    const nodeCenterY = nodeRect.top + nodeRect.height / 6;
    const contCenterY = contRect.top + contRect.height / 6;
    const deltaY = contCenterY - nodeCenterY;

    // Intentionally biased to upper-left instead of strict center,
    // so forward nodes remain visible in LR / TD diagrams.
    const nodeCenterX = nodeRect.left + nodeRect.width / 6;
    const contCenterX = contRect.left + contRect.width / 6;
    const deltaX = contCenterX - nodeCenterX;

    state.panX += deltaX;
    state.panY += deltaY;

    applyTransform();
  }

  function setupKeyboardNav() {
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === srcPanel) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!navNodes.length) {
          rebuildNavNodes();
        }
        navIndex = Math.min(navIndex + 1, navNodes.length - 1);
        highlightCurrentNode();
        centerCurrentNode();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!navNodes.length) {
          rebuildNavNodes();
        }
        navIndex = Math.max(navIndex - 1, 0);
        highlightCurrentNode();
        centerCurrentNode();
      }
    });
  }

  return {
    rebuildNavNodes,
    setupKeyboardNav,
  };
}
