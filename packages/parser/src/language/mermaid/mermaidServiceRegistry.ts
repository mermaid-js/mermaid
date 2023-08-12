import {
  type AstNode,
  DefaultServiceRegistry,
  type LangiumDocument,
  type LangiumDocuments,
  type LangiumServices,
  type URI,
} from 'langium';
import {
  InfoServices,
  JourneyServices,
  MindmapServices,
  PieServices,
  QuadrantServices,
  SankeyServices,
  TimelineServices,
} from '../index.js';

export class MermaidServiceRegistry extends DefaultServiceRegistry {
  private infoServices: InfoServices;
  private journeyServices: JourneyServices;
  private mindmapServices: MindmapServices;
  private pieServices: PieServices;
  private sankeyServices: SankeyServices;
  private quadrantServices: QuadrantServices;
  private timelineServices: TimelineServices;
  private documents: () => LangiumDocuments;

  public override register(language: LangiumServices): void {
    switch (language.LanguageMetaData.languageId) {
      case 'info':
        this.infoServices = language as InfoServices;
        break;
      case 'journey':
        this.journeyServices = language as JourneyServices;
        break;
      case 'mindmap':
        this.mindmapServices = language as MindmapServices;
        break;
      case 'pie':
        this.pieServices = language as PieServices;
        break;
      case 'sankey':
        this.sankeyServices = language as SankeyServices;
        break;
      case 'quadrant':
        this.quadrantServices = language as QuadrantServices;
        break;
      case 'timeline':
        this.timelineServices = language as TimelineServices;
        break;
      default:
        super.register(language);
        break;
    }
  }

  public override getServices(uri: URI): LangiumServices {
    const content: LangiumDocument<AstNode> = this.documents().getOrCreateDocument(uri);
    const text: string = content.textDocument.getText();
    if (/^\s*info/.test(text)) {
      return this.infoServices;
    } else if (/^\s*journey/.test(text)) {
      return this.journeyServices;
    } else if (/^\s*mindmap/.test(text)) {
      return this.mindmapServices;
    } else if (/^\s*pie/.test(text)) {
      return this.pieServices;
    } else if (/^\s*sankey/.test(text)) {
      return this.sankeyServices;
    } else if (/^\s*quadrant/.test(text)) {
      return this.quadrantServices;
    } else if (/^\s*timeline/.test(text)) {
      return this.timelineServices;
    } else {
      return super.getServices(uri);
    }
  }
}
