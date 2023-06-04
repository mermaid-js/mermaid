import { AstNode, EmptyFileSystem } from 'langium';
import { URI } from 'vscode-uri';

import { createMermaidServices } from '../src/language/index.js';

/**
 * @returns services and parser
 */
export function createTestServices<T extends AstNode = AstNode>() {
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
