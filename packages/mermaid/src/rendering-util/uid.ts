export class Uid {
  private static count = 0;
  id: string;
  href: string;

  public static next(name: string): Uid {
    return new Uid(name + ++Uid.count);
  }

  constructor(id: string) {
    this.id = id;
    this.href = `#${id}`;
  }

  toString(): string {
    return 'url(' + this.href + ')';
  }
}
