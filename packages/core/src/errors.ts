export class UnknownDiagramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownDiagramError';
  }
}
