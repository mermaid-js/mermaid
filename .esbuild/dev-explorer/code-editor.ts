import { LitElement, html } from 'lit';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap as keyMap,
  lineNumbers,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import {
  flowchartTags,
  ganttTags,
  journeyTags,
  mermaid,
  mermaidTags,
  mindmapTags,
  pieTags,
  requirementTags,
  sequenceTags,
} from 'codemirror-lang-mermaid';

const mermaidHighlightStyle = HighlightStyle.define([
  {
    tag: [mermaidTags.diagramName, flowchartTags.diagramName],
    color: '#c4b5fd',
    fontWeight: '600',
  },
  {
    tag: [t.keyword, flowchartTags.keyword, ganttTags.keyword, journeyTags.keyword],
    color: '#7dd3fc',
  },
  { tag: [t.controlKeyword, sequenceTags.keyword2], color: '#fbbf24' },
  { tag: [t.modifier, flowchartTags.orientation, sequenceTags.position], color: '#c084fc' },
  {
    tag: [t.variableName, flowchartTags.nodeId, sequenceTags.nodeText, journeyTags.actor],
    color: '#93c5fd',
  },
  {
    tag: [
      t.string,
      flowchartTags.nodeText,
      flowchartTags.nodeEdgeText,
      pieTags.titleText,
      journeyTags.text,
      requirementTags.quotedString,
      ganttTags.string,
    ],
    color: '#86efac',
  },
  {
    tag: [t.number, flowchartTags.number, pieTags.number, requirementTags.number],
    color: '#fca5a5',
  },
  {
    tag: [t.contentSeparator, flowchartTags.link, flowchartTags.nodeEdge, sequenceTags.arrow],
    color: '#f59e0b',
  },
  {
    tag: [t.lineComment, flowchartTags.lineComment, pieTags.lineComment],
    color: '#64748b',
    fontStyle: 'italic',
  },
  { tag: [mindmapTags.lineText1, mindmapTags.lineText4], color: '#86efac' },
  { tag: [mindmapTags.lineText2, mindmapTags.lineText5], color: '#f9a8d4' },
  { tag: mindmapTags.lineText3, color: '#fbbf24' },
]);

export class DevCodeEditor extends LitElement {
  static properties = {
    value: { type: String },
  };

  declare value: string;

  #view?: EditorView;
  #syncingExternalValue = false;

  constructor() {
    super();
    this.value = '';
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.#mountEditor();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('value')) {
      this.#syncEditorValue();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#view?.destroy();
    this.#view = undefined;
  }

  requestMeasure() {
    this.#view?.requestMeasure();
  }

  #mountEditor() {
    const parent = this.querySelector('.code-editor-mount');
    if (!parent || this.#view) return;

    this.#view = new EditorView({
      doc: this.value,
      root: document,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        highlightActiveLine(),
        mermaid(),
        syntaxHighlighting(mermaidHighlightStyle),
        keyMap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || this.#syncingExternalValue) return;
          this.dispatchEvent(
            new CustomEvent('code-change', {
              detail: { value: update.state.doc.toString() },
              bubbles: true,
              composed: true,
            })
          );
        }),
        EditorView.domEventHandlers({
          keydown: (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
              event.preventDefault();
              this.dispatchEvent(new CustomEvent('save-code', { bubbles: true, composed: true }));
              return true;
            }
            return false;
          },
        }),
      ],
      parent,
    });
  }

  #syncEditorValue() {
    if (!this.#view) return;
    const nextValue = this.value ?? '';
    const currentValue = this.#view.state.doc.toString();
    if (currentValue === nextValue) return;

    this.#syncingExternalValue = true;
    this.#view.dispatch({
      changes: {
        from: 0,
        to: this.#view.state.doc.length,
        insert: nextValue,
      },
    });
    this.#syncingExternalValue = false;
  }

  render() {
    return html`<div class="code-editor-mount"></div>`;
  }
}

customElements.define('dev-code-editor', DevCodeEditor);
