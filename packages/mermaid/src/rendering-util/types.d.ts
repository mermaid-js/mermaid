export type MarkdownWordType = 'normal' | 'strong' | 'emphasis';
export interface MarkdownWord {
  content: string;
  type: MarkdownWordType;
}
export type MarkdownLine = MarkdownWord[];
export type CheckFitFunction = (text: MarkdownLine) => boolean;
