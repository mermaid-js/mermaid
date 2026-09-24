// bpmn-moddle ships no type declarations; it is used only by the export test to
// validate generated XML. A minimal ambient declaration is enough here.
declare module 'bpmn-moddle' {
  export interface ModdleParseResult {
    rootElement: any;
    references: any[];
    warnings: any[];
    elementsById: Record<string, any>;
  }
  export interface ModdleInstance {
    fromXML(xml: string, ...args: any[]): Promise<ModdleParseResult>;
  }
  export const BpmnModdle: new () => ModdleInstance;
}
