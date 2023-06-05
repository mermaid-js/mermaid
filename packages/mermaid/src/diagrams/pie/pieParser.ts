import { Pie, createMermaidServices } from 'mermaid-parser';
import { AstNode, EmptyFileSystem } from 'langium';
import { log } from '../../logger.js';
import pieDb from './pieDb.js';
import { URI } from 'vscode-uri';

function createParserServices<T extends AstNode = AstNode>() {
  const services = createMermaidServices(EmptyFileSystem).Mermaid;
  const metaData = services.LanguageMetaData;

  const workspace = services.shared.workspace;
  const langiumDocuments = workspace.LangiumDocuments;
  const documentBuilder = workspace.DocumentBuilder;
  const initPromise = workspace.WorkspaceManager.initializeWorkspace([]);

  let documentIndex = 1;

  const parse = async (input: string, uri?: string) => {
    await initPromise;
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    uri = uri ?? `${documentIndex++}${metaData.fileExtensions[0]}`;
    const document = workspace.LangiumDocumentFactory.fromString<T>(input, URI.file(uri));
    langiumDocuments.addDocument(document);
    await documentBuilder.build([document]);
    return document;
  };

  return { services, parse };
}

export async function parse(text: string) {
  const { parse } = createParserServices<PieChart>();
  const { parseResult: result } = await parse(text);

  if (result.parserErrors.length > 0 || result.lexerErrors.length > 0) {
    log.error(
      { parserErrors: result.parserErrors, lexerErrors: result.lexerErrors },
      'Error parsing info diagram'
    );
    throw new Error(`Parser errors: ${result.parserErrors} Lex errors: ${result.lexerErrors}`);
  }

  const value = result.value;
  if (value.accDescr !== undefined) {
    pieDb.setAccDescription(value.accDescr);
  }
  if (value.accTitle !== undefined) {
    pieDb.setAccTitle(value.accTitle);
  }
  if (value.title !== undefined) {
    pieDb.setDiagramTitle(value.title);
  }
  pieDb.setShowData(value.showData);
  for (const section of value.sections) {
    pieDb.addSection(section.label, section.value);
  }
}
