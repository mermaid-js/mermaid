// ZenUML manage parsing internally. It uses Antlr4 to parse the DSL.
// The parser is defined in https://github.com/ZenUml/vue-sequence/blob/main/src/parser/index.js

// This is a dummy parser that satisfies the mermaid API logic.
export default {
  parser: { yy: {} },
  parse: () => {
    // no op
  },
};
