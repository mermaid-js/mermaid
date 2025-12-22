import { LitElement, html, nothing } from 'lit';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';

import '@shoelace-style/shoelace/dist/components/breadcrumb/breadcrumb.js';
import '@shoelace-style/shoelace/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/split-panel/split-panel.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

import './file-explorer';
import './diagram-viewer';

type ViewMode = 'explorer' | 'viewer';

function getInitialStateFromUrl() {
  const url = new URL(window.location.href);
  const dir = url.searchParams.get('path') ?? '';
  const file = url.searchParams.get('file') ?? '';
  return { dir, file };
}

function setUrlState({ dir, file }: { dir: string; file: string }) {
  const url = new URL(window.location.href);
  url.searchParams.delete('path');
  url.searchParams.delete('file');
  if (dir) url.searchParams.set('path', dir);
  if (file) url.searchParams.set('file', file);
  history.replaceState(null, '', url);
}

export class DevExplorerApp extends LitElement {
  static properties = {
    mode: { state: true },
    dirPath: { state: true },
    lastDirPath: { state: true },
    filePath: { state: true },
    sseToken: { state: true },
  };

  declare mode: ViewMode;
  declare dirPath: string;
  declare lastDirPath: string;
  declare filePath: string;
  declare sseToken: number;

  #events?: EventSource;

  constructor() {
    super();
    const { dir, file } = getInitialStateFromUrl();
    this.dirPath = dir;
    this.lastDirPath = dir;
    this.filePath = file;
    this.mode = file ? 'viewer' : 'explorer';
    this.sseToken = 0;

    setBasePath('/dev/vendor/shoelace');
    registerIconLibrary('default', {
      resolver: (name) => `/dev/vendor/shoelace/assets/icons/${name}.svg`,
    });
  }

  createRenderRoot() {
    // Use light DOM so document-level CSS (public/styles.css => /dev/styles.css) applies to the UI.
    // Without this, Lit's default shadow root will block global selectors like `.list` / `button.card`.
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#events = new EventSource('/events');
    this.#events.onmessage = () => {
      this.sseToken++;
    };

    window.addEventListener('popstate', this.#onPopState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#events?.close();
    window.removeEventListener('popstate', this.#onPopState);
  }

  #onPopState = () => {
    const { dir, file } = getInitialStateFromUrl();
    this.dirPath = dir;
    this.lastDirPath = dir;
    this.filePath = file;
    this.mode = file ? 'viewer' : 'explorer';
  };

  #goToDir = (dir: string) => {
    this.dirPath = dir;
    this.lastDirPath = dir;
    this.mode = 'explorer';
    this.filePath = '';
    setUrlState({ dir, file: '' });
  };

  #openFile = (filePath: string) => {
    this.filePath = filePath;
    this.mode = 'viewer';
    setUrlState({ dir: this.lastDirPath, file: filePath });
  };

  #backToExplorer = () => {
    this.mode = 'explorer';
    this.filePath = '';
    setUrlState({ dir: this.lastDirPath, file: '' });
  };

  render() {
    return html`
      <div class="app">
        ${this.mode === 'explorer'
          ? html`
              <dev-file-explorer
                .path=${this.dirPath}
                .sseToken=${this.sseToken}
                @navigate=${(e: CustomEvent<{ path: string }>) => this.#goToDir(e.detail.path)}
                @open-file=${(e: CustomEvent<{ path: string }>) => this.#openFile(e.detail.path)}
              ></dev-file-explorer>
            `
          : nothing}
        ${this.mode === 'viewer'
          ? html`
              <dev-diagram-viewer
                .filePath=${this.filePath}
                .sseToken=${this.sseToken}
                @back=${this.#backToExplorer}
              ></dev-diagram-viewer>
            `
          : nothing}
      </div>
    `;
  }
}

customElements.define('dev-explorer-app', DevExplorerApp);
