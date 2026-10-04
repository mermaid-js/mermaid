import * as configApi from './config.js';
import { getDiagram, registerDiagram } from './diagram-api/diagramAPI.js';
import { detectType, getDiagramLoader } from './diagram-api/detectType.js';
import { UnknownDiagramError } from './errors.js';
import defaultConfig from './defaultConfig.js';
import { log } from './logger.js';
import { encodeEntities } from './utils.js';
import type { DetailedError } from './utils.js';
import type { DiagramCode, DiagramDefinition, DiagramMetadata } from './diagram-api/types.js';

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type ParseErrorFunction = (err: string | DetailedError | unknown, hash?: any) => void;

/**
 * An object representing a parsed mermaid diagram definition.
 * @privateRemarks This is exported as part of the public mermaidAPI.
 */
export class Diagram {
  public static async fromText(
    codeObjectOrText: DiagramCode | string,
    metadata: Pick<DiagramMetadata, 'title'> = {}
  ) {
    // Accept either a raw string (legacy callers) or a DiagramCode object from
    // preprocessDiagram(). When given a string we normalise to a minimal code
    // object so downstream selection logic stays consistent.
    const code: DiagramCode =
      typeof codeObjectOrText === 'string'
        ? { raw: codeObjectOrText, cleaned: codeObjectOrText }
        : codeObjectOrText;
    const config = configApi.getConfig();
    const type = detectType(code.cleaned, config);
    try {
      getDiagram(type);
    } catch {
      const loader = getDiagramLoader(type);
      if (!loader) {
        throw new UnknownDiagramError(`Diagram ${type} not found.`);
      }
      // Diagram not available, loading it.
      // new diagram will try getDiagram again and if fails then it is a valid throw
      const { id, diagram } = await loader();
      registerDiagram(id, diagram);
    }
    const { db, parser, renderer, init } = getDiagram(type);
    if (parser.parser) {
      // The parser.parser.yy is only present in JISON parsers. So, we'll only set if required.
      parser.parser.yy = db;
    }
    db.clear?.();
    init?.(config);
    // This block was added for legacy compatibility. Use frontmatter instead of adding more special cases.
    if (metadata.title) {
      db.setDiagramTitle?.(metadata.title);
    }
    // Diagrams that report source positions set `preserveCommentsWhenParsing`
    // so that parser positions stay meaningful in original-source space. Every
    // other diagram parses the comment-stripped text, as before.
    //
    // `cleaned` is `withComments` with the comment lines removed, so the two
    // can differ without bound — a diagram padded with `%%` comments has a tiny
    // `cleaned` and an arbitrarily large `withComments`. Whichever string we
    // pick is the one the lexer walks, so the cap is enforced here, on the
    // string actually being handed over, rather than on `cleaned` alone. This
    // covers `parse()` as well as `render()`; only the latter has its own
    // truncation path.
    let source = code.cleaned;
    if (db.preserveCommentsWhenParsing && code.withComments) {
      const maxTextSize = config.maxTextSize ?? defaultConfig.maxTextSize;
      if (code.withComments.length > maxTextSize) {
        log.warn(
          `Comment-preserving source exceeds maxTextSize (${code.withComments.length} > ${maxTextSize}); parsing the comment-stripped text instead. Reported source positions will not account for comment lines.`
        );
      } else {
        source = code.withComments;
      }
    }
    const textToParse = encodeEntities(source) + '\n';
    // Pass frontmatter line offset so positions can be adjusted to match the
    // original source (which includes frontmatter) shown in the editor.
    if (code.frontmatterLineOffset) {
      db.setFrontmatterLineOffset?.(code.frontmatterLineOffset);
    }
    await parser.parse(textToParse);
    return new Diagram(type, textToParse, db, parser, renderer);
  }

  private constructor(
    public type: string,
    public text: string,
    public db: DiagramDefinition['db'],
    public parser: DiagramDefinition['parser'],
    public renderer: DiagramDefinition['renderer']
  ) {}

  async render(id: string, version: string) {
    await this.renderer.draw(this.text, id, version, this);
  }

  getParser() {
    return this.parser;
  }

  getType() {
    return this.type;
  }
}
