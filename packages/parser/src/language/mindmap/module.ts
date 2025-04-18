import type {
  DefaultSharedCoreModuleContext,
  LangiumCoreServices,
  LangiumSharedCoreServices,
  Module,
  PartialLangiumCoreServices,
  LanguageMetaData,
  Grammar,
} from 'langium';
import {
  inject,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  EmptyFileSystem,
  loadGrammarFromJson,
} from 'langium';
import { CommonValueConverter } from '../common/valueConverter.js';
import { MermaidGeneratedSharedModule } from '../generated/module.js';
import { MindMapTokenBuilder } from './tokenBuilder.js';

export const MindMapLanguageMetaData: LanguageMetaData = {
  languageId: 'mindmap',
  fileExtensions: ['.mmd', '.mermaid'],
  caseInsensitive: false,
  mode: 'production',
};

// Define a minimal grammar directly in JSON format
let loadedMindMapGrammar: Grammar | undefined;
export const MindMapGrammar = (): Grammar =>
  loadedMindMapGrammar ??
  (loadedMindMapGrammar = loadGrammarFromJson(`{
    "$type": "Grammar",
    "isDeclared": true,
    "name": "MindMap",
    "imports": [],
    "rules": [
      {
        "$type": "ParserRule",
        "entry": true,
        "name": "Diagram",
        "definition": {
          "$type": "Group",
          "elements": [
            {
              "$type": "Assignment",
              "feature": "keyword",
              "operator": "=",
              "terminal": {
                "$type": "Keyword",
                "value": "mindmap"
              }
            },
            {
              "$type": "Assignment",
              "feature": "statements",
              "operator": "+=",
              "terminal": {
                "$type": "Alternatives",
                "elements": [
                  {
                    "$type": "RuleCall",
                    "rule": {"$ref": "#/rules@1"},
                    "arguments": []
                  },
                  {
                    "$type": "RuleCall",
                    "rule": {"$ref": "#/rules@2"},
                    "arguments": []
                  }
                ]
              },
              "cardinality": "*"
            }
          ]
        },
        "definesHiddenTokens": false,
        "fragment": false,
        "hiddenTokens": [],
        "parameters": [],
        "wildcard": false
      },
      {
        "$type": "ParserRule",
        "name": "RootNode",
        "definition": {
          "$type": "Group",
          "elements": [
            {
              "$type": "Assignment",
              "feature": "content",
              "operator": "=",
              "terminal": {
                "$type": "RuleCall",
                "rule": {"$ref": "#/rules@3"},
                "arguments": []
              }
            }
          ]
        },
        "definesHiddenTokens": false,
        "entry": false,
        "fragment": false,
        "hiddenTokens": [],
        "parameters": [],
        "wildcard": false
      },
      {
        "$type": "ParserRule",
        "name": "ChildNode",
        "definition": {
          "$type": "Group",
          "elements": [
            {
              "$type": "Assignment",
              "feature": "depth",
              "operator": "=",
              "terminal": {
                "$type": "RuleCall",
                "rule": {"$ref": "#/rules@4"},
                "arguments": []
              }
            },
            {
              "$type": "Assignment",
              "feature": "content",
              "operator": "=",
              "terminal": {
                "$type": "RuleCall",
                "rule": {"$ref": "#/rules@3"},
                "arguments": []
              }
            }
          ]
        },
        "definesHiddenTokens": false,
        "entry": false,
        "fragment": false,
        "hiddenTokens": [],
        "parameters": [],
        "wildcard": false
      },
      {
        "$type": "TerminalRule",
        "name": "WORD",
        "type": {"$type": "ReturnType", "name": "string"},
        "definition": {
          "$type": "RegexToken",
          "regex": "/[a-zA-Z0-9_-]+/"
        },
        "fragment": false,
        "hidden": false
      },
      {
        "$type": "TerminalRule",
        "name": "INDENT",
        "type": {"$type": "ReturnType", "name": "string"},
        "definition": {
          "$type": "RegexToken",
          "regex": "/(?:\\\\t+| {2,})/"
        },
        "fragment": false,
        "hidden": false
      },
      {
        "$type": "TerminalRule",
        "name": "WS",
        "definition": {
          "$type": "RegexToken",
          "regex": "/\\\\s+/"
        },
        "fragment": false,
        "hidden": true
      },
      {
        "$type": "TerminalRule",
        "name": "NL",
        "definition": {
          "$type": "RegexToken",
          "regex": "/\\\\r?\\\\n/"
        },
        "fragment": false,
        "hidden": false
      },
      {
        "$type": "TerminalRule",
        "name": "ML_COMMENT",
        "definition": {
          "$type": "RegexToken",
          "regex": "/\\\\/\\\\*[\\\\s\\\\S]*?\\\\*\\\\//"
        },
        "fragment": false,
        "hidden": true
      },
      {
        "$type": "TerminalRule",
        "name": "SL_COMMENT",
        "definition": {
          "$type": "RegexToken",
          "regex": "/(?:%+|\\\\/{2,})[^\\\\n\\\\r]*/"
        },
        "fragment": false,
        "hidden": true
      }
    ],
    "definesHiddenTokens": false,
    "hiddenTokens": [],
    "interfaces": [],
    "types": [],
    "usedGrammars": []
  }`));

interface MindMapAddedServices {
  parser: {
    TokenBuilder: MindMapTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

export type MindMapServices = LangiumCoreServices & MindMapAddedServices;

export const MindMapModule: Module<
  MindMapServices,
  PartialLangiumCoreServices & MindMapAddedServices
> = {
  parser: {
    TokenBuilder: () => new MindMapTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
  Grammar: MindMapGrammar,
  LanguageMetaData: () => MindMapLanguageMetaData,
};

export function createMindMapServices(context: DefaultSharedCoreModuleContext = EmptyFileSystem): {
  shared: LangiumSharedCoreServices;
  MindMap: MindMapServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const MindMap: MindMapServices = inject(createDefaultCoreModule({ shared }), MindMapModule);
  shared.ServiceRegistry.register(MindMap);
  return { shared, MindMap };
}
