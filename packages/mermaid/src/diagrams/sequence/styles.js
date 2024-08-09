/* spell-checker:disable */

const getStyles = (options) =>
  `.actor {
    stroke: ${options.actorBorder};
    fill: ${options.actorBkg};
  }

  text.actor > tspan {
    fill: ${options.actorTextColor};
    stroke: none;
  }

  .actor-line {
    stroke: ${options.actorLineColor};
  }

  .messageLine0 {
    stroke-width: 1.5;
    stroke-dasharray: none;
    stroke: ${options.signalColor};
  }

  .messageLine1 {
    stroke-width: 1.5;
    stroke-dasharray: 2, 2;
    stroke: ${options.signalColor};
  }

  #arrowhead path {
    fill: ${options.signalColor};
    stroke: ${options.signalColor};
  }

  .sequenceNumber {
    fill: ${options.sequenceNumberColor};
  }

  #sequencenumber {
    fill: ${options.signalColor};
  }

  #crosshead path {
    fill: ${options.signalColor};
    stroke: ${options.signalColor};
  }

  .messageText {
    fill: ${options.signalTextColor};
    stroke: none;
  }

  .labelBox {
    stroke: ${options.labelBoxBorderColor};
    fill: ${options.labelBoxBkgColor};
  }

  .labelText, .labelText > tspan {
    fill: ${options.labelTextColor};
    stroke: none;
  }

  .loopText, .loopText > tspan {
    fill: ${options.loopTextColor};
    stroke: none;
  }

  .loopLine {
    stroke-width: 2px;
    stroke-dasharray: 2, 2;
    stroke: ${options.labelBoxBorderColor};
    fill: ${options.labelBoxBorderColor};
  }

  .note {
    //stroke: #decc93;
    stroke: ${options.noteBorderColor};
    fill: ${options.noteBkgColor};
  }

  .noteText, .noteText > tspan {
    fill: ${options.noteTextColor};
    stroke: none;
  }

  .activation0 {
    fill: ${options.activationBkgColor};
    stroke: ${options.activationBorderColor};
  }

  .activation1 {
    fill: ${options.activationBkgColor};
    stroke: ${options.activationBorderColor};
  }

  .activation2 {
    fill: ${options.activationBkgColor};
    stroke: ${options.activationBorderColor};
  }

  .actorPopupMenu {
    position: absolute;
  }

  .actorPopupMenuPanel {
    position: absolute;
    fill: ${options.actorBkg};
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));
}
  .actor-man line {
    stroke: ${options.actorBorder};
    fill: ${options.actorBkg};
  }
  .actor-man circle, line {
    stroke: ${options.actorBorder};
    fill: ${options.actorBkg};
    stroke-width: 2px;
  }

  .mermaid-markdown-note {
    padding: 1em;
  }

  .mermaid-markdown-note p {
    margin: 0;
  }

  .mermaid-markdown-note p > code {
    background-color: #eee;
    padding: 0.2em;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15);
  }

  .mermaid-markdown-note pre {
    margin-top: 0;
  }

  .mermaid-markdown-note code {
    background-color: #fff5f5;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15);
    border-radius: 4px;
    margin: 0;
    white-space: pre-wrap;
  }

  /*!
    Theme: Default
    Description: Original highlight.js style
    Author: (c) Ivan Sagalaev <maniac@softwaremaniacs.org>
    Maintainer: @highlightjs/core-team
    Website: https://highlightjs.org/
    License: see project LICENSE
    Touched: 2021
  */

  pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 1em
  }

  code.hljs {
    padding: 3px 5px
  }

  .hljs {
    background: #f3f3f3;
    color: #444
  }

  .hljs-comment {
    color: #697070
  }

  .hljs-punctuation,
  .hljs-tag {
    color: #444a
  }

  .hljs-tag .hljs-attr,
  .hljs-tag .hljs-name {
    color: #444
  }

  .hljs-attribute,
  .hljs-doctag,
  .hljs-keyword,
  .hljs-meta .hljs-keyword,
  .hljs-name,
  .hljs-selector-tag {
    font-weight: 700
  }

  .hljs-deletion,
  .hljs-number,
  .hljs-quote,
  .hljs-selector-class,
  .hljs-selector-id,
  .hljs-string,
  .hljs-template-tag,
  .hljs-type {
    color: #800
  }

  .hljs-section,
  .hljs-title {
    color: #800;
    font-weight: 700
  }

  .hljs-link,
  .hljs-operator,
  .hljs-regexp,
  .hljs-selector-attr,
  .hljs-selector-pseudo,
  .hljs-symbol,
  .hljs-template-variable,
  .hljs-variable {
    color: #ab5656
  }

  .hljs-literal {
    color: #695
  }

  .hljs-addition,
  .hljs-built_in,
  .hljs-bullet,
  .hljs-code {
    color: #397300
  }

  .hljs-meta {
    color: #1f7199
  }

  .hljs-meta .hljs-string {
    color: #38a
  }

  .hljs-emphasis {
    font-style: italic
  }

  .hljs-strong {
    font-weight: 700
  }

`;

export default getStyles;
