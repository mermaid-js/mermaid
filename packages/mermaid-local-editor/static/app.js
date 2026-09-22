import { initMermaid, state, IS_E2E } from './js/config.js';
import { createStorage } from './js/storage.js';
import { renderDiagram } from './js/renderer.js';
import { setupUI, refreshList } from './js/ui.js';
import { createNavigation } from './js/navigation.js';

initMermaid();

const srcPanel = document.getElementById('srcPanel');
const preview = document.getElementById('preview');
const diagramsSelect = document.getElementById('diagrams');
const nameInput = document.getElementById('name');
const storage = createStorage();
const navigation = createNavigation({
  state,
  preview,
  srcPanel,
  applyTransform,
});

function render() {
  void renderDiagram({
    srcValue: srcPanel.value,
    preview,
    state,
    IS_E2E,
    applyTransform,
    rebuildNavNodes: navigation.rebuildNavNodes,
  });
}

function load(name) {
  storage.setCurrent(name);
  const d = storage.diagrams[name];

  srcPanel.value = d.src;

  // restore the view
  state.scale = d.view?.scale ?? 1;
  state.panX = d.view?.panX ?? 0;
  state.panY = d.view?.panY ?? 0;

  refreshList({ diagramsSelect, nameInput, storage });
  render();
  requestAnimationFrame(applyTransform);
}

function applyTransform() {
  if (!state.iframeRef) {
    return;
  }

  const svg = state.iframeRef.contentDocument?.querySelector('svg');
  if (!svg) {
    return;
  }

  state.panY = Math.max(-20000, Math.min(20000, state.panY));
  state.panX = Math.max(-20000, Math.min(20000, state.panX));

  svg.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;

  storage.updateCurrent({
    view: { scale: state.scale, panX: state.panX, panY: state.panY },
  });
}

setupUI({
  src: srcPanel,
  diagramsSelect,
  nameInput,
  storage,
  state,
  render,
  load,
  applyTransform,
});

navigation.setupKeyboardNav();
load(storage.current);
