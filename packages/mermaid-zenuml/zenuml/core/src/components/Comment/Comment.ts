export default class Comment {
  // define properties color and text
  public text: string;
  public color: string | undefined;

  // Raw comment contains all spaces and newlines
  constructor(raw: string) {
    const lines = raw.split('\n');
    this.color = lines.find((line) => line.trimStart().startsWith('[red]')) ? 'red' : undefined;
    const linesWithoutColor = lines.map((line) => line.replace('[red]', ''));
    this.text = linesWithoutColor.join('\n');
    this.text = this.text.trimEnd();
  }
}
