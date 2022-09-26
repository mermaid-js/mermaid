// @ts-ignore: TODO Fix ts errors
import mindmapParser from './parser/mindmap';
import * as mindmapDb from './mindmapDb';
import mindmapRenderer from './mindmapRenderer';
import mindmapStyles from './styles';
import { injectUtils } from './mermaidUtils';
// import mermaid from 'mermaid';

// console.log('mindmapDb', mindmapDb.getMindmap()); // eslint-disable-line no-console
// registerDiagram()

if (typeof document !== 'undefined') {
  /*!
   * Wait for document loaded before starting the execution
   */
  //   { parser: mindmapParser, db: mindmapDb, renderer: mindmapRenderer, styles: mindmapStyles },

  window.addEventListener(
    'load',
    () => {
      if (window.mermaid && typeof window.mermaid.c) {
        window.mermaid.connectDiagram(
          'mindmap',
          {
            db: mindmapDb,
            renderer: mindmapRenderer,
            parser: mindmapParser,
            styles: mindmapStyles,
          },
          injectUtils
        );
      }
    },
    false
  );
}
