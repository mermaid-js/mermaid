export function refreshList({ diagramsSelect, nameInput, storage }) {
  diagramsSelect.innerHTML = '';
  Object.keys(storage.diagrams).forEach((k) => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    diagramsSelect.appendChild(opt);
  });
  diagramsSelect.value = storage.current;
  nameInput.value = storage.current;
}

export function setupUI({
  src,
  diagramsSelect,
  nameInput,
  storage,
  state,
  render,
  load,
  applyTransform,
}) {
  document.getElementById('save').onclick = () => {
    const name = nameInput.value.trim();
    if (!name) {
      return;
    }

    storage.setCurrent(name);
    storage.updateCurrent({
      src: src.value,
      view: { scale: state.scale, panX: state.panX, panY: state.panY },
    });
    refreshList({ diagramsSelect, nameInput, storage });
  };

  document.getElementById('new').onclick = () => {
    const name = prompt('Enter diagram name');
    if (!name) {
      return;
    }

    storage.create(name);
    load(name);
  };

  document.getElementById('del').onclick = () => {
    if (!confirm(`Delete diagram "${storage.current}"?`)) {
      return;
    }

    storage.deleteCurrent();
    load(storage.current);
  };

  document.getElementById('resetView').onclick = () => {
    state.scale = 1;
    state.panX = 0;
    state.panY = 0;
    applyTransform(); // this will save the reset to storage.diagrams[storage.current].view
  };

  document.getElementById('exportSvg').onclick = () => {
    if (!state.iframeRef) {
      return;
    }

    const svg = state.iframeRef.contentDocument?.querySelector('svg');
    if (!svg) {
      return;
    }

    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${storage.current}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  };

  diagramsSelect.onchange = () => load(diagramsSelect.value);

  let saveTimer;
  src.addEventListener('input', () => {
    render();

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (storage.diagrams[storage.current]) {
        storage.updateCurrent({ src: src.value });
      }
    }, 300);
  });

  const toolbar = document.getElementById('srcPanel');
  const toggleToolbarBtn = document.getElementById('toggleToolbar');

  let toolbarCollapsed = localStorage.getItem('toolbar-collapsed') === '1';

  function applyToolbarState() {
    toolbar.classList.toggle('collapsed', toolbarCollapsed);
    toggleToolbarBtn.textContent = toolbarCollapsed ? '☰' : '✕';
    toggleToolbarBtn.title = toolbarCollapsed ? 'Show toolbar' : 'Hide toolbar';
  }

  toggleToolbarBtn.onclick = () => {
    toolbarCollapsed = !toolbarCollapsed;
    localStorage.setItem('toolbar-collapsed', toolbarCollapsed ? '1' : '0');
    applyToolbarState();
  };

  applyToolbarState();
  refreshList({ diagramsSelect, nameInput, storage });
}
