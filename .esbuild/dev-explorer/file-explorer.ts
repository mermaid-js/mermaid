import { LitElement, html, nothing } from 'lit';

type Entry = {
  name: string;
  kind: 'dir' | 'file';
  path: string;
};

type FilesResponse = {
  root: string;
  path: string;
  entries: Entry[];
};

function dirname(posixPath: string) {
  const p = posixPath.replaceAll('\\', '/').replace(/\/+$/, '');
  if (!p) return '';
  const idx = p.lastIndexOf('/');
  if (idx <= 0) return '';
  return p.slice(0, idx);
}

function pathSegments(posixPath: string) {
  const p = posixPath.replaceAll('\\', '/').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!p) return [];
  return p.split('/').filter(Boolean);
}

export class DevFileExplorer extends LitElement {
  static properties = {
    path: { type: String },
    sseToken: { type: Number },
    loading: { state: true },
    error: { state: true },
    root: { state: true },
    entries: { state: true },
    creating: { state: true },
    newName: { state: true },
    createBusy: { state: true },
    createError: { state: true },
  };

  declare path: string;
  declare sseToken: number;
  declare loading: boolean;
  declare error: string;
  declare root: string;
  declare entries: Entry[];
  declare creating: boolean;
  declare newName: string;
  declare createBusy: boolean;
  declare createError: string;

  constructor() {
    super();
    this.path = '';
    this.sseToken = 0;
    this.loading = true;
    this.error = '';
    this.root = '';
    this.entries = [];
    this.creating = false;
    this.newName = '';
    this.createBusy = false;
    this.createError = '';
  }

  createRenderRoot() {
    // Use light DOM so global CSS in public/styles.css applies.
    return this;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('path') || changed.has('sseToken')) {
      void this.#load();
    }
  }

  async #load() {
    this.loading = true;
    this.error = '';
    try {
      const url = new URL('/dev/api/files', window.location.origin);
      if (this.path) url.searchParams.set('path', this.path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as FilesResponse;
      this.root = json.root ?? '';
      this.entries = json.entries ?? [];
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      this.entries = [];
    } finally {
      this.loading = false;
    }
  }

  #emitNavigate(nextPath: string) {
    this.dispatchEvent(
      new CustomEvent('navigate', { detail: { path: nextPath }, bubbles: true, composed: true })
    );
  }

  #emitOpenFile(filePath: string) {
    this.dispatchEvent(
      new CustomEvent('open-file', { detail: { path: filePath }, bubbles: true, composed: true })
    );
  }

  #onActivate(kind: Entry['kind'], entryPath: string) {
    if (kind === 'dir') {
      this.#emitNavigate(entryPath);
    } else {
      this.#emitOpenFile(entryPath);
    }
  }

  #openCreate() {
    this.newName = '';
    this.createError = '';
    this.createBusy = false;
    this.creating = true;
  }

  #closeCreate() {
    if (this.createBusy) return;
    this.creating = false;
  }

  async #submitCreate() {
    const raw = (this.newName ?? '').trim();
    if (!raw) {
      this.createError = 'Enter a file name.';
      return;
    }
    if (/[/\\]/.test(raw)) {
      this.createError = 'Name cannot contain slashes.';
      return;
    }
    const fileName = raw.toLowerCase().endsWith('.mmd') ? raw : `${raw}.mmd`;
    const relPath = this.path ? `${this.path}/${fileName}` : fileName;

    this.createBusy = true;
    this.createError = '';
    try {
      const url = new URL('/dev/api/file', window.location.origin);
      url.searchParams.set('path', relPath);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '',
      });
      if (res.status === 409) {
        this.createError = 'A file with that name already exists.';
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { path?: string };
      this.creating = false;
      // Open the freshly created file in the viewer/editor.
      this.#emitOpenFile(json.path ?? relPath);
    } catch (e) {
      this.createError = e instanceof Error ? e.message : String(e);
    } finally {
      this.createBusy = false;
    }
  }

  render() {
    const segments = pathSegments(this.path);
    const itemLabel = this.entries.length === 1 ? 'item' : 'items';

    return html`
      <div class="header">
        <div style="min-width: 0;">
          <div class="title">Dev Explorer</div>
          <div class="subtle">
            root:
            <span class="path">${this.root || 'cypress/platform/dev-diagrams'}</span>
          </div>
          <div style="margin-top: 6px;">
            <sl-breadcrumb>
              <sl-breadcrumb-item @click=${() => this.#emitNavigate('')}>root</sl-breadcrumb-item>
              ${segments.map((seg, idx) => {
                const to = segments.slice(0, idx + 1).join('/');
                return html`<sl-breadcrumb-item @click=${() => this.#emitNavigate(to)}
                  >${seg}</sl-breadcrumb-item
                >`;
              })}
            </sl-breadcrumb>
          </div>
        </div>
        <div class="spacer"></div>
        <div class="subtle">
          ${this.loading ? 'loading…' : html`<span>${this.entries.length} ${itemLabel}</span>`}
        </div>
        <sl-button
          size="small"
          variant="default"
          ?disabled=${!this.path}
          @click=${() => this.#emitNavigate(dirname(this.path))}
        >
          <sl-icon slot="prefix" name="arrow-left"></sl-icon>
          Up
        </sl-button>
        <sl-button size="small" variant="primary" @click=${() => this.#openCreate()}>
          <sl-icon slot="prefix" name="file-earmark-plus"></sl-icon>
          New diagram
        </sl-button>
      </div>

      <div class="content">
        ${this.error
          ? html`<div class="empty">Error: <span class="path">${this.error}</span></div>`
          : nothing}
        ${!this.error && !this.loading && this.entries.length === 0
          ? html`<div class="empty">No folders or <span class="path">.mmd</span> files here.</div>`
          : nothing}

        <div class="list">
          ${this.entries.map((e) => {
            const icon = e.kind === 'dir' ? 'folder-fill' : 'file-earmark-code';
            const cardClass = e.kind === 'dir' ? 'card card-folder' : 'card card-file';
            const click =
              e.kind === 'dir'
                ? () => this.#emitNavigate(e.path)
                : () => this.#emitOpenFile(e.path);
            const onKeyDown = (ev: KeyboardEvent) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                this.#onActivate(e.kind, e.path);
              }
            };
            return html`
              <button class=${cardClass} type="button" @click=${click} @keydown=${onKeyDown}>
                <div class="card-inner">
                  <sl-icon class="card-icon" name=${icon}></sl-icon>
                  <div class="card-title">${e.name}</div>
                </div>
              </button>
            `;
          })}
        </div>
      </div>

      <sl-dialog
        label="New diagram"
        ?open=${this.creating}
        @sl-request-close=${(ev: CustomEvent) => {
          // Block closing while the request is in flight.
          if (this.createBusy) {
            ev.preventDefault();
            return;
          }
          this.creating = false;
        }}
      >
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <sl-input
            autofocus
            label="File name"
            placeholder="my-diagram"
            .value=${this.newName}
            help-text=${`Created in ${this.path || this.root || 'root'}. ".mmd" is added automatically.`}
            @sl-input=${(ev: Event) => {
              this.newName = (ev.target as HTMLInputElement).value;
              this.createError = '';
            }}
            @keydown=${(ev: KeyboardEvent) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                void this.#submitCreate();
              }
            }}
          ></sl-input>
          ${this.createError
            ? html`<div class="empty" style="color: var(--sl-color-danger-600, #b00020);">
                ${this.createError}
              </div>`
            : nothing}
        </div>
        <sl-button slot="footer" variant="default" @click=${() => this.#closeCreate()}>
          Cancel
        </sl-button>
        <sl-button
          slot="footer"
          variant="primary"
          ?loading=${this.createBusy}
          @click=${() => void this.#submitCreate()}
        >
          Create
        </sl-button>
      </sl-dialog>
    `;
  }
}

customElements.define('dev-file-explorer', DevFileExplorer);
