interface ConfigType {
  class?: { defaultRenderer: string };
  state?: { defaultRenderer: string };
  flowchart?: { defaultRenderer: string };
}

type DiagramDetector = (text: string) => boolean;
