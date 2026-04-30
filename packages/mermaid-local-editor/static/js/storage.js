export function createStorage() {
  let diagrams = JSON.parse(localStorage.getItem('mermaid-diagrams') || '{}');
  let current = localStorage.getItem('mermaid-current') || 'main';

  if (!diagrams[current]) {
    diagrams[current] = {
      src: `flowchart LR\n  UI --> RuntimeBus --> Orchestrator --> Agents`,
      view: { scale: 1, panX: 0, panY: 0 },
    };
  }

  function save() {
    localStorage.setItem('mermaid-diagrams', JSON.stringify(diagrams));
    localStorage.setItem('mermaid-current', current);
  }

  return {
    get diagrams() {
      return diagrams;
    },
    get current() {
      return current;
    },

    setCurrent(name) {
      current = name;
      save();
    },

    updateCurrent(data) {
      diagrams[current] = { ...diagrams[current], ...data };
      save();
    },

    deleteCurrent() {
      delete diagrams[current];
      current = Object.keys(diagrams)[0] || 'main';
      save();
    },

    create(name) {
      diagrams[name] = {
        src: 'flowchart LR\n  A --> B',
        view: { scale: 1, panX: 0, panY: 0 },
      };
      current = name;
      save();
    },
  };
}
