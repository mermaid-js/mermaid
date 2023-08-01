import {
  AstNode,
  DefaultServiceRegistry,
  LangiumDocument,
  LangiumDocuments,
  LangiumServices,
} from 'langium';
import {
  InfoServices,
  JourneyServices,
  MindmapServices,
  PieServices,
  SankeyServices,
  TimelineServices,
} from '../index.js';
import { URI } from 'vscode-uri';

export class MermaidServiceRegistry extends DefaultServiceRegistry {
  private infoServices: InfoServices;
  private journeyServices: JourneyServices;
  private mindmapServices: MindmapServices;
  private pieServices: PieServices;
  private sankeyServices: SankeyServices;
  private timelineServices: TimelineServices;
  private documents: () => LangiumDocuments;

  public override register(language: LangiumServices): void {
    if (language.LanguageMetaData.languageId === 'info') {
      this.infoServices = language as InfoServices;
    } else if (language.LanguageMetaData.languageId === 'journey') {
      this.journeyServices = language as JourneyServices;
    } else if (language.LanguageMetaData.languageId === 'mindmap') {
      this.journeyServices = language as JourneyServices;
    } else if (language.LanguageMetaData.languageId === 'pie') {
      this.pieServices = language as PieServices;
    } else if (language.LanguageMetaData.languageId === 'sankey') {
      this.sankeyServices = language as SankeyServices;
    } else if (language.LanguageMetaData.languageId === 'timeline') {
      this.timelineServices = language as TimelineServices;
    } else {
      super.register(language);
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
    } else if (/^\s*timeline/.test(text)) {
      return this.timelineServices;
    } else {
      return super.getServices(uri);
    }
  }
}
